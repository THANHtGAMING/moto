const cloudinary = require('../config/cloudDinary');
const riderModel = require('../models/rider.model');
const productModel = require('../models/product.model');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const fs = require('fs/promises');
const getPublicId = require('../utils/getPublicId');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class RiderController {
    // Validation rules
    validateCreate() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Tên tay đua là bắt buộc')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên tay đua phải từ 1-100 ký tự'),
            body('team')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Tên đội không được quá 100 ký tự'),
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
                .withMessage('Tên tay đua không được để trống')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên tay đua phải từ 1-100 ký tự'),
            body('team')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Tên đội không được quá 100 ký tự'),
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

    async createRider(req, res) {
        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn ảnh tay đua');
        }

        const { path, filename } = req.file;
        const { name, team } = req.body;

        if (!name) {
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Thiếu thông tin tay đua');
        }

        try {
            const uploadResult = await cloudinary.uploader.upload(path, {
                folder: 'riders',
                resource_type: 'image',
            });

            const newRider = await riderModel.create({
                name,
                image: uploadResult.url,
                team: team || ''
            });

            await fs.unlink(path).catch(() => {});

            return new Created({
                message: 'Tạo tay đua thành công',
                metadata: newRider,
            }).send(res);
        } catch (error) {
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Lỗi khi upload ảnh lên Cloudinary: ' + error.message);
        }
    }

    async getAllRider(req, res) {
        const riders = await riderModel.find().sort({ createdAt: -1 });
        return new OK({
            message: 'Lấy danh sách tay đua thành công',
            metadata: riders,
        }).send(res);
    }

    async getRiderById(req, res) {
        const { id } = req.params;
        const rider = await riderModel.findById(id);
        if (!rider) throw new NotFoundError('Tay đua không tồn tại');
        
        return new OK({
            message: 'Lấy thông tin tay đua thành công',
            metadata: rider,
        }).send(res);
    }

    async updateRider(req, res) {
        const { id } = req.params;
        const { name, team } = req.body;
        
        if (!id) {
            throw new BadRequestError('Thiếu ID tay đua');
        }

        const findRider = await riderModel.findById(id);
        if (!findRider) {
            throw new NotFoundError('Tay đua không tồn tại');
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (team !== undefined) updateData.team = team;

        let imageUrl = findRider.image;
        const oldImageUrl = findRider.image;

        if (req.file) {
            const { path, filename } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'riders',
                    resource_type: 'image',
                });
                imageUrl = uploadResult.url;

                // Xóa ảnh cũ trên Cloudinary nếu có
                if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
                    try {
                        await cloudinary.uploader.destroy(getPublicId(oldImageUrl));
                    } catch (destroyError) {
                        console.warn('Không thể xóa ảnh cũ:', destroyError.message);
                    }
                }

                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi khi upload ảnh lên Cloudinary: ' + error.message);
            }
        }

        updateData.image = imageUrl;

        const updatedRider = await riderModel.findByIdAndUpdate(id, updateData, { new: true });

        return new OK({
            message: 'Cập nhật tay đua thành công',
            metadata: updatedRider,
        }).send(res);
    }

    async deleteRider(req, res) {
        const { id } = req.params;
        const findRider = await riderModel.findById(id);
        if (!findRider) throw new NotFoundError('Tay đua không tồn tại');

        // Kiểm tra xem có sản phẩm nào đang sử dụng tay đua này không
        const productsUsingRider = await productModel.countDocuments({ riderProduct: id });
        if (productsUsingRider > 0) {
            throw new BadRequestError(
                `Không thể xóa tay đua này vì có ${productsUsingRider} sản phẩm đang sử dụng. Vui lòng xóa hoặc cập nhật các sản phẩm trước.`
            );
        }

        if (findRider.image && findRider.image.includes('cloudinary.com')) {
            try {
                await cloudinary.uploader.destroy(getPublicId(findRider.image));
            } catch (e) {
                console.warn('Không thể xóa ảnh trên cloud:', e.message);
            }
        }

        await findRider.deleteOne();

        return new OK({
            message: 'Xóa tay đua thành công',
            metadata: findRider,
        }).send(res);
    }
}

module.exports = new RiderController();
