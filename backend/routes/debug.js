const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Debug endpoint to test message processing and schema validation
router.post('/test-message-processing', async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    console.log('🧪 Testing message processing with data:');
    console.log('Content:', content);
    console.log('Attachments type:', typeof attachments);
    console.log('Attachments value:', attachments);
    
    // Test the processMessageData function
    const { processMessageData } = require('../controllers/chatController');
    
    let processedMessage;
    try {
      processedMessage = processMessageData({
        content: content || 'Test message',
        role: 'user',
        attachments: attachments || [],
        timestamp: new Date()
      });
      console.log('✅ Message processing successful:', processedMessage);
    } catch (error) {
      console.error('❌ Message processing failed:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message,
        step: 'message_processing'
      });
    }
    
    // Test creating a new chat with this message
    try {
      const testChat = new Chat({
        title: 'Debug Test Chat',
        userId: 'debug-user',
        messages: [processedMessage]
      });
      
      console.log('📋 Test chat created, validating...');
      const validationError = testChat.validateSync();
      
      if (validationError) {
        console.error('❌ Chat validation failed:', validationError);
        return res.status(400).json({
          success: false,
          error: 'Chat validation failed',
          validationError: validationError.message,
          validationDetails: validationError.errors,
          step: 'chat_validation'
        });
      }
      
      console.log('✅ Chat validation successful');
      
      // Try to save (but don't actually save)
      console.log('📋 Chat data that would be saved:');
      console.log('Messages count:', testChat.messages.length);
      console.log('First message:', JSON.stringify(testChat.messages[0], null, 2));
      
      res.json({
        success: true,
        message: 'All tests passed',
        processedMessage: processedMessage,
        chatData: {
          title: testChat.title,
          messageCount: testChat.messages.length,
          firstMessage: testChat.messages[0]
        }
      });
      
    } catch (error) {
      console.error('❌ Chat creation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        step: 'chat_creation'
      });
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      step: 'general_error'
    });
  }
});

// Test endpoint to check the actual schema
router.get('/test-schema', (req, res) => {
  try {
    const schema = Chat.schema;
    const messagesSchema = schema.paths.messages;
    const attachmentsSchema = messagesSchema.schema.paths.attachments;
    
    console.log('📋 Schema analysis:');
    console.log('Messages schema type:', messagesSchema.instance);
    console.log('Attachments schema type:', attachmentsSchema.instance);
    console.log('Attachments schema:', attachmentsSchema.schema);
    
    res.json({
      success: true,
      schema: {
        messagesType: messagesSchema.instance,
        attachmentsType: attachmentsSchema.instance,
        attachmentsSchema: attachmentsSchema.schema
      }
    });
  } catch (error) {
    console.error('❌ Schema test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;