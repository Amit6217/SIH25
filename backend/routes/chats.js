const express = require('express');
const router = express.Router();
const { createChat, getChats, getChat, sendMessage, updateChat, deleteChat, addMessage } = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Chat routes (authentication required)

// Chat routes
router.post('/', auth, createChat);
router.get('/', auth, getChats);
router.get('/:chatId', auth, getChat);
router.put('/:chatId', auth, updateChat);
router.post('/:chatId/messages', auth, sendMessage);
router.delete('/:chatId', auth, deleteChat);
router.post('/:chatId/add-message', auth, addMessage);

module.exports = router;
