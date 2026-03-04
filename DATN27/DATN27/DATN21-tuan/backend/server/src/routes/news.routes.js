const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Ensure upload directory exists
const uploadDir = 'src/uploads/news';
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

const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const newsController = require('../controllers/news.controller');

// --- Public Routes (Hoặc Private tùy nghiệp vụ) ---
router.get('/list', asyncHandler(newsController.getAllNews));
router.get('/detail/:newsId', asyncHandler(newsController.getNewsDetail));

// --- Protected Routes (Cần đăng nhập/Admin) ---
router.post('/create', authUser, upload.single('cover_image'), asyncHandler(newsController.createNews));
router.put('/update/:newsId', authUser, upload.single('cover_image'), asyncHandler(newsController.updateNews));
router.delete('/delete/:newsId', authUser, asyncHandler(newsController.deleteNews));

module.exports = router;