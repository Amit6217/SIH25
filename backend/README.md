# ChatGPT Clone Backend

A Node.js backend API for the ChatGPT Clone application with MongoDB, authentication, and real-time messaging.

## Features

- User authentication (register/login)
- JWT-based authentication
- Chat management
- File upload support
- Real-time messaging with Socket.io
- MongoDB integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

3. Update the `.env` file with your configuration:
   - Set your MongoDB connection string
   - Set a secure JWT secret
   - Configure other settings as needed

4. Start MongoDB (if running locally):
```bash
mongod
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 5000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Chats
- `POST /api/chats` - Create a new chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:chatId` - Get specific chat
- `POST /api/chats/:chatId/messages` - Send message to chat
- `DELETE /api/chats/:chatId` - Delete chat

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## Socket.io Events

- `join-chat` - Join a chat room
- `send-message` - Send a message
- `receive-message` - Receive a message

## File Upload

The application supports uploading:
- Images (JPEG, PNG, GIF, WebP)
- Documents (PDF, TXT, MD)
- Audio files (MP3, WAV, M4A)

Files are stored in the `uploads` directory and served statically.

## Database Schema

### User
- name: String
- email: String (unique)
- password: String (hashed)
- avatar: String (optional)
- isActive: Boolean

### Chat
- title: String
- userId: ObjectId (ref: User)
- messages: Array of message objects
- isActive: Boolean

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `MAX_FILE_SIZE` - Maximum file size for uploads
- `UPLOAD_PATH` - Path for uploaded files

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- File type validation
- File size limits
- CORS protection

## Future Enhancements

- Integration with AI services (OpenAI, etc.)
- Cloud storage for files
- Message encryption
- Rate limiting
- API documentation with Swagger
