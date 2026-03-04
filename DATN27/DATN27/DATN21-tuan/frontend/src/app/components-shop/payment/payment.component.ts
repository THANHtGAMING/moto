import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService, CheckoutPayload } from '../../services/order/order.service';
import { CartService } from '../../services/cart/cart.service';
import { UserService, User, Address } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { Cart, Coupon, getCartItemProduct } from '../../models/cart';

@Component({
  standalone: true,
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class PaymentComponent implements OnInit {
  // User & Addresses
  user: User | null = null;
  addresses: Address[] = [];
  selectedAddress: Address | null = null;

  // Cart
  cart: Cart | null = null;
  cartItems: any[] = [];
  coupons: Coupon[] = [];
  availableCoupons: Coupon[] = [];

  // Coupon states
  couponCode: string = '';
  isApplyingCoupon = false;
  showCouponInput = false;
  selectedCoupon: Coupon | null = null;

  // UI States
  isLoading = true;
  isSubmitting = false;
  showAddAddressModal = false;
  paymentMethod: 'cod' | 'vnpay' | 'momo' = 'cod';

  // Add Address Form
  addressForm: FormGroup;

  // Error/Success messages
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.addressForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      recipientName: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      fullAddress: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(150)]],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Check if user is logged in
    if (!this.authService.checkLogin()) {
      this.errorMessage = 'Vui lòng đăng nhập để tiếp tục thanh toán';
      setTimeout(() => {
        // Store current route to redirect back after login
        localStorage.setItem('redirectAfterLogin', '/payment');
        this.router.navigate(['/login']);
      }, 2000);
      this.isLoading = false;
      return;
    }

    try {
      // Merge guest cart to server cart if exists (before loading cart)
      this.cartService.mergeGuestCartToServer().subscribe({
        next: () => {
          console.log('Guest cart merged before checkout');
        },
        error: (err) => {
          console.error('Error merging guest cart:', err);
        }
      });

      // Load user with addresses
      this.userService.getAuth().subscribe({
        next: (user) => {
          this.user = user;
          this.addresses = user.addresses || [];

          // Select default address or first one
          this.selectedAddress = this.addresses.find(a => a.isDefault) || this.addresses[0] || null;

          // If no addresses, show modal
          if (this.addresses.length === 0) {
            this.showAddAddressModal = true;
          }
        },
        error: (err) => {
          console.error('Error loading user:', err);
          this.errorMessage = 'Vui lòng đăng nhập để tiếp tục thanh toán';
          setTimeout(() => {
            localStorage.setItem('redirectAfterLogin', '/payment');
            this.router.navigate(['/login']);
          }, 2000);
        }
      });

      // Load cart
      this.cartService.getCart().subscribe({
        next: (response) => {
          this.cart = response.cart;
          this.coupons = response.coupons || [];

          if (!this.cart || !this.cart.products || this.cart.products.length === 0) {
            this.errorMessage = 'Giỏ hàng trống! Đang chuyển về trang giỏ hàng...';
            setTimeout(() => this.router.navigate(['/cart']), 2000);
            return;
          }

          // Filter available coupons (eligible ones)
          this.availableCoupons = this.coupons.filter(c => c.isEligible);

          // Map cart items for display
          this.cartItems = this.cart.products.map(item => {
            const product = getCartItemProduct(item);
            const originalPrice = product?.priceProduct || 0;
            const discount = product?.discountProduct || 0;
            const discountedPrice = originalPrice * (1 - discount / 100);

            return {
              _id: product?._id || '',
              name: product?.nameProduct || 'Sản phẩm',
              originalPrice,
              price: discountedPrice,
              discount,
              image: product?.imagesProduct?.[0] || '',
              size: item.size,
              quantity: item.quantity
            };
          });

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading cart:', err);
          this.errorMessage = 'Không thể tải giỏ hàng. Vui lòng thử lại.';
          this.isLoading = false;
        }
      });
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }

  // Address Selection
  selectAddress(address: Address) {
    this.selectedAddress = address;
  }

  // Open Add Address Modal
  openAddAddressModal() {
    this.addressForm.reset({ isDefault: this.addresses.length === 0 });
    this.showAddAddressModal = true;
  }

  // Close Add Address Modal
  closeAddAddressModal() {
    this.showAddAddressModal = false;
    this.addressForm.reset();
  }

  // Submit Add Address
  submitAddAddress() {
    if (this.addressForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin địa chỉ';
      return;
    }

    const addressData = this.addressForm.value;

    this.userService.addAddress(addressData).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        // Select the new address (last one or default one)
        this.selectedAddress = addresses.find(a => a.isDefault) || addresses[addresses.length - 1];
        this.closeAddAddressModal();
        this.successMessage = 'Thêm địa chỉ thành công!';
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Error adding address:', err);
        this.errorMessage = err?.error?.message || 'Không thể thêm địa chỉ. Vui lòng thử lại.';
      }
    });
  }

  // Set Default Address
  setDefaultAddress(address: Address) {
    if (!address._id) return;

    this.userService.setDefaultAddress(address._id).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.selectedAddress = addresses.find(a => a.isDefault) || address;
        this.successMessage = 'Đã đặt làm địa chỉ mặc định';
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Error setting default address:', err);
        this.errorMessage = 'Không thể đặt địa chỉ mặc định';
      }
    });
  }

  // Delete Address
  deleteAddress(address: Address) {
    if (!address._id) return;
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    this.userService.deleteAddress(address._id).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        if (this.selectedAddress?._id === address._id) {
          this.selectedAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
        }
        this.successMessage = 'Đã xóa địa chỉ';
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Error deleting address:', err);
        this.errorMessage = 'Không thể xóa địa chỉ';
      }
    });
  }

  // Checkout
  onCheckout() {
    if (!this.selectedAddress) {
      this.errorMessage = 'Vui lòng chọn địa chỉ giao hàng';
      return;
    }

    if (!this.cart || this.cart.products.length === 0) {
      this.errorMessage = 'Giỏ hàng trống';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const payload: CheckoutPayload = {
      paymentMethod: this.paymentMethod,
      shippingAddress: {
        fullName: this.selectedAddress.recipientName,
        phoneNumber: this.selectedAddress.phoneNumber,
        address: this.selectedAddress.fullAddress,
        email: this.user?.email
      }
    };

    this.orderService.checkout(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        // Handle payment gateway redirect
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
          return;
        }

        // COD - redirect to success page
        this.router.navigate(['/order-success'], {
          state: {
            paymentMethod: this.paymentMethod,
            order: response.order || response
          }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Checkout error:', err);
        this.errorMessage = err?.error?.message || 'Lỗi thanh toán. Vui lòng thử lại.';
      }
    });
  }

  // Helpers
  get totalPrice(): number {
    return this.cart?.totalPrice || 0;
  }

  get finalPrice(): number {
    return this.cart?.finalPrice || this.cart?.totalPrice || 0;
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

  // Format coupon discount display
  getCouponDiscountText(coupon: Coupon): string {
    if (coupon.type === 'PERCENTAGE') {
      return `Giảm ${coupon.value}%`;
    } else {
      return `Giảm ${coupon.value.toLocaleString('vi-VN')}đ`;
    }
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  clearMessagesAfterDelay() {
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  // ============ COUPON METHODS ============

  toggleCouponInput() {
    this.showCouponInput = !this.showCouponInput;
    if (!this.showCouponInput) {
      this.couponCode = '';
      this.selectedCoupon = null;
    }
  }

  selectCoupon(coupon: Coupon) {
    if (!coupon.isEligible) return;
    this.selectedCoupon = coupon;
    this.couponCode = coupon.code;
  }

  applyCoupon() {
    if (!this.selectedCoupon && !this.couponCode.trim()) {
      this.errorMessage = 'Vui lòng chọn hoặc nhập mã giảm giá';
      return;
    }

    const couponId = this.selectedCoupon?._id || this.findCouponByCode(this.couponCode.trim().toUpperCase())?._id;

    if (!couponId) {
      this.errorMessage = 'Mã giảm giá không hợp lệ';
      return;
    }

    this.isApplyingCoupon = true;
    this.errorMessage = null;

    this.cartService.applyCoupon(couponId).subscribe({
      next: (cart) => {
        this.isApplyingCoupon = false;
        this.cart = cart;
        this.successMessage = 'Đã áp dụng mã giảm giá thành công!';
        this.couponCode = '';
        this.selectedCoupon = null;
        this.showCouponInput = false;

        // Reload cart to get updated coupons
        this.cartService.getCart().subscribe({
          next: (response) => {
            this.coupons = response.coupons || [];
            this.availableCoupons = this.coupons.filter(c => c.isEligible);
          }
        });

        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.errorMessage = err?.error?.message || 'Không thể áp dụng mã giảm giá';
      }
    });
  }

  removeCoupon() {
    if (!this.hasAppliedCoupon) return;

    this.isApplyingCoupon = true;
    this.errorMessage = null;

    this.cartService.removeCoupon().subscribe({
      next: (cart) => {
        this.isApplyingCoupon = false;
        this.cart = cart;
        this.successMessage = 'Đã xóa mã giảm giá';

        // Reload cart to get updated coupons
        this.cartService.getCart().subscribe({
          next: (response) => {
            this.coupons = response.coupons || [];
            this.availableCoupons = this.coupons.filter(c => c.isEligible);
          }
        });

        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.errorMessage = err?.error?.message || 'Không thể xóa mã giảm giá';
      }
    });
  }

  findCouponByCode(code: string): Coupon | null {
    return this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  }

  onCouponCodeInput() {
    // Auto-select coupon if code matches
    const matchedCoupon = this.findCouponByCode(this.couponCode.trim().toUpperCase());
    if (matchedCoupon && matchedCoupon.isEligible) {
      this.selectedCoupon = matchedCoupon;
    } else {
      this.selectedCoupon = null;
    }
  }

  // Chỉ cho phép nhập số vào số điện thoại
  onPhoneNumberKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Chỉ cho phép số (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Xử lý paste và các trường hợp khác
  onPhoneNumberInput(event: any) {
    const value = event.target.value;
    // Chỉ giữ lại số
    const numericValue = value.replace(/[^0-9]/g, '');
    if (value !== numericValue) {
      this.addressForm.patchValue({ phoneNumber: numericValue });
    }
  }
}
