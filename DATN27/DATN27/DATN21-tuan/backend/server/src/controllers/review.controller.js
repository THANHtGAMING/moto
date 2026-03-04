const reviewModel = require('../models/review.model');
const orderModel = require('../models/order.model'); // Nhớ đổi tên paymentModel thành orderModel
const productModel = require('../models/product.model');
const userModel = require('../models/user.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const cloudinary = require('../config/cloudDinary');
const fs = require('fs').promises;
const { getPublicId } = require('../utils/getPublicId');

class ReviewController {
    async createReview(req, res) {
        const userId = req.user;
        const { productId, orderId, rating, comment } = req.body;

        // 1. Kiểm tra xem user đã mua sản phẩm này trong đơn hàng đó chưa
        const order = await orderModel.findOne({
            _id: orderId,
            userId: userId,
            status: 'delivered', // Chỉ cho đánh giá khi đã giao hàng thành công
            'products.productId': productId
        });

        if (!order) {
            throw new BadRequestError('Bạn chưa mua sản phẩm này hoặc đơn hàng chưa hoàn tất');
        }

        // 2. Kiểm tra xem đã đánh giá chưa (tránh spam)
        const existReview = await reviewModel.findOne({ userId, productId, orderId });
        if (existReview) {
            throw new BadRequestError('Bạn đã đánh giá sản phẩm này rồi');
        }

        // 3. Xử lý upload ảnh feedback (nếu có)
        let reviewImages = [];
        if (req.files?.length > 0) {
            for (const image of req.files) {
                try {
                    const { path, filename } = image;
                    const { url } = await cloudinary.uploader.upload(path, {
                        folder: 'reviews',
                        resource_type: 'image',
                    });
                    reviewImages.push(url || filename);
                    await fs.unlink(path).catch(() => {});
                } catch (error) {
                    console.error('Error uploading review image:', error);
                }
            }
        }

        const newReview = await reviewModel.create({
            userId, 
            productId, 
            orderId, 
            rating, 
            comment,
            images: reviewImages
        });

        return new Created({
            message: 'Đánh giá thành công',
            metadata: newReview
        }).send(res);
    }

    async getReviewsByProduct(req, res) {
        const { productId } = req.params;
        const reviews = await reviewModel.find({ productId, isHidden: false })
                                         .populate('userId', 'fullName avatar')
                                         .populate('likes', 'fullName')
                                         .populate('dislikes', 'fullName')
                                         .populate('replies.userId', 'fullName avatar isAdmin')
                                         .sort({ createdAt: -1 });
        
        return new OK({
            message: 'Lấy danh sách đánh giá thành công',
            metadata: reviews
        }).send(res);
    }

    // Lấy danh sách sản phẩm trong đơn hàng đã giao mà user chưa đánh giá
    async getPendingReviews(req, res) {
        const userId = req.user;
        const { orderId } = req.params;

        const order = await orderModel.findOne({
            _id: orderId,
            userId: userId,
            status: 'delivered'
        });

        if (!order) {
            throw new NotFoundError('Đơn hàng không tồn tại hoặc chưa được giao');
        }

        // Lấy tất cả reviews đã có cho đơn hàng này
        const existingReviews = await reviewModel.find({ 
            userId, 
            orderId 
        });

        const reviewedProductIds = existingReviews.map(r => r.productId.toString());

        // Lọc ra các sản phẩm chưa được đánh giá
        const pendingProducts = order.products.filter(
            item => !reviewedProductIds.includes(item.productId.toString())
        );

        // Populate thông tin sản phẩm
        const pendingProductsWithDetails = await Promise.all(
            pendingProducts.map(async (item) => {
                const product = await productModel.findById(item.productId);
                return {
                    productId: item.productId,
                    nameProduct: item.nameProduct,
                    imageProduct: item.imageProduct,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    productDetails: product ? {
                        descriptionProduct: product.descriptionProduct,
                        discountProduct: product.discountProduct
                    } : null
                };
            })
        );

        return new OK({
            message: 'Lấy danh sách sản phẩm chưa đánh giá thành công',
            metadata: {
                orderId: order._id,
                orderCode: order.orderCode,
                pendingProducts: pendingProductsWithDetails,
                count: pendingProductsWithDetails.length
            }
        }).send(res);
    }

    // Lấy tất cả đơn hàng đã giao của user (để hiển thị danh sách đánh giá)
    async getMyPendingReviews(req, res) {
        const userId = req.user;

        const deliveredOrders = await orderModel.find({
            userId,
            status: 'delivered'
        }).sort({ updatedAt: -1 });

        const ordersWithPendingReviews = await Promise.all(
            deliveredOrders.map(async (order) => {
                const existingReviews = await reviewModel.find({
                    userId,
                    orderId: order._id
                });

                const reviewedProductIds = existingReviews.map(r => r.productId.toString());
                const pendingCount = order.products.filter(
                    item => !reviewedProductIds.includes(item.productId.toString())
                ).length;

                return {
                    orderId: order._id,
                    orderCode: order.orderCode,
                    deliveredAt: order.updatedAt,
                    totalProducts: order.products.length,
                    reviewedCount: existingReviews.length,
                    pendingCount: pendingCount,
                    hasPending: pendingCount > 0
                };
            })
        );

        // Chỉ trả về các đơn hàng còn sản phẩm chưa đánh giá
        const filteredOrders = ordersWithPendingReviews.filter(order => order.hasPending);

        return new OK({
            message: 'Lấy danh sách đơn hàng cần đánh giá thành công',
            metadata: filteredOrders
        }).send(res);
    }

    // Like/Dislike Review
    async toggleLike(req, res) {
        const userId = req.user;
        const { reviewId } = req.params;

        const review = await reviewModel.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        const likeIndex = review.likes.findIndex(id => id.toString() === userId.toString());
        const dislikeIndex = review.dislikes.findIndex(id => id.toString() === userId.toString());

        if (likeIndex > -1) {
            // Đã like -> Bỏ like
            review.likes.splice(likeIndex, 1);
        } else {
            // Chưa like -> Thêm like và bỏ dislike nếu có
            review.likes.push(userId);
            if (dislikeIndex > -1) {
                review.dislikes.splice(dislikeIndex, 1);
            }
        }

        await review.save();
        await review.populate('likes dislikes', 'fullName');

        return new OK({
            message: 'Đã cập nhật',
            metadata: review
        }).send(res);
    }

    async toggleDislike(req, res) {
        const userId = req.user;
        const { reviewId } = req.params;

        const review = await reviewModel.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        const likeIndex = review.likes.findIndex(id => id.toString() === userId.toString());
        const dislikeIndex = review.dislikes.findIndex(id => id.toString() === userId.toString());

        if (dislikeIndex > -1) {
            // Đã dislike -> Bỏ dislike
            review.dislikes.splice(dislikeIndex, 1);
        } else {
            // Chưa dislike -> Thêm dislike và bỏ like nếu có
            review.dislikes.push(userId);
            if (likeIndex > -1) {
                review.likes.splice(likeIndex, 1);
            }
        }

        await review.save();
        await review.populate('likes dislikes', 'fullName');

        return new OK({
            message: 'Đã cập nhật',
            metadata: review
        }).send(res);
    }

    // Add Reply/Comment to Review
    async addReply(req, res) {
        const userId = req.user;
        const { reviewId } = req.params;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            throw new BadRequestError('Vui lòng nhập bình luận');
        }

        const review = await reviewModel.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        // Check if user is admin
        const user = await userModel.findById(userId);
        const isAdmin = user?.isAdmin === true;

        review.replies.push({
            userId,
            comment: comment.trim(),
            isAdmin
        });

        await review.save();
        await review.populate('replies.userId', 'fullName avatar isAdmin');

        return new OK({
            message: 'Đã thêm bình luận',
            metadata: review
        }).send(res);
    }

    // Delete Reply (admin or reply owner)
    async deleteReply(req, res) {
        const userId = req.user;
        const { reviewId, replyId } = req.params;

        const review = await reviewModel.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        const user = await userModel.findById(userId);
        const isAdmin = user?.isAdmin === true;

        const replyIndex = review.replies.findIndex(r => r._id.toString() === replyId);
        if (replyIndex === -1) throw new NotFoundError('Bình luận không tồn tại');

        const reply = review.replies[replyIndex];
        // Chỉ cho phép xóa nếu là admin hoặc là chủ sở hữu reply
        if (!isAdmin && reply.userId.toString() !== userId.toString()) {
            throw new BadRequestError('Bạn không có quyền xóa bình luận này');
        }

        review.replies.splice(replyIndex, 1);
        await review.save();

        return new OK({
            message: 'Đã xóa bình luận',
            metadata: review
        }).send(res);
    }

    // Admin: Get all reviews (for management)
    async getAllReviews(req, res) {
        const { productId, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (productId) {
            query.productId = productId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const reviews = await reviewModel.find(query)
            .populate('userId', 'fullName avatar email')
            .populate('productId', 'nameProduct imagesProduct')
            .populate('replies.userId', 'fullName avatar isAdmin')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await reviewModel.countDocuments(query);

        return new OK({
            message: 'Lấy danh sách đánh giá thành công',
            metadata: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        }).send(res);
    }

    // Admin: Toggle hide review
    async toggleHideReview(req, res) {
        const { reviewId } = req.params;

        const review = await reviewModel.findById(reviewId);
        if (!review) throw new NotFoundError('Đánh giá không tồn tại');

        review.isHidden = !review.isHidden;
        await review.save();

        return new OK({
            message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị đánh giá',
            metadata: review
        }).send(res);
    }
}

module.exports = new ReviewController();