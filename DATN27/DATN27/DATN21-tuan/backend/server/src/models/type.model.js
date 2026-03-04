const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Type model - replaces category
// Simple model with name and slug
const typeModel = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        genders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gender' }], // Array of gender references
        tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }] // Array of tag references
    },
    { timestamps: true }
);

// Index for slug uniqueness and search
typeModel.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Type', typeModel);
