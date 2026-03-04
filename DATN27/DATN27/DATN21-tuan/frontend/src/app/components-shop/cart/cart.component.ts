import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart/cart.service';
import { Cart, CartItem, Coupon, getCartItemProduct, getAvailableStock, getCartItemProductId } from '../../models/cart';
import { Product } from '../../models/product';
import { getProductImage } from '../../utils/image.util';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  coupons: Coupon[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  couponApplying = false;

  // Coupon dropdown state
  showCouponDropdown = false;
  selectedCoupon: Coupon | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to cart state
    this.subscriptions.push(
      this.cartService.cart$.subscribe(cart => {
        this.cart = cart;
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.cartService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    // Load cart from server
    this.loadCart();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart() {
    this.clearMessages();
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart = response.cart;
        this.coupons = response.coupons || [];
        // Sort: eligible coupons first, then by value descending
        this.coupons.sort((a, b) => {
          if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
          return b.value - a.value;
        });
      },
      error: (err) => {
        console.error('Error loading cart:', err);
        this.errorMessage = err?.error?.message || 'Không thể tải giỏ hàng. Vui lòng đăng nhập.';
      }
    });
  }

  // ============ CART ITEM HELPERS ============

  getProduct(item: CartItem): Product | null {
    return getCartItemProduct(item);
  }

  getProductId(item: CartItem): string {
    return getCartItemProductId(item);
  }

  getProductImage(item: CartItem): string {
    const product = this.getProduct(item);
    return getProductImage(product?.imagesProduct);
  }

  getProductName(item: CartItem): string {
    const product = this.getProduct(item);
    return product?.nameProduct || 'Sản phẩm';
  }

  getProductPrice(item: CartItem): number {
    const product = this.getProduct(item);
    if (!product) return 0;
    return product.priceProduct;
  }

  getDiscountedPrice(item: CartItem): number {
    const product = this.getProduct(item);
    if (!product) return 0;
    return this.cartService.getDiscountedPrice(product.priceProduct, product.discountProduct);
  }

  hasDiscount(item: CartItem): boolean {
    const product = this.getProduct(item);
    return !!(product?.discountProduct && product.discountProduct > 0);
  }

  getItemSubtotal(item: CartItem): number {
    return this.getDiscountedPrice(item) * item.quantity;
  }

  getMaxQuantity(item: CartItem): number {
    return getAvailableStock(item);
  }

  // ============ QUANTITY CONTROLS ============

  getAvailableQuantities(item: CartItem): number[] {
    const max = Math.min(this.getMaxQuantity(item), 10);
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  updateQuantity(item: CartItem, newQuantity: number) {
    this.clearMessages();
    const quantity = Number(newQuantity);

    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }

    const productId = this.getProductId(item);
    this.cartService.updateCart(productId, quantity, item.size).subscribe({
      next: (response: any) => {
        const cart = response.cart || response;
        this.cart = cart;

        // Check if coupon was removed
        if (response.couponRemoved || response.couponRemovedReason) {
          const reason = response.couponRemovedReason || 'Đơn hàng không đủ điều kiện';
          this.errorMessage = `⚠️ Mã giảm giá đã bị huỷ: ${reason}`;
          setTimeout(() => this.errorMessage = null, 5000);
        } else {
          this.successMessage = 'Đã cập nhật số lượng';
          this.clearSuccessAfterDelay();
        }

        // Reload để cập nhật eligibility của coupons
        this.loadCart();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể cập nhật số lượng';
        this.loadCart();
      }
    });
  }

  incrementQuantity(item: CartItem) {
    const maxQty = this.getMaxQuantity(item);
    if (item.quantity < maxQty) {
      this.updateQuantity(item, item.quantity + 1);
    }
  }

  decrementQuantity(item: CartItem) {
    if (item.quantity > 1) {
      this.updateQuantity(item, item.quantity - 1);
    }
  }

  // ============ REMOVE ITEM ============

  removeItem(item: CartItem) {
    this.clearMessages();
    const productId = this.getProductId(item);

    this.cartService.deleteProduct(productId, item.size).subscribe({
      next: (response: any) => {
        const cart = response.cart || response;
        this.cart = cart;

        // Check if coupon was removed
        if (response.couponRemoved || response.couponRemovedReason) {
          const reason = response.couponRemovedReason || 'Đơn hàng không đủ điều kiện';
          this.errorMessage = `⚠️ Mã giảm giá đã bị huỷ: ${reason}`;
          setTimeout(() => this.errorMessage = null, 5000);
        } else {
          this.successMessage = 'Đã xóa sản phẩm khỏi giỏ hàng';
          this.clearSuccessAfterDelay();
        }

        // Reload để cập nhật eligibility của coupons
        this.loadCart();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể xóa sản phẩm';
      }
    });
  }

  // ============ COUPON ============

  toggleCouponDropdown() {
    this.showCouponDropdown = !this.showCouponDropdown;
  }

  closeCouponDropdown() {
    this.showCouponDropdown = false;
  }

  selectCoupon(coupon: Coupon) {
    if (!coupon.isEligible) return; // Don't allow selecting ineligible coupons
    this.selectedCoupon = coupon;
  }

  applyCoupon(couponId?: string, coupon?: Coupon) {
    // Nếu truyền coupon object, ưu tiên dùng nó (cho guest cart)
    // Nếu không, dùng couponId string (cho logged in user)
    const couponToApply = coupon || this.selectedCoupon;
    const id = couponId || couponToApply?._id;

    if (!id && !couponToApply) return;

    this.clearMessages();
    this.couponApplying = true;
    this.showCouponDropdown = false;

    // Truyền coupon object nếu có (cho guest), hoặc couponId string (cho logged in)
    const couponParam: string | Coupon = couponToApply || id!;

    this.cartService.applyCoupon(couponParam).subscribe({
      next: (cart) => {
        this.couponApplying = false;
        // Cập nhật cart ngay từ response
        this.cart = cart;
        this.successMessage = 'Đã áp dụng mã giảm giá thành công!';
        this.selectedCoupon = null;
        this.clearSuccessAfterDelay();
        // Reload để lấy coupons mới và cập nhật eligibility
        this.loadCart();
      },
      error: (err) => {
        this.couponApplying = false;
        this.errorMessage = err?.error?.message || err?.message || 'Không thể áp dụng mã giảm giá';
      }
    });
  }

  applySelectedCoupon() {
    if (this.selectedCoupon) {
      // Truyền coupon object để CartService có thể tính toán cho guest cart
      this.applyCoupon(undefined, this.selectedCoupon);
    }
  }

  // Format coupon discount display
  getCouponDiscountText(coupon: Coupon): string {
    if (coupon.type === 'PERCENTAGE') {
      return `Giảm ${coupon.value}%`;
    } else {
      return `Giảm ${coupon.value.toLocaleString('vi-VN')}đ`;
    }
  }

  // Get remaining amount text
  getRemainingAmountText(coupon: Coupon): string {
    if (coupon.isEligible) return '';
    return `Mua thêm ${Math.ceil(coupon.remainingAmount).toLocaleString('vi-VN')}đ`;
  }

  // Get eligible coupons count
  get eligibleCouponsCount(): number {
    return this.coupons.filter(c => c.isEligible).length;
  }

  // Get all coupons count
  get totalCouponsCount(): number {
    return this.coupons.length;
  }

  // ============ TOTALS ============

  get totalPrice(): number {
    return this.cart?.totalPrice || 0;
  }

  get finalPrice(): number {
    return this.cart?.finalPrice || 0;
  }

  get discountAmount(): number {
    return this.totalPrice - this.finalPrice;
  }

  get hasAppliedCoupon(): boolean {
    return !!(this.cart?.couponId);
  }

  // Get applied coupon info
  get appliedCoupon(): Coupon | null {
    if (!this.cart?.couponId) return null;
    return this.coupons.find(c => c._id === this.cart?.couponId) || null;
  }

  // Remove applied coupon
  removeAppliedCoupon() {
    if (!this.hasAppliedCoupon) return;

    this.clearMessages();
    this.cartService.removeCoupon().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.successMessage = 'Đã xóa mã giảm giá';
        this.clearSuccessAfterDelay();
        // Reload để cập nhật coupons eligibility
        this.loadCart();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể xóa mã giảm giá';
      }
    });
  }

  // ============ NAVIGATION ============

  goToPayment() {
    if (!this.cart || !this.cart.products || this.cart.products.length === 0) {
      this.errorMessage = 'Giỏ hàng trống!';
      return;
    }
    this.router.navigate(['/payment']);
  }

  // ============ HELPERS ============

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  clearSuccessAfterDelay() {
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  get isEmpty(): boolean {
    return !this.cart || !this.cart.products || this.cart.products.length === 0;
  }

  get cartItems(): CartItem[] {
    return this.cart?.products || [];
  }
}
