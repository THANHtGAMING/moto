# Backend Server - Node.js + Express + MongoDB

## Mô tả

Backend API server sử dụng Node.js, Express và MongoDB với cấu trúc MVC chuẩn. Hệ thống quản lý sản phẩm với các model: Gender, Type, Rider, Brand, Tag, và Product.

## Yêu cầu hệ thống

- Node.js (v14 trở lên)
- MongoDB (local hoặc MongoDB Atlas)
- npm hoặc yarn

## Cài đặt

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Cấu hình biến môi trường:**

Tạo file `.env` trong thư mục `backend/server/` với nội dung:

```env
# Database
MONGO_URI=mongodb://localhost:27017/your-database-name
# hoặc MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Server
PORT=8000

# JWT
JWT_SECRET=your-secret-key-here

# Cloudinary (cho upload ảnh)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (nếu sử dụng)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/user/auth/google/callback
```

3. **Chạy server:**

```bash
npm start
```

Server sẽ chạy tại `http://localhost:8000`

## Cấu trúc thư mục

```
src/
├── models/          # Mongoose schemas
│   ├── gender.model.js
│   ├── type.model.js
│   ├── tag.model.js
│   ├── brand.model.js
│   ├── rider.model.js
│   └── product.model.js
├── controllers/     # Business logic
│   ├── gender.controller.js
│   ├── type.controller.js
│   ├── tag.controller.js
│   ├── brand.controller.js
│   └── product.controller.js
├── routes/          # API routes
│   ├── gender.routes.js
│   ├── type.routes.js
│   ├── tag.routes.js
│   ├── brand.routes.js
│   └── product.routes.js
├── middleware/      # Custom middleware
│   ├── validateRequest.js
│   └── authUser.js
├── utils/           # Utility functions
│   ├── generateSlug.js
│   └── escapeRegex.js
├── config/          # Configuration files
│   ├── connectDB.js
│   └── cloudDinary.js
└── server.js        # Entry point
```

## API Endpoints

### Gender API

- `POST /api/gender/create` - Tạo giới tính mới (Admin)
- `GET /api/gender/list` - Lấy danh sách giới tính
- `GET /api/gender/detail/:id` - Lấy chi tiết giới tính
- `PUT /api/gender/update/:id` - Cập nhật giới tính (Admin)
- `DELETE /api/gender/delete/:id` - Xóa giới tính (Admin)

### Type API

- `POST /api/type/create` - Tạo loại mới (Admin)
- `GET /api/type/list` - Lấy danh sách loại
- `GET /api/type/detail/:id` - Lấy chi tiết loại
- `PUT /api/type/update/:id` - Cập nhật loại (Admin)
- `DELETE /api/type/delete/:id` - Xóa loại (Admin)

### Tag API

- `POST /api/tag/create` - Tạo tag mới (Admin)
- `GET /api/tag/list` - Lấy danh sách tag
- `GET /api/tag/detail/:id` - Lấy chi tiết tag
- `PUT /api/tag/update/:id` - Cập nhật tag (Admin)
- `DELETE /api/tag/delete/:id` - Xóa tag (Admin)

### Brand API

- `POST /api/brand/create` - Tạo thương hiệu mới (Admin)
- `GET /api/brand/list` - Lấy danh sách thương hiệu
- `GET /api/brand/detail/:id` - Lấy chi tiết thương hiệu
- `PUT /api/brand/update/:id` - Cập nhật thương hiệu (Admin)
- `DELETE /api/brand/delete/:id` - Xóa thương hiệu (Admin)

### Product API

- `POST /api/product/create` - Tạo sản phẩm mới (Admin)
- `GET /api/product/list` - Lấy danh sách sản phẩm (có filter, search, pagination)
- `GET /api/product/detail/:id` - Lấy chi tiết sản phẩm
- `PUT /api/product/update/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/product/delete/:id` - Xóa sản phẩm (Admin)

#### Product List Query Parameters:

- `page` - Số trang (mặc định: 1)
- `limit` - Số item mỗi trang (mặc định: 20, tối đa: 100)
- `keyword` - Từ khóa tìm kiếm
- `gender` - Filter theo Gender ID
- `type` - Filter theo Type ID
- `brand` - Filter theo Brand ID
- `rider` - Filter theo Rider ID
- `tags` - Filter theo Tag IDs (comma-separated)
- `minPrice` - Giá tối thiểu
- `maxPrice` - Giá tối đa
- `sort` - Sắp xếp: `price_asc`, `price_desc`, `newest`, `oldest`
- `searchMode` - Chế độ tìm kiếm: `auto`, `text`, `regex`

## Business Rules

### Product Model

1. **Sizes vs StockProduct:**
   - Nếu `sizes` array có dữ liệu (length > 0) → `stockProduct` sẽ tự động được set = 0 (ignore)
   - Nếu `sizes` empty/undefined → `stockProduct` là bắt buộc và phải >= 0

2. **Auto-add Sale Tag:**
   - Khi `discountProduct > 0` → tự động thêm Tag "Sale" vào `tags` (nếu Tag "Sale" tồn tại trong DB)
   - Khi `discountProduct` được set về 0 → tự động xóa Tag "Sale" khỏi `tags`

3. **Slug Auto-generation:**
   - Type và Brand tự động tạo slug từ name khi create/update
   - Slug được đảm bảo unique (tự động thêm số suffix nếu trùng)

## Validation

Tất cả API POST/PUT đều sử dụng `express-validator` để validate đầu vào. Lỗi validation sẽ trả về status 400 với thông báo chi tiết.

## Error Handling

Server sử dụng custom error classes và asyncHandler để xử lý lỗi tự động. Tất cả lỗi được format theo chuẩn JSON:

```json
{
  "message": "Thông báo lỗi",
  "statusCode": 400
}
```

## Notes

- Tất cả API đều sử dụng async/await
- Upload ảnh sử dụng Multer + Cloudinary
- Authentication: Sử dụng JWT và middleware `authAdmin` cho các route admin
- Database indexes được tạo tự động cho performance optimization

## Development

Để chạy ở chế độ development với auto-reload:

```bash
npm start
```

(Đã cấu hình nodemon trong package.json)

