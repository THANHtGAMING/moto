import { Routes } from '@angular/router';
import { AdminGuard } from './services/auth/admin-guard';
import { AuthGuard } from './services/auth/auth-guard';
import { UserGuard } from './services/auth/user-guard';
import { ShopGuard } from './services/auth/shop-guard';
import { DashboardComponent } from './componets-admin/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'news',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
   {
    path: 'news/:id',
    loadComponent: () =>
      import('./components/homedetail/homedetail.component').then((m) => m.HomeComponentDetail),
    canActivate: [ShopGuard],
  },
  {
    path: 'store',
    loadComponent: () =>
      import('./components-shop/home-shop/home-shop.component').then((m) => m.HomeShopComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'allproduct',
    loadComponent: () =>
      import('./components-shop/all-product/all-product.component').then((m) => m.AllProductComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components-shop/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components-shop/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components-shop/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'auth/success',
    loadComponent: () =>
      import('./components-shop/auth-success/auth-success.component').then((m) => m.AuthSuccessComponent),
  },
  {
    path: 'auth/error',
    loadComponent: () =>
      import('./components-shop/auth-error/auth-error.component').then((m) => m.AuthErrorComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components-shop/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'review-order/:orderId',
    loadComponent: () =>
      import('./components-shop/review-order/review-order.component').then((m) => m.ReviewOrderComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./components-shop/cart/cart.component').then((m) => m.CartComponent),
    canActivate: [UserGuard],
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./components-shop/wishlist/wishlist.component').then((m) => m.WishlistComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'payment',
    loadComponent: () =>
      import('./components-shop/payment/payment.component').then((m) => m.PaymentComponent),
    canActivate: [UserGuard],
  },
  {
    path: 'order-success',
    loadComponent: () =>
      import('./components-shop/order-success/order-success.component').then((m) => m.OrderSuccessComponent),
    canActivate: [UserGuard],
  },
  {
    path: 'product-detail/:id',
    loadComponent: () =>
      import('./components-shop/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./components-shop/help/help.component').then((m) => m.HelpComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'help-detail/:id',
    loadComponent: () =>
      import('./components-shop/help-detail/help-detail.component').then((m) => m.HelpDetailComponent),
    canActivate: [ShopGuard],
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./components-shop/contact/contact.component').then((m) => m.ContactComponent),
    canActivate: [ShopGuard],
  },

  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [AdminGuard],
    children: [
      //loại
      {
        path: 'type-list',
        loadComponent: () =>
          import('./componets-admin/type/type-list/type-list.component').then((m) => m.TypeListComponent),
      },
      {
        path: 'type-add',
        loadComponent: () =>
          import('./componets-admin/type/type-add/type-add.component').then((m) => m.TypeAddComponent),
      },
      {
        path: 'type-edit/:id',
        loadComponent: () =>
          import('./componets-admin/type/type-edit/type-edit.component').then((m) => m.TypeEditComponent),
      },
      //tay đua
      {
        path: 'rider-list',
        loadComponent: () =>
          import('./componets-admin/rider/rider-list/rider-list.component').then((m) => m.RiderListComponent),
      },
      {
        path: 'rider-add',
        loadComponent: () =>
          import('./componets-admin/rider/rider-add/rider-add.component').then((m) => m.RiderAddComponent),
      },
      {
        path: 'rider-edit/:id',
        loadComponent: () =>
          import('./componets-admin/rider/rider-edit/rider-edit.component').then((m) => m.RiderEditComponent),
      },
      //nhãn hàng
      {
        path: 'brand-list',
        loadComponent: () =>
          import('./componets-admin/brand/brand-list/brand-list.component').then((m) => m.BrandListComponent),
      },
      {
        path: 'brand-add',
        loadComponent: () =>
          import('./componets-admin/brand/brand-add/brand-add.component').then((m) => m.BrandAddComponent),
      },
      {
        path: 'brand-edit/:id',
        loadComponent: () =>
          import('./componets-admin/brand/brand-edit/brand-edit.component').then((m) => m.BrandEditComponent),
      },
      //banner
      {
        path: 'banner',
        loadComponent: () =>
          import('./componets-admin/banner/banner-list/banner-list.component').then((m) => m.BannerListComponent),
      },
      //logo
      {
        path: 'logo',
        loadComponent: () =>
          import('./componets-admin/logo/logo-list/logo-list.component').then((m) => m.LogoListComponent),
      },
      //sản phẩm
      {
        path: 'product-list',
        loadComponent: () =>
          import('./componets-admin/product/product-list/product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'product-add',
        loadComponent: () =>
          import('./componets-admin/product/product-add/product-add.component').then((m) => m.ProductAddComponent),
      },
      {
        path: 'product-edit/:id',
        loadComponent: () =>
          import('./componets-admin/product/product-edit/product-edit.component').then((m) => m.ProductEditComponent),
      },
      //review (đánh giá)
      {
        path: 'review-list',
        loadComponent: () =>
          import('./componets-admin/review/review-list/review-list').then((m) => m.ReviewListComponent),
      },
      // user
      {
        path: 'user-list',
        loadComponent: () =>
          import('./componets-admin/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      //order
      {
        path: 'order-list',
        loadComponent: () =>
          import('./componets-admin/order/order-list/order-list.component').then((m) => m.OrderListComponent),
      },
      {
        path: 'order-detail/:id',
        loadComponent: () =>
          import('./componets-admin/order/order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
      },
      //statistic (thống kê)
      {
        path: 'data-analysis',
        loadComponent: () =>
          import('./componets-admin/statistic/statistic.component').then((m) => m.StatisticComponent),
      },
      //coupon (mã giảm giá)
      {
        path: 'coupon-list',
        loadComponent: () =>
          import('./componets-admin/coupon/coupon-list/coupon-list.component').then((m) => m.CouponListComponent),
      },
      {
        path: 'coupon-add',
        loadComponent: () =>
          import('./componets-admin/coupon/coupon-add/coupon-add.component').then((m) => m.CouponAddComponent),
      },
      {
        path: 'coupon-edit/:id',
        loadComponent: () =>
          import('./componets-admin/coupon/coupon-edit/coupon-edit.component').then((m) => m.CouponEditComponent),
      },
      //news
      {
        path: 'news-add',
        loadComponent: () =>
          import('./componets-admin/news/news-add/news-add.component').then((m) => m.NewsAddComponent),
      },
      {
        path: 'news-list',
        loadComponent: () =>
          import('./componets-admin/news/news-list/news-list.component').then((m) => m.NewsListComponent),
      },
      {
        path: 'news-edit/:id',
        loadComponent: () =>
          import('./componets-admin/news/news-edit/news-edit.component').then((m) => m.NewsEditComponent),
      },
      //gender (giới tính)
      {
        path: 'gender-list',
        loadComponent: () =>
          import('./componets-admin/gender/gender-list/gender-list.component').then((m) => m.GenderListComponent),
      },
      {
        path: 'gender-add',
        loadComponent: () =>
          import('./componets-admin/gender/gender-add/gender-add.component').then((m) => m.GenderAddComponent),
      },
      {
        path: 'gender-edit/:id',
        loadComponent: () =>
          import('./componets-admin/gender/gender-edit/gender-edit.component').then((m) => m.GenderEditComponent),
      },
      //tag
      {
        path: 'tag-list',
        loadComponent: () =>
          import('./componets-admin/tag/tag-list/tag-list.component').then((m) => m.TagListComponent),
      },
      {
        path: 'tag-add',
        loadComponent: () =>
          import('./componets-admin/tag/tag-add/tag-add.component').then((m) => m.TagAddComponent),
      },
      {
        path: 'tag-edit/:id',
        loadComponent: () =>
          import('./componets-admin/tag/tag-edit/tag-edit.component').then((m) => m.TagEditComponent),
      },
      //chat
      {
        path: 'chat',
        loadComponent: () =>
          import('./componets-admin/chat/chat-admin.component').then((m) => m.ChatAdminComponent),
      },
      //help (trợ giúp)
      {
        path: 'help-list',
        loadComponent: () =>
          import('./componets-admin/help/help-list/help-list.component').then((m) => m.HelpListComponent),
      },
      {
        path: 'help-add',
        loadComponent: () =>
          import('./componets-admin/help/help-add/help-add.component').then((m) => m.HelpAddComponent),
      },
      {
        path: 'help-edit/:id',
        loadComponent: () =>
          import('./componets-admin/help/help-edit/help-edit.component').then((m) => m.HelpEditComponent),
      },
      //contact (liên hệ)
      {
        path: 'contact-list',
        loadComponent: () =>
          import('./componets-admin/contact/contact-list/contact-list.component').then((m) => m.ContactListComponent),
      },
      {
        path: 'contact-infor',
        loadComponent: () =>
          import('./componets-admin/contact/contact-infor/contact-infor.component').then((m) => m.ContactInforComponent),
      },
    ],
  },

  { path: '', redirectTo: '/store', pathMatch: 'full' },
  { path: '**', redirectTo: '/store' },
];
