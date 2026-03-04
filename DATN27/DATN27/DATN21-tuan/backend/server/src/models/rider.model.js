const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const riderModel = new Schema(
    {
        name: { type: String, required: true },
        team: { type: String, default: '' },
        image: { type: String, default: '' }
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Rider', riderModel);
