const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const replySchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }, // Đánh dấu reply từ admin
}, {
    timestamps: true
});

const reviewSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Ràng buộc: Phải mua rồi mới được đánh giá
        
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        images: { type: Array, default: [] }, // Ảnh feedback thực tế
        
        // Like/Dislike
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        
        // Replies/Comments
        replies: [replySchema],
        
        isHidden: { type: Boolean, default: false } // Admin có thể ẩn đánh giá spam
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Review', reviewSchema);