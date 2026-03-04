const { NotFoundError, BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const tagModel = require('../models/tag.model');
const productModel = require('../models/product.model');
const typeModel = require('../models/type.model');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class TagController {
    // Validation rules
    validateCreate() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Tên tag là bắt buộc')
                .isLength({ min: 1, max: 50 })
                .withMessage('Tên tag phải từ 1-50 ký tự'),
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
                .withMessage('Tên tag không được để trống')
                .isLength({ min: 1, max: 50 })
                .withMessage('Tên tag phải từ 1-50 ký tự'),
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
    async createTag(req, res) {
        const { name } = req.body;

        const newTag = await tagModel.create({ name });

        return new Created({
            message: 'Tạo tag thành công',
            metadata: newTag,
        }).send(res);
    }

    // GET ALL
    async getAllTags(req, res) {
        const tags = await tagModel.find().sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách tag thành công',
            metadata: tags,
        }).send(res);
    }

    // GET BY ID
    async getTagById(req, res) {
        const { id } = req.params;

        const tag = await tagModel.findById(id);
        if (!tag) throw new NotFoundError('Tag không tồn tại');

        return new OK({
            message: 'Lấy thông tin tag thành công',
            metadata: tag,
        }).send(res);
    }

    // UPDATE
    async updateTag(req, res) {
        const { id } = req.params;
        const { name } = req.body;

        const tag = await tagModel.findById(id);
        if (!tag) throw new NotFoundError('Tag không tồn tại');

        if (name) tag.name = name;

        await tag.save();

        return new OK({
            message: 'Cập nhật tag thành công',
            metadata: tag,
        }).send(res);
    }

    // DELETE
    async deleteTag(req, res) {
        const { id } = req.params;

        const tag = await tagModel.findById(id);
        if (!tag) throw new NotFoundError('Tag không tồn tại');

        // Kiểm tra xem có sản phẩm nào đang sử dụng tag này không
        const productsUsingTag = await productModel.countDocuments({ tags: id });
        if (productsUsingTag > 0) {
            throw new BadRequestError(
                `Không thể xóa tag này vì có ${productsUsingTag} sản phẩm đang sử dụng. Vui lòng xóa hoặc cập nhật các sản phẩm trước.`
            );
        }

        // Kiểm tra xem có loại nào đang sử dụng tag này không
        const typesUsingTag = await typeModel.countDocuments({ tags: id });
        if (typesUsingTag > 0) {
            throw new BadRequestError(
                `Không thể xóa tag này vì có ${typesUsingTag} loại sản phẩm đang sử dụng. Vui lòng cập nhật các loại trước.`
            );
        }

        await tag.deleteOne();

        return new OK({
            message: 'Xóa tag thành công',
            metadata: tag,
        }).send(res);
    }
}

module.exports = new TagController();

