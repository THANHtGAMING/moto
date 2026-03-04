const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { 
            type: String, 
            enum: ['ORDER', 'PROMOTION', 'SYSTEM', 'SECURITY'], 
            default: 'SYSTEM' 
        },
        metadata: { 
            orderId: { type: String }, // Lưu ID đơn hàng để click vào xem chi tiết
            image: { type: String }
        },
        isRead: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        collection: 'notifications'
    }
);

module.exports = mongoose.model('Notification', notificationSchema);