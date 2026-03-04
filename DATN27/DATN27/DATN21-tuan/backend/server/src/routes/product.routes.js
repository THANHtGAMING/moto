const express = require('express');
const router = express.Router();
const fs = require('fs');

const multer = require('multer');
const path = require('path');

// Ensure upload directory exists
const uploadDir = 'src/uploads/products';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    },
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 100 // Maximum 100 files
    },
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận file ảnh
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');

const productController = require('../controllers/product.controller');

// Middleware để xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Kích thước file quá lớn. Mỗi file tối đa 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Số lượng file vượt quá giới hạn (tối đa 100 files).'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Tên field không đúng. Vui lòng sử dụng "imagesProduct".'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Lỗi upload file: ${err.message}`
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Lỗi upload file'
        });
    }
    next();
};

router.post('/create', authAdmin, upload.array('imagesProduct', 100), handleMulterError, productController.validateCreate(), asyncHandler(productController.createProduct));
router.get('/list', asyncHandler(productController.getAllProduct));
router.put('/update/:id', authAdmin, upload.array('imagesProduct', 100), handleMulterError, productController.validateUpdate(), asyncHandler(productController.updateProduct));
router.get('/detail/:id', productController.validateId(), asyncHandler(productController.getProductById));
router.delete('/delete/:id', authAdmin, productController.validateId(), asyncHandler(productController.deleteProduct));

module.exports = router;
