const { NotFoundError, BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');
const cloudinary = require('../config/cloudDinary');
const getPublicId = require('../utils/getPublicId');
const escapeRegex = require('../utils/escapeRegex');
const productModel = require('../models/product.model');
const typeModel = require('../models/type.model');
const riderModel = require('../models/rider.model');
const brandModel = require('../models/brand.model');
const genderModel = require('../models/gender.model');
const tagModel = require('../models/tag.model');
const fs = require('fs/promises');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

class ProductController {
    // Validation rules
    validateCreate() {
        return [
            body('nameProduct')
                .trim()
                .notEmpty()
                .withMessage('Tên sản phẩm là bắt buộc')
                .isLength({ min: 1, max: 200 })
                .withMessage('Tên sản phẩm phải từ 1-200 ký tự'),
            body('priceProduct')
                .isFloat({ min: 0 })
                .withMessage('Giá sản phẩm phải là số >= 0'),
            body('discountProduct')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Giảm giá phải là số >= 0'),
            body('descriptionProduct')
                .trim()
                .notEmpty()
                .withMessage('Mô tả sản phẩm là bắt buộc'),
            body('typeProduct')
                .isMongoId()
                .withMessage('Type ID không hợp lệ'),
            body('genderProduct')
                .optional()
                .isMongoId()
                .withMessage('Gender ID không hợp lệ'),
            body('riderProduct')
                .optional()
                .isMongoId()
                .withMessage('Rider ID không hợp lệ'),
            body('brandProduct')
                .optional()
                .isMongoId()
                .withMessage('Brand ID không hợp lệ'),
            body('tags')
                .optional()
                .isArray()
                .withMessage('Tags phải là mảng'),
            body('stockProduct')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Số lượng tồn kho phải là số nguyên >= 0'),
            validateRequest
        ];
    }

    validateUpdate() {
        return [
            param('id')
                .isMongoId()
                .withMessage('ID không hợp lệ'),
            body('nameProduct')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Tên sản phẩm không được để trống'),
            body('priceProduct')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Giá sản phẩm phải là số >= 0'),
            body('discountProduct')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Giảm giá phải là số >= 0'),
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

    // =======================
    // CREATE PRODUCT
    // =======================
    async createProduct(req, res) {
        const dataImages = req.files;
        const {
            nameProduct,
            priceProduct,
            discountProduct = 0,
            stockProduct = 0,
            descriptionProduct,
            typeProduct,
            genderProduct,
            riderProduct,
            brandProduct,
            tags = [],
            sizes,
            sizeType
        } = req.body;

        if (!nameProduct || !priceProduct || !descriptionProduct || !typeProduct || !dataImages) {
            throw new BadRequestError('Thiếu thông tin sản phẩm');
        }

        // Upload ảnh lên Cloudinary
        let imagesProduct = [];
        for (let i = 0; i < dataImages.length; i++) {
            const image = dataImages[i];
            try {
                const { path, filename } = image;
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'products',
                    resource_type: 'image',
                    timeout: 60000, // 60 seconds timeout
                });
                if (uploadResult && uploadResult.url) {
                    imagesProduct.push(uploadResult.url);
                } else {
                    console.warn(`Upload ảnh ${filename} không trả về URL`);
                }
                // Xóa file tạm sau khi upload
                await fs.unlink(path).catch((err) => {
                    console.warn(`Không thể xóa file tạm ${path}:`, err.message);
                });
            } catch (uploadError) {
                console.error(`Lỗi khi upload ảnh ${image.filename}:`, uploadError);
                // Xóa file tạm ngay cả khi upload lỗi
                await fs.unlink(image.path).catch(() => {});
                // Nếu upload lỗi, throw error để dừng quá trình
                throw new BadRequestError(`Lỗi khi upload ảnh ${image.originalname || image.filename}: ${uploadError.message || 'Upload thất bại'}`);
            }
        }

        const productData = {
            nameProduct,
            priceProduct,
            discountProduct: Number(discountProduct) || 0,
            descriptionProduct,
            typeProduct,
            imagesProduct
        };

        // Xử lý sizes hoặc stock
        if (sizes) {
            try {
                const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
                if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
                    // Validate sizes elements
                    for (const s of parsedSizes) {
                        if (!s.name || s.name.trim() === '') {
                            throw new BadRequestError('Tên size không được để trống');
                        }
                        if (s.stock === undefined || s.stock === null || s.stock < 0) {
                            throw new BadRequestError('Stock của size phải >= 0');
                        }
                    }
                    productData.sizes = parsedSizes.map(s => ({
                        name: s.name.trim(),
                        stock: Number(s.stock) || 0
                    }));
                    productData.stockProduct = 0; // Ignore stockProduct when sizes exist
                    
                    // Add sizeType if provided
                    if (sizeType && ['standard', 'age', 'month'].includes(sizeType)) {
                        productData.sizeType = sizeType;
                    }
                }
            } catch (e) {
                if (e instanceof BadRequestError) throw e;
                throw new BadRequestError('Định dạng sizes không hợp lệ');
            }
        } else {
            // No sizes provided, stockProduct is required
            if (stockProduct === undefined || stockProduct === null) {
                throw new BadRequestError('stockProduct là bắt buộc khi không có sizes');
            }
            productData.stockProduct = Number(stockProduct) || 0;
            productData.sizes = [];
        }

        // Add optional references
        if (genderProduct) productData.genderProduct = genderProduct;
        if (riderProduct) productData.riderProduct = riderProduct;
        if (brandProduct) productData.brandProduct = brandProduct;

        // Validate all references before creating product
        // Validate type (required)
        const typeDoc = await typeModel.findById(typeProduct);
        if (!typeDoc) {
            throw new NotFoundError('Type không tồn tại');
        }

        // Validate gender
        if (genderProduct) {
            const genderDoc = await genderModel.findById(genderProduct);
            if (!genderDoc) {
                throw new NotFoundError('Gender không tồn tại');
            }
        }

        // Validate rider
        if (riderProduct) {
            const riderDoc = await riderModel.findById(riderProduct);
            if (!riderDoc) {
                throw new NotFoundError('Rider không tồn tại');
            }
        }

        // Validate brand
        if (brandProduct) {
            const brandDoc = await brandModel.findById(brandProduct);
            if (!brandDoc) {
                throw new NotFoundError('Brand không tồn tại');
            }
        }

        // Process tags
        let tagIds = [];
        try {
            // Parse tags from JSON string (like sizes)
            const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            if (parsedTags && Array.isArray(parsedTags) && parsedTags.length > 0) {
                // Validate all tag IDs exist
                for (const tagId of parsedTags) {
                    const tagDoc = await tagModel.findById(tagId);
                    if (!tagDoc) {
                        throw new NotFoundError(`Tag với ID ${tagId} không tồn tại`);
                    }
                }
                tagIds = parsedTags;
            }
        } catch (e) {
            if (e instanceof NotFoundError) throw e;
            throw new BadRequestError('Định dạng tags không hợp lệ');
        }

        // Auto-add Sale tag if discountProduct > 0
        if (discountProduct > 0) {
            const saleTag = await tagModel.findOne({ name: /^sale$/i });
            if (saleTag && !tagIds.includes(saleTag._id.toString())) {
                tagIds.push(saleTag._id.toString());
            } else if (!saleTag) {
                console.warn('Tag "Sale" không tồn tại trong DB. Không thể tự động thêm tag Sale.');
            }
        }

        productData.tags = tagIds;

        const newProduct = await productModel.create(productData);

        // Populate references for response
        await newProduct.populate([
            { path: 'genderProduct', select: 'name' },
            { path: 'typeProduct', select: 'name slug' },
            { path: 'riderProduct', select: 'name' },
            { path: 'brandProduct', select: 'name' },
            { path: 'tags', select: 'name' }
        ]);

        return new Created({
            message: 'Tạo sản phẩm thành công',
            metadata: newProduct,
        }).send(res);
    }

    // =======================
    // GET ALL PRODUCT
    // =======================
    async getAllProduct(req, res) {
        const {
            page = 1,
            limit = 20,
            keyword,
            gender,
            type,
            rider,
            brand,
            tags,
            minPrice,
            maxPrice,
            sort = 'newest',
            searchMode = 'auto' // 'auto', 'text', 'regex'
        } = req.query;

        // Guard: validate and limit page/limit
        const pageNum = Math.max(1, Math.floor(Number(page)) || 1);
        const limitNum = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 20));

        const filter = {};

        // Handle keyword search with text index or safe regex fallback
        let useTextSearch = false;
        let sortCondition = {};

        if (keyword && keyword.trim()) {
            const trimmedKeyword = keyword.trim();
            
            // Check if text index exists and use text search if searchMode allows
            if (searchMode === 'text' || searchMode === 'auto') {
                try {
                    // Check if text index exists by querying indexes
                    const indexes = await productModel.collection.getIndexes();
                    const hasTextIndex = Object.values(indexes).some(idx => {
                        if (idx.textIndexVersion !== undefined) return true;
                        if (idx.key) {
                            return Object.values(idx.key).some(val => val === 'text' || val === 1);
                        }
                        return false;
                    });
                    
                    if (hasTextIndex) {
                        filter.$text = { $search: trimmedKeyword };
                        useTextSearch = true;
                        
                        // When using text search and no explicit sort, sort by textScore
                        if (sort === 'newest' || !sort) {
                            sortCondition = { score: { $meta: "textScore" } };
                        }
                    }
                } catch (err) {
                    // Index check failed, fall back to regex
                    useTextSearch = false;
                }
            }

            // Fallback to safe regex search if not using text search
            if (!useTextSearch || searchMode === 'regex') {
                const escapedKeyword = escapeRegex(trimmedKeyword);
                if (escapedKeyword) {
                    delete filter.$text;
                    filter.$or = [
                        { nameProduct: { $regex: escapedKeyword, $options: 'i' } },
                        { descriptionProduct: { $regex: escapedKeyword, $options: 'i' } }
                    ];
                }
            }
        }

        // Apply other filters
        if (gender) filter.genderProduct = gender;
        if (type) filter.typeProduct = type;
        if (rider) filter.riderProduct = rider;
        if (brand) filter.brandProduct = brand;

        // Handle tags filter (comma-separated or array)
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(t => t);
            if (tagArray.length > 0) {
                filter.tags = { $in: tagArray };
            }
        }

        if (minPrice || maxPrice) {
            filter.priceProduct = {};
            if (minPrice) filter.priceProduct.$gte = Number(minPrice);
            if (maxPrice) filter.priceProduct.$lte = Number(maxPrice);
        }

        // Set sort condition if not already set by text search
        if (Object.keys(sortCondition).length === 0) {
            switch (sort) {
                case 'price_asc': sortCondition = { priceProduct: 1 }; break;
                case 'price_desc': sortCondition = { priceProduct: -1 }; break;
                case 'oldest': sortCondition = { createdAt: 1 }; break;
                case 'newest':
                default: sortCondition = { createdAt: -1 }; break;
            }
        }

        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = productModel.find(filter);

        // Execute query with optimized populate
        const products = await query
            .sort(sortCondition)
            .skip(skip)
            .limit(limitNum)
            .populate('genderProduct', 'name')
            .populate('typeProduct', 'name slug')
            .populate('riderProduct', 'name')
            .populate('brandProduct', 'name')
            .populate('tags', 'name')
            .lean();

        // Count total with same filter
        const totalProducts = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNum);

        // Calculate facets (counts per brand/type/gender) based on current filter
        const baseMatch = { ...filter };
        if (baseMatch.$text) {
            delete baseMatch.$text;
        }

        // Brands facet
        const matchForBrands = { ...baseMatch };
        delete matchForBrands.brandProduct;
        const brandsCounts = await productModel.aggregate([
            { $match: matchForBrands },
            { $group: { _id: '$brandProduct', count: { $sum: 1 } } },
            { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
            { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
            { $project: { brandId: '$_id', count: 1, name: '$brand.name' } },
            { $match: { brandId: { $ne: null } } },
            { $sort: { count: -1 } }
        ]);

        // Types facet
        const matchForTypes = { ...baseMatch };
        delete matchForTypes.typeProduct;
        const typesCounts = await productModel.aggregate([
            { $match: matchForTypes },
            { $group: { _id: '$typeProduct', count: { $sum: 1 } } },
            { $lookup: { from: 'types', localField: '_id', foreignField: '_id', as: 'type' } },
            { $unwind: { path: '$type', preserveNullAndEmptyArrays: true } },
            { $project: { typeId: '$_id', count: 1, name: '$type.name', slug: '$type.slug' } },
            { $match: { typeId: { $ne: null } } },
            { $sort: { count: -1 } }
        ]);

        // Genders facet
        const matchForGenders = { ...baseMatch };
        delete matchForGenders.genderProduct;
        const gendersCounts = await productModel.aggregate([
            { $match: matchForGenders },
            { $group: { _id: '$genderProduct', count: { $sum: 1 } } },
            { $lookup: { from: 'genders', localField: '_id', foreignField: '_id', as: 'gender' } },
            { $unwind: { path: '$gender', preserveNullAndEmptyArrays: true } },
            { $project: { genderId: '$_id', count: 1, name: '$gender.name' } },
            { $match: { genderId: { $ne: null } } },
            { $sort: { count: -1 } }
        ]);

        return new OK({
            message: 'Lấy danh sách sản phẩm thành công',
            metadata: {
                products,
                pagination: {
                    total: totalProducts,
                    page: pageNum,
                    limit: limitNum,
                    totalPages
                },
                facets: {
                    brands: brandsCounts,
                    types: typesCounts,
                    genders: gendersCounts
                }
            },
        }).send(res);
    }

    // =======================
    // UPDATE PRODUCT
    // =======================
    async updateProduct(req, res) {
        const { id } = req.params;

        if (!id) throw new BadRequestError('Thiếu ID sản phẩm');

        const findProduct = await productModel.findById(id);
        if (!findProduct) throw new NotFoundError('Sản phẩm không tồn tại');

        const {
            nameProduct,
            priceProduct,
            discountProduct,
            stockProduct,
            descriptionProduct,
            typeProduct,
            genderProduct,
            riderProduct,
            brandProduct,
            tags,
            sizes,
            sizeType,
            oldImagesProduct,
            isActive
        } = req.body;

        let uploadedImages = [];
        if (req.files?.length > 0) {
            // Upload ảnh tuần tự để tránh timeout và lỗi
            for (let i = 0; i < req.files.length; i++) {
                const image = req.files[i];
                try {
                    const { path, filename } = image;
                    const uploadResult = await cloudinary.uploader.upload(path, {
                        folder: 'products',
                        resource_type: 'image',
                        timeout: 60000, // 60 seconds timeout
                    });
                    if (uploadResult && uploadResult.url) {
                        uploadedImages.push(uploadResult.url);
                    } else {
                        console.warn(`Upload ảnh ${filename} không trả về URL`);
                    }
                    // Xóa file tạm sau khi upload
                    await fs.unlink(path).catch((err) => {
                        console.warn(`Không thể xóa file tạm ${path}:`, err.message);
                    });
                } catch (uploadError) {
                    console.error(`Lỗi khi upload ảnh ${image.filename}:`, uploadError);
                    // Xóa file tạm ngay cả khi upload lỗi
                    await fs.unlink(image.path).catch(() => {});
                    // Nếu upload lỗi, throw error để dừng quá trình
                    throw new BadRequestError(`Lỗi khi upload ảnh ${image.originalname || image.filename}: ${uploadError.message || 'Upload thất bại'}`);
                }
            }
        }

        const parserOldImages = oldImagesProduct ? (typeof oldImagesProduct === 'string' ? JSON.parse(oldImagesProduct) : oldImagesProduct) : [];
        const finalImages = [...parserOldImages, ...uploadedImages];

        const updateData = {};

        if (nameProduct) updateData.nameProduct = nameProduct;
        if (priceProduct !== undefined) updateData.priceProduct = Number(priceProduct);
        if (descriptionProduct) updateData.descriptionProduct = descriptionProduct;
        if (finalImages.length > 0) updateData.imagesProduct = finalImages;

        // Handle discountProduct change and Sale tag logic
        const oldDiscount = findProduct.discountProduct || 0;
        const newDiscount = discountProduct !== undefined ? Number(discountProduct) : oldDiscount;
        updateData.discountProduct = newDiscount;

        // Xử lý sizes
        if (sizes !== undefined) {
            if (sizes && sizes !== '') {
                try {
                    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
                    if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
                        // Validate sizes elements
                        for (const s of parsedSizes) {
                            if (!s.name || s.name.trim() === '') {
                                throw new BadRequestError('Tên size không được để trống');
                            }
                            if (s.stock === undefined || s.stock === null || s.stock < 0) {
                                throw new BadRequestError('Stock của size phải >= 0');
                            }
                        }
                        updateData.sizes = parsedSizes.map(s => ({
                            name: s.name.trim(),
                            stock: Number(s.stock) || 0
                        }));
                        updateData.stockProduct = 0; // Ignore stockProduct when sizes exist
                        
                        // Update sizeType if provided
                        if (sizeType !== undefined) {
                            if (sizeType && ['standard', 'age', 'month'].includes(sizeType)) {
                                updateData.sizeType = sizeType;
                            } else if (sizeType === '' || sizeType === null) {
                                updateData.sizeType = null;
                            }
                        }
                    } else {
                        updateData.sizes = [];
                        if (stockProduct === undefined || stockProduct === null) {
                            throw new BadRequestError('stockProduct là bắt buộc khi không có sizes');
                        }
                        updateData.stockProduct = Number(stockProduct) || 0;
                    }
                } catch (e) {
                    if (e instanceof BadRequestError) throw e;
                    throw new BadRequestError('Định dạng sizes không hợp lệ');
                }
            } else {
                // sizes is empty string or null
                updateData.sizes = [];
                if (stockProduct === undefined || stockProduct === null) {
                    throw new BadRequestError('stockProduct là bắt buộc khi không có sizes');
                }
                updateData.stockProduct = Number(stockProduct) || 0;
            }
        } else if (stockProduct !== undefined) {
            // Only stockProduct provided, ensure sizes is empty
            if (!findProduct.sizes || findProduct.sizes.length === 0) {
                updateData.stockProduct = Number(stockProduct) || 0;
            }
        }

        // Validate references if provided
        if (typeProduct) {
            const typeDoc = await typeModel.findById(typeProduct);
            if (!typeDoc) {
                throw new NotFoundError('Type không tồn tại');
            }
            updateData.typeProduct = typeProduct;
        }

        if (genderProduct !== undefined) {
            if (genderProduct) {
                const genderDoc = await genderModel.findById(genderProduct);
                if (!genderDoc) {
                    throw new NotFoundError('Gender không tồn tại');
                }
                updateData.genderProduct = genderProduct;
            } else {
                updateData.genderProduct = null;
            }
        }

        if (riderProduct !== undefined) {
            if (riderProduct) {
                const riderDoc = await riderModel.findById(riderProduct);
                if (!riderDoc) {
                    throw new NotFoundError('Rider không tồn tại');
                }
                updateData.riderProduct = riderProduct;
            } else {
                updateData.riderProduct = null;
            }
        }

        if (brandProduct !== undefined) {
            if (brandProduct) {
                const brandDoc = await brandModel.findById(brandProduct);
                if (!brandDoc) {
                    throw new NotFoundError('Brand không tồn tại');
                }
                updateData.brandProduct = brandProduct;
            } else {
                updateData.brandProduct = null;
            }
        }

        // Process tags
        if (tags !== undefined) {
            let tagIds = [];
            try {
                // Parse tags from JSON string (like sizes)
                const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (parsedTags && Array.isArray(parsedTags) && parsedTags.length > 0) {
                    // Validate all tag IDs exist
                    for (const tagId of parsedTags) {
                        const tagDoc = await tagModel.findById(tagId);
                        if (!tagDoc) {
                            throw new NotFoundError(`Tag với ID ${tagId} không tồn tại`);
                        }
                    }
                    tagIds = parsedTags;
                }
            } catch (e) {
                if (e instanceof NotFoundError) throw e;
                throw new BadRequestError('Định dạng tags không hợp lệ');
            }

            // Auto-add/remove Sale tag based on discountProduct
            if (newDiscount > 0) {
                const saleTag = await tagModel.findOne({ name: /^sale$/i });
                if (saleTag && !tagIds.includes(saleTag._id.toString())) {
                    tagIds.push(saleTag._id.toString());
                }
            } else if (oldDiscount > 0 && newDiscount === 0) {
                // Remove Sale tag when discount is set back to 0
                const saleTag = await tagModel.findOne({ name: /^sale$/i });
                if (saleTag) {
                    tagIds = tagIds.filter(tagId => tagId.toString() !== saleTag._id.toString());
                }
            }

            updateData.tags = tagIds;
        } else {
            // Tags not provided, but check if discount changed
            if (oldDiscount === 0 && newDiscount > 0) {
                // Discount changed from 0 to >0, add Sale tag
                const saleTag = await tagModel.findOne({ name: /^sale$/i });
                if (saleTag) {
                    const currentTags = findProduct.tags || [];
                    if (!currentTags.includes(saleTag._id.toString())) {
                        updateData.tags = [...currentTags.map(t => t.toString()), saleTag._id.toString()];
                    }
                }
            } else if (oldDiscount > 0 && newDiscount === 0) {
                // Discount changed from >0 to 0, remove Sale tag
                const saleTag = await tagModel.findOne({ name: /^sale$/i });
                if (saleTag) {
                    const currentTags = findProduct.tags || [];
                    updateData.tags = currentTags.filter(tagId => tagId.toString() !== saleTag._id.toString());
                }
            }
        }

        // Handle isActive
        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true' || isActive === true;
        }

        const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });

        // Populate references for response
        await updatedProduct.populate([
            { path: 'genderProduct', select: 'name' },
            { path: 'typeProduct', select: 'name slug' },
            { path: 'riderProduct', select: 'name' },
            { path: 'brandProduct', select: 'name' },
            { path: 'tags', select: 'name' }
        ]);

        return new OK({
            message: 'Cập nhật thông tin sản phẩm thành công',
            metadata: updatedProduct,
        }).send(res);
    }

    // =======================
    // GET BY ID
    // =======================
    async getProductById(req, res) {
        const { id } = req.params;

        const product = await productModel.findById(id)
            .populate('genderProduct', 'name')
            .populate('typeProduct', 'name slug')
            .populate('riderProduct', 'name')
            .populate('brandProduct', 'name')
            .populate('tags', 'name');

        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        return new OK({
            message: 'Lấy thông tin sản phẩm thành công',
            metadata: product,
        }).send(res);
    }

    // =======================
    // DELETE PRODUCT
    // =======================
    async deleteProduct(req, res) {
        const { id } = req.params;

        const findProduct = await productModel.findById(id);
        if (!findProduct) throw new NotFoundError('Sản phẩm không tồn tại');

        for (const img of findProduct.imagesProduct) {
            if (img.includes('cloudinary')) {
                try {
                    await cloudinary.uploader.destroy(getPublicId(img));
                } catch (e) {
                    console.log(e);
                }
            }
        }

        await findProduct.deleteOne();

        return new OK({
            message: 'Xóa sản phẩm thành công',
            metadata: findProduct
        }).send(res);
    }
}

module.exports = new ProductController();
