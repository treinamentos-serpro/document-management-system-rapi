const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');
const localFileRepository = require('../src/repositories/localFileRepository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o usuário dono', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  let uploadedDocument;

  t.after(async () => {
    server.close();
    if (uploadedDocument) {
      const storedDocument = documentRepository.deleteById(uploadedDocument.id);
      await localFileRepository.deleteFile(storedDocument.storageName);
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
  assert.strictEqual(Object.hasOwn(uploadedDocument, 'storageName'), false);

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

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'usuario-teste' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteúdo de teste');
});
