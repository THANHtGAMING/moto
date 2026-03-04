// Load environment variables first (in case passport.js is required before dotenv.config() in server.js)
if (!process.env.FACEBOOK_APP_ID && !process.env.GOOGLE_CLIENT_ID) {
    require('dotenv').config();
}

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const userModel = require('../models/user.model');

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/user/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Lấy email từ profile
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                
                if (!email) {
                    return done(new Error('Google không cung cấp email. Vui lòng cung cấp email công khai trong tài khoản Google của bạn.'), null);
                }

                // Tìm user theo email hoặc googleId
                let user = await userModel.findOne({
                    $or: [
                        { email: email },
                        { googleId: profile.id }
                    ]
                });

                if (user) {
                    // User đã tồn tại
                    // Kiểm tra status
                    if (user.status !== 'active') {
                        return done(new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.'), null);
                    }

                    // Cập nhật googleId và avatar nếu chưa có
                    if (!user.googleId) {
                        user.googleId = profile.id;
                    }
                    if (profile.photos && profile.photos[0] && profile.photos[0].value && !user.avatar) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                } else {
                    // Tạo user mới
                    let fullName = profile.displayName;
                    if (!fullName && profile.name) {
                        const givenName = profile.name.givenName || '';
                        const familyName = profile.name.familyName || '';
                        fullName = (givenName + ' ' + familyName).trim() || 'User';
                    }
                    if (!fullName) fullName = 'User';
                    
                    user = await userModel.create({
                        fullName: fullName,
                        email: email,
                        password: null, // Không có password cho OAuth user
                        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                        googleId: profile.id,
                        isAdmin: false,
                        status: 'active'
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Facebook Strategy (chỉ khởi tạo nếu có biến môi trường)
console.log('🔍 Checking Facebook OAuth configuration...');
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✅ Found' : '❌ Not found');
console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✅ Found' : '❌ Not found');
console.log('FACEBOOK_CALLBACK_URL:', process.env.FACEBOOK_CALLBACK_URL || '/api/user/auth/facebook/callback');

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    try {
        passport.use(
            'facebook',
            new FacebookStrategy(
                {
                    clientID: process.env.FACEBOOK_APP_ID,
                    clientSecret: process.env.FACEBOOK_APP_SECRET,
                    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/user/auth/facebook/callback',
                    profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
                    enableProof: true
                },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log('Facebook profile received:', JSON.stringify(profile, null, 2));
                    
                    // Lấy email từ profile - Facebook có thể trả về trong profile._json hoặc profile.emails
                    let email = null;
                    if (profile.emails && profile.emails.length > 0) {
                        email = profile.emails[0].value;
                    } else if (profile._json && profile._json.email) {
                        email = profile._json.email;
                    }
                    
                    if (!email) {
                        console.error('Facebook profile missing email:', profile);
                        return done(new Error('Facebook không cung cấp email. Vui lòng cung cấp email công khai trong tài khoản Facebook của bạn hoặc đăng nhập bằng email/password.'), null);
                    }

                    // Lấy avatar từ Facebook
                    let avatar = '';
                    if (profile.photos && profile.photos.length > 0 && profile.photos[0].value) {
                        avatar = profile.photos[0].value;
                    } else if (profile._json && profile._json.picture && profile._json.picture.data && profile._json.picture.data.url) {
                        avatar = profile._json.picture.data.url;
                    }

                    // Tìm user theo email hoặc facebookId
                    let user = await userModel.findOne({
                        $or: [
                            { email: email },
                            { facebookId: profile.id }
                        ]
                    });

                    if (user) {
                        // User đã tồn tại
                        // Kiểm tra status
                        if (user.status !== 'active') {
                            return done(new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.'), null);
                        }

                        // Cập nhật facebookId và avatar nếu chưa có
                        if (!user.facebookId) {
                            user.facebookId = profile.id;
                        }
                        if (avatar && !user.avatar) {
                            user.avatar = avatar;
                        }
                        await user.save();
                        console.log('Facebook login: User updated:', user.email);
                    } else {
                        // Tạo user mới
                        user = await userModel.create({
                            fullName: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'User',
                            email: email,
                            password: null, // Không có password cho OAuth user
                            avatar: avatar,
                            facebookId: profile.id,
                            isAdmin: false,
                            status: 'active'
                        });
                        console.log('Facebook login: New user created:', user.email);
                    }

                    return done(null, user);
                } catch (error) {
                    console.error('Facebook Strategy Error:', error);
                    return done(error, null);
                }
            }
            )
        );
        console.log('✅ Facebook OAuth Strategy initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Facebook Strategy:', error);
        throw error;
    }
} else {
    console.log('⚠️  Facebook OAuth not configured (FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not found)');
    console.log('   Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to your .env file');
}

// Serialize user for session (nếu dùng session)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

