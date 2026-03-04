const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const helpSchema = new Schema(
    {
        name: { type: String, required: true }, // Tên chủ đề help
        description: { type: String, required: true }, // Mô tả ngắn
        icon: { type: String, required: true }, // Font Awesome icon class (ví dụ: "fas fa-user", "fas fa-shopping-cart")
        iconColor: { type: String, default: '#6c757d' }, // Màu nền cho icon (hex color)
        order: { type: Number, default: 0 }, // Thứ tự hiển thị
        status: { 
            type: String, 
            enum: ['active', 'inactive'], 
            default: 'active' 
        }
    },
    {
        timestamps: true,
        collection: 'helps'
    }
);

// Index for sorting
helpSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('Help', helpSchema);

