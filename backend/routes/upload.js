const express = require('express');
const router = express.Router();
const { upload, uploadFile, uploadMultipleFiles } = require('../controllers/uploadController');

// Upload routes (no authentication required)

// Single file upload
router.post('/single', upload.single('file'), uploadFile);

// Multiple files upload
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

module.exports = router;
