# RAG Integration Documentation

This document explains how to use the RAG (Retrieval-Augmented Generation) functionality that has been integrated into the frontend.

## Overview

The RAG integration allows users to:
1. Upload PDF documents to the RAG service
2. Query PDFs using natural language questions
3. View and manage uploaded PDFs
4. Get AI-powered answers based on PDF content

## Frontend Components

### 1. PDFUpload Component
- **Location**: `frontend/src/components/PDFUpload.js`
- **Purpose**: Upload PDF files to the RAG service
- **Features**:
  - Drag and drop PDF upload
  - File validation (PDF only)
  - Upload progress indication
  - Success/error feedback
  - File size display

### 2. PDFList Component
- **Location**: `frontend/src/components/PDFList.js`
- **Purpose**: Display and manage uploaded PDFs
- **Features**:
  - List all user's uploaded PDFs
  - Search functionality
  - PDF selection for querying
  - Delete PDF functionality
  - File metadata display

### 3. RAGQuery Component
- **Location**: `frontend/src/components/RAGQuery.js`
- **Purpose**: Query PDFs using natural language
- **Features**:
  - Question input interface
  - Real-time query processing
  - Answer display with formatting
  - Metadata display
  - Session management

### 4. Updated ChatInterface
- **Location**: `frontend/src/components/ChatInterface.js`
- **New Features**:
  - PDF upload button (green upload icon)
  - PDF list button (blue search icon)
  - Integrated RAG functionality
  - Modal management for RAG components

## API Integration

### RAG API Methods
- **Location**: `frontend/src/utils/api.js`
- **Methods**:
  - `ragAPI.uploadPDF(formData)` - Upload PDF to RAG service
  - `ragAPI.queryPDF(pdfId, question, sessionId)` - Query PDF
  - `ragAPI.getUserPDFs()` - Get user's PDFs
  - `ragAPI.getPDFList()` - Get all PDFs from RAG service
  - `ragAPI.deletePDF(pdfId)` - Delete PDF
  - `ragAPI.resetMemory(sessionId)` - Reset conversation memory
  - `ragAPI.getHealth()` - Check RAG service health

## How to Use

### 1. Upload a PDF
1. Click the green upload button (📤) in the chat interface
2. Drag and drop a PDF file or click "browse files"
3. Click "Upload PDF" to process the file
4. Wait for the upload to complete (file will be indexed)

### 2. View Your PDFs
1. Click the blue search button (🔍) in the chat interface
2. Browse your uploaded PDFs
3. Use the search bar to find specific PDFs
4. Click "Select" to choose a PDF for querying

### 3. Query a PDF
1. Select a PDF from the PDF list
2. Enter your question in the query interface
3. Click "Ask Question" or press Enter
4. View the AI-generated answer based on PDF content

### 4. Manage PDFs
- **Delete**: Click the trash icon next to any PDF
- **Refresh**: Click the refresh button to reload the PDF list
- **Search**: Use the search bar to filter PDFs by name

## Backend Endpoints

The following endpoints are available for RAG functionality:

- `GET /api/rag/health` - Check RAG service health
- `POST /api/rag/upload` - Upload PDF (requires auth)
- `POST /api/rag/query` - Query PDF
- `GET /api/rag/user-pdfs` - Get user's PDFs (requires auth)
- `GET /api/rag/pdfs` - Get all PDFs from RAG service
- `DELETE /api/rag/pdf/:pdfId` - Delete PDF
- `POST /api/rag/memory/reset` - Reset conversation memory

## Technical Details

### Authentication
- PDF upload and user PDF list require authentication
- Query functionality is available without authentication
- JWT tokens are automatically included in requests

### File Handling
- Only PDF files are accepted for upload
- Maximum file size: 10MB
- Files are processed and indexed by the RAG service
- Uploaded files are temporarily stored and then cleaned up

### Session Management
- Each query session has a unique session ID
- Session memory can be reset if needed
- Sessions help maintain conversation context

### Error Handling
- Comprehensive error messages for all operations
- Network error handling with retry options
- File validation with user-friendly messages

## Troubleshooting

### Common Issues

1. **PDF Upload Fails**
   - Check if file is actually a PDF
   - Ensure file size is under 10MB
   - Verify RAG service is running
   - Check authentication status

2. **Query Returns Error**
   - Ensure PDF is properly indexed
   - Check RAG service health
   - Verify PDF ID is correct

3. **PDF List Empty**
   - Check if user is authenticated
   - Verify PDFs were uploaded successfully
   - Check RAG service connection

### Debug Steps

1. Check RAG service health: `GET /api/rag/health`
2. Verify authentication: Check browser dev tools for token
3. Check network requests in browser dev tools
4. Verify backend logs for error messages

## Future Enhancements

Potential improvements for the RAG integration:

1. **Chat Integration**: Integrate RAG results directly into chat messages
2. **Batch Operations**: Upload multiple PDFs at once
3. **Advanced Search**: Search within PDF content
4. **Export Results**: Export query results to various formats
5. **Collaboration**: Share PDFs between users
6. **Analytics**: Track query patterns and usage

## Dependencies

### Frontend Dependencies
- React (for components)
- Lucide React (for icons)
- Axios (for API calls)
- React Dropzone (for file uploads)

### Backend Dependencies
- Express.js (for API routes)
- Multer (for file uploads)
- Axios (for RAG service communication)
- FormData (for multipart requests)

## Environment Variables

Make sure these environment variables are set:

- `RAG_SERVICE_URL` - URL of the RAG service (default: http://localhost:8000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication
