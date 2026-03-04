import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf, CommonModule } from '@angular/common';
import { HeaderComponent } from "../app/components/header/header.component";
import { FooterComponent } from "../app/components/footer/footer.component";
import { HeaderShopComponent } from './components-shop/header-shop/header-shop.component';
import { FooterShopComponent } from './components-shop/footer-shop/footer-shop.component';
import { ToastContainerComponent } from './services/toast/toast.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    HeaderComponent,
    FooterComponent,
    HeaderShopComponent,
    FooterShopComponent,
    ToastContainerComponent,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  isHomePage = true;
  showLayout = true; // kiểm soát việc ẩn header/footer

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        // 1️⃣ Các trang thuộc layout shop
        const shopPages = ['/store', '/allproduct','/payment','/cart','/wishlist','/product-detail','/order-success','/profile','/help','/contact'
          ,'/auth/success','/auth/error', '/review-order'
        ];

        // 2️⃣ Các trang KHÔNG có header/footer
        const hiddenLayoutPages = ['/login', '/register','/admin'];

        // Nếu URL khớp hiddenLayoutPages → ẩn layout
        this.showLayout = !hiddenLayoutPages.some(path => currentUrl.startsWith(path));

        // Nếu vẫn hiển thị layout → xác định kiểu header/footer
        if (this.showLayout) {
          this.isHomePage = !shopPages.some(path => currentUrl.startsWith(path));
        }
      });
  }
}
