const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/reviews');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const { asyncHandler } = require('../auth/checkAuth');
const { authUser, authAdmin } = require('../middleware/authUser');
const reviewController = require('../controllers/review.controller');

// User routes
router.post('/create', authUser, upload.array('images', 5), asyncHandler(reviewController.createReview)); // Tối đa 5 ảnh
router.get('/product/:productId', asyncHandler(reviewController.getReviewsByProduct)); // Public ai cũng xem được
router.get('/pending/order/:orderId', authUser, asyncHandler(reviewController.getPendingReviews)); // Lấy sản phẩm chưa đánh giá trong đơn hàng
router.get('/pending/my-orders', authUser, asyncHandler(reviewController.getMyPendingReviews)); // Lấy tất cả đơn hàng cần đánh giá

// Like/Dislike routes
router.post('/:reviewId/like', authUser, asyncHandler(reviewController.toggleLike));
router.post('/:reviewId/dislike', authUser, asyncHandler(reviewController.toggleDislike));

// Reply/Comment routes
router.post('/:reviewId/reply', authUser, asyncHandler(reviewController.addReply));
router.delete('/:reviewId/reply/:replyId', authUser, asyncHandler(reviewController.deleteReply));

// Admin routes
router.get('/admin/list', authAdmin, asyncHandler(reviewController.getAllReviews));
router.patch('/admin/:reviewId/toggle-hide', authAdmin, asyncHandler(reviewController.toggleHideReview));

module.exports = router;