const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const couponController = require('../controllers/coupon.controller');

// --- Admin Routes ---
router.post('/create', authAdmin, asyncHandler(couponController.createCoupon));
router.get('/list', authAdmin, asyncHandler(couponController.getAllCoupon));
router.get('/detail/:id', authAdmin, asyncHandler(couponController.getCouponById));
router.put('/update/:id', authAdmin, asyncHandler(couponController.updateCoupon));
router.delete('/delete/:id', authAdmin, asyncHandler(couponController.deleteCoupon));
router.put('/toggle-header/:id', authAdmin, asyncHandler(couponController.toggleShowOnHeader));

// --- Public Routes ---
// Lấy coupon đang được hiển thị trên header (không cần auth)
router.get('/header', asyncHandler(couponController.getHeaderCoupon));
// Lấy danh sách coupons available cho guest (không cần auth)
router.get('/available', asyncHandler(couponController.getAvailableCoupons));

// --- User Routes ---
// API này dùng để check xem mã có hợp lệ không và giảm bao nhiêu tiền trước khi đặt hàng
router.post('/apply', authUser, asyncHandler(couponController.applyCoupon));

module.exports = router;
