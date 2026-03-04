const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bannerSchema = new Schema(
    {
        imageUrl: { 
            type: String, 
            required: true,
            trim: true
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            trim: true,
            default: ''
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        isModal: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'banners'
    }
);

// Index for faster queries
bannerSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);

