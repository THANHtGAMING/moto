const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const chatController = require('../controllers/chat.controller');

// --- User Routes (Cần đăng nhập) ---
router.get('/messages', authUser, asyncHandler(chatController.getMessages));
router.post('/send', authUser, asyncHandler(chatController.sendMessage));
router.put('/mark-read/:messageId', authUser, asyncHandler(chatController.markAsRead));
router.put('/mark-all-admin-read', authUser, asyncHandler(chatController.markAllAdminMessagesAsRead));
router.get('/unread-count', authUser, asyncHandler(chatController.getUnreadCount));

// --- Admin Routes (Cần đăng nhập và là admin) ---
router.post('/admin/send', authUser, asyncHandler(chatController.sendAdminMessage));
router.get('/admin/conversations', authUser, asyncHandler(chatController.getAllConversations));
router.get('/admin/messages/:userId', authUser, asyncHandler(chatController.getMessagesByUserId));
router.get('/admin/unread-count', authUser, asyncHandler(chatController.getAdminUnreadCount));
router.put('/admin/mark-read/:messageId', authUser, asyncHandler(chatController.markAdminAsRead));
router.put('/admin/mark-all-read/:userId', authUser, asyncHandler(chatController.markAllAsReadByUserId));

module.exports = router;

