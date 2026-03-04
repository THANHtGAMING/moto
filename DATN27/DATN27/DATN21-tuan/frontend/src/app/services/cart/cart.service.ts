import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of, forkJoin, switchMap, throwError } from 'rxjs';
import { Cart, CartResponse, CartUserInfo, CartItem, getCartItemProduct, Coupon } from '../../models/cart';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../product.service';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://localhost:8000';
  private cartUrl = `${this.baseUrl}/api/cart`;
  private readonly GUEST_CART_KEY = 'guest_cart';

  // BehaviorSubject to share cart state across components
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  // Cart count observable for header
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private productService: ProductService
  ) {
    // Initialize cart on service creation
    this.refreshCart();
  }

  // Get HTTP options with credentials for cookie-based auth
  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Update cart state and count
  private updateCartState(cart: Cart | null): void {
    this.cartSubject.next(cart);
    if (cart && cart.products) {
      const count = cart.products.reduce((sum, item) => sum + item.quantity, 0);
      this.cartCountSubject.next(count);
    } else {
      this.cartCountSubject.next(0);
    }
  }

  // ============ GUEST CART (LOCALSTORAGE) METHODS ============

  /**
   * Check if user is logged in
   */
  private isLoggedIn(): boolean {
    return !!this.authService.checkLogin();
  }

  /**
   * Get guest cart from localStorage
   */
  private getGuestCart(): Cart | null {
    try {
      const guestCartData = localStorage.getItem(this.GUEST_CART_KEY);
      if (guestCartData) {
        return JSON.parse(guestCartData) as Cart;
      }
    } catch (error) {
      console.error('Error reading guest cart from localStorage:', error);
      localStorage.removeItem(this.GUEST_CART_KEY);
    }
    return null;
  }

  /**
   * Save guest cart to localStorage
   */
  private saveGuestCart(cart: Cart | null): void {
    try {
      if (cart && cart.products && cart.products.length > 0) {
        localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
      } else {
        localStorage.removeItem(this.GUEST_CART_KEY);
      }
    } catch (error) {
      console.error('Error saving guest cart to localStorage:', error);
    }
  }

  /**
   * Clear guest cart from localStorage
   */
  private clearGuestCart(): void {
    localStorage.removeItem(this.GUEST_CART_KEY);
  }

  /**
   * Calculate total price and final price for guest cart
   * If coupon is applied, re-apply it
   */
  private calculateGuestCartTotals(cart: Cart, appliedCoupon?: Coupon): void {
    let totalPrice = 0;

    cart.products.forEach(item => {
      const product = getCartItemProduct(item);
      if (product) {
        // Calculate item price with discount
        const itemPrice = product.discountProduct && product.discountProduct > 0
          ? product.priceProduct * (1 - product.discountProduct / 100)
          : product.priceProduct;
        totalPrice += itemPrice * item.quantity;
      }
    });

    cart.totalPrice = totalPrice;

    // Calculate final price with coupon if applied
    if (cart.couponId && appliedCoupon) {
      this.applyCouponDiscountToGuestCart(cart, appliedCoupon);
    } else {
      cart.finalPrice = totalPrice;
    }
  }

  /**
   * Apply coupon discount to guest cart total
   */
  private applyCouponDiscountToGuestCart(cart: Cart, coupon: Coupon): void {
    if (cart.totalPrice < coupon.minOrderValue) {
      cart.finalPrice = cart.totalPrice; // No discount if not eligible
      return;
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      // Percentage discount
      discountAmount = cart.totalPrice * (coupon.value / 100);
    } else {
      // FIXED_AMOUNT discount
      discountAmount = Math.min(coupon.value, cart.totalPrice);
    }

    // Ensure discount doesn't exceed total price
    discountAmount = Math.min(discountAmount, cart.totalPrice);
    cart.finalPrice = Math.max(0, cart.totalPrice - discountAmount);
  }

  /**
   * Load available coupons for guest cart (public endpoint)
   * @param totalPrice - Optional cart total price to calculate eligibility
   */
  loadAvailableCouponsForGuest(totalPrice?: number): Observable<Coupon[]> {
    const params: any = {};
    if (totalPrice !== undefined && totalPrice !== null) {
      params.totalPrice = totalPrice.toString();
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/api/coupon/available${queryString ? '?' + queryString : ''}`;

    return this.httpClient.get<any>(url, { withCredentials: true }).pipe(
      map((res: any) => {
        const coupons = res?.metadata || res || [];
        return coupons as Coupon[];
      }),
      catchError((error) => {
        console.error('Error loading available coupons:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetch product details for guest cart items that only have productId as string
   */
  private fetchProductDetailsForGuestCart(cart: Cart): Observable<Cart> {
    const itemsNeedingDetails = cart.products.filter(item => typeof item.productId === 'string');

    if (itemsNeedingDetails.length === 0) {
      return of(cart);
    }

    const productFetchRequests = itemsNeedingDetails.map(item => {
      const productId = item.productId as string;
      return this.productService.getProductDetail(productId).pipe(
        map((product: Product) => ({
          item,
          product
        })),
        catchError(err => {
          console.error(`Error fetching product ${productId}:`, err);
          return of({ item, product: null });
        })
      );
    });

    return forkJoin(productFetchRequests).pipe(
      map((results: any[]) => {
        results.forEach(({ item, product }) => {
          if (product) {
            // Update item with product details
            const itemIndex = cart.products.findIndex(
              i => typeof i.productId === 'string' && i.productId === (product as Product)._id
            );
            if (itemIndex >= 0) {
              cart.products[itemIndex].productId = product;
            }
          }
        });
        return cart;
      })
    );
  }

  /**
   * GET /api/cart/get - Get current user's cart
   * For guests, return cart from localStorage with product details and coupons
   */
  getCart(): Observable<CartResponse> {
    this.loadingSubject.next(true);

    // If not logged in, return guest cart from localStorage
    if (!this.isLoggedIn()) {
      let guestCart = this.getGuestCart() || { products: [], totalPrice: 0, finalPrice: 0, couponId: null };

      // Fetch product details for items that only have productId as string
      return this.fetchProductDetailsForGuestCart(guestCart).pipe(
        switchMap((cartWithProducts) => {
          // Recalculate totals
          this.calculateGuestCartTotals(cartWithProducts);

          // If coupon is applied, re-apply it
          if (cartWithProducts.couponId) {
            // We'll handle coupon loading separately
          }

          // Re-apply coupon if exists
          let couponRemoved = false;
          let couponRemovedReason: string | null = null;

          // Load available coupons for guest
          return this.loadAvailableCouponsForGuest(cartWithProducts.totalPrice).pipe(
            map((coupons: Coupon[]) => {
              // Re-apply coupon if cart has couponId
              if (cartWithProducts.couponId) {
                const appliedCoupon = coupons.find(c => c._id === cartWithProducts.couponId);
                if (appliedCoupon) {
                  // Re-check eligibility
                  if (cartWithProducts.totalPrice >= appliedCoupon.minOrderValue) {
                    this.applyCouponDiscountToGuestCart(cartWithProducts, appliedCoupon);
                  } else {
                    // Not eligible anymore, remove coupon
                    cartWithProducts.couponId = null;
                    cartWithProducts.finalPrice = cartWithProducts.totalPrice;
                    couponRemoved = true;
                    couponRemovedReason = `Đơn hàng không đủ điều kiện (tối thiểu ${appliedCoupon.minOrderValue.toLocaleString('vi-VN')}đ)`;
                  }
                } else {
                  // Coupon not found, remove it
                  cartWithProducts.couponId = null;
                  cartWithProducts.finalPrice = cartWithProducts.totalPrice;
                  couponRemoved = true;
                  couponRemovedReason = 'Mã giảm giá không còn hiệu lực';
                }
              }

              // Save updated cart
              this.saveGuestCart(cartWithProducts);
              this.updateCartState(cartWithProducts);

              const response: CartResponse = {
                cart: cartWithProducts,
                coupons: coupons
              };
              this.loadingSubject.next(false);
              return response;
            })
          );
        }),
        catchError((error) => {
          console.error('Error loading guest cart:', error);
          this.loadingSubject.next(false);
          const response: CartResponse = {
            cart: guestCart,
            coupons: []
          };
          return of(response);
        })
      );
    }

    // Logged in user - get from server
    return this.httpClient.get<any>(`${this.cartUrl}/get`, this.getHttpOptions()).pipe(
      map((res: any) => {
        const data = res?.metadata || res;
        return data as CartResponse;
      }),
      tap((response: CartResponse) => {
        this.updateCartState(response.cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error fetching cart:', error);
        this.loadingSubject.next(false);
        this.updateCartState(null);
        throw error;
      })
    );
  }

  /**
   * Refresh cart from server and update local state
   * For guests, load from localStorage
   */
  refreshCart(): void {
    if (this.isLoggedIn()) {
      // Logged in user - get from server
      this.getCart().subscribe({
        next: () => {},
        error: (err) => {
          console.log('Could not fetch cart:', err?.error?.message || 'Not logged in');
        }
      });
    } else {
      // Guest user - get from localStorage
      const guestCart = this.getGuestCart();
      if (guestCart) {
        this.updateCartState(guestCart);
      } else {
        this.updateCartState(null);
      }
    }
  }

  /**
   * POST /api/cart/create - Add product to cart
   * For guests, add to localStorage
   * @param productId - Product ID
   * @param quantity - Quantity to add
   * @param size - Size (null if product has no sizes)
   */
  addToCart(productId: string, quantity: number, size: string | null = null): Observable<any> {
    this.loadingSubject.next(true);

    // If not logged in, add to guest cart (localStorage)
    if (!this.isLoggedIn()) {
      return this.addToGuestCart(productId, quantity, size);
    }

    // Logged in user - add to server cart
    const body = { productId, quantity, size };

    return this.httpClient.post<any>(`${this.cartUrl}/create`, body, this.getHttpOptions()).pipe(
      map((res: any) => {
        const metadata = res?.metadata || res;
        // Return full response including couponRemoved
        return {
          cart: metadata.cart || metadata,
          couponRemoved: metadata.couponRemoved || false,
          couponRemovedReason: metadata.couponRemovedReason || null
        };
      }),
      tap((response: any) => {
        this.updateCartState(response.cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error adding to cart:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Add product to guest cart (localStorage)
   * Fetches product details and stores them
   */
  private addToGuestCart(productId: string, quantity: number, size: string | null = null): Observable<any> {
    // Fetch product details first
    return this.productService.getProductDetail(productId).pipe(
      switchMap((product: Product) => {
        try {
          const guestCart = this.getGuestCart() || { products: [], totalPrice: 0, finalPrice: 0, couponId: null };

          // Normalize size for comparison
          const normalizeSize = (s: string | null) => s ? s.trim().toUpperCase() : null;
          const normalizedSize = normalizeSize(size);

          // Check if product already exists in cart
          const existingItemIndex = guestCart.products.findIndex(item => {
            const itemProductId = typeof item.productId === 'string' ? item.productId : (item.productId as Product)?._id;
            return itemProductId === productId && normalizeSize(item.size) === normalizedSize;
          });

          if (existingItemIndex >= 0) {
            // Update quantity
            guestCart.products[existingItemIndex].quantity += quantity;
          } else {
            // Add new item with product details
            guestCart.products.push({
              productId: product, // Store full product object
              size: size,
              quantity: quantity
            });
          }

          // Recalculate cart totals
          this.calculateGuestCartTotals(guestCart);

          // Re-apply coupon if exists (async, will update later)
          if (guestCart.couponId) {
            this.loadAvailableCouponsForGuest(guestCart.totalPrice).subscribe({
              next: (coupons) => {
                this.reapplyCouponToGuestCart(guestCart, coupons);
                this.saveGuestCart(guestCart);
                this.updateCartState(guestCart);
              }
            });
          }

          // Save to localStorage
          this.saveGuestCart(guestCart);
          this.updateCartState(guestCart);
          this.loadingSubject.next(false);

          return of({
            cart: guestCart,
            couponRemoved: false,
            couponRemovedReason: null
          });
        } catch (error) {
          console.error('Error adding to guest cart:', error);
          this.loadingSubject.next(false);
          return of({ cart: null, couponRemoved: false });
        }
      }),
      catchError((error) => {
        console.error('Error fetching product details for guest cart:', error);
        this.loadingSubject.next(false);
        return of({ cart: null, couponRemoved: false });
      })
    );
  }

  /**
   * PUT /api/cart/update - Update product quantity in cart
   * For guests, update in localStorage
   * @param productId - Product ID
   * @param newQuantity - New quantity
   * @param size - Size (null if product has no sizes)
   * @returns Observable with cart and couponRemoved info
   */
  updateCart(productId: string, newQuantity: number, size: string | null = null): Observable<any> {
    this.loadingSubject.next(true);

    // If not logged in, update guest cart
    if (!this.isLoggedIn()) {
      return this.updateGuestCart(productId, newQuantity, size);
    }

    // Logged in user - update server cart
    const body = { productId, newQuantity, size };

    return this.httpClient.put<any>(`${this.cartUrl}/update`, body, this.getHttpOptions()).pipe(
      map((res: any) => {
        const metadata = res?.metadata || res;
        // Return full response including couponRemoved
        return {
          cart: metadata.cart || metadata,
          couponRemoved: metadata.couponRemoved || false,
          couponRemovedReason: metadata.couponRemovedReason || null
        };
      }),
      tap((response: any) => {
        this.updateCartState(response.cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error updating cart:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Re-apply coupon to guest cart if couponId exists
   */
  private reapplyCouponToGuestCart(cart: Cart, coupons: Coupon[]): void {
    if (!cart.couponId) return;

    const appliedCoupon = coupons.find(c => c._id === cart.couponId);
    if (appliedCoupon) {
      // Re-check eligibility
      if (cart.totalPrice >= appliedCoupon.minOrderValue) {
        this.applyCouponDiscountToGuestCart(cart, appliedCoupon);
      } else {
        // Not eligible anymore, remove coupon
        cart.couponId = null;
        cart.finalPrice = cart.totalPrice;
      }
    } else {
      // Coupon not found, remove it
      cart.couponId = null;
      cart.finalPrice = cart.totalPrice;
    }
  }

  /**
   * Update product quantity in guest cart
   */
  private updateGuestCart(productId: string, newQuantity: number, size: string | null = null): Observable<any> {
    try {
      const guestCart = this.getGuestCart();
      if (!guestCart) {
        this.loadingSubject.next(false);
        return of({ cart: null, couponRemoved: false });
      }

      const normalizeSize = (s: string | null) => s ? s.trim().toUpperCase() : null;
      const normalizedSize = normalizeSize(size);

      const itemIndex = guestCart.products.findIndex(item => {
        const itemProductId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id;
        return itemProductId === productId && normalizeSize(item.size) === normalizedSize;
      });

      if (itemIndex >= 0) {
        if (newQuantity <= 0) {
          // Remove item if quantity is 0 or less
          guestCart.products.splice(itemIndex, 1);
        } else {
          guestCart.products[itemIndex].quantity = newQuantity;
        }
      }

      // Recalculate totals
      this.calculateGuestCartTotals(guestCart);

      // Re-apply coupon if exists (async, will update later)
      if (guestCart.couponId) {
        this.loadAvailableCouponsForGuest(guestCart.totalPrice).subscribe({
          next: (coupons) => {
            this.reapplyCouponToGuestCart(guestCart, coupons);
            this.saveGuestCart(guestCart);
            this.updateCartState(guestCart);
          }
        });
      }

      this.saveGuestCart(guestCart);
      this.updateCartState(guestCart);
      this.loadingSubject.next(false);

      return of({
        cart: guestCart,
        couponRemoved: false,
        couponRemovedReason: null
      });
    } catch (error) {
      console.error('Error updating guest cart:', error);
      this.loadingSubject.next(false);
      return of({ cart: null, couponRemoved: false });
    }
  }

  /**
   * DELETE /api/cart/delete/:productId - Remove product from cart
   * For guests, remove from localStorage
   * Note: Uses httpClient.request for DELETE with body
   * @param productId - Product ID
   * @param size - Size (null if product has no sizes)
   * @returns Observable with cart and couponRemoved info
   */
  deleteProduct(productId: string, size: string | null = null): Observable<any> {
    this.loadingSubject.next(true);

    // If not logged in, remove from guest cart
    if (!this.isLoggedIn()) {
      return this.deleteFromGuestCart(productId, size);
    }

    // Logged in user - remove from server cart
    const options = {
      ...this.getHttpOptions(),
      body: { size }
    };

    return this.httpClient.request<any>('DELETE', `${this.cartUrl}/delete/${productId}`, options).pipe(
      map((res: any) => {
        const metadata = res?.metadata || res;
        // Return full response including couponRemoved
        return {
          cart: metadata.cart || metadata,
          couponRemoved: metadata.couponRemoved || false,
          couponRemovedReason: metadata.couponRemovedReason || null
        };
      }),
      tap((response: any) => {
        this.updateCartState(response.cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error removing from cart:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Delete product from guest cart
   */
  private deleteFromGuestCart(productId: string, size: string | null = null): Observable<any> {
    try {
      const guestCart = this.getGuestCart();
      if (!guestCart) {
        this.loadingSubject.next(false);
        return of({ cart: null, couponRemoved: false });
      }

      const normalizeSize = (s: string | null) => s ? s.trim().toUpperCase() : null;
      const normalizedSize = normalizeSize(size);

      guestCart.products = guestCart.products.filter(item => {
        const itemProductId = typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id;
        const itemSize = normalizeSize(item.size);
        return !(itemProductId === productId && itemSize === normalizedSize);
      });

      // Recalculate totals
      this.calculateGuestCartTotals(guestCart);

      // Re-apply coupon if exists (async, will update later)
      let couponRemoved = false;
      let couponRemovedReason: string | null = null;

      if (guestCart.couponId) {
        this.loadAvailableCouponsForGuest(guestCart.totalPrice).subscribe({
          next: (coupons) => {
            this.reapplyCouponToGuestCart(guestCart, coupons);
            if (!guestCart.couponId) {
              couponRemoved = true;
              couponRemovedReason = 'Mã giảm giá không còn hợp lệ';
            }
            this.saveGuestCart(guestCart);
            this.updateCartState(guestCart);
          }
        });
      }

      this.saveGuestCart(guestCart);
      this.updateCartState(guestCart);
      this.loadingSubject.next(false);

      return of({
        cart: guestCart,
        couponRemoved: couponRemoved,
        couponRemovedReason: couponRemovedReason
      });
    } catch (error) {
      console.error('Error deleting from guest cart:', error);
      this.loadingSubject.next(false);
      return of({ cart: null, couponRemoved: false });
    }
  }

  /**
   * PUT /api/cart/apply-coupon - Apply coupon to cart
   * For guests, apply coupon locally
   * @param couponId - Coupon ID to apply (or coupon object for guests)
   */
  applyCoupon(couponId: string | Coupon): Observable<Cart> {
    this.loadingSubject.next(true);

    // If not logged in, apply coupon to guest cart
    if (!this.isLoggedIn()) {
      return this.applyCouponToGuestCart(couponId as Coupon);
    }

    // Logged in user - apply via API
    const couponIdValue = typeof couponId === 'string' ? couponId : (couponId as Coupon)._id;
    const body = { couponId: couponIdValue };

    return this.httpClient.put<any>(`${this.cartUrl}/apply-coupon`, body, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap((cart: Cart) => {
        this.updateCartState(cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error applying coupon:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Apply coupon to guest cart
   */
  private applyCouponToGuestCart(coupon: Coupon): Observable<Cart> {
    try {
      const guestCart = this.getGuestCart();
      if (!guestCart) {
        this.loadingSubject.next(false);
        return of({ products: [], totalPrice: 0, finalPrice: 0, couponId: null });
      }

      // Recalculate total first
      this.calculateGuestCartTotals(guestCart);

      // Check if eligible
      if (guestCart.totalPrice < coupon.minOrderValue) {
        this.loadingSubject.next(false);
        throw new Error(`Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`);
      }

      // Apply coupon discount
      guestCart.couponId = coupon._id;
      this.applyCouponDiscountToGuestCart(guestCart, coupon);

      // Save to localStorage
      this.saveGuestCart(guestCart);
      this.updateCartState(guestCart);
      this.loadingSubject.next(false);

      return of(guestCart);
    } catch (error: any) {
      console.error('Error applying coupon to guest cart:', error);
      this.loadingSubject.next(false);
      return throwError(() => error);
    }
  }

  /**
   * Remove coupon from cart (set couponId to null)
   * For guests, remove locally
   */
  removeCoupon(): Observable<Cart> {
    this.loadingSubject.next(true);

    // If not logged in, remove coupon from guest cart
    if (!this.isLoggedIn()) {
      try {
        const guestCart = this.getGuestCart();
        if (!guestCart) {
          this.loadingSubject.next(false);
          return of({ products: [], totalPrice: 0, finalPrice: 0, couponId: null });
        }

        guestCart.couponId = null;
        // Recalculate totals without coupon
        this.calculateGuestCartTotals(guestCart);

        // Save to localStorage
        this.saveGuestCart(guestCart);
        this.updateCartState(guestCart);
        this.loadingSubject.next(false);

        return of(guestCart);
      } catch (error) {
        console.error('Error removing coupon from guest cart:', error);
        this.loadingSubject.next(false);
        return throwError(() => error);
      }
    }

    // Logged in user - remove via API
    const body = { couponId: null };

    return this.httpClient.put<any>(`${this.cartUrl}/apply-coupon`, body, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap((cart: Cart) => {
        this.updateCartState(cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error removing coupon:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * POST /api/cart/update-info - Update user info in cart
   * @param info - User info (fullName, phoneNumber, address, email)
   */
  updateInfo(info: CartUserInfo): Observable<Cart> {
    this.loadingSubject.next(true);

    return this.httpClient.post<any>(`${this.cartUrl}/update-info`, info, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap((cart: Cart) => {
        this.updateCartState(cart);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error updating cart info:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Clear local cart state (e.g., after logout)
   * Also clears guest cart from localStorage
   */
  clearLocalCart(): void {
    this.clearGuestCart();
    this.updateCartState(null);
  }

  /**
   * Merge guest cart into server cart when user logs in
   * This should be called after successful login
   */
  mergeGuestCartToServer(): Observable<any> {
    const guestCart = this.getGuestCart();
    if (!guestCart || !guestCart.products || guestCart.products.length === 0) {
      // No guest cart to merge, just refresh server cart
      return this.getCart().pipe(
        catchError(() => of(null))
      );
    }

    if (!this.isLoggedIn()) {
      // Not logged in yet, return empty
      return of(null);
    }

    // Merge all items from guest cart to server cart
    const mergeRequests: Observable<any>[] = [];

    guestCart.products.forEach(item => {
      const productId = typeof item.productId === 'string' ? item.productId : (item.productId as any)._id;
      mergeRequests.push(
        this.httpClient.post<any>(
          `${this.cartUrl}/create`,
          { productId, quantity: item.quantity, size: item.size },
          this.getHttpOptions()
        ).pipe(
          catchError(err => {
            console.error(`Error merging item ${productId} to cart:`, err);
            return of(null);
          })
        )
      );
    });

    // Execute all merge requests
    return forkJoin(mergeRequests).pipe(
      tap(() => {
        // Clear guest cart after successful merge
        this.clearGuestCart();
        // Refresh server cart
        this.refreshCart();
      }),
      catchError(err => {
        console.error('Error merging guest cart:', err);
        return of(null);
      })
    );
  }

  /**
   * Get current cart value synchronously
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.getValue();
  }

  /**
   * Get current cart count synchronously
   */
  getCartCount(): number {
    return this.cartCountSubject.getValue();
  }

  // ============ HELPER METHODS FOR UI ============

  /**
   * Calculate item subtotal (with discount applied)
   */
  calculateItemSubtotal(item: CartItem): number {
    const product = getCartItemProduct(item);
    if (!product) return 0;

    const price = product.discountProduct && product.discountProduct > 0
      ? product.priceProduct * (1 - product.discountProduct / 100)
      : product.priceProduct;

    return price * item.quantity;
  }

  /**
   * Get discounted price for a product
   */
  getDiscountedPrice(priceProduct: number, discountProduct?: number): number {
    if (discountProduct && discountProduct > 0) {
      return priceProduct * (1 - discountProduct / 100);
    }
    return priceProduct;
  }

  /**
   * Format price to Vietnamese đồng
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + ' đ';
  }
}
