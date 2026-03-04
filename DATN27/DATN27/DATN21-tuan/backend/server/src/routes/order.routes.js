const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const { authNotAdmin } = require('../middleware/authUser');
const orderController = require('../controllers/order.controller');

router.post('/checkout', authNotAdmin, asyncHandler(orderController.checkout));
router.get('/my-orders', authNotAdmin, asyncHandler(orderController.getMyOrders));
router.get('/detail/:orderId', authNotAdmin, asyncHandler(orderController.getOrderDetail));
router.patch('/cancel/:orderId', authNotAdmin, asyncHandler(orderController.cancelOrder));

// Callback không cần authUser vì do Server VNPay/Momo gọi
router.get('/vnpay-callback', asyncHandler(orderController.vnpayCallback));
router.get('/momo-callback', asyncHandler(orderController.momoCallback));

module.exports = router;