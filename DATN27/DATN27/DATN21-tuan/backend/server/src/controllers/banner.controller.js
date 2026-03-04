const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const bannerModel = require('../models/banner.model');
const cloudinary = require('../config/cloudDinary');
const fs = require('fs/promises');

class BannerController {
    // 1. Lấy tất cả banner (active)
    async getAllBanners(req, res) {
        const { activeOnly, modalOnly } = req.query;
        
        let query = {};
        if (activeOnly === 'true') {
            query.isActive = true;
        }
        if (modalOnly === 'true') {
            query.isModal = true;
            query.isActive = true; // Modal banner phải active
        }

        const banners = await bannerModel.find(query)
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return new OK({
            message: 'Lấy danh sách banner thành công',
            metadata: {
                banners: banners || []
            }
        }).send(res);
    }

    // 2. Tạo banner mới
    async createBanner(req, res) {
        const { title, description, order, isModal } = req.body;

        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn ảnh banner');
        }

        let imageUrl = '';
        const { path } = req.file;
        try {
            const uploadResult = await cloudinary.uploader.upload(path, {
                folder: 'banners',
                resource_type: 'image',
            });
            imageUrl = uploadResult.url;
            await fs.unlink(path).catch(() => {});
        } catch (error) {
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
        }

        // Nếu banner này được ghim làm modal, bỏ ghim các banner khác
        if (isModal === 'true' || isModal === true) {
            await bannerModel.updateMany(
                { isModal: true },
                { $set: { isModal: false } }
            );
        }

        const newBanner = await bannerModel.create({
            imageUrl,
            title: title || '',
            description: description || '',
            order: order ? parseInt(order) : 0,
            isActive: true,
            isModal: isModal === 'true' || isModal === true
        });

        return new Created({
            message: 'Tạo banner thành công',
            metadata: newBanner
        }).send(res);
    }

    // 3. Cập nhật banner
    async updateBanner(req, res) {
        const { id } = req.params;
        const { title, description, order, isActive, isModal } = req.body;

        const banner = await bannerModel.findById(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        let imageUrl = banner.imageUrl;

        // Upload ảnh mới nếu có
        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'banners',
                    resource_type: 'image',
                });
                imageUrl = uploadResult.url;
                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
            }
        }

        // Nếu banner này được ghim làm modal, bỏ ghim các banner khác
        if (isModal === 'true' || isModal === true) {
            await bannerModel.updateMany(
                { _id: { $ne: id }, isModal: true },
                { $set: { isModal: false } }
            );
        }

        // Cập nhật thông tin
        if (title !== undefined) banner.title = title;
        if (description !== undefined) banner.description = description;
        if (order !== undefined) banner.order = parseInt(order);
        if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
        if (isModal !== undefined) banner.isModal = isModal === 'true' || isModal === true;
        if (imageUrl) banner.imageUrl = imageUrl;

        await banner.save();

        return new OK({
            message: 'Cập nhật banner thành công',
            metadata: banner
        }).send(res);
    }

    // 4. Xóa banner
    async deleteBanner(req, res) {
        const { id } = req.params;

        const banner = await bannerModel.findByIdAndDelete(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        return new OK({
            message: 'Xóa banner thành công',
            metadata: banner
        }).send(res);
    }

    // 5. Cập nhật thứ tự banner
    async updateBannerOrder(req, res) {
        const { banners } = req.body; // Array of { id, order }

        if (!Array.isArray(banners)) {
            throw new BadRequestError('Danh sách banner không hợp lệ');
        }

        const updatePromises = banners.map(({ id, order }) => 
            bannerModel.findByIdAndUpdate(id, { order: parseInt(order) }, { new: true })
        );

        await Promise.all(updatePromises);

        return new OK({
            message: 'Cập nhật thứ tự banner thành công'
        }).send(res);
    }

    // 6. Toggle ghim banner (chỉ cho phép 1 banner được ghim)
    async toggleModalBanner(req, res) {
        const { id } = req.params;

        const banner = await bannerModel.findById(id);
        if (!banner) {
            throw new NotFoundError('Không tìm thấy banner');
        }

        // Nếu banner này chưa được ghim, ghim nó và bỏ ghim các banner khác
        if (!banner.isModal) {
            // Bỏ ghim tất cả banner khác
            await bannerModel.updateMany(
                { _id: { $ne: id }, isModal: true },
                { $set: { isModal: false } }
            );
            // Ghim banner này
            banner.isModal = true;
        } else {
            // Bỏ ghim banner này
            banner.isModal = false;
        }

        await banner.save();

        return new OK({
            message: banner.isModal ? 'Ghim banner thành công' : 'Bỏ ghim banner thành công',
            metadata: banner
        }).send(res);
    }
}

module.exports = new BannerController();

