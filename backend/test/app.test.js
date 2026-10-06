const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const { readdir } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

process.env.MAX_FILE_SIZE_BYTES = '32';

const app = require('../src/app');
const documentRepository = require('../src/repositories/documents.repository');
const documentController = require('../src/controllers/documents.controller');

async function startServer(t) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

async function storageFiles() {
  try {
    return (await readdir(path.resolve(__dirname, '../storage'))).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function uploadForm(content, name = 'teste.txt', field = 'file') {
  const form = new FormData();
  form.append(field, new Blob([content]), name);
  return form;
}

function uploadFile(baseUrl, body, owner = 'usuario-teste') {
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body,
  });
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o usuário dono', async (t) => {
  const baseUrl = await startServer(t);
  let uploadedDocument;

  t.after(async () => {
    if (uploadedDocument) {
      const storedDocument = documentRepository.deleteById(uploadedDocument.id);
      await documentRepository.deleteFile(storedDocument.storageName);
    }
  });

  const form = new FormData();
  form.append('file', new Blob(['conteúdo de teste'], { type: 'text/plain' }), 'teste.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-teste' },
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  uploadedDocument = (await uploadResponse.json()).document;
  assert.strictEqual(uploadedDocument.originalName, 'teste.txt');
  assert.strictEqual(uploadedDocument.owner, 'usuario-teste');
  assert.deepStrictEqual(Object.keys(uploadedDocument).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteúdo de teste'));
  assert.strictEqual(new Date(uploadedDocument.uploadedAt).toISOString(), uploadedDocument.uploadedAt);
  assert.match(uploadedDocument.id, /^[0-9a-f-]{36}$/);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-teste' },
  });
  assert.deepStrictEqual((await listResponse.json()).documents.map(({ id }) => id), [uploadedDocument.id]);

  const otherUserList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'outro-usuario' },
  });
  assert.deepStrictEqual((await otherUserList.json()).documents, []);

  const deniedDownload = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'outro-usuario' },
  });
  assert.strictEqual(deniedDownload.status, 404);
  const missingDownload = await fetch(`${baseUrl}/documents/inexistente/download`, {
    headers: { 'X-User-Id': 'usuario-teste' },
  });
  assert.strictEqual(missingDownload.status, 404);
  assert.deepStrictEqual(await deniedDownload.json(), await missingDownload.json());

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'usuario-teste' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment; filename="teste.txt"/);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo de teste');

  const storedDocument = documentRepository.findById(uploadedDocument.id);
  await documentRepository.deleteFile(storedDocument.storageName);
  const missingFile = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'usuario-teste' },
  });
  assert.strictEqual(missingFile.status, 404);
  assert.strictEqual((await missingFile.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('operações rejeitam usuário ausente, vazio ou longo antes de gravar arquivos', async (t) => {
  const baseUrl = await startServer(t);
  const before = await storageFiles();
  for (const owner of [undefined, '', 'x'.repeat(129)]) {
    for (const endpoint of ['/upload', '/documents', '/documents/inexistente/download']) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: endpoint === '/upload' ? 'POST' : 'GET',
        headers: owner === undefined ? {} : { 'X-User-Id': owner },
        body: endpoint === '/upload' ? uploadForm('arquivo') : undefined,
      });
      assert.strictEqual(response.status, 400);
      assert.strictEqual((await response.json()).error.code, 'INVALID_USER');
    }
  }
  assert.deepStrictEqual(await storageFiles(), before);
});

test('validação rejeita espaços nas extremidades do identificador', () => {
  for (const owner of [' usuario', 'usuario ', '   ']) {
    const response = {
      status(status) {
        assert.strictEqual(status, 400);
        return this;
      },
      json(body) {
        assert.strictEqual(body.error.code, 'INVALID_USER');
      },
    };
    documentController.validateUser({ get: () => owner }, response, () => assert.fail('Usuário inválido aceito'));
  }
});

test('uploads inválidos não registram metadados nem deixam arquivos', async (t) => {
  const baseUrl = await startServer(t);
  const before = await storageFiles();
  const missingFile = new FormData();
  missingFile.append('title', 'sem arquivo');
  const multipleFiles = uploadForm('primeiro');
  multipleFiles.append('file', new Blob(['segundo']), 'segundo.txt');
  const cases = [
    [missingFile, 400, 'FILE_REQUIRED'],
    [uploadForm(''), 400, 'FILE_REQUIRED'],
    [uploadForm('arquivo', 'teste.txt', 'outro'), 400, 'FILE_REQUIRED'],
    [multipleFiles, 400, 'FILE_REQUIRED'],
    [uploadForm('x'.repeat(33)), 413, 'FILE_TOO_LARGE'],
    [uploadForm('x'.repeat(64)), 413, 'FILE_TOO_LARGE'],
  ];
  for (const [body, status, code] of cases) {
    const response = await uploadFile(baseUrl, body, 'usuario-rejeitado');
    assert.strictEqual(response.status, status);
    assert.strictEqual((await response.json()).error.code, code);
    assert.deepStrictEqual(await storageFiles(), before);
    assert.deepStrictEqual(documentRepository.findByOwner('usuario-rejeitado'), []);
  }
});

test('limite exato é aceito e nomes repetidos usam armazenamento único', async (t) => {
  const baseUrl = await startServer(t);
  const storedDocuments = [];
  t.after(async () => {
    for (const document of storedDocuments) {
      documentRepository.deleteById(document.id);
      await documentRepository.deleteFile(document.storageName);
    }
  });
  for (let index = 0; index < 2; index += 1) {
    const response = await uploadFile(baseUrl, uploadForm('x'.repeat(32), '../../relatorio.txt'), 'usuario-limite');
    assert.strictEqual(response.status, 201);
    const document = (await response.json()).document;
    const storedDocument = documentRepository.findById(document.id);
    storedDocuments.push(storedDocument);
    assert.strictEqual(document.size, 32);
    assert.notStrictEqual(storedDocument.storageName, document.originalName);
    assert.strictEqual(path.dirname(await documentRepository.findFile(storedDocument.storageName)),
      path.resolve(__dirname, '../storage'));
  }
  assert.notStrictEqual(storedDocuments[0].id, storedDocuments[1].id);
  assert.notStrictEqual(storedDocuments[0].storageName, storedDocuments[1].storageName);
});

test('listagem ordena por data decrescente e não expõe campos internos', async (t) => {
  const baseUrl = await startServer(t);
  const documents = ['2026-01-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'].map((uploadedAt) => ({
    id: randomUUID(), originalName: 'teste.txt', size: 1, uploadedAt,
    owner: 'usuario-ordenacao', storageName: randomUUID(),
  }));
  t.after(() => documents.forEach((document) => documentRepository.deleteById(document.id)));
  documents.forEach((document) => documentRepository.create(document));
  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'usuario-ordenacao' } });
  assert.strictEqual(response.status, 200);
  const listed = (await response.json()).documents;
  assert.deepStrictEqual(listed.map((document) => document.id), [documents[1].id, documents[0].id]);
  assert.ok(listed.every((document) => !Object.hasOwn(document, 'storageName')));
});

test('falha no registro remove arquivo e não revela detalhes internos', async (t) => {
  const baseUrl = await startServer(t);
  const before = await storageFiles();
  const originalCreate = documentRepository.create;
  t.after(() => { documentRepository.create = originalCreate; });
  documentRepository.create = () => { throw new Error('/caminho/interno: falha de persistencia'); };
  const response = await uploadFile(baseUrl, uploadForm('conteudo'), 'usuario-falha');
  assert.strictEqual(response.status, 500);
  assert.deepStrictEqual(await response.json(), {
    error: { code: 'UPLOAD_FAILED', message: 'Nao foi possivel enviar o documento.' },
  });
  assert.deepStrictEqual(await storageFiles(), before);
  assert.deepStrictEqual(documentRepository.findByOwner('usuario-falha'), []);
});

test('repository rejeita caminhos fora do armazenamento', async () => {
  for (const storageName of ['../arquivo', '/tmp/arquivo', '..', '.', '']) {
    await assert.rejects(documentRepository.findFile(storageName));
    await assert.rejects(documentRepository.deleteFile(storageName));
  }
});
