const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orderCode: { type: String, required: true, unique: true }, // Mã đơn hàng hiển thị cho khách (VD: #MOTO123)
        
        // Snapshot sản phẩm (Lưu cứng thông tin lúc mua)
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                nameProduct: String, // Lưu thêm tên để nhỡ xóa sản phẩm gốc vẫn xem được đơn
                imageProduct: String,
                price: Number, // Giá lúc mua
                quantity: { type: Number, default: 1 },
                size: { type: String, default: null }, // Lưu size để trừ tồn kho đúng
            },
        ],
        
        totalPrice: { type: Number, default: 0 }, // Tổng tiền hàng
        shippingFee: { type: Number, default: 0 }, // Phí ship (nếu có)
        discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá
        finalPrice: { type: Number, required: true }, // Khách phải trả
        
        // Thông tin giao hàng (Snapshot từ User hoặc nhập mới)
        shippingAddress: {
            fullName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            address: { type: String, required: true },
            email: { type: String, required: true },
        },

        couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
        
        paymentMethod: { type: String, enum: ['cod', 'momo', 'vnpay'], required: true },
        
        // Trạng thái thanh toán
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        
        // Trạng thái đơn hàng
        status: { 
            type: String, 
            enum: ['pending', 'pending_payment', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned', 'failed'], 
            default: 'pending' 
        },
        
        // Tracking log cho Admin/Shipper
        statusHistory: [
            {
                status: String,
                updatedAt: { type: Date, default: Date.now },
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }
        ]
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Order', orderSchema);