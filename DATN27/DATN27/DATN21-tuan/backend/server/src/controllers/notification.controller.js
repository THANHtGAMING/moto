const notificationModel = require('../models/notification.model');
const { OK } = require('../core/success.response');
const { NotFoundError } = require('../core/error.response');

class NotificationController {
    
    // 1. Lấy danh sách thông báo của User hiện tại
    async getMyNotifications(req, res) {
        const userId = req.user;
        const { limit = 20, page = 1 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const notifications = await notificationModel.find({ userId })
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip(skip)
            .limit(Number(limit));

        // Đếm số lượng chưa đọc
        const unreadCount = await notificationModel.countDocuments({ userId, isRead: false });

        return new OK({
            message: 'Lấy danh sách thông báo thành công',
            metadata: {
                notifications,
                unreadCount
            }
        }).send(res);
    }

    // 2. Đánh dấu đã đọc (1 thông báo hoặc tất cả)
    async markAsRead(req, res) {
        const userId = req.user;
        const { notificationId } = req.body; // Nếu null thì đánh dấu tất cả

        if (notificationId) {
            await notificationModel.findOneAndUpdate(
                { _id: notificationId, userId },
                { isRead: true }
            );
        } else {
            // Đánh dấu tất cả là đã đọc
            await notificationModel.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );
        }

        return new OK({
            message: 'Đã cập nhật trạng thái đã đọc',
            metadata: true
        }).send(res);
    }

    // --- HÀM INTERNAL (Dùng để gọi nội bộ từ các controller khác) ---
    // Ví dụ: NotificationController.pushNoti({ userId: '...', title: '...', ... })
    static async pushNoti({ userId, title, message, type, metadata }) {
        try {
            await notificationModel.create({
                userId, title, message, type, metadata
            });
            // Nếu bạn có tích hợp Socket.io, đây là chỗ bắn sự kiện realtime
            // global.io.to(userId).emit('new_notification', { ... });
            return true;
        } catch (error) {
            console.error('Lỗi tạo thông báo:', error);
            return false;
        }
    }
}

module.exports = NotificationController;