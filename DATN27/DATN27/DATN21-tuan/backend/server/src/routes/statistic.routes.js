const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const statisticController = require('../controllers/statistic.controller');

// Dashboard Overview (Cards)
router.get('/dashboard', authAdmin, asyncHandler(statisticController.getDashboardStats));

// Chart Data
router.get('/revenue-chart', authAdmin, asyncHandler(statisticController.getRevenueChart));

// Top Selling
router.get('/top-products', authAdmin, asyncHandler(statisticController.getTopSellingProducts));

module.exports = router;