const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactInfoSchema = new Schema(
    {
        address: { type: String, required: true }, // Địa chỉ
        phone: { type: String, required: true }, // Số điện thoại
        email: { type: String, required: true }, // Email
        mapUrl: { type: String }, // URL bản đồ (Google Maps, etc.)
        workingHours: { type: String }, // Giờ làm việc
        facebook: { type: String }, // Link Facebook
        instagram: { type: String }, // Link Instagram
        zalo: { type: String }, // Số Zalo
        status: { 
            type: String, 
            enum: ['active', 'inactive'], 
            default: 'active' 
        }
    },
    {
        timestamps: true,
        collection: 'contactinfos'
    }
);

// Chỉ cho phép 1 bản ghi active
contactInfoSchema.index({ status: 1 });

module.exports = mongoose.model('ContactInfo', contactInfoSchema);

