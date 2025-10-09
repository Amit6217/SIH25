const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const ragServiceManager = require('./services/ragServiceManager');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatgpt-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/chats', require('./routes/chats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/rag', require('./routes/rag'));
app.use('/api/debug', require('./routes/debug'));

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
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start RAG service if enabled
  if (process.env.START_RAG_SERVICE === 'true') {
    console.log('Starting RAG service...');
    try {
      await ragServiceManager.startRAGService();
      console.log('RAG service integration ready');
    } catch (error) {
      console.error('Failed to start RAG service:', error);
      console.log('Server will continue without RAG service');
    }
  } else {
    console.log('RAG service auto-start disabled. Use START_RAG_SERVICE=true to enable.');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await ragServiceManager.stopRAGService();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await ragServiceManager.stopRAGService();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
