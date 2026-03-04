const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        logoUrl: { type: String, required: true }, // URL ảnh logo
        description: { type: String, default: '' },
        status: { 
            type: String, 
            enum: ['active', 'inactive'], 
            default: 'active' 
        }
    },
    {
        timestamps: true,
        collection: 'brands'
    }
);

module.exports = mongoose.model('brand', brandSchema);