import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Thêm withCredentials cho tất cả requests để gửi cookies
  const clonedReq = req.clone({
    withCredentials: true
  });

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Nếu lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (err.status === 401 || err.status === 403) {
        // Kiểm tra xem đang ở trang công khai hay không
        const currentPath = window.location.pathname;
        const publicPaths = [
          '/store',
          '/allproduct',
          '/product-detail',
          '/cart',
          '/help',
          '/contact',
          '/news',
          '/',
          '/home',
          '/login',
          '/register',
          '/forgot-password'
        ];
        const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

        // Nếu đang ở trang công khai → KHÔNG redirect, chỉ throw error
        // Cho phép guest xem trang và xử lý lỗi tại component
        if (isPublicPath) {
          return throwError(() => err);
        }

        // Nếu KHÔNG ở trang công khai → chỉ redirect với các API yêu cầu authentication
        const authRequiredEndpoints = [
          '/api/user/auth',
          '/api/user/change-password',
          '/api/order',
          '/api/wishlist',
          '/api/review',
          '/api/user/address'
        ];

        const requiresAuth = authRequiredEndpoints.some(endpoint => req.url.includes(endpoint));

        // Chỉ redirect nếu là API yêu cầu authentication
        if (requiresAuth &&
            !req.url.includes('/login') &&
            !req.url.includes('/register') &&
            !req.url.includes('/auth/success') &&
            !req.url.includes('/auth/error')) {
          localStorage.removeItem('user');
          location.assign('/login');
        }

        return throwError(() => err);
      }

      // Nếu lỗi khác → trả về
      return throwError(() => err);
    })
  );
};
