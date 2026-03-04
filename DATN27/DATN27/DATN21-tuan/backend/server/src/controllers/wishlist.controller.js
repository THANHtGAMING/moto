const wishlistModel = require('../models/wishlist.model');
const productModel = require('../models/product.model');
const { OK } = require('../core/success.response');
const { NotFoundError, BadRequestError } = require('../core/error.response');

class WishlistController {
    
    // Thêm hoặc Xóa sản phẩm khỏi Wishlist (Toggle)
    async toggleWishlist(req, res) {
        const userId = req.user;
        const { productId } = req.body;

        if (!productId) throw new BadRequestError('Thiếu productId');

        // Kiểm tra sản phẩm có tồn tại không
        const product = await productModel.findById(productId);
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        // Tìm wishlist của user
        let wishlist = await wishlistModel.findOne({ userId });

        if (!wishlist) {
            // Nếu chưa có wishlist -> Tạo mới và thêm sản phẩm vào
            wishlist = await wishlistModel.create({
                userId,
                products: [{ productId }]
            });
            return new OK({
                message: 'Đã thêm vào danh sách yêu thích',
                metadata: wishlist
            }).send(res);
        }

        // Nếu đã có wishlist -> Kiểm tra xem sản phẩm đã có trong đó chưa
        const isExistIndex = wishlist.products.findIndex(p => p.productId.toString() === productId);

        if (isExistIndex > -1) {
            // Đã có -> Xóa đi (Un-favorite)
            wishlist.products.splice(isExistIndex, 1);
            await wishlist.save();
            return new OK({
                message: 'Đã xóa khỏi danh sách yêu thích',
                metadata: wishlist
            }).send(res);
        } else {
            // Chưa có -> Thêm vào
            wishlist.products.push({ productId });
            await wishlist.save();
            return new OK({
                message: 'Đã thêm vào danh sách yêu thích',
                metadata: wishlist
            }).send(res);
        }
    }

    // Lấy danh sách yêu thích
    async getMyWishlist(req, res) {
        const userId = req.user;

        const wishlist = await wishlistModel.findOne({ userId })
            .populate('products.productId', 'nameProduct priceProduct imagesProduct discountProduct'); // Populate thông tin cần thiết để hiển thị

        if (!wishlist) {
            return new OK({
                message: 'Danh sách yêu thích trống',
                metadata: []
            }).send(res);
        }

        return new OK({
            message: 'Lấy danh sách yêu thích thành công',
            metadata: wishlist.products
        }).send(res);
    }
}

module.exports = new WishlistController();