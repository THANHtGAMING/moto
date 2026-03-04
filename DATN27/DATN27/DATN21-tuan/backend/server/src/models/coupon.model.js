const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true }, // Mã code (VD: SUMMER2024)
        name: { type: String, required: true }, // Tên chương trình
        description: { type: String },
        
        // Loại giảm giá: Theo % hoặc theo số tiền cố định
        type: { 
            type: String, 
            enum: ['PERCENTAGE', 'FIXED_AMOUNT'], 
            default: 'PERCENTAGE',
            required: true
        },
        
        value: { type: Number, required: true }, // Giá trị (VD: 10 (10%) hoặc 50000 (50k))
        
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        
        minOrderValue: { type: Number, default: 0 }, // Giá trị đơn tối thiểu để áp dụng
        
        usageLimit: { type: Number, default: 100 }, // Giới hạn số lần dùng tối đa
        usedCount: { type: Number, default: 0 }, // Số lần đã dùng
        
        isActive: { type: Boolean, default: true },
        showOnHeader: { type: Boolean, default: false } // Hiển thị trên banner header
    },
    {
        timestamps: true,
        collection: 'coupons'
    }
);

module.exports = mongoose.model('Coupon', couponSchema);