const express = require('express');
const router = express.Router();
const { createChat, getChats, getChat, sendMessage, updateChat, deleteChat } = require('../controllers/chatController');

// Chat routes (no authentication required)

// Chat routes
router.post('/', createChat);
router.get('/', getChats);
router.get('/:chatId', getChat);
router.put('/:chatId', updateChat);
router.post('/:chatId/messages', sendMessage);
router.delete('/:chatId', deleteChat);

module.exports = router;
