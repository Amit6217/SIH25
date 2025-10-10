const express = require('express');
const router = express.Router();
const { upload, uploadFile, uploadMultipleFiles } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// Upload routes (authentication required)

// Single file upload
router.post('/single', auth, upload.single('file'), uploadFile);

// Multiple files upload
router.post('/multiple', auth, upload.array('files', 10), uploadMultipleFiles);

module.exports = router;
