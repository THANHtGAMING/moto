const mongoose = require('mongoose');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Kết nối thành công đến MongoDB');
    } catch (error) {
        console.error('Kết nối thất bại đến MongoDB', error);
    }
};


module.exports = connectDB;
