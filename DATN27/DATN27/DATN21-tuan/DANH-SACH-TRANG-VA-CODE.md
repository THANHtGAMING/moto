# DANH SÁCH CÁC TRANG VÀ ĐƯỜNG DẪN CODE CONTROLLER

## SHOP PAGES (Trang người dùng)

### 3. Thực hiện trang chủ
- **Đường dẫn trang:** `http://localhost:4200/store`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/home-shop/home-shop.component.ts`

### 4. Thực hiện trang danh sách sản phẩm
- **Đường dẫn trang:** `http://localhost:4200/allproduct`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/all-product/all-product.component.ts`

### 5. Thực hiện trang chi tiết Sản phẩm
- **Đường dẫn trang:** `http://localhost:4200/product-detail/:id` (ví dụ: `http://localhost:4200/product-detail/123`)
- **Đường dẫn code controller:** `frontend/src/app/components-shop/product-detail/product-detail.component.ts`

### 6. Thực hiện trang giỏ hàng (Cart)
- **Đường dẫn trang:** `http://localhost:4200/cart`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/cart/cart.component.ts`

### 7. Thực hiện trang đơn hàng của tôi
- **Đường dẫn trang:** `http://localhost:4200/profile` (xem trong phần đơn hàng của profile)
- **Đường dẫn code controller:** `frontend/src/app/components-shop/profile/profile.component.ts`

### 8. Thực hiện trang chi tiết Đơn hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/order-detail/:id` (Admin) hoặc xem trong profile
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/order/order-detail/order-detail.component.ts`

### 9. Thực hiện trang đánh giá Đơn hàng
- **Đường dẫn trang:** `http://localhost:4200/review-order/:orderId` (ví dụ: `http://localhost:4200/review-order/123`)
- **Đường dẫn code controller:** `frontend/src/app/components-shop/review-order/review-order.component.ts`

### 10. Thực hiện trang yêu thích
- **Đường dẫn trang:** `http://localhost:4200/wishlist`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/wishlist/wishlist.component.ts`

### 11. Thực hiện trang hồ sơ
- **Đường dẫn trang:** `http://localhost:4200/profile`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/profile/profile.component.ts`

### 12. Thực hiện trang đăng nhập
- **Đường dẫn trang:** `http://localhost:4200/login`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/login/login.component.ts`

### 13. Thực hiện trang đăng ký
- **Đường dẫn trang:** `http://localhost:4200/register`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/register/register.component.ts`

### 14. Thực hiện trang quên mật khẩu
- **Đường dẫn trang:** `http://localhost:4200/forgot-password`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/forgot-password/forgot-password.ts`

### 15. Thực hiện trang thành công đặt hàng
- **Đường dẫn trang:** `http://localhost:4200/order-success`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/order-success/order-success.component.ts`

### 16. Thực hiện trang trợ giúp
- **Đường dẫn trang:** `http://localhost:4200/help`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/help/help.component.ts`

### 17. Thực hiện trang chi tiết Trợ giúp
- **Đường dẫn trang:** `http://localhost:4200/help-detail/:id` (ví dụ: `http://localhost:4200/help-detail/123`)
- **Đường dẫn code controller:** `frontend/src/app/components-shop/help-detail/help-detail.component.ts`

### 18. Thực hiện trang liên hệ (Contact)
- **Đường dẫn trang:** `http://localhost:4200/contact`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/contact/contact.component.ts`

### 19. Thực hiện trang xác thực Thành công
- **Đường dẫn trang:** `http://localhost:4200/auth/success`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/auth-success/auth-success.component.ts`

### 20. Thực hiện trang xác thực Lỗi
- **Đường dẫn trang:** `http://localhost:4200/auth/error`
- **Đường dẫn code controller:** `frontend/src/app/components-shop/auth-error/auth-error.component.ts`

---

## ADMIN PAGES (Trang quản trị)

### 24. Thực hiện trang chủ Admin
- **Đường dẫn trang:** `http://localhost:4200/admin` hoặc `http://localhost:4200/admin/data-analysis`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/dashboard/dashboard.component.ts`

### 25. Thực hiện trang Quản lý Loại Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/type-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/type/type-list/type-list.component.ts`

### 26. Thực hiện trang Thêm Loại Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/type-add`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/type/type-add/type-add.component.ts`

### 27. Thực hiện trang Sửa Loại Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/type-edit/:id` (ví dụ: `http://localhost:4200/admin/type-edit/123`)
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/type/type-edit/type-edit.component.ts`

### 28. Thực hiện trang Quản lý Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/product-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/product/product-list/product-list.component.ts`

### 29. Thực hiện trang Thêm Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/product-add`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/product/product-add/product-add.component.ts`

### 30. Thực hiện trang Sửa Sản Phẩm
- **Đường dẫn trang:** `http://localhost:4200/admin/product-edit/:id` (ví dụ: `http://localhost:4200/admin/product-edit/123`)
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/product/product-edit/product-edit.component.ts`

### 31. Thực hiện trang Quản lý Đơn Hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/order-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/order/order-list/order-list.component.ts`

### 32. Thực hiện trang Chi tiết Đơn Hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/order-detail/:id` (ví dụ: `http://localhost:4200/admin/order-detail/123`)
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/order/order-detail/order-detail.component.ts`

### 33. Thực hiện trang Quản lý Nhãn Hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/brand-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/brand/brand-list/brand-list.component.ts`

### 34. Thực hiện trang Thêm Nhãn Hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/brand-add`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/brand/brand-add/brand-add.component.ts`

### 35. Thực hiện trang Sửa Nhãn Hàng
- **Đường dẫn trang:** `http://localhost:4200/admin/brand-edit/:id` (ví dụ: `http://localhost:4200/admin/brand-edit/123`)
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/brand/brand-edit/brand-edit.component.ts`

### 36. Thực hiện trang Quản lý Banner
- **Đường dẫn trang:** `http://localhost:4200/admin/banner`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/banner/banner-list/banner-list.component.ts`

### 37. Thực hiện trang Quản lý Người Dùng
- **Đường dẫn trang:** `http://localhost:4200/admin/user-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/user-list/user-list.component.ts`

### 38. Thực hiện trang Thống Kê
- **Đường dẫn trang:** `http://localhost:4200/admin/data-analysis`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/statistic/statistic.component.ts`

### 39. Thực hiện trang Quản lý Mã Giảm Giá
- **Đường dẫn trang:** `http://localhost:4200/admin/coupon-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/coupon/coupon-list/coupon-list.component.ts`

### 40. Thực hiện trang Quản lý Đánh Giá
- **Đường dẫn trang:** `http://localhost:4200/admin/review-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/review/review-list/review-list.ts`

### 41. Thực hiện trang Quản lý Tin Tức
- **Đường dẫn trang:** `http://localhost:4200/admin/news-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/news/news-list/news-list.component.ts`

### 42. Thực hiện trang Quản lý Trợ Giúp
- **Đường dẫn trang:** `http://localhost:4200/admin/help-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/help/help-list/help-list.component.ts`

### 43. Thực hiện trang Quản lý Thư Liên Hệ
- **Đường dẫn trang:** `http://localhost:4200/admin/contact-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/contact/contact-list/contact-list.component.ts`

### 44. Thực hiện trang Quản lý Địa chỉ Liên Hệ
- **Đường dẫn trang:** `http://localhost:4200/admin/contact-infor`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/contact/contact-infor/contact-infor.component.ts`

### 45. Thực hiện trang Quản lý Tay Đua
- **Đường dẫn trang:** `http://localhost:4200/admin/rider-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/rider/rider-list/rider-list.component.ts`

### 46. Thực hiện trang Quản lý Giới Tính
- **Đường dẫn trang:** `http://localhost:4200/admin/gender-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/gender/gender-list/gender-list.component.ts`

### 47. Thực hiện trang Quản lý Thẻ
- **Đường dẫn trang:** `http://localhost:4200/admin/tag-list`
- **Đường dẫn code controller:** `frontend/src/app/componets-admin/tag/tag-list/tag-list.component.ts`

---

## LƯU Ý

- **Base URL:** `http://localhost:4200` (khi chạy local)
- **`:id`** và **`:orderId`** là các tham số động, cần thay bằng ID thực tế
- Tất cả các trang admin yêu cầu đăng nhập với quyền Admin
- Một số trang shop yêu cầu đăng nhập (có `canActivate: [ShopGuard]` hoặc `[UserGuard]`)

---

## BACKEND CONTROLLERS (Tham khảo)

Các controller backend tương ứng nằm trong thư mục:
- `backend/server/src/controllers/`

Ví dụ:
- `backend/server/src/controllers/product.controller.js`
- `backend/server/src/controllers/user.controller.js`
- `backend/server/src/controllers/order.controller.js`
- `backend/server/src/controllers/cart.controller.js`
- Và các controller khác...

