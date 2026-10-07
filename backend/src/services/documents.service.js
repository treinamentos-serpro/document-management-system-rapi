const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documents.repository');

function documentError(code) {
  return Object.assign(new Error(code), { code });
}

function publicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

async function createDocument(file, owner, maxFileSize) {
  if (!file) throw documentError('FILE_REQUIRED');
  try {
    if (file.size === 0) throw documentError('FILE_REQUIRED');
    if (file.size > maxFileSize) throw documentError('FILE_TOO_LARGE');
    const document = documentRepository.create({
      id: randomUUID(),
      originalName: file.originalName,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storageName: file.storageName,
    });
    return publicDocument(document);
  } catch (error) {
    await documentRepository.deleteFile(file.storageName);
    throw error;
  }
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt)
      || second.id.localeCompare(first.id))
    .map(publicDocument);
}

async function downloadDocument(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) throw documentError('DOCUMENT_NOT_FOUND');
  const filePath = await documentRepository.findFile(document.storageName);
  if (!filePath) throw documentError('DOCUMENT_NOT_FOUND');
  return { filePath, originalName: document.originalName };
}

function getUploadStorage() {
  return documentRepository.uploadStorage;
}

module.exports = { createDocument, listDocuments, downloadDocument, getUploadStorage };