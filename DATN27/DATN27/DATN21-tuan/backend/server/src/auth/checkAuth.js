const jwt = require('jsonwebtoken');

const asyncHandler = (fn) => {
    return async (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
        algorithm: 'HS256',
    });
};

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
        algorithm: 'HS256',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { asyncHandler, createAccessToken, createRefreshToken, verifyToken };
