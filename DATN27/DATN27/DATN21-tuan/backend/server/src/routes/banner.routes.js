const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Config Multer (Upload file)
const uploadDir = 'src/uploads/banners';
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
const bannerController = require('../controllers/banner.controller');

// Public route - Lấy tất cả banner (active)
router.get('/list', asyncHandler(bannerController.getAllBanners));

// Admin routes
router.post('/create', authAdmin, upload.single('image'), asyncHandler(bannerController.createBanner));
router.put('/update/:id', authAdmin, upload.single('image'), asyncHandler(bannerController.updateBanner));
router.delete('/delete/:id', authAdmin, asyncHandler(bannerController.deleteBanner));
router.put('/update-order', authAdmin, asyncHandler(bannerController.updateBannerOrder));
router.put('/toggle-modal/:id', authAdmin, asyncHandler(bannerController.toggleModalBanner));

module.exports = router;

