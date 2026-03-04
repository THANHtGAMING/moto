const { Created, OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const typeModel = require('../models/type.model');
const genderModel = require('../models/gender.model');
const tagModel = require('../models/tag.model');
const productModel = require('../models/product.model');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class TypeController {
    // Validation rules
    validateCreate() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Tên loại là bắt buộc')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên loại phải từ 1-100 ký tự'),
            body('genders')
                .optional()
                .isArray()
                .withMessage('Genders phải là một mảng'),
            body('genders.*')
                .optional()
                .isMongoId()
                .withMessage('Mỗi gender ID phải là MongoDB ObjectId hợp lệ'),
            body('tags')
                .optional()
                .isArray()
                .withMessage('Tags phải là một mảng'),
            body('tags.*')
                .optional()
                .isMongoId()
                .withMessage('Mỗi tag ID phải là MongoDB ObjectId hợp lệ'),
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
                .withMessage('Tên loại không được để trống')
                .isLength({ min: 1, max: 100 })
                .withMessage('Tên loại phải từ 1-100 ký tự'),
            body('genders')
                .optional()
                .isArray()
                .withMessage('Genders phải là một mảng'),
            body('genders.*')
                .optional()
                .isMongoId()
                .withMessage('Mỗi gender ID phải là MongoDB ObjectId hợp lệ'),
            body('tags')
                .optional()
                .isArray()
                .withMessage('Tags phải là một mảng'),
            body('tags.*')
                .optional()
                .isMongoId()
                .withMessage('Mỗi tag ID phải là MongoDB ObjectId hợp lệ'),
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

    async createType(req, res) {
        const { name, genders, tags } = req.body;

        if (!name) {
            throw new BadRequestError('Thiếu tên loại');
        }

        // Validate genders if provided
        if (genders && Array.isArray(genders) && genders.length > 0) {
            const validGenders = await genderModel.find({ _id: { $in: genders } });
            if (validGenders.length !== genders.length) {
                throw new BadRequestError('Một hoặc nhiều gender ID không hợp lệ');
            }
        }

        // Validate tags if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
            const validTags = await tagModel.find({ _id: { $in: tags } });
            if (validTags.length !== tags.length) {
                throw new BadRequestError('Một hoặc nhiều tag ID không hợp lệ');
            }
        }

        // Auto-generate slug
        const slug = await generateUniqueSlug(typeModel, name);

        const newType = await typeModel.create({
            name,
            slug,
            genders: genders && Array.isArray(genders) ? genders : [],
            tags: tags && Array.isArray(tags) ? tags : []
        });

        // Populate genders and tags before returning
        await newType.populate('genders', 'name');
        await newType.populate('tags', 'name');

        return new Created({
            message: 'Tạo loại thành công',
            metadata: newType,
        }).send(res);
    }

    // Lấy types
    async getAllType(req, res) {
        const { gender } = req.query; // Optional filter by gender
        
        // Build filter object
        const filter = {};
        
        // Filter by gender if provided - check if gender ID exists in genders array
        if (gender) {
            filter.genders = gender; // Mongoose will automatically match if gender ID is in the array
            console.log('Filtering types by gender ID:', gender);
        }
        
        console.log('Type filter:', filter);
        const types = await typeModel.find(filter)
            .populate('genders', 'name')
            .populate('tags', 'name')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${types.length} types${gender ? ` for gender ${gender}` : ''}`);
        
        return new OK({
            message: 'Lấy loại thành công',
            metadata: types,
        }).send(res);
    }

    async getTypeById(req, res) {
        const { id } = req.params;
        const type = await typeModel.findById(id)
            .populate('genders', 'name')
            .populate('tags', 'name');
        if (!type) throw new NotFoundError('Loại không tồn tại');
        
        return new OK({
            message: 'Lấy thông tin loại thành công',
            metadata: type,
        }).send(res);
    }

    async updateType(req, res) {
        const { id } = req.params;
        const { name, genders, tags } = req.body;
        
        const findType = await typeModel.findById(id);
        if (!findType) throw new NotFoundError('Loại không tồn tại');

        const updateData = {};
        
        if (name) {
            updateData.name = name;
            // Regenerate slug if name changes
            updateData.slug = await generateUniqueSlug(typeModel, name, id);
        }

        // Handle genders update
        if (genders !== undefined) {
            if (Array.isArray(genders)) {
                // Validate genders if provided
                if (genders.length > 0) {
                    const validGenders = await genderModel.find({ _id: { $in: genders } });
                    if (validGenders.length !== genders.length) {
                        throw new BadRequestError('Một hoặc nhiều gender ID không hợp lệ');
                    }
                }
                updateData.genders = genders;
            } else {
                throw new BadRequestError('Genders phải là một mảng');
            }
        }

        // Handle tags update
        if (tags !== undefined) {
            if (Array.isArray(tags)) {
                // Validate tags if provided
                if (tags.length > 0) {
                    const validTags = await tagModel.find({ _id: { $in: tags } });
                    if (validTags.length !== tags.length) {
                        throw new BadRequestError('Một hoặc nhiều tag ID không hợp lệ');
                    }
                }
                updateData.tags = tags;
            } else {
                throw new BadRequestError('Tags phải là một mảng');
            }
        }

        const updatedType = await typeModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate('genders', 'name')
            .populate('tags', 'name');

        return new OK({
            message: 'Cập nhật loại thành công',
            metadata: updatedType,
        }).send(res);
    }

    async deleteType(req, res) {
        const { id } = req.params;
        const findType = await typeModel.findById(id);
        if (!findType) throw new NotFoundError('Loại không tồn tại');

        // Kiểm tra xem có sản phẩm nào đang sử dụng loại này không
        // typeProduct là required field trong Product model
        const productsUsingType = await productModel.countDocuments({ typeProduct: id });
        if (productsUsingType > 0) {
            throw new BadRequestError(
                `Không thể xóa loại này vì có ${productsUsingType} sản phẩm đang sử dụng. Vui lòng xóa hoặc cập nhật các sản phẩm trước.`
            );
        }

        await findType.deleteOne();

        return new OK({
            message: 'Xóa loại thành công',
            metadata: findType,
        }).send(res);
    }
}

module.exports = new TypeController();
