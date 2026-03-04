const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const contactInfoController = require('../controllers/contactInfo.controller');

// --- Public Routes ---
router.get('/get', asyncHandler(contactInfoController.getContactInfo));

// --- Protected Routes (Admin only) ---
router.post('/create-or-update', authUser, asyncHandler(contactInfoController.createOrUpdateContactInfo));
router.put('/update/:contactInfoId', authUser, asyncHandler(contactInfoController.updateContactInfo));

module.exports = router;

