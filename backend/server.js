const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { startKeepAlive } = require('./utils/keepalive');

// Load environment variables
dotenv.config();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatgpt-clone')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/rag', require('./routes/rag'));
app.use('/api/debug', require('./routes/debug'));

// Root route - show all available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'ChatGPT Clone Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user (requires auth)',
        'POST /api/auth/logout': 'Logout user (requires auth)',
      },
      chats: {
        'POST /api/chats': 'Create a new chat (requires auth)',
        'GET /api/chats': 'Get user chats (requires auth)',
        'GET /api/chats/:chatId': 'Get specific chat (requires auth)',
        'PUT /api/chats/:chatId': 'Update chat title (requires auth)',
        'POST /api/chats/:chatId/messages':
          'Send message to chat (requires auth)',
        'DELETE /api/chats/:chatId': 'Delete chat (requires auth)',
      },
      upload: {
        'POST /api/upload/single': 'Upload single file (requires auth)',
        'POST /api/upload/multiple': 'Upload multiple files (requires auth)',
      },
      rag: {
        'GET /api/rag/health': 'Check RAG service health',
        'POST /api/rag/upload': 'Upload PDF to RAG service (requires auth)',
        'POST /api/rag/query': 'Query PDF using RAG service',
        'POST /api/rag/memory/reset': 'Reset conversation memory',
        'GET /api/rag/user-pdfs': 'Get user uploaded PDFs (requires auth)',
        'GET /api/rag/pdfs': 'Get list of uploaded PDFs from RAG service',
        'DELETE /api/rag/pdf/:pdfId': 'Delete PDF from RAG service',
      },
      debug: {
        'POST /api/debug/test-message-processing': 'Test message processing',
        'GET /api/debug/test-schema': 'Test schema validation',
      },
    },
    note: 'All chat and upload routes require authentication. Include Authorization header with Bearer token.',
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('send-message', (data) => {
    socket.to(data.chatId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Define URLs for keep-alive, using the server's own address
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;

  // Start keep-alive pings once the server starts
  startKeepAlive([backendUrl, process.env.RAG_SERVICE_URL]);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
