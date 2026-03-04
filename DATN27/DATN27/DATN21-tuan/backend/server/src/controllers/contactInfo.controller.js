const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const contactInfoModel = require('../models/contactInfo.model');

class ContactInfoController {

    // 1. Lấy thông tin liên hệ (public)
    async getContactInfo(req, res) {
        const contactInfo = await contactInfoModel.findOne({ status: 'active' }).lean();

        if (!contactInfo) {
            // Trả về thông tin mặc định nếu chưa có
            return new OK({
                message: 'Lấy thông tin liên hệ thành công',
                metadata: {
                    address: '',
                    phone: '',
                    email: '',
                    mapUrl: '',
                    workingHours: '',
                    facebook: '',
                    instagram: '',
                    zalo: ''
                },
            }).send(res);
        }

        return new OK({
            message: 'Lấy thông tin liên hệ thành công',
            metadata: contactInfo,
        }).send(res);
    }

    // 2. Tạo hoặc cập nhật thông tin liên hệ (admin only)
    async createOrUpdateContactInfo(req, res) {
        const { address, phone, email, mapUrl, workingHours, facebook, instagram, zalo } = req.body;

        if (!address || !phone || !email) {
            throw new BadRequestError('Thiếu thông tin (address, phone, email)');
        }

        // Tìm bản ghi active hiện tại
        let contactInfo = await contactInfoModel.findOne({ status: 'active' });

        if (contactInfo) {
            // Cập nhật bản ghi hiện tại
            contactInfo.address = address;
            contactInfo.phone = phone;
            contactInfo.email = email;
            contactInfo.mapUrl = mapUrl || '';
            contactInfo.workingHours = workingHours || '';
            contactInfo.facebook = facebook || '';
            contactInfo.instagram = instagram || '';
            contactInfo.zalo = zalo || '';
            
            await contactInfo.save();

            return new OK({
                message: 'Cập nhật thông tin liên hệ thành công',
                metadata: contactInfo,
            }).send(res);
        } else {
            // Tạo mới
            // Vô hiệu hóa tất cả bản ghi cũ (nếu có)
            await contactInfoModel.updateMany({}, { status: 'inactive' });

            const newContactInfo = await contactInfoModel.create({
                address,
                phone,
                email,
                mapUrl: mapUrl || '',
                workingHours: workingHours || '',
                facebook: facebook || '',
                instagram: instagram || '',
                zalo: zalo || '',
                status: 'active'
            });

            return new Created({
                message: 'Tạo thông tin liên hệ thành công',
                metadata: newContactInfo,
            }).send(res);
        }
    }

    // 3. Cập nhật thông tin liên hệ
    async updateContactInfo(req, res) {
        const { contactInfoId } = req.params;
        const { address, phone, email, mapUrl, workingHours, facebook, instagram, zalo, status } = req.body;

        if (!contactInfoId) {
            throw new BadRequestError('Thiếu ContactInfo ID');
        }

        const contactInfo = await contactInfoModel.findById(contactInfoId);
        if (!contactInfo) {
            throw new NotFoundError('Thông tin liên hệ không tồn tại');
        }

        const updateData = {};
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (mapUrl !== undefined) updateData.mapUrl = mapUrl;
        if (workingHours !== undefined) updateData.workingHours = workingHours;
        if (facebook !== undefined) updateData.facebook = facebook;
        if (instagram !== undefined) updateData.instagram = instagram;
        if (zalo !== undefined) updateData.zalo = zalo;
        if (status) updateData.status = status;

        // Nếu set active, vô hiệu hóa các bản ghi khác
        if (status === 'active') {
            await contactInfoModel.updateMany(
                { _id: { $ne: contactInfoId } },
                { status: 'inactive' }
            );
        }

        const updatedContactInfo = await contactInfoModel.findByIdAndUpdate(contactInfoId, updateData, {
            new: true,
        });

        return new OK({
            message: 'Cập nhật thông tin liên hệ thành công',
            metadata: updatedContactInfo,
        }).send(res);
    }
}

module.exports = new ContactInfoController();

