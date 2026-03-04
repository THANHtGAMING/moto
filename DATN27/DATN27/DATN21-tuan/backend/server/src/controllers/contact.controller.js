const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const contactModel = require('../models/contact.model');

class ContactController {

    // 1. Tạo thư liên hệ mới (public - không cần đăng nhập)
    async createContact(req, res) {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            throw new BadRequestError('Thiếu thông tin (name, email, subject, message)');
        }

        const newContact = await contactModel.create({
            name,
            email,
            phone: phone || '',
            subject,
            message,
            status: 'new',
            isRead: false
        });

        if (!newContact) {
            throw new BadRequestError('Gửi thư liên hệ thất bại');
        }

        return new Created({
            message: 'Gửi thư liên hệ thành công',
            metadata: newContact,
        }).send(res);
    }

    // 2. Lấy danh sách thư liên hệ (admin only)
    async getAllContacts(req, res) {
        const { status, isRead } = req.query;
        
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        const contacts = await contactModel.find(filter)
            .sort({ createdAt: -1 }) // Mới nhất trước
            .lean();

        return new OK({
            message: 'Lấy danh sách thư liên hệ thành công',
            metadata: contacts,
        }).send(res);
    }

    // 3. Lấy chi tiết thư liên hệ
    async getContactDetail(req, res) {
        const { contactId } = req.params;

        if (!contactId) {
            throw new BadRequestError('Thiếu Contact ID');
        }

        const contact = await contactModel.findById(contactId).lean();
        if (!contact) {
            throw new NotFoundError('Thư liên hệ không tồn tại');
        }

        // Đánh dấu đã đọc
        await contactModel.findByIdAndUpdate(contactId, { 
            isRead: true,
            status: contact.status === 'new' ? 'read' : contact.status
        });

        return new OK({
            message: 'Lấy thông tin thư liên hệ thành công',
            metadata: contact,
        }).send(res);
    }

    // 4. Cập nhật trạng thái thư
    async updateContactStatus(req, res) {
        const { contactId } = req.params;
        const { status, replyMessage } = req.body;

        if (!contactId) {
            throw new BadRequestError('Thiếu Contact ID');
        }

        const contact = await contactModel.findById(contactId);
        if (!contact) {
            throw new NotFoundError('Thư liên hệ không tồn tại');
        }

        const updateData = {};
        if (status) {
            updateData.status = status;
        }
        if (replyMessage) {
            updateData.replyMessage = replyMessage;
            updateData.repliedAt = new Date();
            updateData.repliedBy = req.user?._id;
            updateData.status = 'replied';
        }
        if (status === 'read' || status === 'replied') {
            updateData.isRead = true;
        }

        const updatedContact = await contactModel.findByIdAndUpdate(contactId, updateData, {
            new: true,
        });

        return new OK({
            message: 'Cập nhật thư liên hệ thành công',
            metadata: updatedContact,
        }).send(res);
    }

    // 5. Xóa thư liên hệ
    async deleteContact(req, res) {
        const { contactId } = req.params;

        if (!contactId) {
            throw new BadRequestError('Thiếu Contact ID');
        }

        const contact = await contactModel.findById(contactId);
        if (!contact) {
            throw new NotFoundError('Thư liên hệ không tồn tại');
        }

        await contactModel.findByIdAndDelete(contactId);

        return new OK({
            message: 'Xóa thư liên hệ thành công',
            metadata: {},
        }).send(res);
    }

    // 6. Đếm số thư chưa đọc
    async getUnreadCount(req, res) {
        const count = await contactModel.countDocuments({ 
            isRead: false,
            status: { $ne: 'archived' }
        });

        return new OK({
            message: 'Lấy số thư chưa đọc thành công',
            metadata: { count },
        }).send(res);
    }
}

module.exports = new ContactController();

