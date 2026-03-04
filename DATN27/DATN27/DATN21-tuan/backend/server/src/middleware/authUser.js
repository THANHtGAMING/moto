const { AuthFailureError, ForbiddenError } = require('../core/error.response');

const { verifyToken } = require('../auth/checkAuth');

const userModel = require('../models/user.model');

const authUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const decoded = await verifyToken(accessToken);
        if (!decoded) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        req.user = decoded.id;
        next();
    } catch (error) {
        throw new AuthFailureError('Vui lòng đăng nhập lại');
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const decoded = await verifyToken(accessToken);
        if (!decoded) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const findUser = await userModel.findById(decoded.id);
        if (!findUser) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        if (findUser.isAdmin === false) {
            throw new ForbiddenError('Bạn không có quyền truy cập');
        }
        next();
    } catch (error) {
        throw new ForbiddenError('Bạn không có quyền truy cập');
    }
};

// Middleware để chặn Admin truy cập các chức năng của User (cart, order, payment)
const authNotAdmin = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const decoded = await verifyToken(accessToken);
        if (!decoded) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const findUser = await userModel.findById(decoded.id);
        if (!findUser) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        if (findUser.isAdmin === true) {
            throw new ForbiddenError('Admin không được phép sử dụng chức năng này');
        }
        req.user = decoded.id;
        next();
    } catch (error) {
        throw new ForbiddenError('Admin không được phép sử dụng chức năng này');
    }
};

module.exports = { authUser, authAdmin, authNotAdmin };
