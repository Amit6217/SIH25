const express = require('express');
const router = express.Router();
const { createChat, getChats, getChat, sendMessage, deleteChat } = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All chat routes require authentication
router.use(auth);

// Chat routes
router.post('/', createChat);
router.get('/', getChats);
router.get('/:chatId', getChat);
router.post('/:chatId/messages', sendMessage);
router.delete('/:chatId', deleteChat);

module.exports = router;
