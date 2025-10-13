# LegalEase

A full-stack LegalEase built with React, Node.js, and MongoDB featuring user authentication, real-time messaging, file uploads, and voice input.

## 🚀 Features

### Frontend (React + Tailwind CSS)
- Modern, responsive UI design
- User authentication (login/register)
- Real-time chat interface
- File upload with drag & drop
- Voice recording capability
- Message history
- Socket.io integration for real-time updates

### Backend (Node.js + Express + MongoDB)
- RESTful API with Express.js
- MongoDB database integration
- JWT-based authentication
- File upload handling
- Real-time messaging with Socket.io
- Password hashing with bcrypt
- File type validation and size limits

## 📁 Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utility functions
│   │   └── ...
│   ├── public/
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
└── README.md               # This file
```

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 📦 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd chatgpt-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm run dev
# Create .env file with REACT_APP_API_URL=http://localhost:5000/api
npm start
```

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legalease
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode
1. Start MongoDB (if running locally)
2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
3. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

### Production Mode
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Start the backend:
   ```bash
   cd backend
   npm start
   ```

## 📡 API Endpoints

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

## 🎯 Key Features

### User Authentication
- Secure registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes

### Chat Functionality
- Real-time messaging
- Message history
- Chat management
- Socket.io integration

### File Upload
- Drag & drop interface
- Multiple file types support
- File validation
- Size limits

### Voice Input
- Browser microphone access
- Hold-to-record functionality
- Audio file generation
- Integration with chat

## 🔒 Security Features

- Password hashing
- JWT token authentication
- File type validation
- File size limits
- CORS protection
- Input sanitization

## 🎨 UI/UX Features

- Modern, clean design
- Responsive layout
- Smooth animations
- Intuitive user interface
- Real-time updates
- File preview
- Voice recording indicators

## 🚀 Future Enhancements

- AI service integration (OpenAI, etc.)
- Cloud storage for files
- Message encryption
- Push notifications
- Dark mode
- Message search
- Chat export
- Multi-language support
- Rate limiting
- API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Express.js for the web framework
- MongoDB for the database
- Socket.io for real-time communication
