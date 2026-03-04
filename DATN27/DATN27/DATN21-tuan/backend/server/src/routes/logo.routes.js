const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Config Multer (Upload file)
const uploadDir = 'src/uploads/logos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const logoController = require('../controllers/logo.controller');

// Public route - Lấy tất cả logo (active)
router.get('/list', asyncHandler(logoController.getAllLogos));

// Admin routes
router.post('/create', authAdmin, upload.single('image'), asyncHandler(logoController.createLogo));
router.put('/update/:id', authAdmin, upload.single('image'), asyncHandler(logoController.updateLogo));
router.delete('/delete/:id', authAdmin, asyncHandler(logoController.deleteLogo));
router.put('/update-order', authAdmin, asyncHandler(logoController.updateLogoOrder));
router.put('/toggle-pin/:id', authAdmin, asyncHandler(logoController.togglePinLogo));

// Public route - Lấy logo đã ghim
router.get('/pinned', asyncHandler(logoController.getPinnedLogo));

module.exports = router;

