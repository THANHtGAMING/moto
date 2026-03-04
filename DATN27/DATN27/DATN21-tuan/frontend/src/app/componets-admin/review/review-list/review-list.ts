import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { ReviewService } from '../../../services/review/review.service';
import { Review, Reply } from '../../../models/review';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.css']
})
export class ReviewListComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  products: any[] = [];

  // Filters
  productFilter: string = '';
  keyword: string = '';

  // Pagination
  p: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  // Reply states
  replyingToReviewId: string | null = null;
  replyText: { [reviewId: string]: string } = {};
  isSubmittingReply: { [reviewId: string]: boolean } = {};

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadReviews();
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products as any[];
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  loadReviews() {
    this.isLoading = true;
    const params: any = {
      page: this.p,
      limit: this.itemsPerPage
    };

    if (this.productFilter) {
      params.productId = this.productFilter;
    }

    this.reviewService.getAllReviews(params).subscribe({
      next: (data) => {
        this.reviews = data.reviews || [];
        this.totalItems = data.pagination?.total || 0;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.errorMessage = 'Không thể tải danh sách đánh giá';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredReviews = this.reviews.filter(review => {
      const matchesKeyword = !this.keyword ||
        review.comment.toLowerCase().includes(this.keyword.toLowerCase()) ||
        review.userId?.fullName?.toLowerCase().includes(this.keyword.toLowerCase());
      return matchesKeyword;
    });
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.p = 1;
    this.loadReviews();
  }

  pageChanged(page: number) {
    this.p = page;
    this.loadReviews();
  }

  // Reply methods
  startReply(reviewId: string) {
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
        this.loadReviews();
        this.successMessage = 'Đã thêm phản hồi thành công';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.isSubmittingReply[reviewId] = false;
        this.errorMessage = err?.error?.message || 'Không thể thêm phản hồi';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  deleteReply(review: Review, replyId: string) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    const reviewId = review._id;
    this.reviewService.deleteReply(reviewId, replyId).subscribe({
      next: () => {
        // Reset pagination về trang 1 và reload reviews to get fresh data
        this.p = 1;
        this.loadReviews();
        this.successMessage = 'Đã xóa bình luận thành công';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể xóa bình luận';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  // Toggle hide review
  toggleHideReview(review: Review) {
    const action = review.isHidden ? 'hiển thị' : 'ẩn';
    if (!confirm(`Bạn có chắc muốn ${action} đánh giá này?`)) return;

    this.reviewService.toggleHideReview(review._id).subscribe({
      next: () => {
        // Reload reviews to get fresh data
        this.loadReviews();
        this.successMessage = `Đã ${action} đánh giá thành công`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể cập nhật đánh giá';
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStarsArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getProductName(productId: any): string {
    if (typeof productId === 'string') {
      const product = this.products.find(p => p._id === productId);
      return product?.nameProduct || 'N/A';
    }
    return productId?.nameProduct || 'N/A';
  }
}
