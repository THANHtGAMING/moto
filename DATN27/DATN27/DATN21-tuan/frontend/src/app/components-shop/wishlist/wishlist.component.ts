import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService, WishlistItem } from '../../services/wishlist/wishlist.service';
import { AuthService } from '../../services/auth/auth.service';
import { getProductImage } from '../../utils/image.util';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  isLogin = false;

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLogin = this.authService.checkLogin();
    if (this.isLogin) {
      this.loadWishlist();
    } else {
      this.errorMessage = 'Vui lòng đăng nhập để xem danh sách yêu thích';
    }
  }

  loadWishlist() {
    this.isLoading = true;
    this.errorMessage = null;

    this.wishlistService.getMyWishlist().subscribe({
      next: (items) => {
        this.wishlistItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không thể tải danh sách yêu thích';
        this.isLoading = false;
      }
    });
  }

  removeFromWishlist(productId: string) {
    this.wishlistService.toggleWishlist(productId).subscribe({
      next: () => {
        // Reload wishlist after removal
        this.loadWishlist();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không thể xóa khỏi danh sách yêu thích';
      }
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }

  getProductImage(images: string[] | null | undefined): string {
    return getProductImage(images);
  }

  calculateDiscountPrice(price: number, discount?: number): number {
    if (discount && discount > 0) {
      return price * (1 - discount / 100);
    }
    return price;
  }
}

