const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const logoModel = require('../models/logo.model');
const cloudinary = require('../config/cloudDinary');
const fs = require('fs/promises');

class LogoController {
    // 1. Lấy tất cả logo (active)
    async getAllLogos(req, res) {
        const { activeOnly, location } = req.query;
        
        let query = {};
        if (activeOnly === 'true') {
            query.isActive = true;
        }
        if (location) {
            query.location = location;
        }

        const logos = await logoModel.find(query)
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return new OK({
            message: 'Lấy danh sách logo thành công',
            metadata: {
                logos: logos || []
            }
        }).send(res);
    }

    // 2. Tạo logo mới
    async createLogo(req, res) {
        const { title, description, order, location } = req.body;

        if (!req.file) {
            throw new BadRequestError('Vui lòng chọn ảnh logo');
        }

        let imageUrl = '';
        const { path } = req.file;
        try {
            const uploadResult = await cloudinary.uploader.upload(path, {
                folder: 'logos',
                resource_type: 'image',
            });
            imageUrl = uploadResult.url;
            await fs.unlink(path).catch(() => {});
        } catch (error) {
            if (path) await fs.unlink(path).catch(() => {});
            throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
        }

        const newLogo = await logoModel.create({
            imageUrl,
            title: title || '',
            description: description || '',
            order: order ? parseInt(order) : 0,
            isActive: true,
            location: location || 'header'
        });

        return new Created({
            message: 'Tạo logo thành công',
            metadata: newLogo
        }).send(res);
    }

    // 3. Cập nhật logo
    async updateLogo(req, res) {
        const { id } = req.params;
        const { title, description, order, isActive, location } = req.body;

        const logo = await logoModel.findById(id);
        if (!logo) {
            throw new NotFoundError('Không tìm thấy logo');
        }

        let imageUrl = logo.imageUrl;

        // Upload ảnh mới nếu có
        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'logos',
                    resource_type: 'image',
                });
                imageUrl = uploadResult.url;
                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi upload ảnh: ' + error.message);
            }
        }

        // Cập nhật thông tin
        if (title !== undefined) logo.title = title;
        if (description !== undefined) logo.description = description;
        if (order !== undefined) logo.order = parseInt(order);
        if (isActive !== undefined) logo.isActive = isActive === 'true' || isActive === true;
        if (location !== undefined) logo.location = location;
        if (imageUrl) logo.imageUrl = imageUrl;

        await logo.save();

        return new OK({
            message: 'Cập nhật logo thành công',
            metadata: logo
        }).send(res);
    }

    // 4. Xóa logo
    async deleteLogo(req, res) {
        const { id } = req.params;

        const logo = await logoModel.findByIdAndDelete(id);
        if (!logo) {
            throw new NotFoundError('Không tìm thấy logo');
        }

        return new OK({
            message: 'Xóa logo thành công',
            metadata: logo
        }).send(res);
    }

    // 5. Cập nhật thứ tự logo
    async updateLogoOrder(req, res) {
        const { logos } = req.body; // Array of { id, order }

        if (!Array.isArray(logos)) {
            throw new BadRequestError('Danh sách logo không hợp lệ');
        }

        const updatePromises = logos.map(({ id, order }) => 
            logoModel.findByIdAndUpdate(id, { order: parseInt(order) }, { new: true })
        );

        await Promise.all(updatePromises);

        return new OK({
            message: 'Cập nhật thứ tự logo thành công'
        }).send(res);
    }

    // 6. Toggle ghim logo (chỉ cho phép 1 logo được ghim)
    async togglePinLogo(req, res) {
        const { id } = req.params;

        const logo = await logoModel.findById(id);
        if (!logo) {
            throw new NotFoundError('Không tìm thấy logo');
        }

        // Nếu logo này chưa được ghim, ghim nó và bỏ ghim các logo khác
        if (!logo.isPinned) {
            // Bỏ ghim tất cả logo khác
            await logoModel.updateMany(
                { _id: { $ne: id }, isPinned: true },
                { $set: { isPinned: false } }
            );
            // Ghim logo này
            logo.isPinned = true;
        } else {
            // Bỏ ghim logo này
            logo.isPinned = false;
        }

        await logo.save();

        return new OK({
            message: logo.isPinned ? 'Ghim logo thành công' : 'Bỏ ghim logo thành công',
            metadata: logo
        }).send(res);
    }

    // 7. Lấy logo đã ghim
    async getPinnedLogo(req, res) {
        const logo = await logoModel.findOne({ isPinned: true, isActive: true }).lean();

        return new OK({
            message: 'Lấy logo đã ghim thành công',
            metadata: logo || null
        }).send(res);
    }
}

module.exports = new LogoController();

