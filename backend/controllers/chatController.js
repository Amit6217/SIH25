const Chat = require('../models/Chat');
const { queryPDF } = require('./ragController');

/**
 * Helper function to validate and process message data
 */
const processMessageData = (msg) => {
  // Ensure content is not empty
  if (!msg.content || msg.content.trim() === '') {
    throw new Error('Message content is required and cannot be empty');
  }

  // Handle attachments properly
  let attachments = [];
  if (msg.attachments) {
    // If attachments is a string, try to parse it
    if (typeof msg.attachments === 'string') {
      try {
        attachments = JSON.parse(msg.attachments);
      } catch (parseError) {
        console.warn('Failed to parse attachments string:', msg.attachments);
        attachments = [];
      }
    } else if (Array.isArray(msg.attachments)) {
      attachments = msg.attachments;
    }
  }

  return {
    content: msg.content.trim(),
    role: msg.role,
    timestamp: msg.timestamp || new Date(),
    attachments: attachments,
    metadata: msg.metadata || {}
  };
};

const createChat = async (req, res) => {
  try {
    const { title = 'New Chat', messages = [] } = req.body;
    
    const chat = new Chat({
      title,
      userId: req.user._id,
      messages: messages.map(msg => processMessageData(msg))
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error creating chat', error: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id, isActive: true })
      .sort({ updatedAt: -1 })
      .select('title messages createdAt updatedAt');
    
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error fetching chats' });
  }
};

const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: req.user._id, 
      isActive: true 
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error fetching chat' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, attachments = [], pdfId, useRAG = false } = req.body;
    
    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: req.user._id, 
      isActive: true 
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Process message data using helper function
    const userMessage = processMessageData({
      content,
      role: 'user',
      timestamp: new Date(),
      attachments,
      metadata: {
        pdfId: pdfId || null,
        useRAG: useRAG || false
      }
    });
    
    chat.messages.push(userMessage);
    
    let aiResponse;
    
    // If RAG is enabled and PDF ID is provided, use RAG service
    if (useRAG && pdfId) {
      try {
        // Create a mock request/response for RAG controller
        const ragReq = {
          body: {
            pdfId: pdfId,
            question: content,
            sessionId: chatId // Use chatId as sessionId for conversation continuity
          }
        };
        
        const ragRes = {
          json: (data) => {
            aiResponse = {
              content: data.answer,
              role: 'assistant',
              timestamp: new Date(),
              metadata: {
                ragMetadata: data.metadata,
                sessionId: data.sessionId,
                source: 'RAG'
              }
            };
          },
          status: (code) => ({
            json: (data) => {
              throw new Error(`RAG service error: ${data.message || 'Unknown error'}`);
            }
          })
        };
        
        await queryPDF(ragReq, ragRes);
        
      } catch (ragError) {
        console.error('RAG query failed:', ragError);
        // Fallback to regular AI response if RAG fails
        aiResponse = {
          content: `I received your message: "${content}". RAG processing failed, but I'm here to help with your question.`,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            source: 'fallback',
            ragError: ragError.message
          }
        };
      }
    } else {
      // Regular AI response (simulated)
      aiResponse = {
        content: `I received your message: "${content}". This is a simulated AI response. In a real implementation, this would be processed by an AI service like OpenAI's GPT.`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          source: 'simulated'
        }
      };
    }
    
    chat.messages.push(aiResponse);
    await chat.save();
    
    res.json({ 
      message: 'Message sent successfully', 
      chat,
      aiResponse: aiResponse
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error.message.includes('Message content is required')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error sending message', error: error.message });
    }
  }
};

const updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user._id, isActive: true },
      { title },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ message: 'Server error updating chat' });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error deleting chat' });
  }
};

module.exports = {
  createChat,
  getChats,
  getChat,
  sendMessage,
  updateChat,
  deleteChat,
  processMessageData
};
