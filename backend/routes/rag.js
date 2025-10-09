const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  uploadPDFToRAG, 
  queryPDF, 
  resetMemory, 
  getPDFList, 
  deletePDF, 
  getRAGHealth 
} = require('../controllers/ragController');
const ragServiceManager = require('../services/ragServiceManager');

// Configure multer for PDF uploads to RAG service
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/rag');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rag-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files for RAG service
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for RAG processing'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// RAG routes (no authentication required)

// Health check for RAG service
router.get('/health', getRAGHealth);

// Service management routes
router.post('/service/start', async (req, res) => {
  try {
    const success = await ragServiceManager.startRAGService();
    res.json({
      message: success ? 'RAG service started successfully' : 'Failed to start RAG service',
      status: ragServiceManager.getServiceStatus()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting RAG service', error: error.message });
  }
});

router.post('/service/stop', async (req, res) => {
  try {
    const success = await ragServiceManager.stopRAGService();
    res.json({
      message: success ? 'RAG service stopped successfully' : 'Failed to stop RAG service',
      status: ragServiceManager.getServiceStatus()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error stopping RAG service', error: error.message });
  }
});

router.post('/service/restart', async (req, res) => {
  try {
    const success = await ragServiceManager.restartRAGService();
    res.json({
      message: success ? 'RAG service restarted successfully' : 'Failed to restart RAG service',
      status: ragServiceManager.getServiceStatus()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error restarting RAG service', error: error.message });
  }
});

router.get('/service/status', (req, res) => {
  res.json({
    message: 'RAG service status',
    status: ragServiceManager.getServiceStatus()
  });
});

router.post('/service/install-deps', async (req, res) => {
  try {
    await ragServiceManager.installDependencies();
    res.json({ message: 'Python dependencies installed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error installing dependencies', error: error.message });
  }
});

// Upload PDF to RAG service
router.post('/upload', upload.single('pdf'), uploadPDFToRAG);

// Query PDF using RAG service
router.post('/query', queryPDF);

// Reset conversation memory
router.post('/memory/reset', resetMemory);

// Get list of uploaded PDFs
router.get('/pdfs', getPDFList);

// Delete PDF from RAG service
router.delete('/pdf/:pdfId', deletePDF);

module.exports = router;
