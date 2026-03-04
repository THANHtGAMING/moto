const brandModel = require('../models/brand.model');
const productModel = require('../models/product.model');
const cloudinary = require('../config/cloudDinary');
const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const fs = require('fs/promises');
const getPublicId = require('../utils/getPublicId');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class BrandController {
    // Validation rules
    validateCreate() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Tên thương hiệu là bắt buộc')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên thương hiệu phải từ 1-100 ký tự'),
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
                .withMessage('Tên thương hiệu không được để trống')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên thương hiệu phải từ 1-100 ký tự'),
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
    
    // Tạo thương hiệu
    async createBrand(req, res) {
        const { name, description } = req.body;

        if (!name) {
            throw new BadRequestError('Tên thương hiệu là bắt buộc');
        }

        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn logo thương hiệu');
        }

        let logoUrl = '';
        const { path } = req.file;
        try {
            const uploadResult = await cloudinary.uploader.upload(path, {
                folder: 'brands',
                resource_type: 'image',
            });
            logoUrl = uploadResult.url;
            await fs.unlink(path).catch(() => {});
        } catch (error) {
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
        }

        const newBrand = await brandModel.create({
            name,
            description: description || '',
            logoUrl
        });

        return new Created({
            message: 'Tạo thương hiệu thành công',
            metadata: newBrand
        }).send(res);
    }

    // Lấy tất cả
    async getAllBrands(req, res) {
        const brands = await brandModel.find({ status: 'active' }).sort({ createdAt: -1 });
        return new OK({
            message: 'Lấy danh sách thương hiệu thành công',
            metadata: brands
        }).send(res);
    }

    // Lấy chi tiết thương hiệu
    async getBrandById(req, res) {
        const { id } = req.params;
        const brand = await brandModel.findById(id);
        if (!brand) throw new NotFoundError('Thương hiệu không tồn tại');
        
        return new OK({
            message: 'Lấy thông tin thương hiệu thành công',
            metadata: brand
        }).send(res);
    }

    // Cập nhật thương hiệu
    async updateBrand(req, res) {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const brand = await brandModel.findById(id);
        if (!brand) throw new NotFoundError('Thương hiệu không tồn tại');

        const updateData = {};

        // Cập nhật thông tin cơ bản
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;

        // Nếu có upload logo mới
        if (req.file) {
            const { path } = req.file;
            try {
                // Xóa ảnh cũ trên cloudinary
                if (brand.logoUrl) {
                    try {
                        const publicId = getPublicId(brand.logoUrl);
                        await cloudinary.uploader.destroy(publicId);
                    } catch (e) {
                        console.error('Lỗi xóa ảnh cũ:', e);
                    }
                }

                // Upload ảnh mới
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'brands',
                    resource_type: 'image',
                });
                updateData.logoUrl = uploadResult.url;

                // Xóa file tạm
                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
            }
        }

        const updatedBrand = await brandModel.findByIdAndUpdate(id, updateData, { new: true });

        return new OK({
            message: 'Cập nhật thương hiệu thành công',
            metadata: updatedBrand
        }).send(res);
    }

    // Xóa thương hiệu
    async deleteBrand(req, res) {
        const { id } = req.params;
        const brand = await brandModel.findById(id);
        if (!brand) throw new NotFoundError('Thương hiệu không tồn tại');

        // Kiểm tra xem có sản phẩm nào đang sử dụng thương hiệu này không
        const productsUsingBrand = await productModel.countDocuments({ brandProduct: id });
        if (productsUsingBrand > 0) {
            throw new BadRequestError(
                `Không thể xóa thương hiệu này vì có ${productsUsingBrand} sản phẩm đang sử dụng. Vui lòng xóa hoặc cập nhật các sản phẩm trước.`
            );
        }

        // Xóa ảnh trên cloud
        if (brand.logoUrl) {
            try {
                const publicId = getPublicId(brand.logoUrl);
                await cloudinary.uploader.destroy(publicId);
            } catch (e) {
                console.error('Lỗi xóa ảnh cũ:', e);
            }
        }

        await brand.deleteOne();
        return new OK({ message: 'Xóa thành công', metadata: {} }).send(res);
    }
}

module.exports = new BrandController();
