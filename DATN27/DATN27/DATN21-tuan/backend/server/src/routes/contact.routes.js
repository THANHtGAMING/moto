const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const contactController = require('../controllers/contact.controller');

// --- Public Routes ---
router.post('/create', asyncHandler(contactController.createContact));

// --- Protected Routes (Admin only) ---
router.get('/list', authUser, asyncHandler(contactController.getAllContacts));
router.get('/detail/:contactId', authUser, asyncHandler(contactController.getContactDetail));
router.put('/update/:contactId', authUser, asyncHandler(contactController.updateContactStatus));
router.delete('/delete/:contactId', authUser, asyncHandler(contactController.deleteContact));
router.get('/unread-count', authUser, asyncHandler(contactController.getUnreadCount));

module.exports = router;

