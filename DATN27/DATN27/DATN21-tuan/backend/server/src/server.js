// Load environment variables FIRST
require('dotenv').config();

// Debug: Kiểm tra biến môi trường
console.log('🔍 Checking environment variables...');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Not found');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Not found');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '/api/user/auth/google/callback');
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✅ Found' : '❌ Not found');
console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✅ Found' : '❌ Not found');
console.log('FACEBOOK_CALLBACK_URL:', process.env.FACEBOOK_CALLBACK_URL || '/api/user/auth/facebook/callback');

const express = require('express');
const app = express();
const port = 8000;

const bodyParser = require('body-parser');

const routes = require('./routes/index.routes');
const connectDB = require('./config/connectDB');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

// CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Body parser với giới hạn kích thước để hỗ trợ upload nhiều ảnh
// Tăng limit để hỗ trợ upload nhiều ảnh (100 files x 5MB = 500MB)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(cookieParser());

// Initialize Passport (không dùng session, chỉ dùng cho OAuth flow)
app.use(passport.initialize());

connectDB();

routes(app);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Log error for debugging
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);

    return res.status(statusCode).json({
        success: false,
        message: err.message || 'lỗi server',
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
