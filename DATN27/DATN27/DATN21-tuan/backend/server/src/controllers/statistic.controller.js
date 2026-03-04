const orderModel = require('../models/order.model');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const { OK } = require('../core/success.response');

class StatisticController {
    
    // Thống kê tổng quan cho thẻ Dashboard (Cards)
    async getDashboardStats(req, res) {
        // 1. Tổng doanh thu (Chỉ tính đơn hàng đã hoàn thành - delivered và đã thanh toán)
        const revenue = await orderModel.aggregate([
            { $match: { status: 'delivered', isPaid: true } },
            { $group: { _id: null, total: { $sum: '$finalPrice' } } }
        ]);
        const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

        // 2. Đếm số lượng
        const totalOrders = await orderModel.countDocuments();
        const totalUsers = await userModel.countDocuments({ role: { $ne: 'ADMIN' } }); // Trừ admin ra
        const totalProducts = await productModel.countDocuments();

        // 3. Đơn hàng mới nhất (5 đơn)
        const recentOrders = await orderModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'fullName email')
            .select('orderCode totalPrice status createdAt');

        return new OK({
            message: 'Lấy số liệu thống kê thành công',
            metadata: {
                totalRevenue,
                totalOrders,
                totalUsers,
                totalProducts,
                recentOrders
            }
        }).send(res);
    }

    // Biểu đồ doanh thu theo ngày (7 ngày gần nhất)
    async getRevenueChart(req, res) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const chartData = await orderModel.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: sevenDaysAgo },
                    status: 'delivered', // Chỉ tính đơn đã hoàn thành
                    isPaid: true
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$finalPrice" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
        ]);

        return new OK({
            message: 'Lấy dữ liệu biểu đồ thành công',
            metadata: chartData
        }).send(res);
    }

    // Top sản phẩm bán chạy
    async getTopSellingProducts(req, res) {
        const topProducts = await orderModel.aggregate([
            { $unwind: "$products" }, // Tách mảng sản phẩm ra từng dòng
            { $match: { status: 'delivered', isPaid: true } }, // Chỉ tính đơn đã hoàn thành và đã thanh toán
            {
                $group: {
                    _id: "$products.productId",
                    name: { $first: "$products.nameProduct" },
                    totalSold: { $sum: "$products.quantity" },
                    revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } }, // Sắp xếp bán chạy nhất
            { $limit: 5 }
        ]);

        return new OK({
            message: 'Lấy top sản phẩm bán chạy thành công',
            metadata: topProducts
        }).send(res);
    }
}

module.exports = new StatisticController();