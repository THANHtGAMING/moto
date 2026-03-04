const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const genderSchema = new Schema(
    {
        name: { type: String, required: true, unique: true }
    },
    {
        timestamps: true,
        collection: 'genders'
    }
);

module.exports = mongoose.model('Gender', genderSchema);

