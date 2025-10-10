const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// RAG service configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
const RAG_SERVICE_TIMEOUT = 30000; // 30 seconds

/**
 * Upload PDF to RAG service
 */
const uploadPDFToRAG = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.includes('pdf')) {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Create form data for RAG service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Upload to RAG service
    const response = await axios.post(`${RAG_SERVICE_URL}/pdf/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: RAG_SERVICE_TIMEOUT
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'PDF uploaded successfully to RAG service',
      pdfId: response.data.pdf_id,
      filename: response.data.filename,
      ragResponse: response.data
    });

  } catch (error) {
    console.error('RAG PDF upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'RAG service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to upload PDF to RAG service',
      error: error.message
    });
  }
};

/**
 * Query PDF using RAG service
 */
const queryPDF = async (req, res) => {
  try {
    const { pdfId, question, sessionId = 'default' } = req.body;

    // Input validation
    if (!pdfId || typeof pdfId !== 'string' || pdfId.trim() === '') {
      return res.status(400).json({
        message: 'PDF ID is required and must be a non-empty string'
      });
    }

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        message: 'Question is required and must be a non-empty string'
      });
    }

    // Create form data for RAG service
    const formData = new FormData();
    formData.append('pdf_id', pdfId);
    formData.append('question', question);
    formData.append('session_id', sessionId);

    // Query RAG service
    const response = await axios.post(`${RAG_SERVICE_URL}/pdf/query`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: RAG_SERVICE_TIMEOUT
    });

    res.json({
      message: 'Query processed successfully',
      answer: response.data.answer,
      metadata: response.data.metadata,
      sessionId: response.data.session_id
    });

  } catch (error) {
    console.error('RAG query error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'RAG service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to query PDF',
      error: error.message
    });
  }
};

/**
 * Reset conversation memory
 */
const resetMemory = async (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;

    const formData = new FormData();
    formData.append('session_id', sessionId);

    const response = await axios.post(`${RAG_SERVICE_URL}/memory/reset`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: RAG_SERVICE_TIMEOUT
    });

    res.json({
      message: 'Memory reset successfully',
      sessionId: response.data.session_id
    });

  } catch (error) {
    console.error('RAG memory reset error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'RAG service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to reset memory',
      error: error.message
    });
  }
};

/**
 * Get list of uploaded PDFs
 */
const getPDFList = async (req, res) => {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/pdf/list`, {
      timeout: RAG_SERVICE_TIMEOUT
    });

    res.json({
      message: 'PDF list retrieved successfully',
      pdfs: response.data.pdfs,
      count: response.data.count
    });

  } catch (error) {
    console.error('RAG PDF list error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'RAG service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to get PDF list',
      error: error.message
    });
  }
};

/**
 * Delete PDF from RAG service
 */
const deletePDF = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!pdfId) {
      return res.status(400).json({
        message: 'PDF ID is required'
      });
    }

    const response = await axios.delete(`${RAG_SERVICE_URL}/pdf/${pdfId}`, {
      timeout: RAG_SERVICE_TIMEOUT
    });

    res.json({
      message: 'PDF deleted successfully',
      pdfId: response.data.pdf_id
    });

  } catch (error) {
    console.error('RAG PDF delete error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'RAG service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to delete PDF',
      error: error.message
    });
  }
};

/**
 * Get RAG service health status
 */
const getRAGHealth = async (req, res) => {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      message: 'RAG service is healthy',
      status: response.data.status,
      ragService: response.data
    });

  } catch (error) {
    console.error('RAG health check error:', error);

    res.status(503).json({
      message: 'RAG service is unavailable',
      error: error.message
    });
  }
};

module.exports = {
  uploadPDFToRAG,
  queryPDF,
  resetMemory,
  getPDFList,
  deletePDF,
  getRAGHealth
};
