const express = require('express');
const router = express.Router();
const { debugMessageData, testMessageProcessing } = require('../utils/chatDebug');
const auth = require('../middleware/auth');

// Debug route to test message processing
router.post('/debug/message', auth, (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message data is required' });
    }

    // Debug the incoming message
    debugMessageData(message, 'Incoming Message');
    
    // Test the message processing logic
    const { processMessageData } = require('../controllers/chatController');
    
    try {
      const processedMessage = processMessageData(message);
      res.json({
        success: true,
        original: message,
        processed: processedMessage,
        message: 'Message processed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        original: message,
        error: error.message,
        message: 'Message processing failed'
      });
    }
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Debug endpoint error', error: error.message });
  }
});

// Test all message processing scenarios
router.get('/debug/test-scenarios', auth, (req, res) => {
  try {
    testMessageProcessing();
    res.json({ message: 'Test scenarios completed, check console logs' });
  } catch (error) {
    res.status(500).json({ message: 'Test scenarios failed', error: error.message });
  }
});

// Test chat creation with various message formats
router.post('/debug/test-chat-creation', auth, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Debug each message
    messages.forEach((msg, index) => {
      debugMessageData(msg, `Message ${index + 1}`);
    });

    // Try to create a chat with these messages
    const Chat = require('../models/Chat');
    const { processMessageData } = require('../controllers/chatController');
    
    const chat = new Chat({
      title: 'Debug Test Chat',
      userId: req.user._id,
      messages: messages.map(msg => processMessageData(msg))
    });

    // Don't save, just validate
    const validationError = chat.validateSync();
    
    if (validationError) {
      res.status(400).json({
        success: false,
        validationError: validationError.message,
        errors: validationError.errors
      });
    } else {
      res.json({
        success: true,
        message: 'Chat validation passed',
        chatData: {
          title: chat.title,
          messageCount: chat.messages.length,
          messages: chat.messages.map(msg => ({
            content: msg.content,
            role: msg.role,
            attachmentsCount: msg.attachments.length
          }))
        }
      });
    }
    
  } catch (error) {
    console.error('Debug chat creation error:', error);
    res.status(500).json({ message: 'Debug chat creation failed', error: error.message });
  }
});

module.exports = router;
