const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const newsModel = require('../models/news.model');
const cloudinary = require('../config/cloudDinary');
const fs = require('fs/promises');

class NewsController {

    // 1. Tạo bài viết mới
    async createNews(req, res) {
        const { title, content, category_code, status_code } = req.body;
        // Giả sử lấy tên tác giả từ token user đăng nhập (req.user) hoặc gửi từ body
        // Ở đây mình demo lấy từ body, bạn có thể sửa thành req.user.name nếu user model có field name
        const author = req.body.author || 'Admin'; 

        if (!title || !content || !category_code) {
            throw new BadRequestError('Thiếu thông tin bài viết (title, content, category)');
        }

        let cover_image_url = '';

        // Xử lý upload ảnh nếu có
        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'news',
                    resource_type: 'image',
                });
                cover_image_url = uploadResult.url;
                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi khi upload ảnh lên Cloudinary: ' + error.message);
            }
        }

        const newNews = await newsModel.create({
            title,
            content,
            author,
            category_code,
            cover_image_url,
            status_code: status_code || 'published',
            published_date: new Date()
        });

        if (!newNews) {
            throw new BadRequestError('Tạo bài viết thất bại');
        }

        return new Created({
            message: 'Tạo bài viết thành công',
            metadata: newNews,
        }).send(res);
    }

    // 2. Cập nhật bài viết
    async updateNews(req, res) {
        const { newsId } = req.params;
        const { title, content, category_code, status_code } = req.body;

        if (!newsId) {
            throw new BadRequestError('Thiếu News ID');
        }

        const foundNews = await newsModel.findById(newsId);
        if (!foundNews) {
            throw new NotFoundError('Bài viết không tồn tại');
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (category_code) updateData.category_code = category_code;
        if (status_code) updateData.status_code = status_code;

        // Xử lý upload ảnh mới nếu có
        if (req.file) {
            const { path } = req.file;
            try {
                const uploadResult = await cloudinary.uploader.upload(path, {
                    folder: 'news',
                    resource_type: 'image',
                });
                updateData.cover_image_url = uploadResult.url;
                await fs.unlink(path).catch(() => {});
            } catch (error) {
                if (path) await fs.unlink(path).catch(() => {});
                throw new BadRequestError('Lỗi khi upload ảnh lên Cloudinary: ' + error.message);
            }
        }

        // Thực hiện update
        const updatedNews = await newsModel.findByIdAndUpdate(newsId, updateData, {
            new: true, // Trả về dữ liệu sau khi update
        });

        return new OK({
            message: 'Cập nhật bài viết thành công',
            metadata: updatedNews,
        }).send(res);
    }

    // 3. Xóa bài viết
    async deleteNews(req, res) {
        const { newsId } = req.params;

        if (!newsId) {
            throw new BadRequestError('Thiếu News ID');
        }

        const foundNews = await newsModel.findById(newsId);
        if (!foundNews) {
            throw new NotFoundError('Bài viết không tồn tại');
        }

        await newsModel.findByIdAndDelete(newsId);

        return new OK({
            message: 'Xóa bài viết thành công',
            metadata: {},
        }).send(res);
    }

    // 4. Lấy chi tiết bài viết
    async getNewsDetail(req, res) {
        const { newsId } = req.params;

        if (!newsId) {
            throw new BadRequestError('Thiếu News ID');
        }

        const foundNews = await newsModel.findById(newsId);
        if (!foundNews) {
            throw new NotFoundError('Bài viết không tồn tại');
        }

        return new OK({
            message: 'Lấy thông tin bài viết thành công',
            metadata: foundNews,
        }).send(res);
    }

    // 5. Lấy danh sách bài viết (Có hỗ trợ lọc theo category hoặc status)
    async getAllNews(req, res) {
        const { category_code, status_code, limit = 10, page = 1 } = req.query;
        
        const filter = {};
        if (category_code) filter.category_code = category_code;
        if (status_code) filter.status_code = status_code;
        else filter.status_code = 'published'; // Mặc định chỉ lấy bài đã published nếu khách xem

        const skip = (Number(page) - 1) * Number(limit);

        const listNews = await newsModel.find(filter)
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await newsModel.countDocuments(filter);

        return new OK({
            message: 'Lấy danh sách bài viết thành công',
            metadata: {
                news: listNews,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit)
                }
            },
        }).send(res);
    }
}

module.exports = new NewsController();