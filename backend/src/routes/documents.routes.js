const express = require('express');
const documentController = require('../controllers/documents.controller');

const router = express.Router();

router.post('/upload', documentController.validateUser, documentController.upload);
router.get('/documents', documentController.validateUser, documentController.list);
router.get('/documents/:id/download', documentController.validateUser, documentController.download);

module.exports = router;