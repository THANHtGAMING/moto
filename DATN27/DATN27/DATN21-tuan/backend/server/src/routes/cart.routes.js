const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authNotAdmin } = require('../middleware/authUser');

const cartController = require('../controllers/cart.controller');

router.post('/create', authNotAdmin, asyncHandler(cartController.createCart));
router.put('/update', authNotAdmin, asyncHandler(cartController.updateCart));
router.delete('/delete/:productId', authNotAdmin, asyncHandler(cartController.deleteProductInCart));
router.get('/get', authNotAdmin, asyncHandler(cartController.getCartInUser));
router.put('/update-info', authNotAdmin, asyncHandler(cartController.updateInfoCart));
router.put('/apply-coupon', authNotAdmin, asyncHandler(cartController.applyCoupon));

module.exports = router;
