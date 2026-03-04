const { NotFoundError, BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const genderModel = require('../models/gender.model');
const productModel = require('../models/product.model');
const typeModel = require('../models/type.model');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class GenderController {
    // Validation rules
    validateCreate() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Tên giới tính là bắt buộc')
                .isLength({ min: 1, max: 50 })
                .withMessage('Tên giới tính phải từ 1-50 ký tự'),
            validateRequest
        ];
    }

    validateUpdate() {
        return [
            param('id')
                .isMongoId()
                .withMessage('ID không hợp lệ'),
            body('name')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Tên giới tính không được để trống')
                .isLength({ min: 1, max: 50 })
                .withMessage('Tên giới tính phải từ 1-50 ký tự'),
            validateRequest
        ];
    }

    validateId() {
        return [
            param('id')
                .isMongoId()
                .withMessage('ID không hợp lệ'),
            validateRequest
        ];
    }

    // CREATE
    async createGender(req, res) {
        const { name } = req.body;

        const newGender = await genderModel.create({ name });

        return new Created({
            message: 'Tạo giới tính thành công',
            metadata: newGender,
        }).send(res);
    }

    // GET ALL
    async getAllGenders(req, res) {
        const genders = await genderModel.find().sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách giới tính thành công',
            metadata: genders,
        }).send(res);
    }

    // GET BY ID
    async getGenderById(req, res) {
        const { id } = req.params;

        const gender = await genderModel.findById(id);
        if (!gender) throw new NotFoundError('Giới tính không tồn tại');

        return new OK({
            message: 'Lấy thông tin giới tính thành công',
            metadata: gender,
        }).send(res);
    }

    // UPDATE
    async updateGender(req, res) {
        const { id } = req.params;
        const { name } = req.body;

        const gender = await genderModel.findById(id);
        if (!gender) throw new NotFoundError('Giới tính không tồn tại');

        if (name) gender.name = name;

        await gender.save();

        return new OK({
            message: 'Cập nhật giới tính thành công',
            metadata: gender,
        }).send(res);
    }

    // DELETE
    async deleteGender(req, res) {
        const { id } = req.params;

        const gender = await genderModel.findById(id);
        if (!gender) throw new NotFoundError('Giới tính không tồn tại');

        // Kiểm tra xem có sản phẩm nào đang sử dụng giới tính này không
        const productsUsingGender = await productModel.countDocuments({ genderProduct: id });
        if (productsUsingGender > 0) {
            throw new BadRequestError(
                `Không thể xóa giới tính này vì có ${productsUsingGender} sản phẩm đang sử dụng. Vui lòng xóa hoặc cập nhật các sản phẩm trước.`
            );
        }

        // Kiểm tra xem có loại nào đang sử dụng giới tính này không
        const typesUsingGender = await typeModel.countDocuments({ genders: id });
        if (typesUsingGender > 0) {
            throw new BadRequestError(
                `Không thể xóa giới tính này vì có ${typesUsingGender} loại sản phẩm đang sử dụng. Vui lòng cập nhật các loại trước.`
            );
        }

        await gender.deleteOne();

        return new OK({
            message: 'Xóa giới tính thành công',
            metadata: gender,
        }).send(res);
    }
}

module.exports = new GenderController();

