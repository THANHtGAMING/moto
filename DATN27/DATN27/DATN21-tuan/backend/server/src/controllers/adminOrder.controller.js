const orderModel = require('../models/order.model');
const productModel = require('../models/product.model');
const couponModel = require('../models/coupon.model');
const userModel = require('../models/user.model');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const { OK } = require('../core/success.response');
const NotificationController = require('./notification.controller');

class AdminOrderController {
    // 1. GET /api/admin/order/list - Lấy danh sách đơn hàng với filter
    async getOrderList(req, res) {
        try {
            const { 
                status, 
                paymentMethod, 
                isPaid,
                startDate, 
                endDate, 
                keyword,
                page = 1, 
                limit = 20 
            } = req.query;

            // Build query
            const query = {};
            
            if (status && status !== '') {
                query.status = status;
            }
            
            if (paymentMethod && paymentMethod !== '') {
                query.paymentMethod = paymentMethod;
            }
            
            if (isPaid !== undefined && isPaid !== null && isPaid !== '') {
                query.isPaid = isPaid === 'true' || isPaid === true;
            }
            
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }
            
            if (keyword && keyword.trim() !== '') {
                query.$or = [
                    { orderCode: { $regex: keyword.trim(), $options: 'i' } },
                    { 'shippingAddress.fullName': { $regex: keyword.trim(), $options: 'i' } },
                    { 'shippingAddress.phoneNumber': { $regex: keyword.trim(), $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get orders with user info - handle null populate
            const orders = await orderModel.find(query)
                .populate({
                    path: 'userId',
                    select: 'fullName email phoneNumber',
                    strictPopulate: false // Cho phép populate null
                })
                .populate({
                    path: 'couponId',
                    select: 'code name value type',
                    strictPopulate: false // Cho phép populate null
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await orderModel.countDocuments(query);

            return new OK({
                message: 'Lấy danh sách đơn hàng thành công',
                metadata: {
                    orders,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit))
                    }
                }
            }).send(res);
        } catch (error) {
            console.error('Error in getOrderList:', error);
            throw new BadRequestError(error.message || 'Lỗi khi lấy danh sách đơn hàng');
        }
    }

    // 2. GET /api/admin/order/:orderId - Lấy chi tiết đơn hàng
    async getOrderDetail(req, res) {
        const { orderId } = req.params;

        const order = await orderModel.findById(orderId)
            .populate({
                path: 'userId',
                select: 'fullName email phoneNumber',
                model: 'User',
                strictPopulate: false
            })
            .populate({
                path: 'couponId',
                select: 'code name value type description',
                model: 'Coupon',
                strictPopulate: false
            });

        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        return new OK({
            message: 'Lấy chi tiết đơn hàng thành công',
            metadata: order
        }).send(res);
    }

    // 3. PATCH /api/admin/order/:orderId/status - Cập nhật trạng thái đơn hàng
    async updateOrderStatus(req, res) {
        const { orderId } = req.params;
        const { status, note } = req.body;
        const adminId = req.user; // Admin ID từ middleware

        const validStatuses = ['pending', 'pending_payment', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned', 'failed'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError('Trạng thái không hợp lệ');
        }

        const order = await orderModel.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        // Nếu hủy đơn hàng, hoàn lại tồn kho
        if (status === 'cancelled' && order.status !== 'cancelled') {
            const normalize = (s) => (s ? s.trim().toUpperCase() : null);
            
            for (const item of order.products) {
                const product = await productModel.findById(item.productId);
                if (!product) continue;
                
                const normalizedSize = normalize(item.size);
                const hasSize = product.sizes && product.sizes.length > 0 && normalizedSize;
                
                if (hasSize) {
                    const sizeObj = product.sizes.find(s => normalize(s.name) === normalizedSize);
                    if (sizeObj) {
                        sizeObj.stock += item.quantity;
                        await product.save();
                    }
                } else {
                    product.stockProduct += item.quantity;
                    await product.save();
                }
            }
            
            // Giảm usedCount của coupon nếu đã tăng
            if (order.couponId && order.isPaid) {
                await couponModel.findByIdAndUpdate(order.couponId, { $inc: { usedCount: -1 } });
            }
        }

        // Cập nhật trạng thái và lịch sử
        const previousStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: adminId,
            note: note || ''
        });
        await order.save();

        // Gửi thông báo mời đánh giá khi đơn hàng được giao thành công
        if (status === 'delivered' && previousStatus !== 'delivered') {
            // Gửi thông báo mời người dùng đánh giá (không tự động tạo review)
            NotificationController.pushNoti({
                userId: order.userId,
                title: '🎉 Đơn hàng đã được giao thành công!',
                message: `Đơn hàng ${order.orderCode} của bạn đã được giao thành công. Hãy đánh giá sản phẩm để giúp chúng tôi cải thiện dịch vụ nhé!`,
                type: 'ORDER',
                metadata: { orderId: order._id.toString() }
            }).catch(err => console.error('Error sending delivery notification:', err));
        }

        return new OK({
            message: 'Cập nhật trạng thái đơn hàng thành công',
            metadata: order
        }).send(res);
    }

    // 4. PATCH /api/admin/order/:orderId/mark-paid - Đánh dấu đã thanh toán
    async markOrderPaid(req, res) {
        const { orderId } = req.params;
        const { isPaid } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) throw new NotFoundError('Đơn hàng không tồn tại');

        // Nếu đánh dấu đã thanh toán và chưa trừ tồn kho
        if (isPaid && !order.isPaid) {
            // Kiểm tra tồn kho
            const normalize = (s) => (s ? s.trim().toUpperCase() : null);
            const outOfStockItems = [];
            
            for (const item of order.products) {
                const product = await productModel.findById(item.productId);
                if (!product) {
                    outOfStockItems.push(item.nameProduct || 'Sản phẩm không tồn tại');
                    continue;
                }
                
                const normalizedSize = normalize(item.size);
                const hasSize = product.sizes && product.sizes.length > 0 && normalizedSize;
                
                if (hasSize) {
                    const sizeObj = product.sizes.find(s => normalize(s.name) === normalizedSize);
                    if (!sizeObj || sizeObj.stock < item.quantity) {
                        outOfStockItems.push(`${product.nameProduct} size ${item.size}`);
                    }
                } else {
                    if (product.stockProduct < item.quantity) {
                        outOfStockItems.push(product.nameProduct);
                    }
                }
            }
            
            if (outOfStockItems.length > 0) {
                throw new BadRequestError(`Một số sản phẩm đã hết hàng: ${outOfStockItems.join(', ')}`);
            }
            
            // Trừ tồn kho
            for (const item of order.products) {
                const product = await productModel.findById(item.productId);
                if (!product) continue;
                
                const normalizedSize = normalize(item.size);
                const hasSize = product.sizes && product.sizes.length > 0 && normalizedSize;
                
                if (hasSize) {
                    const sizeObj = product.sizes.find(s => normalize(s.name) === normalizedSize);
                    if (sizeObj) {
                        sizeObj.stock -= item.quantity;
                        await product.save();
                    }
                } else {
                    product.stockProduct -= item.quantity;
                    await product.save();
                }
            }
            
            // Tăng usedCount cho coupon
            if (order.couponId) {
                await couponModel.findByIdAndUpdate(order.couponId, { $inc: { usedCount: 1 } });
            }
        }

        order.isPaid = isPaid;
        if (isPaid && !order.paidAt) {
            order.paidAt = new Date();
        }
        await order.save();

        return new OK({
            message: isPaid ? 'Đã đánh dấu đơn hàng đã thanh toán' : 'Đã bỏ đánh dấu thanh toán',
            metadata: order
        }).send(res);
    }
}

module.exports = new AdminOrderController();

