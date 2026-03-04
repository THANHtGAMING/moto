const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../middleware/authUser');
const wishlistController = require('../controllers/wishlist.controller');

// Thêm/Xóa sản phẩm yêu thích (Toggle)
router.post('/toggle', authUser, asyncHandler(wishlistController.toggleWishlist));

// Lấy danh sách của tôi
router.get('/my-wishlist', authUser, asyncHandler(wishlistController.getMyWishlist));

module.exports = router;