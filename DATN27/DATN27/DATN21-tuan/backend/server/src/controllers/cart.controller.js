const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');


const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');
const couponModel = require('../models/coupon.model');


// Tính tổng tiền giỏ hàng
async function calculateTotalPrice(findCartUser) {
    if (!findCartUser || !findCartUser.products || findCartUser.products.length === 0) {
        findCartUser.totalPrice = 0;
        findCartUser.finalPrice = 0;
        await findCartUser.save();
        return 0;
    }

    // Kiểm tra xem products đã được populate chưa (nếu productId là object có priceProduct thì đã populate)
    const firstProduct = findCartUser.products[0];
    const isPopulated = firstProduct && 
                        firstProduct.productId && 
                        typeof firstProduct.productId === 'object' && 
                        !firstProduct.productId._bsontype && // Không phải ObjectId
                        firstProduct.productId.priceProduct !== undefined;

    let productsData = null;
    
    if (!isPopulated) {
        // Products chưa được populate, query từ DB
        const allProductIds = findCartUser.products.map((p) => {
            // Lấy productId (có thể là ObjectId hoặc string)
            return p.productId?._id || p.productId;
        }).filter(id => id != null);
        
        if (allProductIds.length > 0) {
            productsData = await productModel.find({ _id: { $in: allProductIds } });
        }
    }

    let totalPrice = 0;

    findCartUser.products.forEach((p) => {
        let product = null;
        
        if (isPopulated) {
            // Products đã được populate, lấy trực tiếp
            product = p.productId;
        } else if (productsData) {
            // Tìm product trong productsData bằng cách so sánh ID
            const productIdStr = p.productId?.toString ? p.productId.toString() : String(p.productId);
            product = productsData.find((prod) => {
                const prodIdStr = prod._id?.toString ? prod._id.toString() : String(prod._id);
                return prodIdStr === productIdStr;
            });
        }
        
        if (product && product.priceProduct && typeof product.priceProduct === 'number') {
            // Kiểm tra discountProduct có tồn tại và là số hợp lệ không
            const discount = product.discountProduct && typeof product.discountProduct === 'number' && product.discountProduct > 0 
                ? product.discountProduct 
                : 0;
            
            // Tính giá sau khi giảm giá
            const priceAfterDiscount = product.priceProduct - (product.priceProduct * discount) / 100;
            const quantity = p.quantity && typeof p.quantity === 'number' ? p.quantity : 0;
            totalPrice += priceAfterDiscount * quantity;
        }
    });

    // Đảm bảo totalPrice là số hợp lệ
    totalPrice = isNaN(totalPrice) ? 0 : Math.max(0, totalPrice);

    findCartUser.totalPrice = totalPrice;
    // Không tính finalPrice ở đây - sẽ được tính trong revalidateCoupon nếu có coupon
    if (!findCartUser.couponId) {
        findCartUser.finalPrice = totalPrice;
    }

    await findCartUser.save();
    return totalPrice;
}

// Re-validate coupon sau khi thay đổi giỏ hàng
// Trả về { isValid: boolean, reason: string, couponRemoved: boolean }
async function revalidateCoupon(findCartUser) {
    if (!findCartUser.couponId) {
        // Không có coupon, set finalPrice = totalPrice
        findCartUser.finalPrice = findCartUser.totalPrice;
        await findCartUser.save();
        return { isValid: false, reason: '', couponRemoved: false };
    }

    const coupon = await couponModel.findById(findCartUser.couponId);
    const now = new Date();
    let eligible = true;
    let reason = '';

    // Kiểm tra các điều kiện
    if (!coupon) {
        eligible = false;
        reason = 'Mã không tồn tại hoặc không hoạt động';
    } else if (!coupon.isActive) {
        eligible = false;
        reason = 'Mã không còn hoạt động';
    } else if (coupon.startDate > now) {
        eligible = false;
        reason = 'Mã chưa bắt đầu';
    } else if (coupon.endDate < now) {
        eligible = false;
        reason = 'Mã đã hết hạn';
    } else if (coupon.usedCount >= coupon.usageLimit) {
        eligible = false;
        reason = 'Mã đã hết lượt sử dụng';
    } else if (findCartUser.totalPrice < coupon.minOrderValue) {
        eligible = false;
        reason = `Đơn hàng chưa đủ ${coupon.minOrderValue.toLocaleString('vi-VN')}đ`;
    }

    if (!eligible) {
        // Coupon không hợp lệ - xóa coupon và set finalPrice = totalPrice
        findCartUser.couponId = null;
        findCartUser.finalPrice = findCartUser.totalPrice;
        await findCartUser.save();
        return { isValid: false, reason, couponRemoved: true };
    }

    // Coupon hợp lệ - tính lại finalPrice
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discountAmount = (findCartUser.totalPrice * coupon.value) / 100;
    } else if (coupon.type === 'FIXED_AMOUNT') {
        discountAmount = coupon.value;
    }

    // Đảm bảo không giảm quá giá trị đơn hàng
    if (discountAmount > findCartUser.totalPrice) {
        discountAmount = findCartUser.totalPrice;
    }

    findCartUser.finalPrice = Math.max(0, findCartUser.totalPrice - discountAmount);
    await findCartUser.save();
    return { isValid: true, reason: '', couponRemoved: false };
}


class CartController {
    async createCart(req, res) {
        const userId = req.user;
        const { productId, quantity, size } = req.body;


        if (!userId || !productId || !Number(quantity)) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }


        const findProductDb = await productModel.findById(productId);
        if (!findProductDb) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }

        const normalize = (s) => (s ? s.trim().toUpperCase() : null);
        const normalizedSize = normalize(size);
        const hasSize = findProductDb.sizes && findProductDb.sizes.length > 0;

        // CHỈ kiểm tra stock trước khi thêm vào giỏ (KHÔNG trừ tồn kho)
        // Tồn kho chỉ được trừ khi đơn hàng được xác nhận thanh toán thành công
        if (hasSize) {
            if (!normalizedSize) throw new BadRequestError('Vui lòng chọn size');
            const sizeObj = findProductDb.sizes.find(s => normalize(s.name) === normalizedSize);
            if (!sizeObj) throw new BadRequestError('Size không tồn tại');
            if (sizeObj.stock < Number(quantity)) throw new BadRequestError('Số lượng sản phẩm không đủ');
            // KHÔNG trừ stock ở đây - chỉ kiểm tra
        } else {
            // sản phẩm không có size
            if (findProductDb.stockProduct < Number(quantity))
                throw new BadRequestError('Số lượng sản phẩm không đủ');
            // KHÔNG trừ stock ở đây - chỉ kiểm tra
        }
       
        let findCartUser = await cartModel.findOne({ userId });


        if (!findCartUser) {
            // Tạo giỏ hàng mới
            findCartUser = await cartModel.create({
                userId,
                products: [{ productId, size: size || null, quantity: Number(quantity) }],
            });
        } else {
            // Thêm hoặc update sản phẩm
            const existingProduct = findCartUser.products.find(
                (p) => p.productId.toString() === productId && normalize(p.size) === normalizedSize
            );
            if (existingProduct) {
                existingProduct.quantity += Number(quantity);
            } else {
                findCartUser.products.push({ productId, size: size || null, quantity: Number(quantity) });
            }
        }


        await calculateTotalPrice(findCartUser);
        
        // Re-validate coupon sau khi thay đổi giỏ hàng
        const couponValidation = await revalidateCoupon(findCartUser);

        // Populate product info before returning
        await findCartUser.populate('products.productId');

        // Nếu coupon bị huỷ, thêm thông tin vào response
        const responseData = { cart: findCartUser };
        if (couponValidation.couponRemoved) {
            responseData.couponRemoved = true;
            responseData.couponRemovedReason = couponValidation.reason;
        }

        return new OK({
            message: couponValidation.couponRemoved 
                ? `Thêm sản phẩm vào giỏ hàng thành công. ${couponValidation.reason ? `Mã giảm giá đã bị huỷ: ${couponValidation.reason}` : ''}`
                : 'Thêm sản phẩm vào giỏ hàng thành công',
            metadata: responseData,
        }).send(res);
    }


    async updateCart(req, res) {
        const userId = req.user;
        const { productId, newQuantity, size } = req.body;


        if (!userId || !productId) {
            throw new BadRequestError('Thiếu thông tin giỏ hàng');
        }


        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) throw new NotFoundError('Giỏ hàng không tồn tại');


        const normalize = (s) => (s ? s.trim().toUpperCase() : null);
        const findProductInCart = findCartUser.products.find(
            (p) => p.productId.toString() === productId && normalize(p.size) === normalize(size)
        );
        if (!findProductInCart) throw new NotFoundError('Sản phẩm không tồn tại trong giỏ hàng');


        const productDb = await productModel.findById(productId);
        if (!productDb) throw new NotFoundError('Sản phẩm không tồn tại');


        const currentQuantity = findProductInCart.quantity;
        const normalizedSize = normalize(size);

        // Kiểm tra sản phẩm có size hay không
        const hasSize = productDb.sizes && productDb.sizes.length > 0 && normalizedSize;

        if (Number(newQuantity) === 0) {
            // Xóa sản phẩm khỏi giỏ (KHÔNG hoàn lại stock - vì chưa trừ từ đầu)
            findCartUser.products = findCartUser.products.filter(
                (p) => !(p.productId.toString() === productId && normalize(p.size) === normalizedSize)
            );
        } else if (Number(newQuantity) > currentQuantity) {
            const addedQuantity = Number(newQuantity) - currentQuantity;
            
            // CHỈ kiểm tra stock khi tăng số lượng (KHÔNG trừ tồn kho)
            if (hasSize) {
                const sizeObj = productDb.sizes.find(s => normalize(s.name) === normalizedSize);
                if (!sizeObj) throw new BadRequestError('Size không tồn tại');
                if (sizeObj.stock < addedQuantity)
                    throw new BadRequestError('Số lượng sản phẩm không đủ');
                // KHÔNG trừ stock ở đây
            } else {
                if (productDb.stockProduct < addedQuantity)
                    throw new BadRequestError('Số lượng sản phẩm không đủ');
                // KHÔNG trừ stock ở đây
            }
            findProductInCart.quantity = Number(newQuantity);
            // KHÔNG save productDb - không thay đổi tồn kho
        } else {
            // Giảm số lượng (KHÔNG hoàn lại stock - vì chưa trừ từ đầu)
            findProductInCart.quantity = Number(newQuantity);
        }


        await calculateTotalPrice(findCartUser);
        
        // Re-validate coupon sau khi thay đổi giỏ hàng
        const couponValidation = await revalidateCoupon(findCartUser);

        // Populate product info before returning
        await findCartUser.populate('products.productId');

        // Nếu coupon bị huỷ, thêm thông tin vào response
        const responseData = { cart: findCartUser };
        if (couponValidation.couponRemoved) {
            responseData.couponRemoved = true;
            responseData.couponRemovedReason = couponValidation.reason;
        }

        return new OK({
            message: couponValidation.couponRemoved 
                ? `Cập nhật số lượng sản phẩm thành công. ${couponValidation.reason ? `Mã giảm giá đã bị huỷ: ${couponValidation.reason}` : ''}`
                : 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
            metadata: responseData,
        }).send(res);
    }


    async deleteProductInCart(req, res) {
        const userId = req.user;
        const { productId } = req.params;
        const { size } = req.body;


        if (!userId || !productId) throw new BadRequestError('Thiếu thông tin giỏ hàng');


        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) throw new NotFoundError('Giỏ hàng không tồn tại');


        const normalize = (s) => (s ? s.trim().toUpperCase() : null);
        const normalizedSize = normalize(size);

        const findProductInCart = findCartUser.products.find(
            (p) => p.productId.toString() === productId && normalize(p.size) === normalizedSize
        );
        if (!findProductInCart) throw new NotFoundError('Sản phẩm không tồn tại trong giỏ hàng');


        // KHÔNG cộng lại stock khi xóa khỏi cart (vì chưa trừ từ đầu)
        // Tồn kho chỉ được trừ khi đơn hàng được xác nhận thanh toán thành công


        findCartUser.products = findCartUser.products.filter(
            (p) => !(p.productId.toString() === productId && normalize(p.size) === normalizedSize)
        );


        await calculateTotalPrice(findCartUser);
        
        // Re-validate coupon sau khi thay đổi giỏ hàng
        const couponValidation = await revalidateCoupon(findCartUser);

        // Populate product info before returning
        await findCartUser.populate('products.productId');

        // Nếu coupon bị huỷ, thêm thông tin vào response
        const responseData = { cart: findCartUser };
        if (couponValidation.couponRemoved) {
            responseData.couponRemoved = true;
            responseData.couponRemovedReason = couponValidation.reason;
        }

        return new OK({
            message: couponValidation.couponRemoved 
                ? `Xóa sản phẩm khỏi giỏ hàng thành công. ${couponValidation.reason ? `Mã giảm giá đã bị huỷ: ${couponValidation.reason}` : ''}`
                : 'Xóa sản phẩm khỏi giỏ hàng thành công',
            metadata: responseData,
        }).send(res);
    }


    async getCartInUser(req, res) {
        const userId = req.user;


        let findCartUser = await cartModel.findOne({ userId })
            .populate('products.productId'); // Populate product info for each cart item
        
        const today = new Date();
        
        // Nếu có cart, tính lại totalPrice và revalidate coupon để đảm bảo finalPrice đúng
        if (findCartUser && findCartUser.products && findCartUser.products.length > 0) {
            // Tính lại totalPrice từ products
            await calculateTotalPrice(findCartUser);
            // Revalidate coupon để tính lại finalPrice
            await revalidateCoupon(findCartUser);
            
            // Reload cart từ DB để lấy totalPrice và finalPrice đã được tính lại
            findCartUser = await cartModel.findOne({ userId })
                .populate('products.productId');
        }
        
        // Lấy TẤT CẢ coupon còn hiệu lực và còn số lượng (không filter theo minOrderValue)
        const allCoupons = await couponModel.find({
            startDate: { $lte: today },
            endDate: { $gte: today },
            isActive: true,
            $expr: { $lt: ['$usedCount', '$usageLimit'] } // usedCount < usageLimit
        });
        
        // Map coupons với thông tin eligible
        const cartTotal = findCartUser ? findCartUser.totalPrice : 0;
        const couponsWithEligibility = allCoupons.map(coupon => ({
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
            // Thêm field để frontend biết có đủ điều kiện không
            isEligible: cartTotal >= coupon.minOrderValue,
            remainingAmount: coupon.minOrderValue - cartTotal // Số tiền còn thiếu
        }));


        if (!findCartUser) {
            findCartUser = await cartModel.create({
                userId,
                products: [],
            });
            // Populate để có đầy đủ thông tin
            await findCartUser.populate('products.productId');
        }

        return new OK({
            message: 'Lấy giỏ hàng thành công',
            metadata: { cart: findCartUser, coupons: couponsWithEligibility },
        }).send(res);
    }


    async updateInfoCart(req, res) {
        const userId = req.user;
        const { fullName, phoneNumber, address, email } = req.body;


        if (!userId || !fullName || !phoneNumber || !address || !email)
            throw new BadRequestError('Thiếu thông tin giỏ hàng');


        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) throw new NotFoundError('Giỏ hàng không tồn tại');


        findCartUser.fullName = fullName;
        findCartUser.phoneNumber = phoneNumber;
        findCartUser.address = address;
        findCartUser.email = email;


        await findCartUser.save();
        
        // Re-validate coupon (tính lại totalPrice và kiểm tra coupon)
        await calculateTotalPrice(findCartUser);
        const couponValidation = await revalidateCoupon(findCartUser);

        // Populate product info before returning
        await findCartUser.populate('products.productId');

        // Nếu coupon bị huỷ, thêm thông tin vào response
        const responseData = { cart: findCartUser };
        if (couponValidation.couponRemoved) {
            responseData.couponRemoved = true;
            responseData.couponRemovedReason = couponValidation.reason;
        }

        return new OK({
            message: couponValidation.couponRemoved 
                ? `Cập nhật thông tin giỏ hàng thành công. ${couponValidation.reason ? `Mã giảm giá đã bị huỷ: ${couponValidation.reason}` : ''}`
                : 'Cập nhật thông tin giỏ hàng thành công',
            metadata: responseData,
        }).send(res);
    }


    async applyCoupon(req, res) {
        const userId = req.user;
        const { couponId } = req.body;


        if (!userId) throw new BadRequestError('Thiếu thông tin giỏ hàng');


        const findCartUser = await cartModel.findOne({ userId });
        if (!findCartUser) throw new NotFoundError('Giỏ hàng không tồn tại');

        // Tính lại totalPrice trước khi validate và áp mã
        await calculateTotalPrice(findCartUser);
        // Reload cart để lấy totalPrice mới nhất sau khi tính lại
        const refreshedCart = await cartModel.findOne({ userId });
        if (!refreshedCart) throw new NotFoundError('Giỏ hàng không tồn tại');

        // Nếu couponId là null hoặc undefined -> Xóa coupon
        if (!couponId || couponId === null) {
            refreshedCart.couponId = null;
            refreshedCart.finalPrice = refreshedCart.totalPrice;
            await refreshedCart.save();
            await refreshedCart.populate('products.productId');

            return new OK({
                message: 'Đã xóa mã giảm giá',
                metadata: refreshedCart,
            }).send(res);
        }

        const findCoupon = await couponModel.findById(couponId);
        if (!findCoupon) throw new NotFoundError('Mã giảm giá không tồn tại');

        // Validate coupon
        if (!findCoupon.isActive) throw new BadRequestError('Mã giảm giá không còn hoạt động');
        if (findCoupon.usedCount >= findCoupon.usageLimit) throw new BadRequestError('Mã giảm giá đã hết số lượng');
        if (findCoupon.startDate > new Date()) throw new BadRequestError('Mã giảm giá chưa bắt đầu');
        if (findCoupon.endDate < new Date()) throw new BadRequestError('Mã giảm giá đã hết hạn');
        if (refreshedCart.totalPrice < findCoupon.minOrderValue)
            throw new BadRequestError(`Đơn hàng chưa đủ ${findCoupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`);

        // Tính toán giảm giá dựa trên loại coupon
        let discountAmount = 0;
        if (findCoupon.type === 'PERCENTAGE') {
            discountAmount = (refreshedCart.totalPrice * findCoupon.value) / 100;
        } else if (findCoupon.type === 'FIXED_AMOUNT') {
            discountAmount = findCoupon.value;
        }

        // Đảm bảo không giảm quá giá trị đơn hàng
        if (discountAmount > refreshedCart.totalPrice) discountAmount = refreshedCart.totalPrice;

        refreshedCart.couponId = findCoupon._id;
        refreshedCart.finalPrice = Math.max(0, refreshedCart.totalPrice - discountAmount);
        await refreshedCart.save();

        // Populate product info before returning
        await refreshedCart.populate('products.productId');

        return new OK({
            message: `Áp dụng mã "${findCoupon.code}" thành công! Giảm ${discountAmount.toLocaleString('vi-VN')}đ`,
            metadata: refreshedCart,
        }).send(res);
    }
}


module.exports = new CartController();
