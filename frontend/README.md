# ChatGPT Clone Frontend

A React frontend application for the ChatGPT Clone with modern UI, file upload, voice input, and real-time messaging.

## Features

- Modern React 18 with hooks
- Tailwind CSS for styling
- User authentication (login/register)
- Real-time chat interface
- File upload with drag & drop
- Voice recording capability
- Responsive design
- Message history
- Socket.io integration for real-time updates

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running (see backend README)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatInterface.js    # Main chat component
│   ├── Login.js            # Login form
│   ├── Register.js         # Registration form
│   └── Sidebar.js           # Sidebar with chat history
├── contexts/           # React contexts
│   └── AuthContext.js      # Authentication context
├── utils/              # Utility functions
│   └── api.js              # API configuration
├── App.js              # Main app component
├── index.js            # Entry point
└── index.css           # Global styles with Tailwind
```

## Components

### ChatInterface
- Main chat component with message display
- File upload with drag & drop support
- Voice recording functionality
- Real-time message updates
- Attachment preview and management

### Authentication
- Login and registration forms
- Form validation
- Password visibility toggle
- Error handling

### Sidebar
- Chat history display
- New chat creation
- User profile section
- Logout functionality

## Features in Detail

### File Upload
- Supports images, documents, and audio files
- Drag & drop interface
- File type validation
- File size limits
- Preview before sending

### Voice Recording
- Hold-to-record functionality
- Audio file generation
- Integration with chat messages
- Browser microphone access

### Real-time Updates
- Socket.io integration
- Live message updates
- Chat room management
- Connection status handling

## Styling

The application uses Tailwind CSS with custom components:
- Custom color palette
- Responsive design
- Smooth animations
- Modern UI components
- Dark/light theme support (ready for implementation)

## API Integration

The frontend communicates with the backend through:
- RESTful API calls for CRUD operations
- Socket.io for real-time messaging
- File upload endpoints
- Authentication endpoints

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

- Dark mode toggle
- Message search functionality
- Chat export options
- Advanced file preview
- Push notifications
- Offline support
- Multi-language support
- Accessibility improvements

## Development

### Adding New Features
1. Create components in `src/components/`
2. Add API calls in `src/utils/api.js`
3. Update contexts if needed
4. Add routes in `App.js`

### Styling Guidelines
- Use Tailwind CSS classes
- Follow the established color palette
- Maintain responsive design
- Use custom components for consistency

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service
3. Ensure the backend API is accessible
4. Update environment variables for production
