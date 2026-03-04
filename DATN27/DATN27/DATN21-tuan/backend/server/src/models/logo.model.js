const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const logoSchema = new Schema(
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
        location: {
            type: String,
            enum: ['header', 'footer', 'other'],
            default: 'header'
        },
        isPinned: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'logos'
    }
);

// Index for faster queries
logoSchema.index({ order: 1, isActive: 1, location: 1 });
logoSchema.index({ isPinned: 1 });

module.exports = mongoose.model('Logo', logoSchema);

