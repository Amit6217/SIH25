# Backend-RAG Integration

This document explains how the Node.js backend is integrated with the Python RAG (Retrieval-Augmented Generation) service.

## Architecture Overview

The integration consists of several components:

1. **RAG Controller** (`controllers/ragController.js`) - Handles HTTP communication with the Python RAG service
2. **RAG Routes** (`routes/rag.js`) - Express routes for RAG functionality
3. **RAG Service Manager** (`services/ragServiceManager.js`) - Manages the Python subprocess
4. **Updated Chat Controller** - Integrates RAG responses into chat messages

## Features

### 1. PDF Upload and Processing
- Upload PDFs to the RAG service for indexing
- Automatic text extraction and vector indexing
- Support for multiple PDFs with unique IDs

### 2. Intelligent Querying
- Query uploaded PDFs using natural language
- Session-based conversation memory
- Context-aware responses based on PDF content

### 3. Service Management
- Start/stop/restart RAG service programmatically
- Health monitoring and status checks
- Automatic dependency installation

### 4. Chat Integration
- Seamless integration with existing chat system
- Optional RAG processing for messages
- Fallback to regular responses if RAG fails

## API Endpoints

### RAG Service Management
- `GET /api/rag/health` - Check RAG service health
- `POST /api/rag/service/start` - Start RAG service
- `POST /api/rag/service/stop` - Stop RAG service
- `POST /api/rag/service/restart` - Restart RAG service
- `GET /api/rag/service/status` - Get service status
- `POST /api/rag/service/install-deps` - Install Python dependencies

### PDF Operations
- `POST /api/rag/upload` - Upload PDF to RAG service
- `POST /api/rag/query` - Query uploaded PDF
- `GET /api/rag/pdfs` - List uploaded PDFs
- `DELETE /api/rag/pdf/:pdfId` - Delete PDF

### Memory Management
- `POST /api/rag/memory/reset` - Reset conversation memory

### Chat Integration
- `POST /api/chats/:chatId/messages` - Send message (with optional RAG processing)

## Environment Configuration

Add these variables to your `.env` file:

```env
# RAG Service Configuration
RAG_SERVICE_URL=http://localhost:8000
RAG_SERVICE_TIMEOUT=30000
RAG_SERVICE_PORT=8000
START_RAG_SERVICE=true
PYTHON_PATH=python
RAG_MAIN_SCRIPT=main_simple.py
```

## Usage Examples

### 1. Upload a PDF
```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);

const response = await fetch('/api/rag/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { pdfId } = await response.json();
```

### 2. Query a PDF
```javascript
const response = await fetch('/api/rag/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    pdfId: 'uploaded-pdf-id',
    question: 'What is the main topic of this document?',
    sessionId: 'user-session-123'
  })
});

const { answer, metadata } = await response.json();
```

### 3. Send Chat Message with RAG
```javascript
const response = await fetch('/api/chats/chat-id/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'Can you explain the key points from the uploaded document?',
    pdfId: 'uploaded-pdf-id',
    useRAG: true
  })
});
```

## Service Management

### Automatic Startup
Set `START_RAG_SERVICE=true` in your environment to automatically start the RAG service when the backend starts.

### Manual Control
Use the service management endpoints to control the RAG service:

```javascript
// Start service
await fetch('/api/rag/service/start', { method: 'POST' });

// Check status
const status = await fetch('/api/rag/service/status');
const { isRunning, port, pid } = await status.json();

// Stop service
await fetch('/api/rag/service/stop', { method: 'POST' });
```

## Error Handling

The integration includes comprehensive error handling:

1. **Service Unavailable** - Graceful fallback when RAG service is down
2. **Upload Failures** - Automatic cleanup of temporary files
3. **Query Timeouts** - Configurable timeout settings
4. **Dependency Issues** - Automatic dependency installation

## Security Considerations

1. **Authentication Required** - All RAG endpoints require valid JWT tokens
2. **File Validation** - Only PDF files are accepted for upload
3. **Size Limits** - 10MB file size limit enforced
4. **CORS Configuration** - Proper CORS settings for cross-origin requests

## Performance Optimization

1. **Async Processing** - Non-blocking PDF processing
2. **Session Memory** - Efficient conversation context management
3. **Caching** - PDF indexing results are cached
4. **Resource Management** - Automatic cleanup of temporary files

## Troubleshooting

### Common Issues

1. **RAG Service Won't Start**
   - Check Python installation
   - Verify dependencies are installed
   - Check port availability

2. **PDF Upload Fails**
   - Verify file is valid PDF
   - Check file size limits
   - Ensure RAG service is running

3. **Query Timeouts**
   - Increase `RAG_SERVICE_TIMEOUT` setting
   - Check RAG service performance
   - Verify PDF indexing completed

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs of RAG service communication and error messages.

## Development

### Adding New Features

1. **New RAG Endpoints** - Add to `ragController.js` and `rag.js`
2. **Service Management** - Extend `ragServiceManager.js`
3. **Chat Integration** - Modify `chatController.js`

### Testing

Test the integration using the provided endpoints:

```bash
# Test health check
curl http://localhost:5000/api/rag/health

# Test service status
curl http://localhost:5000/api/rag/service/status
```

## Production Deployment

1. **Environment Variables** - Set all required environment variables
2. **Python Dependencies** - Ensure all Python packages are installed
3. **Service Monitoring** - Monitor RAG service health
4. **Resource Limits** - Configure appropriate memory and CPU limits
5. **Security** - Use HTTPS and secure authentication tokens
