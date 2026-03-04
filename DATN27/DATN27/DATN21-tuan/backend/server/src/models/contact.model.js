const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactSchema = new Schema(
    {
        name: { type: String, required: true }, // Tên người gửi
        email: { type: String, required: true }, // Email người gửi
        phone: { type: String }, // Số điện thoại
        subject: { type: String, required: true }, // Tiêu đề thư
        message: { type: String, required: true }, // Nội dung thư
        status: { 
            type: String, 
            enum: ['new', 'read', 'replied', 'archived'], 
            default: 'new' 
        }, // Trạng thái: mới, đã đọc, đã trả lời, đã lưu trữ
        isRead: { type: Boolean, default: false }, // Đã đọc chưa
        replyMessage: { type: String }, // Nội dung trả lời (nếu có)
        repliedAt: { type: Date }, // Thời gian trả lời
        repliedBy: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        } // Admin đã trả lời
    },
    {
        timestamps: true,
        collection: 'contacts'
    }
);

// Index for faster queries
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ isRead: 1 });

module.exports = mongoose.model('Contact', contactSchema);

