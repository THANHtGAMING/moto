const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const newsSchema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true }, // Text content
        author: { type: String, required: true }, // Có thể đổi thành ObjectId ref User nếu muốn
        category_code: { type: String, required: true },
        published_date: { type: Date, default: Date.now },
        cover_image_url: { type: String, default: '' },
        status_code: { 
            type: String, 
            default: 'published', 
            enum: ['draft', 'published', 'hidden'] // Validate các trạng thái cho phép
        }, 
    },
    {
        timestamps: true, // Tự động tạo created_at và updated_at
        collection: 'news' // Tên collection trong Mongo
    },
);

// Index text search nếu cần tìm kiếm theo tiêu đề sau này
newsSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('news', newsSchema);