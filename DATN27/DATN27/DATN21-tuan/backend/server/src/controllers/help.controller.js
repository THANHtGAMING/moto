const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const helpModel = require('../models/help.model');

class HelpController {

    // 1. Tạo help item mới
    async createHelp(req, res) {
        const { name, description, icon, iconColor, order } = req.body;

        if (!name || !description || !icon) {
            throw new BadRequestError('Thiếu thông tin (name, description, icon)');
        }

        const newHelp = await helpModel.create({
            name,
            description,
            icon,
            iconColor: iconColor || '#6c757d',
            order: order || 0,
            status: 'active'
        });

        if (!newHelp) {
            throw new BadRequestError('Tạo help item thất bại');
        }

        return new Created({
            message: 'Tạo help item thành công',
            metadata: newHelp,
        }).send(res);
    }

    // 2. Cập nhật help item
    async updateHelp(req, res) {
        const { helpId } = req.params;
        const { name, description, icon, iconColor, order, status } = req.body;

        if (!helpId) {
            throw new BadRequestError('Thiếu Help ID');
        }

        const foundHelp = await helpModel.findById(helpId);
        if (!foundHelp) {
            throw new NotFoundError('Help item không tồn tại');
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (icon) updateData.icon = icon;
        if (iconColor !== undefined) updateData.iconColor = iconColor;
        if (order !== undefined) updateData.order = order;
        if (status) updateData.status = status;

        const updatedHelp = await helpModel.findByIdAndUpdate(helpId, updateData, {
            new: true,
        });

        return new OK({
            message: 'Cập nhật help item thành công',
            metadata: updatedHelp,
        }).send(res);
    }

    // 3. Xóa help item
    async deleteHelp(req, res) {
        const { helpId } = req.params;

        if (!helpId) {
            throw new BadRequestError('Thiếu Help ID');
        }

        const foundHelp = await helpModel.findById(helpId);
        if (!foundHelp) {
            throw new NotFoundError('Help item không tồn tại');
        }

        await helpModel.findByIdAndDelete(helpId);

        return new OK({
            message: 'Xóa help item thành công',
            metadata: {},
        }).send(res);
    }

    // 4. Lấy chi tiết help item
    async getHelpDetail(req, res) {
        const { helpId } = req.params;

        if (!helpId) {
            throw new BadRequestError('Thiếu Help ID');
        }

        const foundHelp = await helpModel.findById(helpId);
        if (!foundHelp) {
            throw new NotFoundError('Help item không tồn tại');
        }

        return new OK({
            message: 'Lấy thông tin help item thành công',
            metadata: foundHelp,
        }).send(res);
    }

    // 5. Lấy danh sách help items (chỉ lấy active cho public)
    async getAllHelp(req, res) {
        const { status } = req.query;
        
        const filter = {};
        // Nếu không có quyền admin, chỉ lấy active
        if (!req.user || !req.user.isAdmin) {
            filter.status = 'active';
        } else if (status) {
            filter.status = status;
        }

        const listHelp = await helpModel.find(filter)
            .sort({ order: 1, createdAt: 1 }) // Sắp xếp theo order, sau đó theo ngày tạo
            .lean();

        return new OK({
            message: 'Lấy danh sách help thành công',
            metadata: listHelp,
        }).send(res);
    }
}

module.exports = new HelpController();

