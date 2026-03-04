const couponModel = require('../models/coupon.model');
const { Created, OK } = require('../core/success.response');
const { NotFoundError, BadRequestError } = require('../core/error.response');

class CouponController {
    
    // Tạo Coupon mới
    async createCoupon(req, res) {
        const { code, name, description, type, value, startDate, endDate, minOrderValue, usageLimit } = req.body;
        
        if (!code || !name || !value || !startDate || !endDate) {
            throw new BadRequestError('Thiếu thông tin bắt buộc');
        }

        // Check trùng code
        const existCoupon = await couponModel.findOne({ code: code.toUpperCase() });
        if (existCoupon) throw new BadRequestError('Mã giảm giá này đã tồn tại');

        const newCoupon = await couponModel.create({
            code: code.toUpperCase(),
            name,
            description: description || '',
            type: type || 'PERCENTAGE',
            value,
            startDate,
            endDate,
            minOrderValue: minOrderValue || 0,
            usageLimit: usageLimit || 100
        });

        return new Created({
            message: 'Tạo mã giảm giá thành công',
            metadata: newCoupon,
        }).send(res);
    }

    // Admin lấy danh sách
    async getAllCoupon(req, res) {
        const coupons = await couponModel.find().sort({ createdAt: -1 });
        return new OK({
            message: 'Lấy danh sách mã giảm giá thành công',
            metadata: coupons,
        }).send(res);
    }

    // Admin lấy chi tiết 1 coupon
    async getCouponById(req, res) {
        const { id } = req.params;
        const coupon = await couponModel.findById(id);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        return new OK({
            message: 'Lấy chi tiết mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Admin cập nhật coupon
    async updateCoupon(req, res) {
        const { id } = req.params;
        const { code, name, description, type, value, startDate, endDate, minOrderValue, usageLimit, isActive } = req.body;

        const coupon = await couponModel.findById(id);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        // Check trùng code (nếu đổi code)
        if (code && code.toUpperCase() !== coupon.code) {
            const existCoupon = await couponModel.findOne({ code: code.toUpperCase() });
            if (existCoupon) throw new BadRequestError('Mã giảm giá này đã tồn tại');
        }

        // Update các field
        if (code) coupon.code = code.toUpperCase();
        if (name) coupon.name = name;
        if (description !== undefined) coupon.description = description;
        if (type) coupon.type = type;
        if (value !== undefined) coupon.value = value;
        if (startDate) coupon.startDate = startDate;
        if (endDate) coupon.endDate = endDate;
        if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
        if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
        if (isActive !== undefined) coupon.isActive = isActive;
        if (req.body.showOnHeader !== undefined) {
            // Nếu set showOnHeader = true, thì bỏ tất cả coupon khác
            if (req.body.showOnHeader === true) {
                await couponModel.updateMany(
                    { _id: { $ne: id } },
                    { showOnHeader: false }
                );
            }
            coupon.showOnHeader = req.body.showOnHeader;
        }

        await coupon.save();

        return new OK({
            message: 'Cập nhật mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Admin xóa coupon
    async deleteCoupon(req, res) {
        const { id } = req.params;
        const coupon = await couponModel.findByIdAndDelete(id);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        return new OK({
            message: 'Xóa mã giảm giá thành công',
            metadata: coupon,
        }).send(res);
    }

    // Toggle showOnHeader - Chọn coupon hiển thị trên header
    async toggleShowOnHeader(req, res) {
        const { id } = req.params;
        const coupon = await couponModel.findById(id);
        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        // Nếu đang set showOnHeader = true, thì bỏ tất cả coupon khác
        if (!coupon.showOnHeader) {
            await couponModel.updateMany(
                { _id: { $ne: id } },
                { showOnHeader: false }
            );
        }

        coupon.showOnHeader = !coupon.showOnHeader;
        await coupon.save();

        return new OK({
            message: coupon.showOnHeader 
                ? `Đã chọn mã "${coupon.code}" hiển thị trên header`
                : `Đã bỏ chọn mã "${coupon.code}" khỏi header`,
            metadata: coupon,
        }).send(res);
    }

    // Lấy coupon đang được hiển thị trên header
    async getHeaderCoupon(req, res) {
        const now = new Date();
        const coupon = await couponModel.findOne({
            showOnHeader: true,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ['$usedCount', '$usageLimit'] }
        });

        if (!coupon) {
            return new OK({
                message: 'Không có mã giảm giá nào đang hiển thị trên header',
                metadata: null,
            }).send(res);
        }

        return new OK({
            message: 'Lấy mã giảm giá header thành công',
            metadata: coupon,
        }).send(res);
    }

    // Lấy danh sách coupons available cho guest (public endpoint)
    async getAvailableCoupons(req, res) {
        const { totalPrice } = req.query;
        const cartTotal = totalPrice ? parseFloat(totalPrice) : 0;

        const now = new Date();

        // Lấy tất cả coupons đang active và trong thời hạn
        const coupons = await couponModel.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ['$usedCount', '$usageLimit'] } // usedCount < usageLimit
        }).sort({ createdAt: -1 });

        // Map coupons với thông tin eligible dựa trên cartTotal
        const couponsWithEligibility = coupons.map(coupon => ({
            _id: coupon._id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minOrderValue: coupon.minOrderValue,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            // Frontend-specific fields
            isEligible: cartTotal >= coupon.minOrderValue,
            remainingAmount: Math.max(0, coupon.minOrderValue - cartTotal) // Số tiền còn thiếu
        }));

        return new OK({
            message: 'Lấy danh sách mã giảm giá thành công',
            metadata: couponsWithEligibility,
        }).send(res);
    }

    // User check mã giảm giá (Tính toán số tiền được giảm)
    async applyCoupon(req, res) {
        const { code, orderTotal } = req.body;

        const coupon = await couponModel.findOne({ 
            code: code.toUpperCase(), 
            isActive: true 
        });

        if (!coupon) throw new NotFoundError('Mã giảm giá không tồn tại hoặc đã bị khóa');

        // 1. Validate thời hạn
        const now = new Date();
        if (now < new Date(coupon.startDate)) throw new BadRequestError('Mã giảm giá chưa bắt đầu');
        if (now > new Date(coupon.endDate)) throw new BadRequestError('Mã giảm giá đã hết hạn');

        // 2. Validate số lượng
        if (coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Mã giảm giá đã hết lượt sử dụng');

        // 3. Validate giá trị đơn tối thiểu
        if (orderTotal < coupon.minOrderValue) {
            throw new BadRequestError(`Đơn hàng phải tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`);
        }

        // 4. Tính toán số tiền giảm
        let discountAmount = 0;
        if (coupon.type === 'PERCENTAGE') {
            discountAmount = (orderTotal * coupon.value) / 100;
        } else {
            discountAmount = coupon.value;
        }

        // Đảm bảo không giảm quá giá trị đơn hàng
        if (discountAmount > orderTotal) discountAmount = orderTotal;

        return new OK({
            message: 'Áp dụng mã thành công',
            metadata: {
                couponId: coupon._id,
                code: coupon.code,
                discountAmount: discountAmount,
                finalPrice: orderTotal - discountAmount
            }
        }).send(res);
    }
}

module.exports = new CouponController();