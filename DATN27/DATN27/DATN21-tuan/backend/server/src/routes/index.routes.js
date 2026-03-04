const userRoutes = require('./user.routes');
const typeRoutes = require('./type.routes');
const riderRoutes = require('./rider.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const couponRoutes = require('./coupon.routes');
const newsRoutes = require('./news.routes');
const reviewRoutes = require('./review.routes');
const orderRoutes = require('./order.routes');
const statisticRoutes = require('./statistic.routes');
const wishlistRoutes = require('./wishlist.routes');
const notificationRoutes = require('./notification.routes');
const brandRoutes = require('./brand.routes');
const adminOrderRoutes = require('./adminOrder.routes');
const genderRoutes = require('./gender.routes');
const tagRoutes = require('./tag.routes');
const chatRoutes = require('./chat.routes');
const helpRoutes = require('./help.routes');
const contactRoutes = require('./contact.routes');
const contactInfoRoutes = require('./contactInfo.routes');
const bannerRoutes = require('./banner.routes');
const logoRoutes = require('./logo.routes');

function routes(app) {
    app.use('/api/user', userRoutes);
    app.use('/api/type', typeRoutes);
    app.use('/api/rider', riderRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/news', newsRoutes);
    app.use('/api/review', reviewRoutes);
    app.use('/api/order', orderRoutes);
    app.use('/api/statistic', statisticRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/notification', notificationRoutes);
    app.use('/api/brand', brandRoutes);
    app.use('/api/admin/order', adminOrderRoutes);
    app.use('/api/gender', genderRoutes);
    app.use('/api/tag', tagRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/help', helpRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/contact-info', contactInfoRoutes);
    app.use('/api/banner', bannerRoutes);
    app.use('/api/logo', logoRoutes);
}

module.exports = routes;
