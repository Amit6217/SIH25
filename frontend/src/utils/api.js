import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// RAG API methods
export const ragAPI = {
  // Upload PDF to RAG service
  uploadPDF: (formData) => {
    return api.post('/rag/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Query PDF using RAG service
  queryPDF: (pdfId, question, sessionId = 'default') => {
    return api.post('/rag/query', {
      pdfId,
      question,
      sessionId
    });
  },

  // Query latest PDF using RAG service
  queryLatestPDF: (question, sessionId = 'default') => {
    return api.post('/rag/query-latest', {
      question,
      sessionId
    });
  },

  // Get user's uploaded PDFs
  getUserPDFs: () => {
    return api.get('/rag/user-pdfs');
  },

  // Get list of all PDFs from RAG service
  getPDFList: () => {
    return api.get('/rag/pdfs');
  },

  // Delete PDF from RAG service
  deletePDF: (pdfId) => {
    return api.delete(`/rag/pdf/${pdfId}`);
  },

  // Reset conversation memory
  resetMemory: (sessionId = 'default') => {
    return api.post('/rag/memory/reset', { sessionId });
  },

  // Check RAG service health
  getHealth: () => {
    return api.get('/rag/health');
  }
};

export default api;
