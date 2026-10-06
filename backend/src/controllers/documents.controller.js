const multer = require('multer');
const documentService = require('../services/documents.service');

const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10485760);
if (!Number.isSafeInteger(maxFileSize) || maxFileSize < 1 || maxFileSize >= Number.MAX_SAFE_INTEGER) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo valido.');
}

const receiveFile = multer({
  storage: documentService.getUploadStorage(),
  limits: { fileSize: maxFileSize + 1, files: 1 },
}).single('file');

const errors = {
  INVALID_USER: [400, 'Informe um X-User-Id valido, com ate 128 caracteres e sem espacos nas extremidades.'],
  FILE_REQUIRED: [400, 'Envie um arquivo nao vazio no campo file.'],
  FILE_TOO_LARGE: [413, 'O arquivo excede o tamanho permitido.'],
  DOCUMENT_NOT_FOUND: [404, 'Documento nao encontrado.'],
  UPLOAD_FAILED: [500, 'Nao foi possivel enviar o documento.'],
  DOCUMENT_LIST_FAILED: [500, 'Nao foi possivel listar os documentos.'],
  DOWNLOAD_FAILED: [500, 'Nao foi possivel baixar o documento.'],
  INTERNAL_ERROR: [500, 'Nao foi possivel concluir a requisicao.'],
};

function sendError(response, code) {
  const [status, message] = errors[code];
  return response.status(status).json({ error: { code, message } });
}

function validateUser(request, response, next) {
  const owner = request.get('X-User-Id');
  if (!owner || owner.trim() !== owner || owner.length > 128) {
    return sendError(response, 'INVALID_USER');
  }
  request.documentOwner = owner;
  next();
}

function upload(request, response) {
  receiveFile(request, response, async (error) => {
    if (error) {
      const code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE'
        : error instanceof multer.MulterError ? 'FILE_REQUIRED' : 'UPLOAD_FAILED';
      return sendError(response, code);
    }
    try {
      const file = request.file && {
        originalName: request.file.originalname,
        size: request.file.size,
        storageName: request.file.filename,
      };
      const document = await documentService.createDocument(file, request.documentOwner, maxFileSize);
      response.status(201).json({ document });
    } catch (failure) {
      const code = ['FILE_REQUIRED', 'FILE_TOO_LARGE'].includes(failure.code)
        ? failure.code : 'UPLOAD_FAILED';
      sendError(response, code);
    }
  });
}

function list(request, response) {
  try {
    response.json({ documents: documentService.listDocuments(request.documentOwner) });
  } catch {
    sendError(response, 'DOCUMENT_LIST_FAILED');
  }
}

async function download(request, response) {
  try {
    const document = await documentService.downloadDocument(request.params.id, request.documentOwner);
    response.download(document.filePath, document.originalName, {
      headers: { 'Content-Type': 'application/octet-stream' },
    }, (error) => {
      if (!error) return;
      if (response.headersSent) {
        response.destroy();
        return;
      }
      sendError(response, error.code === 'ENOENT' ? 'DOCUMENT_NOT_FOUND' : 'DOWNLOAD_FAILED');
    });
  } catch (error) {
    sendError(response, error.code === 'DOCUMENT_NOT_FOUND' ? error.code : 'DOWNLOAD_FAILED');
  }
}

function handleError(error, request, response, next) {
  if (response.headersSent) return next(error);
  sendError(response, 'INTERNAL_ERROR');
}

module.exports = { validateUser, upload, list, download, handleError };