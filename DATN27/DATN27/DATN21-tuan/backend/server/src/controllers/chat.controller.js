const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const chatModel = require('../models/chat.model');
const userModel = require('../models/user.model');

class ChatController {
    // 1. Lấy tất cả tin nhắn của user hiện tại
    async getMessages(req, res) {
        const userId = req.user;
        
        if (!userId) {
            throw new BadRequestError('Người dùng chưa đăng nhập');
        }

        // Lấy tất cả tin nhắn của user này (cả user và admin gửi)
        const messages = await chatModel.find({
            userId: userId
        })
        .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần
        .populate('userId', 'fullName email')
        .populate('adminId', 'fullName email')
        .lean();

        return new OK({
            message: 'Lấy danh sách tin nhắn thành công',
            metadata: {
                messages: messages || []
            }
        }).send(res);
    }

    // 2. Gửi tin nhắn mới (từ user)
    async sendMessage(req, res) {
        const userId = req.user;
        const { message } = req.body;

        if (!userId) {
            throw new BadRequestError('Người dùng chưa đăng nhập');
        }

        if (!message || !message.trim()) {
            throw new BadRequestError('Tin nhắn không được để trống');
        }

        const newMessage = await chatModel.create({
            message: message.trim(),
            sender: 'user',
            userId: userId,
            isRead: false
        });

        // Populate để trả về thông tin đầy đủ
        const populatedMessage = await chatModel.findById(newMessage._id)
            .populate('userId', 'fullName email')
            .populate('adminId', 'fullName email')
            .lean();

        return new Created({
            message: 'Gửi tin nhắn thành công',
            metadata: {
                message: populatedMessage
            }
        }).send(res);
    }

    // 3. Admin gửi tin nhắn (phản hồi)
    async sendAdminMessage(req, res) {
        const adminId = req.user;
        const { userId, message } = req.body;

        if (!adminId) {
            throw new BadRequestError('Admin chưa đăng nhập');
        }

        if (!userId) {
            throw new BadRequestError('Thiếu userId');
        }

        if (!message || !message.trim()) {
            throw new BadRequestError('Tin nhắn không được để trống');
        }

        // Kiểm tra user có tồn tại không
        const userExists = await chatModel.findOne({ userId: userId });
        if (!userExists) {
            throw new NotFoundError('Không tìm thấy user');
        }

        const newMessage = await chatModel.create({
            message: message.trim(),
            sender: 'admin',
            userId: userId,
            adminId: adminId,
            isRead: false
        });

        const populatedMessage = await chatModel.findById(newMessage._id)
            .populate('userId', 'fullName email')
            .populate('adminId', 'fullName email')
            .lean();

        return new Created({
            message: 'Gửi tin nhắn thành công',
            metadata: {
                message: populatedMessage
            }
        }).send(res);
    }

    // 4. Đánh dấu tin nhắn đã đọc
    async markAsRead(req, res) {
        const { messageId } = req.params;
        const userId = req.user;

        if (!userId) {
            throw new BadRequestError('Người dùng chưa đăng nhập');
        }

        if (!messageId) {
            throw new BadRequestError('Thiếu messageId');
        }

        const message = await chatModel.findById(messageId);
        if (!message) {
            throw new NotFoundError('Không tìm thấy tin nhắn');
        }

        // User chỉ có thể đánh dấu tin nhắn thuộc về họ (tin nhắn từ admin gửi cho user)
        if (message.userId.toString() !== userId.toString()) {
            throw new BadRequestError('Không có quyền đánh dấu tin nhắn này');
        }

        // Chỉ đánh dấu tin nhắn từ admin là đã đọc (user không cần đánh dấu tin nhắn của chính họ)
        if (message.sender === 'admin') {
            message.isRead = true;
            await message.save();
        }

        return new OK({
            message: 'Đánh dấu tin nhắn đã đọc thành công',
            metadata: message
        }).send(res);
    }

    // 5. Lấy số lượng tin nhắn chưa đọc
    async getUnreadCount(req, res) {
        const userId = req.user;

        if (!userId) {
            throw new BadRequestError('Người dùng chưa đăng nhập');
        }

        const count = await chatModel.countDocuments({
            userId: userId,
            sender: 'admin',
            isRead: false
        });

        return new OK({
            message: 'Lấy số lượng tin nhắn chưa đọc thành công',
            metadata: {
                count: count
            }
        }).send(res);
    }

    // 6. Admin: Lấy tất cả conversations (danh sách user đã chat)
    async getAllConversations(req, res) {
        // Chỉ admin mới có quyền
        const adminUser = await userModel.findById(req.user);
        if (!adminUser || !adminUser.isAdmin) {
            throw new BadRequestError('Chỉ admin mới có quyền truy cập');
        }

        // Lấy danh sách các user đã có tin nhắn, kèm tin nhắn cuối cùng
        const conversations = await chatModel.aggregate([
            {
                // Sort trước để $last lấy message mới nhất
                $sort: { createdAt: 1 }
            },
            {
                $group: {
                    _id: '$userId',
                    lastMessage: { $last: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    userId: '$_id',
                    user: {
                        _id: '$user._id',
                        fullName: '$user.fullName',
                        email: '$user.email'
                    },
                    lastMessage: {
                        _id: '$lastMessage._id',
                        message: '$lastMessage.message',
                        sender: '$lastMessage.sender',
                        createdAt: '$lastMessage.createdAt'
                    },
                    unreadCount: 1
                }
            }
        ]);

        return new OK({
            message: 'Lấy danh sách conversations thành công',
            metadata: {
                conversations: conversations || []
            }
        }).send(res);
    }

    // 7. Admin: Lấy tin nhắn của một user cụ thể
    async getMessagesByUserId(req, res) {
        const adminUser = await userModel.findById(req.user);
        if (!adminUser || !adminUser.isAdmin) {
            throw new BadRequestError('Chỉ admin mới có quyền truy cập');
        }

        const { userId } = req.params;

        if (!userId) {
            throw new BadRequestError('Thiếu userId');
        }

        const messages = await chatModel.find({
            userId: userId
        })
        .sort({ createdAt: 1 })
        .populate('userId', 'fullName email')
        .populate('adminId', 'fullName email')
        .lean();

        return new OK({
            message: 'Lấy tin nhắn thành công',
            metadata: {
                messages: messages || []
            }
        }).send(res);
    }

    // 8. Admin: Lấy số lượng tin nhắn chưa đọc (tin nhắn từ user gửi tới admin)
    async getAdminUnreadCount(req, res) {
        const adminUser = await userModel.findById(req.user);
        if (!adminUser || !adminUser.isAdmin) {
            throw new BadRequestError('Chỉ admin mới có quyền truy cập');
        }

        const count = await chatModel.countDocuments({
            sender: 'user',
            isRead: false
        });

        return new OK({
            message: 'Lấy số lượng tin nhắn chưa đọc thành công',
            metadata: {
                count: count
            }
        }).send(res);
    }

    // 9. Admin: Đánh dấu tin nhắn từ user là đã đọc
    async markAdminAsRead(req, res) {
        const adminUser = await userModel.findById(req.user);
        if (!adminUser || !adminUser.isAdmin) {
            throw new BadRequestError('Chỉ admin mới có quyền truy cập');
        }

        const { messageId } = req.params;

        if (!messageId) {
            throw new BadRequestError('Thiếu messageId');
        }

        const message = await chatModel.findById(messageId);
        if (!message) {
            throw new NotFoundError('Không tìm thấy tin nhắn');
        }

        // Chỉ đánh dấu tin nhắn từ user (sender: 'user')
        if (message.sender !== 'user') {
            throw new BadRequestError('Chỉ có thể đánh dấu tin nhắn từ user');
        }

        message.isRead = true;
        await message.save();

        return new OK({
            message: 'Đánh dấu tin nhắn đã đọc thành công',
            metadata: message
        }).send(res);
    }

    // 10. Admin: Đánh dấu tất cả tin nhắn chưa đọc của một user là đã đọc
    async markAllAsReadByUserId(req, res) {
        const adminUser = await userModel.findById(req.user);
        if (!adminUser || !adminUser.isAdmin) {
            throw new BadRequestError('Chỉ admin mới có quyền truy cập');
        }

        const { userId } = req.params;

        if (!userId) {
            throw new BadRequestError('Thiếu userId');
        }

        const result = await chatModel.updateMany(
            {
                userId: userId,
                sender: 'user',
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return new OK({
            message: 'Đánh dấu tất cả tin nhắn đã đọc thành công',
            metadata: {
                modifiedCount: result.modifiedCount
            }
        }).send(res);
    }

    // 11. User: Đánh dấu tất cả tin nhắn từ admin là đã đọc
    async markAllAdminMessagesAsRead(req, res) {
        const userId = req.user;

        if (!userId) {
            throw new BadRequestError('Người dùng chưa đăng nhập');
        }

        const result = await chatModel.updateMany(
            {
                userId: userId,
                sender: 'admin',
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return new OK({
            message: 'Đánh dấu tất cả tin nhắn từ admin đã đọc thành công',
            metadata: {
                modifiedCount: result.modifiedCount
            }
        }).send(res);
    }
}

module.exports = new ChatController();

