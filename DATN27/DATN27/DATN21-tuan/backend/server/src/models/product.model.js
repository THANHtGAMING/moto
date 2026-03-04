const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productModel = new Schema(
    {
        imagesProduct: { type: Array, required: true },
        nameProduct: { type: String, required: true },
        priceProduct: { type: Number, required: true },
        discountProduct: { type: Number, default: 0 },
        descriptionProduct: { type: String, required: true },

        // Nếu là quần áo → có nhiều size
        sizes: [
            {
                name: { type: String },   // S, M, L, XL, XXL (người lớn) hoặc "3 tháng", "6 tháng", "12 tháng", "2 tuổi", "3 tuổi" (trẻ em)
                stock: { type: Number }   // Tồn riêng mỗi size
            }
        ],
        
        // Loại size: 'standard' (S, M, L...), 'age' (theo tuổi), 'month' (theo tháng), hoặc null (tự do)
        sizeType: { type: String, enum: ['standard', 'age', 'month'], default: null },

        // Nếu là phụ kiện → dùng stock tổng
        stockProduct: { type: Number, default: 0 },

        // References - removed categoryProduct, added genderProduct
        genderProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Gender', default: null },
        typeProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
        riderProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },
        brandProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'brand', default: null },
        
        // Tags array
        tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
        
        // Active status
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Text index for search functionality
productModel.index({ nameProduct: 'text', descriptionProduct: 'text' });

// Compound index for filter & sort performance
// Updated: removed categoryProduct, added genderProduct
productModel.index({
    genderProduct: 1,
    typeProduct: 1,
    riderProduct: 1,
    brandProduct: 1,
    priceProduct: 1,
    createdAt: -1
});

// Pre-save middleware to handle sizes vs stockProduct logic
productModel.pre('save', function(next) {
    // If sizes array has data (length > 0), set stockProduct to 0
    if (this.sizes && Array.isArray(this.sizes) && this.sizes.length > 0) {
        this.stockProduct = 0;
    }
    next();
});

// Pre-validate middleware to ensure stockProduct is provided when sizes is empty
productModel.pre('validate', function(next) {
    // If sizes is empty/undefined, stockProduct must be provided and >= 0
    if (!this.sizes || !Array.isArray(this.sizes) || this.sizes.length === 0) {
        if (this.stockProduct === undefined || this.stockProduct === null) {
            return next(new Error('stockProduct is required when sizes is empty'));
        }
        if (this.stockProduct < 0) {
            return next(new Error('stockProduct must be >= 0'));
        }
    }
    next();
});

module.exports = mongoose.model('Product', productModel);
