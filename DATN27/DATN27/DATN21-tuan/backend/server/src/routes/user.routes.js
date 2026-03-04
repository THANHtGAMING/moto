const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const { asyncHandler } = require('../auth/checkAuth');
const { authUser, authAdmin } = require('../middleware/authUser');
const usersController = require('../controllers/user.controller');

// Multer configuration for avatar upload
const uploadDir = 'src/uploads/users';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    },
});

// Auth Routes
router.post('/register', asyncHandler(usersController.register));
router.post('/login', asyncHandler(usersController.login));
router.get('/auth', authUser, asyncHandler(usersController.authUser));
router.get('/logout', authUser, asyncHandler(usersController.logout));
router.post('/forgot-password', asyncHandler(usersController.forgotPassword));
router.post('/verify-forgot-password', asyncHandler(usersController.verifyForgotPassword));

// OAuth Routes - Google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/error` }),
    asyncHandler(usersController.googleCallbackHandler)
);

// OAuth Routes - Facebook
router.get('/auth/facebook', (req, res, next) => {
    console.log('Facebook auth initiated');
    // Với Facebook, email được lấy qua profileFields trong passport config
    // Không cần scope riêng nếu đã cấu hình profileFields có 'email'
    passport.authenticate('facebook')(req, res, next);
});

router.get('/auth/facebook/callback',
    (req, res, next) => {
        console.log('Facebook callback received');
        passport.authenticate('facebook', { 
            session: false, 
            failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/error?message=${encodeURIComponent('Đăng nhập Facebook thất bại')}`
        })(req, res, next);
    },
    asyncHandler(usersController.facebookCallbackHandler)
);

// Address Routes (MỚI)
router.post('/address', authUser, asyncHandler(usersController.addAddress));
router.delete('/address/:addressId', authUser, asyncHandler(usersController.deleteAddress));
router.patch('/address/set-default', authUser, asyncHandler(usersController.setDefaultAddress));

// User Profile Routes
router.put('/change-password', authUser, asyncHandler(usersController.changePassword));
router.put('/upload-avatar', authUser, upload.single('avatar'), asyncHandler(usersController.uploadAvatar));
router.put('/update-profile', authUser, asyncHandler(usersController.updateProfile));

// Admin Routes - User Management
router.get('/get', authAdmin, asyncHandler(usersController.getAllUsers));
router.delete('/delete/:id', authAdmin, asyncHandler(usersController.deleteUser));

module.exports = router;