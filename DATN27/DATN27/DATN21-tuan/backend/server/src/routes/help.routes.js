const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const helpController = require('../controllers/help.controller');

// --- Public Routes ---
router.get('/list', asyncHandler(helpController.getAllHelp));
router.get('/detail/:helpId', asyncHandler(helpController.getHelpDetail));

// --- Protected Routes (Cần đăng nhập/Admin) ---
router.post('/create', authUser, asyncHandler(helpController.createHelp));
router.put('/update/:helpId', authUser, asyncHandler(helpController.updateHelp));
router.delete('/delete/:helpId', authUser, asyncHandler(helpController.deleteHelp));

module.exports = router;

