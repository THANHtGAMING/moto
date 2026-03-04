const { validationResult } = require('express-validator');
const { BadRequestError } = require('../core/error.response');

/**
 * Middleware to validate express-validator results
 * Returns 400 with validation errors if validation fails
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));
        throw new BadRequestError('Dữ liệu không hợp lệ: ' + errorMessages.map(e => e.message).join(', '));
    }
    next();
};

module.exports = validateRequest;

