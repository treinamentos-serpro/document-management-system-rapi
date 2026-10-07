const { randomUUID } = require('node:crypto');
const { mkdir, stat, unlink } = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function resolveStoragePath(storageName) {
  if (typeof storageName !== 'string' || !storageName || path.basename(storageName) !== storageName) {
    throw new Error('Nome de armazenamento invalido.');
  }
  const filePath = path.resolve(storageDirectory, storageName);
  if (path.dirname(filePath) !== storageDirectory) {
    throw new Error('Caminho de armazenamento invalido.');
  }
  return filePath;
}

const uploadStorage = multer.diskStorage({
  destination(request, file, callback) {
    mkdir(storageDirectory, { recursive: true }).then(
      () => callback(null, storageDirectory),
      callback,
    );
  },
  filename(request, file, callback) {
    callback(null, randomUUID());
  },
});

function create(document) {
  resolveStoragePath(document.storageName);
  documents.set(document.id, { ...document });
  return { ...document };
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

function deleteById(id) {
  const document = findById(id);
  documents.delete(id);
  return document;
}

async function deleteFile(storageName) {
  try {
    await unlink(resolveStoragePath(storageName));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function findFile(storageName) {
  const filePath = resolveStoragePath(storageName);
  try {
    const details = await stat(filePath);
    return details.isFile() ? filePath : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

module.exports = { uploadStorage, create, findById, findByOwner, deleteById, deleteFile, findFile };