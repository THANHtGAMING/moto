const { ConflictRequestError, NotFoundError, AuthFailureError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const otpModel = require('../models/otp.model');
const { createAccessToken, createRefreshToken } = require('../auth/checkAuth');
const SendMailForgotPassword = require('../utils/mailForgotPassword');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

function setCookie(res, accessToken, refreshToken) {
    // Secure flag chỉ bật khi production (HTTPS)
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    });
    res.cookie('logged', 1, {
        httpOnly: false,
        secure: isProduction,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    });
}

class UsersController {
    // ... (Giữ nguyên register, login, authUser, logout, forgotPassword...)
    async register(req, res) {
        const { email, password } = req.body;
        const fullName = req.body.fullName || req.body.fullname;
        if (!fullName) throw new BadRequestError('Vui lòng cung cấp họ tên');
        if (!password || password.length < 6) throw new BadRequestError('Mật khẩu phải có ít nhất 6 ký tự');
        
        const findUser = await userModel.findOne({ email });
        if (findUser) throw new ConflictRequestError('Email đã tồn tại');
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await userModel.create({
            fullName,
            email,
            password: hashedPassword,
        });

        return new Created({ message: 'Đăng ký thành công', metadata: newUser }).send(res);
    }

    async login(req, res) {
        const { email, password } = req.body;
        const findUser = await userModel.findOne({ email });
        if (!findUser) throw new NotFoundError('Tài khoản hoặc mật khẩu không chính xác !');

        // Kiểm tra nếu user không có password (đăng ký bằng OAuth)
        if (!findUser.password) {
            throw new AuthFailureError('Tài khoản này được đăng ký bằng Google/Facebook. Vui lòng đăng nhập bằng phương thức đó.');
        }

        const isMathPassword = await bcrypt.compare(password, findUser.password);
        if (!isMathPassword) throw new AuthFailureError('Tài khoản hoặc mật khẩu không chính xác !');

        const accessToken = createAccessToken({ id: findUser._id });
        const refreshToken = createRefreshToken({ id: findUser._id });
        setCookie(res, accessToken, refreshToken);

        return new OK({
            message: 'Đăng nhập thành công',
            metadata: { accessToken, refreshToken },
        }).send(res);
    }

    async authUser(req, res) {
        const userId = req.user;
        if (!userId) throw new AuthFailureError('Vui lòng đăng nhập lại');
        const findUser = await userModel.findById(userId);
        if (!findUser) throw new NotFoundError('Người dùng không tồn tại');

        return new OK({ message: 'Xác thực thành công', metadata: findUser }).send(res);
    }

    async logout(req, res) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');
        return new OK({ message: 'Đăng xuất thành công', metadata: {} }).send(res);
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        const findUser = await userModel.findOne({ email });
        if (!findUser) throw new NotFoundError('Email không tồn tại');

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const tokenForgotPassword = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('tokenForgotPassword', tokenForgotPassword, { httpOnly: false, secure: isProduction, maxAge: 5 * 60 * 1000, sameSite: 'strict' });

        await otpModel.create({ otp, email });
        await SendMailForgotPassword(email, otp);

        return new OK({ message: 'Mã OTP đã được gửi đến email của bạn', metadata: true }).send(res);
    }

    async verifyForgotPassword(req, res) {
        const { otp, password } = req.body;
        const tokenForgotPassword = req.cookies.tokenForgotPassword;
        if (!tokenForgotPassword || !otp) throw new BadRequestError('Bạn đang thiếu thông tin');
        
        let decoded;
        try {
            decoded = jwt.verify(tokenForgotPassword, process.env.JWT_SECRET);
        } catch(e) {
            throw new BadRequestError('Phiên làm việc hết hạn, vui lòng thử lại');
        }

        const email = decoded.email;
        const findOtp = await otpModel.findOne({ email, otp });
        if (!findOtp) throw new BadRequestError('Mã OTP không hợp lệ');

        const findUser = await userModel.findOne({ email });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        findUser.password = hashedPassword;
        await findUser.save();

        await otpModel.deleteMany({ email });
        res.clearCookie('tokenForgotPassword');

        return new OK({ message: 'Khôi phục mật khẩu thành công', metadata: true }).send(res);
    }

    // --- CÁC HÀM MỚI: QUẢN LÝ ĐỊA CHỈ ---

    async addAddress(req, res) {
        const userId = req.user;
        const { name, recipientName, phoneNumber, fullAddress } = req.body;
        let { isDefault } = req.body;

        if (!name || !recipientName || !phoneNumber || !fullAddress) {
            throw new BadRequestError('Thiếu thông tin địa chỉ');
        }

        const user = await userModel.findById(userId);
        if (!user) throw new NotFoundError('User không tồn tại');

        // Nếu là địa chỉ mặc định, bỏ mặc định các địa chỉ cũ
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        } else if (user.addresses.length === 0) {
            // Nếu là địa chỉ đầu tiên, tự động set mặc định
            isDefault = true;
        }

        user.addresses.push({ name, recipientName, phoneNumber, fullAddress, isDefault });
        await user.save();

        return new OK({
            message: 'Thêm địa chỉ thành công',
            metadata: user.addresses
        }).send(res);
    }

    async deleteAddress(req, res) {
        const userId = req.user;
        const { addressId } = req.params;

        const user = await userModel.findById(userId);
        
        // Lọc bỏ địa chỉ cần xóa
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();

        return new OK({
            message: 'Xóa địa chỉ thành công',
            metadata: user.addresses
        }).send(res);
    }

    async setDefaultAddress(req, res) {
        const userId = req.user;
        const { addressId } = req.body;

        const user = await userModel.findById(userId);
        
        user.addresses.forEach(addr => {
            if (addr._id.toString() === addressId) {
                addr.isDefault = true;
            } else {
                addr.isDefault = false;
            }
        });
        await user.save();

        return new OK({
            message: 'Đặt địa chỉ mặc định thành công',
            metadata: user.addresses
        }).send(res);
    }

    // Admin: Get all users with statistics
    async getAllUsers(req, res) {
        const users = await userModel.find().select('-password').lean(); // Không trả về password
        
        // Thêm thống kê cho mỗi user (số đơn hàng, tổng tiền)
        const orderModel = require('../models/order.model');
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                // Đếm số đơn hàng của user
                const orderCount = await orderModel.countDocuments({ userId: user._id });
                
                // Tính tổng tiền đã mua (chỉ tính đơn đã thanh toán/hoàn thành)
                const totalSpentResult = await orderModel.aggregate([
                    { $match: { userId: user._id, status: { $in: ['delivered', 'confirmed'] }, isPaid: true } },
                    { $group: { _id: null, total: { $sum: '$finalPrice' } } }
                ]);
                const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;
                
                return {
                    ...user,
                    orderCount,
                    totalSpent
                };
            })
        );
        
        return new OK({
            message: 'Lấy danh sách người dùng thành công',
            metadata: usersWithStats
        }).send(res);
    }

    // Admin: Delete user
    async deleteUser(req, res) {
        const { id } = req.params;
        const user = await userModel.findByIdAndDelete(id);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại');
        }
        return new OK({
            message: 'Xóa người dùng thành công',
            metadata: {}
        }).send(res);
    }

    // Change password
    async changePassword(req, res) {
        const userId = req.user;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }

        if (newPassword.length < 6) {
            throw new BadRequestError('Mật khẩu mới phải có ít nhất 6 ký tự');
        }

        const user = await userModel.findById(userId);
        if (!user) {
            throw new NotFoundError('Người dùng không tồn tại');
        }

        // Kiểm tra nếu user không có password (OAuth user)
        if (!user.password) {
            throw new BadRequestError('Tài khoản này được đăng ký bằng Google/Facebook. Không thể đổi mật khẩu.');
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatchPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isMatchPassword) {
            throw new AuthFailureError('Mật khẩu hiện tại không chính xác');
        }

        // Hash mật khẩu mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        user.password = hashedPassword;
        await user.save();

        return new OK({
            message: 'Đổi mật khẩu thành công',
            metadata: {}
        }).send(res);
    }

    // OAuth: Google Auth Redirect
    async googleAuthRedirect(req, res, next) {
        // Passport sẽ xử lý redirect
        // Không cần code ở đây, route sẽ gọi passport.authenticate
    }

    // OAuth: Google Callback Handler
    async googleCallbackHandler(req, res, next) {
        try {
            const user = req.user; // User từ passport strategy
            
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/error?message=${encodeURIComponent('Đăng nhập Google thất bại')}`);
            }

            // Tạo tokens
            const accessToken = createAccessToken({ id: user._id });
            const refreshToken = createRefreshToken({ id: user._id });

            // Set cookies
            setCookie(res, accessToken, refreshToken);

            // Redirect về frontend
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            return res.redirect(`${frontendUrl}/auth/success?token=${accessToken}`);
        } catch (error) {
            console.error('Google callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message || 'Đăng nhập Google thất bại')}`);
        }
    }

    // OAuth: Facebook Auth Redirect
    async facebookAuthRedirect(req, res, next) {
        // Passport sẽ xử lý redirect
        // Không cần code ở đây, route sẽ gọi passport.authenticate
    }

    // OAuth: Facebook Callback Handler
    async facebookCallbackHandler(req, res, next) {
        try {
            console.log('Facebook callback received');
            console.log('req.user:', req.user);
            console.log('req.query:', req.query);
            console.log('req.params:', req.params);
            
            const user = req.user; // User từ passport strategy
            
            if (!user) {
                console.error('Facebook callback: No user found in req.user');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
                return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Đăng nhập Facebook thất bại: Không thể lấy thông tin người dùng')}`);
            }

            console.log('Facebook login successful for user:', user.email);

            // Tạo tokens
            const accessToken = createAccessToken({ id: user._id });
            const refreshToken = createRefreshToken({ id: user._id });

            // Set cookies
            setCookie(res, accessToken, refreshToken);

            // Redirect về frontend
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            console.log('Redirecting to:', `${frontendUrl}/auth/success?token=${accessToken.substring(0, 20)}...`);
            return res.redirect(`${frontendUrl}/auth/success?token=${accessToken}`);
        } catch (error) {
            console.error('Facebook callback error:', error);
            console.error('Error stack:', error.stack);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            const errorMessage = error.message || 'Đăng nhập Facebook thất bại';
            return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
    }

    // Upload Avatar
    async uploadAvatar(req, res) {
        const userId = req.user;
        if (!userId) throw new AuthFailureError('Vui lòng đăng nhập lại');

        const findUser = await userModel.findById(userId);
        if (!findUser) throw new NotFoundError('Người dùng không tồn tại');

        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn ảnh đại diện');
        }

        const cloudinary = require('../config/cloudDinary');
        const fs = require('fs/promises');
        const getPublicId = require('../utils/getPublicId');

        const { path } = req.file;
        const oldAvatarUrl = findUser.avatar;

        try {
            // Upload new avatar to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(path, {
                folder: 'users/avatars',
                resource_type: 'image',
            });

            // Delete old avatar from Cloudinary (if exists and is Cloudinary URL)
            if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary.com')) {
                try {
                    const oldPublicId = getPublicId(oldAvatarUrl);
                    await cloudinary.uploader.destroy(oldPublicId);
                    console.log('Old avatar deleted from Cloudinary:', oldPublicId);
                } catch (destroyError) {
                    console.warn('Could not delete old avatar:', destroyError.message);
                }
            }

            // Update user avatar
            findUser.avatar = uploadResult.url;
            await findUser.save();

            // Delete temporary file
            await fs.unlink(path).catch(() => {});

            return new OK({
                message: 'Cập nhật ảnh đại diện thành công',
                metadata: findUser
            }).send(res);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Lỗi khi upload ảnh: ' + error.message);
        }
    }

    // Update Profile (fullName)
    async updateProfile(req, res) {
        const userId = req.user;
        if (!userId) throw new AuthFailureError('Vui lòng đăng nhập lại');

        const { fullName } = req.body;
        if (!fullName || fullName.trim().length < 2) {
            throw new BadRequestError('Họ và tên phải có ít nhất 2 ký tự');
        }

        const findUser = await userModel.findById(userId);
        if (!findUser) throw new NotFoundError('Người dùng không tồn tại');

        findUser.fullName = fullName.trim();
        await findUser.save();

        return new OK({
            message: 'Cập nhật hồ sơ thành công',
            metadata: findUser
        }).send(res);
    }
}

module.exports = new UsersController();