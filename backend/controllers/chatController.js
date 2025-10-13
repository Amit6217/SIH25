const Chat = require('../models/Chat');
const axios = require('axios');
const FormData = require('form-data');

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
        // Handle both JSON string and simple string cases
        if (msg.attachments.startsWith('[') || msg.attachments.startsWith('{')) {
          // Clean the string by removing extra spaces and fixing common issues
          let cleanedString = msg.attachments.trim();
          
          // Fix common JSON issues
          cleanedString = cleanedString
            .replace(/\[\s*\{/g, '[{')  // Remove spaces after opening bracket
            .replace(/\}\s*\]/g, '}]')  // Remove spaces before closing bracket
            .replace(/,\s*\}/g, '}')    // Remove trailing commas
            .replace(/,\s*\]/g, ']')    // Remove trailing commas in arrays
            .replace(/\{\s*/g, '{')    // Remove spaces after opening brace
            .replace(/\s*\}/g, '}');   // Remove spaces before closing brace
          
          attachments = JSON.parse(cleanedString);
        } else {
          // If it's a simple string, wrap it in an array
          attachments = [msg.attachments];
        }
      } catch (parseError) {
        // If parsing fails, try to extract file information manually
        const fileMatch = msg.attachments.match(/name:\s*['"]([^'"]+)['"]/);
        if (fileMatch) {
          attachments = [{ 
            name: fileMatch[1], 
            type: 'document', 
            url: '', 
            size: 0 
          }];
        } else {
          // If all else fails, treat as a single attachment
          attachments = [{ name: msg.attachments, type: 'unknown' }];
        }
      }
    } else if (Array.isArray(msg.attachments)) {
      attachments = msg.attachments;
    } else if (typeof msg.attachments === 'object') {
      // If it's a single object, wrap it in an array
      attachments = [msg.attachments];
    }
  }

  // Ensure each attachment has the required fields
  attachments = attachments.map(attachment => {
    if (typeof attachment === 'string') {
      return {
        name: attachment,
        type: 'unknown',
        url: '',
        size: 0
      };
    }
    return {
      name: attachment.name || 'unknown',
      type: attachment.type || 'unknown',
      url: attachment.url || '',
      size: attachment.size || 0
    };
  });

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
    const userId = req.user._id; // Use authenticated user ID
    
    // Input validation
    if (title && typeof title !== 'string') {
      return res.status(400).json({ message: 'Title must be a string' });
    }
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages must be an array' });
    }
    
    const chat = new Chat({
      title,
      userId: userId,
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
    const userId = req.user._id; // Use authenticated user ID
    const chats = await Chat.find({ userId: userId, isActive: true })
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
    const userId = req.user._id; // Use authenticated user ID
    
    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: userId, 
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
    const userId = req.user._id; // Use authenticated user ID
    
    // Input validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required and cannot be empty' });
    }
    
    if (!Array.isArray(attachments)) {
      return res.status(400).json({ message: 'Attachments must be an array' });
    }
    
    // If RAG is enabled, validate PDF ID
    if (useRAG && (!pdfId || typeof pdfId !== 'string' || pdfId.trim() === '')) {
      return res.status(400).json({ message: 'PDF ID is required when using RAG' });
    }
    
    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: userId, 
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
        console.log('Calling RAG service directly:', {
          pdfId,
          question: content,
          sessionId: chatId
        });

        // Create form data for RAG service
        const formData = new FormData();
        formData.append('pdf_id', pdfId);
        formData.append('question', content);
        formData.append('session_id', chatId);

        // Call RAG service directly
        const ragResponse = await axios.post(`${process.env.RAG_SERVICE_URL}pdf/query`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 3000000
        });

        aiResponse = {
          content: ragResponse.data.answer,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            ragMetadata: ragResponse.data.metadata,
            sessionId: ragResponse.data.session_id,
            source: 'RAG',
            pdfId: pdfId
          }
        };

        console.log('RAG service response:', ragResponse.data);

      } catch (ragError) {
        console.error('RAG query failed:', ragError);
        // Fallback to regular AI response if RAG fails
        aiResponse = {
          content: `I received your question about the PDF: "${content}". However, I encountered an issue processing your request: ${ragError.message}. Please try again or contact support.`,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            source: 'fallback',
            ragError: ragError.message,
            pdfId: pdfId
          }
        };
      }
    } else {
      // Regular AI response (simulated)
      aiResponse = {
        content: `I received your message: "${content}". This is a simulated AI response. To get answers from your PDFs, please upload a PDF first and then ask questions with useRAG: true and provide the pdfId.`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          source: 'simulated'
        }
      };
    }
    
    chat.messages.push(aiResponse);
    
    try {
      await chat.save();
    } catch (saveError) {
      console.error('Chat save failed:', saveError);
      if (saveError.errors) {
        console.error('Validation errors:', saveError.errors);
      }
      throw saveError;
    }
    
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
    const userId = req.user._id; // Use authenticated user ID
    
    // Input validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required and cannot be empty' });
    }
    
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: userId, isActive: true },
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
    const userId = req.user._id; // Use authenticated user ID
    
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: userId },
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
