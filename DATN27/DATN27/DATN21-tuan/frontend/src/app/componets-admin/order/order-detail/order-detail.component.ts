import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminOrderService, Order } from '../../../services/admin-order/admin-order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  isLoading = false;
  isUpdating = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Status update
  newStatus: string = '';
  statusNote: string = '';

  // Status options (base list)
  allStatusOptions = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'pending_payment', label: 'Chờ thanh toán' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'returned', label: 'Đã trả hàng' },
    { value: 'failed', label: 'Thất bại' }
  ];
  
  // Status options (filtered based on payment status)
  statusOptions: Array<{ value: string; label: string }> = [];

  constructor(
    private adminOrderService: AdminOrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetail(orderId);
    }
  }

  loadOrderDetail(orderId: string) {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.adminOrderService.getOrderDetail(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.newStatus = order.status;
        this.updateStatusOptions();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể tải chi tiết đơn hàng';
        this.isLoading = false;
      }
    });
  }

  // Kiểm tra đơn hàng đã thanh toán chưa
  // Momo và VNPay luôn đã thanh toán (thanh toán trước khi đặt hàng)
  isOrderPaid(): boolean {
    if (!this.order) return false;
    if (this.order.paymentMethod === 'momo' || this.order.paymentMethod === 'vnpay') {
      return true; // Momo và VNPay luôn đã thanh toán
    }
    return this.order.isPaid || false; // COD thì kiểm tra isPaid
  }

  // Kiểm tra đơn hàng có thể cập nhật trạng thái không
  // Đơn đã giao hoặc đã hủy thì không thể cập nhật
  canUpdateStatus(): boolean {
    if (!this.order) return false;
    return this.order.status !== 'delivered' && this.order.status !== 'cancelled';
  }

  // Cập nhật danh sách trạng thái dựa trên trạng thái thanh toán
  updateStatusOptions() {
    if (this.isOrderPaid()) {
      // Nếu đã thanh toán, loại bỏ "Chờ thanh toán"
      this.statusOptions = this.allStatusOptions.filter(opt => opt.value !== 'pending_payment');
    } else {
      // Nếu chưa thanh toán, hiển thị tất cả
      this.statusOptions = [...this.allStatusOptions];
    }
  }

  updateStatus() {
    if (!this.order || !this.newStatus) return;
    
    // Kiểm tra đơn hàng có thể cập nhật không
    if (!this.canUpdateStatus()) {
      this.errorMessage = 'Đơn hàng đã giao hoặc đã hủy, không thể cập nhật trạng thái';
      return;
    }
    
    if (this.newStatus === this.order.status) {
      this.errorMessage = 'Trạng thái mới phải khác trạng thái hiện tại';
      return;
    }

    if (!confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng ${this.order.orderCode} thành "${this.getStatusLabel(this.newStatus)}"?`)) {
      return;
    }

    this.isUpdating = true;
    this.errorMessage = null;
    
    this.adminOrderService.updateOrderStatus(this.order._id, this.newStatus, this.statusNote).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.updateStatusOptions(); // Cập nhật lại danh sách trạng thái sau khi cập nhật
        this.isUpdating = false;
        this.successMessage = 'Cập nhật trạng thái thành công!';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.isUpdating = false;
        this.errorMessage = err?.error?.message || 'Không thể cập nhật trạng thái';
      }
    });
  }

  markPaid() {
    if (!this.order) return;
    
    // Kiểm tra đơn hàng có thể cập nhật không
    if (!this.canUpdateStatus()) {
      this.errorMessage = 'Đơn hàng đã giao hoặc đã hủy, không thể cập nhật thanh toán';
      return;
    }
    
    // Không cho phép đánh dấu thanh toán cho Momo/VNPay (luôn đã thanh toán)
    if (this.order.paymentMethod === 'momo' || this.order.paymentMethod === 'vnpay') {
      this.errorMessage = 'Đơn hàng thanh toán qua Momo/VNPay luôn được coi là đã thanh toán';
      return;
    }
    
    const wasPaid = this.order.isPaid;
    const action = wasPaid ? 'bỏ đánh dấu' : 'đánh dấu';
    if (!confirm(`Bạn có chắc muốn ${action} đơn hàng ${this.order.orderCode} là đã thanh toán?`)) {
      return;
    }

    this.isUpdating = true;
    this.errorMessage = null;
    
    this.adminOrderService.markOrderPaid(this.order._id, !wasPaid).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.updateStatusOptions(); // Cập nhật lại danh sách trạng thái
        
        // Nếu vừa đánh dấu đã thanh toán và trạng thái hiện tại là "pending_payment", tự động chuyển sang "confirmed"
        if (!wasPaid && this.isOrderPaid() && this.order.status === 'pending_payment') {
          this.newStatus = 'confirmed';
          // Gọi updateStatus nhưng không cần confirm lại
          this.adminOrderService.updateOrderStatus(this.order._id, 'confirmed', 'Tự động chuyển sau khi thanh toán').subscribe({
            next: (finalOrder) => {
              this.order = finalOrder;
              this.isUpdating = false;
              this.successMessage = 'Đã đánh dấu thanh toán và cập nhật trạng thái thành công!';
              setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
              this.isUpdating = false;
              this.errorMessage = err?.error?.message || 'Đã đánh dấu thanh toán nhưng không thể cập nhật trạng thái';
            }
          });
        } else {
          this.isUpdating = false;
          this.successMessage = `Đã ${action} thanh toán thành công!`;
          setTimeout(() => this.successMessage = null, 3000);
        }
      },
      error: (err) => {
        this.isUpdating = false;
        this.errorMessage = err?.error?.message || 'Không thể cập nhật trạng thái thanh toán';
      }
    });
  }

  getStatusLabel(status: string): string {
    // Tìm trong allStatusOptions trước (để luôn có kết quả)
    const option = this.allStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
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

  getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
  }

  getCouponDiscountText(coupon: any): string {
    if (!coupon) return '';
    if (coupon.type === 'PERCENTAGE') {
      return `Giảm ${coupon.value}%`;
    }
    return `Giảm ${coupon.value.toLocaleString('vi-VN')}đ`;
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }
}

