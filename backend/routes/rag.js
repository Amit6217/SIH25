const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { 
  uploadPDFToRAG, 
  queryPDF, 
  queryLatestPDF,
  resetMemory, 
  getUserPDFs,
  getPDFList, 
  deletePDF, 
  getRAGHealth 
} = require('../controllers/ragController');

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
    fileSize: 100 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// RAG routes (no authentication required)

// Debug endpoint to test request body parsing
router.post('/debug-query', (req, res) => {
  console.log('Debug query endpoint called');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  res.json({
    message: 'Debug endpoint response',
    receivedBody: req.body,
    headers: req.headers,
    hasBody: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body'
  });
});

// Health check for RAG service
router.get('/health', getRAGHealth);

// Upload PDF to RAG service (requires authentication)
router.post('/upload', auth, upload.single('pdf'), uploadPDFToRAG);

// Query PDF using RAG service
router.post('/query', queryPDF);

// Query latest PDF using RAG service (requires authentication)
router.post('/query-latest', auth, queryLatestPDF);

// Reset conversation memory
router.post('/memory/reset', resetMemory);

// Get user's uploaded PDFs (requires authentication)
router.get('/user-pdfs', auth, getUserPDFs);

// Get list of uploaded PDFs from RAG service
router.get('/pdfs', getPDFList);

// Delete PDF from RAG service
router.delete('/pdf/:pdfId', deletePDF);

module.exports = router;
