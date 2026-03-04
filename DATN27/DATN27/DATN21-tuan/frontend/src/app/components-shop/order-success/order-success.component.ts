import { Component } from '@angular/core';
import { CommonModule, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart/cart.service';
import { CartItem, getCartItemProduct } from '../../models/cart';

@Component({
  selector: 'app-order-success',
  standalone: true,
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css'],
  imports: [NgIf, NgFor, DecimalPipe, RouterLink,CommonModule]
})
export class OrderSuccessComponent {

  paymentMethod: string = '';
  order: any;
  cartItems: any[] = [];

  constructor(
    private router: Router,
    private cartService: CartService
  ) {
    // Lấy dữ liệu từ state khi navigate từ payment
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    // ưu tiên state → nếu không có thì lấy từ localStorage
    this.paymentMethod = state?.['paymentMethod'] || localStorage.getItem("lastPaymentMethod") || 'COD';
    this.order = state?.['order'] || JSON.parse(localStorage.getItem("orderSuccess") || "null");
    if (!this.order) {
      this.router.navigate(['/store']);
      return;
    }
    this.loadCartItems();
    localStorage.setItem("lastPaymentMethod", this.paymentMethod);
  }
  private loadCartItems() {
    const currentCart = this.cartService.getCurrentCart();
    if (currentCart && currentCart.products) {
      this.cartItems = currentCart.products.map(item => {
        const product = getCartItemProduct(item);
        return {
          _id: product?._id || '',
          name: product?.nameProduct || 'Sản phẩm',
          price: product?.priceProduct || 0,
          image: product?.imagesProduct?.[0] || '',
          size: item.size,
          quantity: item.quantity
        };
      });
    }
    this.cartService.clearLocalCart();
  }
}
