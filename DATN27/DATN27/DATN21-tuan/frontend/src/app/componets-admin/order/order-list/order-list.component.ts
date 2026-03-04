import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AdminOrderService, Order, OrderListParams } from '../../../services/admin-order/admin-order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxPaginationModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Filters
  filters: OrderListParams = {
    page: 1,
    limit: 10,
    status: '',
    paymentMethod: '',
    isPaid: ''
  };

  // Pagination
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  };
  p: number = 1; // For pagination-controls
  dummyArray: any[] = []; // Dummy array for pagination-controls to calculate total pages

  constructor(private adminOrderService: AdminOrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.adminOrderService.getOrderList(this.filters).subscribe({
      next: (response) => {
        this.orders = response.orders;
        this.pagination = response.pagination;
        this.p = response.pagination.page; // Sync với pagination-controls
        // Create dummy array for pagination-controls to calculate total pages
        this.dummyArray = new Array(response.pagination.total).fill(0);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể tải danh sách đơn hàng';
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.filters.page = 1; // Reset về trang đầu khi filter
    this.loadOrders();
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.p = page; // Sync với pagination-controls
    this.loadOrders();
    window.scrollTo(0, 0);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-pending',
      'pending_payment': 'badge-pending-payment',
      'confirmed': 'badge-confirmed',
      'shipping': 'badge-shipping',
      'delivered': 'badge-delivered',
      'cancelled': 'badge-cancelled',
      'returned': 'badge-returned',
      'failed': 'badge-failed'
    };
    return statusMap[status] || 'badge-default';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'pending_payment': 'Chờ thanh toán',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng',
      'failed': 'Thất bại'
    };
    return statusMap[status] || status;
  }

  getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cod': 'COD',
      'vnpay': 'VNPay',
      'momo': 'Momo'
    };
    return methodMap[method] || method;
  }

  getPaymentMethodClass(method: string): string {
    const classMap: { [key: string]: string } = {
      'cod': 'payment-cod',
      'vnpay': 'payment-vnpay',
      'momo': 'payment-momo'
    };
    return classMap[method] || '';
  }

  // Kiểm tra đơn hàng đã thanh toán chưa
  // Momo và VNPay luôn đã thanh toán (thanh toán trước khi đặt hàng)
  isOrderPaid(order: Order): boolean {
    if (order.paymentMethod === 'momo' || order.paymentMethod === 'vnpay') {
      return true; // Momo và VNPay luôn đã thanh toán
    }
    return order.isPaid || false; // COD thì kiểm tra isPaid
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;
    
    // Hiển thị tối đa 5 trang
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

