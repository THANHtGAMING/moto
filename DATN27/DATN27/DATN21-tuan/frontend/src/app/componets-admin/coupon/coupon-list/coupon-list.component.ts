import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { CouponService, Coupon } from '../../../services/coupon/coupon.service';
import { RefreshService } from '../../../services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxPaginationModule],
  templateUrl: './coupon-list.component.html',
  styleUrls: ['./coupon-list.component.css']
})
export class CouponListComponent implements OnInit, OnDestroy {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  p: number = 1;

  // Filters
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  private refreshSubscription?: Subscription;

  constructor(
    private couponService: CouponService,
    private refreshService: RefreshService
  ) {}

  ngOnInit() {
    this.loadCoupons();
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.couponRefresh$.subscribe(() => {
      this.p = 1;
      this.loadCoupons();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadCoupons() {
    this.isLoading = true;
    this.couponService.getAll().subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể tải danh sách mã giảm giá';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let result = [...this.coupons];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      const now = new Date();
      if (this.statusFilter === 'active') {
        result = result.filter(c => c.isActive && new Date(c.endDate) >= now);
      } else if (this.statusFilter === 'expired') {
        result = result.filter(c => new Date(c.endDate) < now);
      } else if (this.statusFilter === 'inactive') {
        result = result.filter(c => !c.isActive);
      }
    }

    // Type filter
    if (this.typeFilter) {
      result = result.filter(c => c.type === this.typeFilter);
    }

    this.filteredCoupons = result;
  }

  onSearch() {
    this.applyFilters();
    this.p = 1;
  }

  onFilterChange() {
    this.applyFilters();
    this.p = 1;
  }

  deleteCoupon(coupon: Coupon) {
    if (!confirm(`Bạn có chắc muốn xóa mã "${coupon.code}"?`)) return;

    this.couponService.delete(coupon._id).subscribe({
      next: () => {
        this.successMessage = `Đã xóa mã "${coupon.code}"`;
        // Emit refresh event để reload danh sách coupons
        this.refreshService.refreshCoupons();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể xóa mã giảm giá';
      }
    });
  }

  toggleActive(coupon: Coupon) {
    this.couponService.update(coupon._id, { isActive: !coupon.isActive }).subscribe({
      next: (updated) => {
        coupon.isActive = updated.isActive;
        this.successMessage = `Đã ${updated.isActive ? 'kích hoạt' : 'tắt'} mã "${coupon.code}"`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể cập nhật trạng thái';
      }
    });
  }

  toggleShowOnHeader(coupon: Coupon) {
    this.couponService.toggleShowOnHeader(coupon._id).subscribe({
      next: (updated) => {
        // Cập nhật tất cả coupons trong list
        this.coupons.forEach(c => {
          if (c._id === updated._id) {
            c.showOnHeader = updated.showOnHeader;
          } else if (updated.showOnHeader) {
            // Nếu coupon này được chọn, bỏ chọn các coupon khác
            c.showOnHeader = false;
          }
        });
        this.applyFilters();
        this.successMessage = updated.showOnHeader
          ? `Đã chọn mã "${coupon.code}" hiển thị trên header`
          : `Đã bỏ chọn mã "${coupon.code}" khỏi header`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể cập nhật trạng thái hiển thị';
      }
    });
  }

  getStatusBadge(coupon: Coupon): { text: string; class: string } {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return { text: 'Đã tắt', class: 'badge-inactive' };
    }
    if (now < startDate) {
      return { text: 'Chưa bắt đầu', class: 'badge-pending' };
    }
    if (now > endDate) {
      return { text: 'Đã hết hạn', class: 'badge-expired' };
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return { text: 'Hết lượt', class: 'badge-expired' };
    }
    return { text: 'Đang hoạt động', class: 'badge-active' };
  }

  getDiscountText(coupon: Coupon): string {
    if (coupon.type === 'PERCENTAGE') {
      return `${coupon.value}%`;
    }
    return `${coupon.value.toLocaleString('vi-VN')}đ`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }
}

