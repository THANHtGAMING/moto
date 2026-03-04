const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin, authUser } = require('../middleware/authUser');

const paymentController = require('../controllers/payment.controller');

router.post('/create', authUser, asyncHandler(paymentController.createPayment));
router.get('/vnpay-callback', asyncHandler(paymentController.vnpayCallback));
router.get('/momo-callback', asyncHandler(paymentController.momoCallback));

module.exports = router;
