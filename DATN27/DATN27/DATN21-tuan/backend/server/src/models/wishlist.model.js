const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                addedAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
        collection: 'wishlists'
    }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);