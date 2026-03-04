import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../services/review/review.service';
import { OrderService } from '../../services/order/order.service';
import { PendingReview, CreateReviewRequest } from '../../models/review';

@Component({
  selector: 'app-review-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './review-order.component.html',
  styleUrls: ['./review-order.component.css']
})
export class ReviewOrderComponent implements OnInit {
  orderId: string = '';
  orderCode: string = '';
  pendingProducts: PendingReview[] = [];
  isLoading = false;
  error: string = '';
  success: string = '';

  // Review form states
  reviewForms: { [key: string]: {
    rating: number;
    comment: string;
    images: File[];
    isSubmitting: boolean;
  } } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId = params['orderId'];
      if (this.orderId) {
        this.loadPendingReviews();
      }
    });
  }

  loadPendingReviews() {
    this.isLoading = true;
    this.reviewService.getPendingReviews(this.orderId).subscribe({
      next: (data) => {
        this.orderCode = data.orderCode;
        this.pendingProducts = data.pendingProducts;

        // Initialize review forms
        this.pendingProducts.forEach(product => {
          if (!this.reviewForms[product.productId]) {
            this.reviewForms[product.productId] = {
              rating: 5,
              comment: '',
              images: [],
              isSubmitting: false
            };
          }
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading pending reviews:', err);
        this.error = 'Không thể tải danh sách sản phẩm cần đánh giá';
        this.isLoading = false;
      }
    });
  }

  onRatingClick(productId: string, rating: number) {
    if (this.reviewForms[productId]) {
      this.reviewForms[productId].rating = rating;
    }
  }

  onImageSelected(productId: string, event: any) {
    const files = event.target.files;
    if (files && files.length > 0 && this.reviewForms[productId]) {
      const maxImages = 5;
      const filesToAdd = Array.from(files).slice(0, maxImages - this.reviewForms[productId].images.length) as File[];
      this.reviewForms[productId].images = [...this.reviewForms[productId].images, ...filesToAdd];
    }
  }

  removeImage(productId: string, index: number) {
    if (this.reviewForms[productId]) {
      this.reviewForms[productId].images.splice(index, 1);
    }
  }

  getStarsArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  submitReview(productId: string) {
    const form = this.reviewForms[productId];
    if (!form || form.isSubmitting) return;

    if (!form.comment.trim()) {
      this.error = 'Vui lòng nhập đánh giá';
      return;
    }

    form.isSubmitting = true;
    this.error = '';
    this.success = '';

    const reviewData: CreateReviewRequest = {
      productId: productId,
      orderId: this.orderId,
      rating: form.rating,
      comment: form.comment,
      images: form.images
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: () => {
        this.success = 'Đánh giá thành công!';
        // Remove product from pending list
        this.pendingProducts = this.pendingProducts.filter(p => p.productId !== productId);
        delete this.reviewForms[productId];

        // If no more pending products, redirect after 2 seconds
        if (this.pendingProducts.length === 0) {
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.error = err?.error?.message || 'Có lỗi xảy ra khi gửi đánh giá';
        form.isSubmitting = false;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }
}

