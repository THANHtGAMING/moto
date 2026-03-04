const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const adminOrderController = require('../controllers/adminOrder.controller');

// GET /api/admin/order/list - Lấy danh sách đơn hàng với filter
router.get('/list', authAdmin, asyncHandler(adminOrderController.getOrderList));

// GET /api/admin/order/:orderId - Lấy chi tiết đơn hàng
router.get('/:orderId', authAdmin, asyncHandler(adminOrderController.getOrderDetail));

// PATCH /api/admin/order/:orderId/status - Cập nhật trạng thái đơn hàng
router.patch('/:orderId/status', authAdmin, asyncHandler(adminOrderController.updateOrderStatus));

// PATCH /api/admin/order/:orderId/mark-paid - Đánh dấu đã thanh toán
router.patch('/:orderId/mark-paid', authAdmin, asyncHandler(adminOrderController.markOrderPaid));

module.exports = router;

