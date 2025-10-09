const Chat = require('../models/Chat');

const createChat = async (req, res) => {
  try {
    const { title = 'New Chat' } = req.body;
    
    const chat = new Chat({
      title,
      userId: req.user._id,
      messages: []
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error creating chat' });
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
    const { content, attachments = [] } = req.body;
    
    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: req.user._id, 
      isActive: true 
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Add user message
    const userMessage = {
      content,
      role: 'user',
      timestamp: new Date(),
      attachments
    };
    
    chat.messages.push(userMessage);
    
    // Simulate AI response (in a real app, you'd call an AI service)
    const aiResponse = {
      content: `I received your message: "${content}". This is a simulated AI response. In a real implementation, this would be processed by an AI service like OpenAI's GPT.`,
      role: 'assistant',
      timestamp: new Date()
    };
    
    chat.messages.push(aiResponse);
    await chat.save();
    
    res.json({ message: 'Message sent successfully', chat });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
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
  deleteChat
};
