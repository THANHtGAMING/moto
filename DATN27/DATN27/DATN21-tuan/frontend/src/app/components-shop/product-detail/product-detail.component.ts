import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product, ProductSize, getDiscountedPrice, isProductInStock } from '../../models/product';
import { CartService } from '../../services/cart/cart.service';
import { ReviewService } from '../../services/review/review.service';
import { WishlistService } from '../../services/wishlist/wishlist.service';
import { AuthService } from '../../services/auth/auth.service';
import { Review } from '../../models/review';
import { RouterLink } from '@angular/router';
import { getImageUrl, getProductImage } from '../../utils/image.util';
import { NgIf } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  imports: [CommonModule, RouterModule, FormsModule,RouterLink,NgIf]
})
export class ProductDetailComponent implements OnInit {
  product!: Product;
  relatedProducts: Product[] = [];
  viewedProducts: Product[] = [];
  currentImageIndex = 0;
  selectedSize: ProductSize | null = null;
  selectedQuantity: number = 1;
  productImages: string[] = [];

  // UI states
  isAddingToCart = false;
  isBuyingNow = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Wishlist states
  isInWishlist = false;
  isTogglingWishlist = false;
  isLogin = false;
  isADM = false;

  // Review states
  reviews: Review[] = [];
  isLoadingReviews = false;
  showReviewForm = false;
  reviewRating = 5;
  reviewComment = '';
  reviewImages: File[] = [];
  isSubmittingReview = false;

  // Like/Dislike/Reply states
  currentUserId: string | null = null;
  replyingToReviewId: string | null = null;
  replyText: { [reviewId: string]: string } = {};
  isSubmittingReply: { [reviewId: string]: boolean } = {};
  isTogglingLike: { [reviewId: string]: boolean } = {};
  isTogglingDislike: { [reviewId: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private wishlistService: WishlistService,
    private authService: AuthService
  ) {
    this.isLogin = this.authService.checkLogin();
    this.isADM = this.authService.checkAdmin() !== false;
    if (this.isLogin) {
      this.authService.authUser().subscribe({
        next: (user: any) => {
          this.currentUserId = user?._id || null;
        }
      });
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Save current product to viewed products
      this.saveViewedProduct(id);
      
      this.productService.getProductDetail(id).subscribe({
        next: (data: any) => {
          this.product = data;
          // Process images through utility to ensure valid URLs
          this.productImages = (this.product.imagesProduct || []).map(img => getImageUrl(img)).filter(img => img !== '');

          // Load reviews
          this.loadReviews(id);

          // Load viewed products instead of related products
          this.loadViewedProducts(id);

          // Check if product is in wishlist (if user is logged in)
          if (this.isLogin && id) {
            this.checkWishlistStatus(id);
          }
        },
        error: (err) => {
          console.error('Error loading product:', err);
          this.errorMessage = 'Không thể tải thông tin sản phẩm';
        }
      });
    }
  }

  loadReviews(productId: string) {
    this.isLoadingReviews = true;
    this.reviewService.getReviewsByProduct(productId).subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews;
        this.isLoadingReviews = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.isLoadingReviews = false;
      }
    });
  }

  loadRelatedProducts(typeId: string) {
    this.productService.getProductByQuery({ type: typeId }).subscribe({
      next: (data: any) => {
        // getProductByQuery trả về { products: [...], pagination: {...} }
        const products = data?.products || (Array.isArray(data) ? data : []);
        this.relatedProducts = products.filter((p: Product) => p._id !== this.product._id).slice(0, 8);
      },
      error: (err) => {
        console.error('Error loading related products:', err);
        this.relatedProducts = [];
      }
    });
  }

  // Save viewed product to localStorage
  saveViewedProduct(productId: string) {
    try {
      const viewedKey = 'viewed_products';
      let viewedIds: string[] = JSON.parse(localStorage.getItem(viewedKey) || '[]');
      
      // Remove if already exists (to avoid duplicates)
      viewedIds = viewedIds.filter(id => id !== productId);
      
      // Add to the beginning
      viewedIds.unshift(productId);
      
      // Keep only last 20 viewed products
      viewedIds = viewedIds.slice(0, 20);
      
      localStorage.setItem(viewedKey, JSON.stringify(viewedIds));
    } catch (error) {
      console.error('Error saving viewed product:', error);
    }
  }

  // Load viewed products from localStorage
  loadViewedProducts(currentProductId: string) {
    try {
      const viewedKey = 'viewed_products';
      const viewedIds: string[] = JSON.parse(localStorage.getItem(viewedKey) || '[]');
      
      // Filter out current product
      const otherViewedIds = viewedIds.filter(id => id !== currentProductId).slice(0, 8);
      
      if (otherViewedIds.length === 0) {
        this.viewedProducts = [];
        return;
      }

      // Load product details for each viewed product ID
      const productObservables = otherViewedIds.map(id => 
        this.productService.getProductDetail(id).pipe(
          catchError(() => of(null)) // Skip products that no longer exist
        )
      );

      forkJoin(productObservables).subscribe({
        next: (products: (Product | null)[]) => {
          this.viewedProducts = products.filter((p): p is Product => p !== null);
        },
        error: (err) => {
          console.error('Error loading viewed products:', err);
          this.viewedProducts = [];
        }
      });
    } catch (error) {
      console.error('Error loading viewed products:', error);
      this.viewedProducts = [];
    }
  }

  // ============ IMAGE SLIDER ============

  prevImage() {
    if (!this.productImages.length) return;
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.productImages.length) % this.productImages.length;
  }

  nextImage() {
    if (!this.productImages.length) return;
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.productImages.length;
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  // ============ SIZE HANDLING ============

  // Check if product has sizes
  get hasSizes(): boolean {
    return !!(this.product?.sizes && this.product.sizes.length > 0);
  }

  // Get available sizes (with stock > 0)
  get availableSizes(): ProductSize[] {
    if (!this.hasSizes) return [];
    return this.product.sizes!.filter(s => s.stock > 0);
  }

  // Check if a specific size is in stock
  isSizeInStock(size: ProductSize): boolean {
    return size.stock > 0;
  }

  // Select a size
  selectSize(size: ProductSize) {
    if (!this.isSizeInStock(size)) return;
    this.selectedSize = size;
    this.selectedQuantity = 1; // Reset quantity when size changes
    this.clearMessages();
  }

  // ============ QUANTITY HANDLING ============

  // Get max quantity available
  get maxQuantity(): number {
    if (this.hasSizes) {
      return this.selectedSize ? this.selectedSize.stock : 0;
    }
    return this.product?.stockProduct ?? 0;
  }

  // Get available quantities array for select dropdown
  get availableQuantities(): number[] {
    const max = this.maxQuantity;
    if (max <= 0) return [];
    return Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1);
  }

  // Increment quantity
  incrementQuantity() {
    if (this.selectedQuantity < this.maxQuantity) {
      this.selectedQuantity++;
    }
  }

  // Decrement quantity
  decrementQuantity() {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  // ============ STOCK STATUS ============

  // Check if product is in stock
  get isInStock(): boolean {
    return isProductInStock(this.product);
  }

  // Get stock status text
  get stockStatusText(): string {
    if (this.hasSizes) {
      if (this.selectedSize) {
        return this.selectedSize.stock > 0
          ? `Còn ${this.selectedSize.stock} sản phẩm`
          : 'Hết hàng';
      }
      const totalStock = this.product.sizes!.reduce((sum, s) => sum + s.stock, 0);
      return totalStock > 0 ? `Còn hàng (${totalStock} sản phẩm)` : 'Hết hàng';
    }
    const stock = this.product?.stockProduct ?? 0;
    return stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng';
  }

  // ============ PRICING ============

  // Get original price
  get originalPrice(): number {
    return this.product?.priceProduct ?? 0;
  }

  // Get discounted price
  get discountedPrice(): number {
    return getDiscountedPrice(this.product);
  }

  // Check if product has discount
  get hasDiscount(): boolean {
    return !!(this.product?.discountProduct && this.product.discountProduct > 0);
  }

  // ============ MODAL ============

  // Check if product is for children (trẻ em)
  get isChildrenProduct(): boolean {
    if (!this.product) return false;

    // Check by genderProduct name
    const genderName = this.product.genderProduct?.name || '';
    const kidKeywords = ['trẻ em', 'trẻ', 'kid', 'kids', 'children', 'child'];
    const isKidGender = kidKeywords.some(keyword =>
      genderName.toLowerCase().includes(keyword.toLowerCase())
    );

    // Also check by sizeType (age or month indicates children's product)
    const isKidSizeType = this.product.sizeType === 'age' || this.product.sizeType === 'month';

    return isKidGender || isKidSizeType;
  }

  // Get size chart image path based on product type
  get sizeChartImage(): string {
    return this.isChildrenProduct
      ? '/public/image/sizekids.png'
      : '/public/image/sizeao.jpg';
  }

  openModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) modal.style.display = 'block';
  }

  closeModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) modal.style.display = 'none';
  }

  // ============ CART ============

  // Clear messages
  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  // Check if can add to cart
  get canAddToCart(): boolean {
    if (!this.product || !this.isInStock) return false;
    if (this.hasSizes && !this.selectedSize) return false;
    if (this.selectedQuantity <= 0 || this.selectedQuantity > this.maxQuantity) return false;
    return true;
  }

  // Add to cart
  addToCart() {
    this.clearMessages();

    // Validation
    if (this.hasSizes && !this.selectedSize) {
      this.errorMessage = '⚠️ Vui lòng chọn size trước khi thêm vào giỏ hàng!';
      return;
    }

    if (!this.canAddToCart) {
      this.errorMessage = '⚠️ Không thể thêm sản phẩm vào giỏ hàng!';
      return;
    }

    this.isAddingToCart = true;
    const sizeValue = this.selectedSize ? this.selectedSize.name : null;

    this.cartService.addToCart(this.product._id, this.selectedQuantity, sizeValue).subscribe({
      next: (cart) => {
        this.isAddingToCart = false;
        this.successMessage = '🛒 Đã thêm vào giỏ hàng thành công!';

        // Auto clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.isAddingToCart = false;
        // Display error message from backend
        const message = err?.error?.message || err?.error?.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng';
        this.errorMessage = `❌ ${message}`;
      }
    });
  }

  // Buy Now - Add to cart and redirect to payment
  buyNow() {
    if (!this.isLogin) {
      this.router.navigate(['/login']);
      return;
    }

    this.clearMessages();

    // Validation
    if (this.hasSizes && !this.selectedSize) {
      this.errorMessage = '⚠️ Vui lòng chọn size trước khi mua!';
      return;
    }

    if (!this.canAddToCart) {
      this.errorMessage = '⚠️ Không thể mua sản phẩm này!';
      return;
    }

    this.isBuyingNow = true;
    const sizeValue = this.selectedSize ? this.selectedSize.name : null;

    this.cartService.addToCart(this.product._id, this.selectedQuantity, sizeValue).subscribe({
      next: (cart) => {
        this.isBuyingNow = false;
        // Redirect to payment page
        this.router.navigate(['/payment']);
      },
      error: (err) => {
        this.isBuyingNow = false;
        const message = err?.error?.message || err?.error?.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng';
        this.errorMessage = `❌ ${message}`;
      }
    });
  }

  // ============ REVIEW ============

  toggleReviewForm() {
    this.showReviewForm = !this.showReviewForm;
    if (!this.showReviewForm) {
      this.resetReviewForm();
    }
  }

  resetReviewForm() {
    this.reviewRating = 5;
    this.reviewComment = '';
    this.reviewImages = [];
  }

  onRatingClick(rating: number) {
    this.reviewRating = rating;
  }

  onImageSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 5 images
      const maxImages = 5;
      const filesToAdd = Array.from(files).slice(0, maxImages - this.reviewImages.length) as File[];
      this.reviewImages = [...this.reviewImages, ...filesToAdd];
    }
  }

  removeImage(index: number) {
    this.reviewImages.splice(index, 1);
  }

  getStarsArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getAverageRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / this.reviews.length;
  }

  getAverageRatingRounded(): number {
    return Math.round(this.getAverageRating());
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ============ WISHLIST ============

  // Check if product is in wishlist
  checkWishlistStatus(productId: string) {
    this.wishlistService.getMyWishlist().subscribe({
      next: (items) => {
        this.isInWishlist = items.some(item => item.productId._id === productId);
      },
      error: () => {
        this.isInWishlist = false;
      }
    });
  }

  // Toggle wishlist (add/remove)
  toggleWishlist() {
    if (!this.isLogin) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.product?._id || this.isTogglingWishlist) return;

    this.isTogglingWishlist = true;
    this.wishlistService.toggleWishlist(this.product._id).subscribe({
      next: (result) => {
        this.isTogglingWishlist = false;
        this.isInWishlist = !this.isInWishlist;

        // Show success message
        if (this.isInWishlist) {
          this.successMessage = '❤️ Đã thêm vào danh sách yêu thích!';
        } else {
          this.successMessage = '💔 Đã xóa khỏi danh sách yêu thích';
        }

        // Auto clear message after 2 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 2000);
      },
      error: (err) => {
        this.isTogglingWishlist = false;
        const message = err?.error?.message || 'Có lỗi xảy ra';
        this.errorMessage = `❌ ${message}`;

        // Auto clear error after 3 seconds
        setTimeout(() => {
          this.errorMessage = null;
        }, 3000);
      }
    });
  }

  // Note: User can only review if they have a delivered order with this product
  // This will be handled in the review order page

  // ============ LIKE/DISLIKE ============

  isLiked(review: Review): boolean {
    if (!this.currentUserId || !review.likes) return false;
    return review.likes.some(like => like._id === this.currentUserId);
  }

  isDisliked(review: Review): boolean {
    if (!this.currentUserId || !review.dislikes) return false;
    return review.dislikes.some(dislike => dislike._id === this.currentUserId);
  }

  toggleLike(review: Review) {
    if (!this.isLogin) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isTogglingLike[review._id]) return;

    this.isTogglingLike[review._id] = true;
    this.reviewService.toggleLike(review._id).subscribe({
      next: () => {
        this.isTogglingLike[review._id] = false;
        if (this.product?._id) {
          this.loadReviews(this.product._id);
        }
      },
      error: (err) => {
        this.isTogglingLike[review._id] = false;
        console.error('Error toggling like:', err);
        this.errorMessage = 'Không thể cập nhật like';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  toggleDislike(review: Review) {
    if (!this.isLogin) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isTogglingDislike[review._id]) return;

    this.isTogglingDislike[review._id] = true;
    this.reviewService.toggleDislike(review._id).subscribe({
      next: () => {
        this.isTogglingDislike[review._id] = false;
        // Reload reviews to get fresh data with all populated fields
        if (this.product?._id) {
          this.loadReviews(this.product._id);
        }
      },
      error: (err) => {
        this.isTogglingDislike[review._id] = false;
        console.error('Error toggling dislike:', err);
        this.errorMessage = 'Không thể cập nhật dislike';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  // ============ REPLY/COMMENT ============

  startReply(reviewId: string) {
    if (!this.isLogin) {
      this.router.navigate(['/login']);
      return;
    }
    this.replyingToReviewId = reviewId;
    if (!this.replyText[reviewId]) {
      this.replyText[reviewId] = '';
    }
  }

  cancelReply(reviewId: string) {
    this.replyingToReviewId = null;
    this.replyText[reviewId] = '';
  }

  submitReply(review: Review) {
    const reviewId = review._id;
    const comment = this.replyText[reviewId]?.trim();

    if (!comment) {
      return;
    }

    if (this.isSubmittingReply[reviewId]) return;

    this.isSubmittingReply[reviewId] = true;
    this.reviewService.addReply(reviewId, comment).subscribe({
      next: () => {
        this.isSubmittingReply[reviewId] = false;
        this.replyingToReviewId = null;
        this.replyText[reviewId] = '';
        // Reload reviews to get fresh data with all populated fields
        if (this.product?._id) {
          this.loadReviews(this.product._id);
        }
        this.successMessage = 'Đã thêm bình luận thành công';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.isSubmittingReply[reviewId] = false;
        console.error('Error adding reply:', err);
        this.errorMessage = err?.error?.message || 'Không thể thêm bình luận';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  canDeleteReply(reply: any): boolean {
    if (!this.currentUserId) return false;
    // Admin hoặc chủ sở hữu reply có thể xóa
    return reply.userId.isAdmin === true || reply.userId._id === this.currentUserId;
  }

  deleteReply(review: Review, replyId: string) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    const reviewId = review._id;
    this.reviewService.deleteReply(reviewId, replyId).subscribe({
      next: () => {
        // Reload reviews to get fresh data
        if (this.product?._id) {
          this.loadReviews(this.product._id);
        }
        this.successMessage = 'Đã xóa bình luận thành công';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Error deleting reply:', err);
        this.errorMessage = err?.error?.message || 'Không thể xóa bình luận';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  // Get product image URL helper
  getProductImage(images: string[] | null | undefined): string {
    return getProductImage(images);
  }

  getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'250\' height=\'250\'%3E%3Crect fill=\'%23ddd\' width=\'250\' height=\'250\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
  }
}
