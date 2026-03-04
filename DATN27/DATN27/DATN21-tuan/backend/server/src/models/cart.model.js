const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartModel = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                size: { type: String, default: null },     // với sản phẩm không có size → null
                quantity: { type: Number, required: true },
            }
        ],

        totalPrice: { type: Number, default: 0 },
        finalPrice: { type: Number, default: 0 },
        couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },

        // Không bắt buộc
        fullName: String,
        phoneNumber: String,
        address: String,
        email: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('cart', cartModel);