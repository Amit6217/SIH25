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
