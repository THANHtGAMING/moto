import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { UserService, Address } from '../../services/user/user.service';
import { OrderService } from '../../services/order/order.service';
import { ReviewService } from '../../services/review/review.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ChangePasswordModalComponent],
  template: `
    <div class="profile-container">
      <!-- Sidebar -->
      <div class="profile-sidebar">
        <!-- Logo Section -->
        <div class="logo-section" *ngIf="user">
          <div class="logo">
            <div class="user-avatar-container">
              <div class="user-avatar">
                <img *ngIf="previewUrl" [src]="previewUrl" [alt]="user.fullName" />
                <span *ngIf="!previewUrl" class="avatar-placeholder">
                  {{ getShortName(user.fullName) }}
                </span>
              </div>
            </div>
            <div class="user-info-section">
              <div class="greeting">Xin chào bạn !</div>
              <div class="user-name">{{ user.fullName }}</div>
            </div>
          </div>
          <label for="avatar-input" class="upload-link">
            <input
              type="file"
              id="avatar-input"
              accept="image/*"
              (change)="onFileSelected($event)"
              [disabled]="isUploadingAvatar"
              style="display: none;"
            />
            <i class="fas fa-arrow-up upload-icon"></i>
            Tải hình ảnh đại diện của bạn
          </label>
        </div>

        <!-- Separator -->
        <div class="nav-separator"></div>

        <!-- Navigation Links -->
        <nav class="sidebar-nav">
          <a class="nav-link" [class.active]="activeSection === 'orders'" (click)="setActiveSection('orders')">
            <i class="fas fa-list nav-icon"></i>
            Đơn hàng của tôi
          </a>
          <a class="nav-link" [class.active]="activeSection === 'address'" (click)="setActiveSection('address')">
            <i class="fas fa-map-marker-alt nav-icon"></i>
            Sổ địa chỉ
          </a>
          <a class="nav-link" [class.active]="activeSection === 'info'" (click)="setActiveSection('info')">
            <i class="fas fa-file-alt nav-icon"></i>
            Thông tin của tôi
          </a>
          <a class="nav-link" *ngIf="hasPassword" (click)="openChangePasswordModal()">
            <i class="fas fa-lock nav-icon"></i>
            Thay đổi mật khẩu
          </a>
          <a class="nav-link logout" (click)="onLogout()">
            <i class="fas fa-sign-out-alt nav-icon"></i>
            Đăng xuất
          </a>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="profile-main-content">
        <!-- Orders Section -->
        <div class="orders-section" *ngIf="activeSection === 'orders'">
          <!-- Order Status Tabs -->
          <div class="order-tabs">
            <button 
              class="tab-btn" 
              [class.active]="selectedStatus === 'pending'"
              (click)="filterOrders('pending')">
              Đơn mới
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedStatus === 'confirmed'"
              (click)="filterOrders('confirmed')">
              Đã xác nhận
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedStatus === 'shipped'"
              (click)="filterOrders('shipped')">
              Đã gửi hàng
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedStatus === 'delivered'"
              (click)="filterOrders('delivered')">
              Đã nhận
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedStatus === 'cancelled'"
              (click)="filterOrders('cancelled')">
              Đã huỷ
            </button>
          </div>

          <!-- Orders List -->
          <div class="orders-content">
            <div class="orders-list" *ngIf="paginatedOrders && paginatedOrders.length > 0">
              <div class="order-card" *ngFor="let order of paginatedOrders">
                <div class="order-header">
                  <div class="order-info">
                    <h3>Đơn hàng {{ order.orderCode || '#' + order._id.slice(-8) }}</h3>
                    <p class="order-date">{{ formatDate(order.createdAt) }}</p>
                  </div>
                  <div class="order-status">
                    <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                      {{ getStatusText(order.status) }}
                    </span>
                  </div>
                </div>

                <div class="order-details">
                  <div class="order-item" *ngFor="let item of order.products || order.items">
                    <div class="item-info">
                      <img *ngIf="item.imageProduct" [src]="item.imageProduct" alt="{{ item.nameProduct || item.productName }}" class="item-image">
                      <div class="item-text-info">
                        <span class="item-name">{{ item.nameProduct || item.productName }}</span>
                        <span class="item-meta" *ngIf="item.size">Size: {{ item.size }} | </span>
                        <span class="item-quantity">Số lượng: x{{ item.quantity }}</span>
                      </div>
                    </div>
                    <span class="item-price">{{ formatPrice((item.price || 0) * item.quantity) }}</span>
                  </div>
                </div>

                <div class="order-footer">
                  <div class="order-actions">
                    <button 
                      *ngIf="canCancelOrder(order)"
                      class="btn-cancel-order"
                      (click)="cancelOrder(order)">
                      Hủy đơn hàng
                    </button>
                    <button class="btn-view" (click)="openOrderDetailModal(order._id)">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div class="pagination-container" *ngIf="filteredOrders && filteredOrders.length > 0 && totalPages > 1">
              <button 
                class="pagination-btn" 
                [disabled]="currentPage === 1"
                (click)="goToPage(currentPage - 1)">
                ← Trước
              </button>
              <div class="pagination-pages">
                <button 
                  *ngFor="let page of getPageNumbers()"
                  class="pagination-page"
                  [class.active]="page === currentPage"
                  (click)="goToPage(page)">
                  {{ page }}
                </button>
              </div>
              <button 
                class="pagination-btn" 
                [disabled]="currentPage === totalPages"
                (click)="goToPage(currentPage + 1)">
                Sau →
              </button>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="filteredOrders && filteredOrders.length === 0 && !isLoadingOrders">
              <div class="empty-icon">
                <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Price tag body -->
                  <rect x="40" y="30" width="70" height="80" rx="6" fill="#B3E5FC" stroke="#81D4FA" stroke-width="2"/>
                  <!-- Price tag top loop -->
                  <path d="M55 30 L55 20 Q55 15 60 15 L90 15 Q95 15 95 20 L95 30" fill="#81D4FA" stroke="#4FC3F7" stroke-width="2"/>
                  <!-- Sad face -->
                  <circle cx="75" cy="60" r="8" fill="#4FC3F7"/>
                  <path d="M70 70 Q75 75 80 70" stroke="#4FC3F7" stroke-width="2" stroke-linecap="round" fill="none"/>
                  <!-- Plus signs -->
                  <circle cx="30" cy="50" r="3" fill="#81D4FA"/>
                  <path d="M30 47 L30 53 M27 50 L33 50" stroke="#4FC3F7" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="120" cy="70" r="3" fill="#81D4FA"/>
                  <path d="M120 67 L120 73 M117 70 L123 70" stroke="#4FC3F7" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <h3 class="empty-title">Chưa có đơn hàng nào</h3>
              <p class="empty-message">
                Nơi này sẽ giúp xem lại những đơn hàng mà bạn đã đặt, hãy quay lại đây sau khi gửi đơn hàng đầu tiên của mình nhé!
              </p>
            </div>

            <div class="loading" *ngIf="isLoadingOrders">
              Đang tải...
            </div>
          </div>
        </div>

        <!-- Address Section -->
        <div class="address-section" *ngIf="activeSection === 'address'">
          <h2>Sổ địa chỉ</h2>

          <!-- Success Message -->
          <div class="success-message" *ngIf="successMessage">
            <i class="fas fa-check-circle"></i> {{ successMessage }}
          </div>

          <!-- Error Message -->
          <div class="error-message" *ngIf="error">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>

          <!-- Address List -->
          <div class="address-list" *ngIf="addresses.length > 0">
            <div class="address-card" *ngFor="let addr of addresses">
              <div class="address-content">
                <div class="address-header">
                  <span class="address-name">{{ addr.name }}</span>
                  <span class="default-badge" *ngIf="addr.isDefault">Mặc định</span>
                </div>
                <div class="recipient-info">
                  <strong>{{ addr.recipientName }}</strong> | {{ addr.phoneNumber }}
                </div>
                <div class="address-detail">{{ addr.fullAddress }}</div>
                <div class="address-actions">
                  <button
                    class="btn-link"
                    *ngIf="!addr.isDefault"
                    (click)="setDefaultAddress(addr)">
                    Đặt làm mặc định
                  </button>
                  <button
                    class="btn-link danger"
                    (click)="deleteAddress(addr)">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Address Message -->
          <div class="no-address" *ngIf="addresses.length === 0">
            <p><i class="fas fa-map-marker-alt"></i> Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ để tiếp tục.</p>
          </div>

          <!-- Add Address Button -->
          <button class="add-address-btn" (click)="openAddAddressModal()">
            + Thêm địa chỉ mới
          </button>
        </div>

        <!-- User Info Section -->
        <div class="user-info-edit-section" *ngIf="activeSection === 'info'">
          <h2>Thông tin của tôi</h2>

          <div class="info-form-container" *ngIf="user">
            <form [formGroup]="userInfoForm" (ngSubmit)="submitUserInfo()">
              <div class="form-group">
                <label>Họ tên</label>
                <input 
                  type="text" 
                  formControlName="fullName" 
                  [readonly]="!canEditName"
                  [class.readonly]="!canEditName"
                  placeholder="Nhập họ tên" />
                <div class="form-hint" *ngIf="!canEditName && daysUntilNextEdit > 0">
                  Bạn có thể chỉnh sửa lại sau {{ daysUntilNextEdit }} ngày nữa
                </div>
                <div class="form-hint" *ngIf="canEditName">
                  Bạn có thể chỉnh sửa tên của mình
                </div>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  [value]="user.email" 
                  readonly 
                  class="readonly"
                  placeholder="Email" />
                <div class="form-hint">
                  Email không thể thay đổi
                </div>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn-save" 
                  [disabled]="userInfoForm.invalid || !canEditName || isSavingUserInfo">
                  {{ isSavingUserInfo ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
                <button 
                  type="button" 
                  class="btn-cancel" 
                  (click)="cancelEditUserInfo()"
                  *ngIf="userInfoForm.dirty">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Other Sections Placeholder -->
        <div class="other-section" *ngIf="activeSection !== 'orders' && activeSection !== 'address' && activeSection !== 'info'">
          <h2>{{ getSectionTitle() }}</h2>
          <p>Nội dung đang được phát triển...</p>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <app-change-password-modal 
      *ngIf="showChangePasswordModal"
      (close)="showChangePasswordModal = false"
      (success)="onPasswordChangeSuccess()">
    </app-change-password-modal>

    <!-- Add Address Modal -->
    <div class="modal-overlay" *ngIf="showAddAddressModal" (click)="closeAddAddressModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Thêm địa chỉ mới</h3>
          <button class="modal-close" (click)="closeAddAddressModal()">×</button>
        </div>

        <form [formGroup]="addressForm" (ngSubmit)="submitAddAddress()">
          <div class="form-group">
            <label>Tên địa chỉ (VD: Nhà, Công ty...)</label>
            <input 
              type="text" 
              formControlName="name" 
              placeholder="Nhập tên địa chỉ" 
              [class.error]="addressForm.get('name')?.invalid && addressForm.get('name')?.touched" />
            <div class="error-message" *ngIf="addressForm.get('name')?.invalid && addressForm.get('name')?.touched">
              <span *ngIf="addressForm.get('name')?.errors?.['required']">Tên địa chỉ là bắt buộc</span>
              <span *ngIf="addressForm.get('name')?.errors?.['minlength']">Tên địa chỉ phải có ít nhất 2 ký tự</span>
            </div>
          </div>

          <div class="form-group">
            <label>Họ tên người nhận</label>
            <input 
              type="text" 
              formControlName="recipientName" 
              placeholder="Nhập họ tên người nhận (10-20 ký tự)" 
              maxlength="20"
              [class.error]="addressForm.get('recipientName')?.invalid && addressForm.get('recipientName')?.touched" />
            <div class="error-message" *ngIf="addressForm.get('recipientName')?.invalid && addressForm.get('recipientName')?.touched">
              <span *ngIf="addressForm.get('recipientName')?.errors?.['required']">Họ tên người nhận không được bỏ trống</span>
              <span *ngIf="addressForm.get('recipientName')?.errors?.['minlength']">Họ tên người nhận phải có ít nhất 10 ký tự</span>
              <span *ngIf="addressForm.get('recipientName')?.errors?.['maxlength']">Họ tên người nhận không được vượt quá 20 ký tự</span>
            </div>
          </div>

          <div class="form-group">
            <label>Số điện thoại</label>
            <input 
              type="tel" 
              formControlName="phoneNumber" 
              placeholder="Nhập số điện thoại (10 số)" 
              maxlength="10"
              (keypress)="onPhoneNumberKeyPress($event)"
              (input)="onPhoneNumberInput($event)"
              [class.error]="addressForm.get('phoneNumber')?.invalid && addressForm.get('phoneNumber')?.touched" />
            <div class="error-message" *ngIf="addressForm.get('phoneNumber')?.invalid && addressForm.get('phoneNumber')?.touched">
              <span *ngIf="addressForm.get('phoneNumber')?.errors?.['required']">Số điện thoại không được bỏ trống</span>
              <span *ngIf="addressForm.get('phoneNumber')?.errors?.['pattern']">Số điện thoại phải là 10 ký tự số</span>
            </div>
          </div>

          <div class="form-group">
            <label>Địa chỉ chi tiết</label>
            <textarea 
              formControlName="fullAddress" 
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố (10-150 ký tự)" 
              rows="4"
              maxlength="150"
              [class.error]="addressForm.get('fullAddress')?.invalid && addressForm.get('fullAddress')?.touched"></textarea>
            <div class="error-message" *ngIf="addressForm.get('fullAddress')?.invalid && addressForm.get('fullAddress')?.touched">
              <span *ngIf="addressForm.get('fullAddress')?.errors?.['required']">Địa chỉ chi tiết không được bỏ trống</span>
              <span *ngIf="addressForm.get('fullAddress')?.errors?.['minlength']">Địa chỉ chi tiết phải có ít nhất 10 ký tự</span>
              <span *ngIf="addressForm.get('fullAddress')?.errors?.['maxlength']">Địa chỉ chi tiết không được vượt quá 150 ký tự</span>
            </div>
          </div>

          <div class="form-group checkbox">
            <label>
              <input type="checkbox" formControlName="isDefault" />
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="closeAddAddressModal()">Hủy</button>
            <button type="submit" class="btn-submit" [disabled]="addressForm.invalid">Lưu địa chỉ</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div class="modal-overlay order-detail-modal-overlay" *ngIf="showOrderDetailModal" (click)="closeOrderDetailModal()">
      <div class="modal-content order-detail-modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Chi tiết đơn hàng</h3>
          <button class="modal-close" (click)="closeOrderDetailModal()">×</button>
        </div>

        <div class="order-detail-modal-body">
          <div class="loading" *ngIf="isLoadingOrderDetail">
            <p>Đang tải thông tin đơn hàng...</p>
          </div>

          <div class="error" *ngIf="orderDetailError && !isLoadingOrderDetail">
            <p>{{ orderDetailError }}</p>
          </div>

          <div class="order-detail-content" *ngIf="selectedOrder && !isLoadingOrderDetail && !orderDetailError">
            <!-- Order Info Card -->
            <div class="info-card">
              <h3>Thông tin đơn hàng</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Mã đơn hàng:</label>
                  <strong>{{ selectedOrder.orderCode || '#' + selectedOrder._id.slice(-8) }}</strong>
                </div>
                <div class="info-item">
                  <label>Trạng thái:</label>
                  <span class="status-badge" [ngClass]="getStatusClass(selectedOrder.status)">
                    {{ getStatusText(selectedOrder.status) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Phương thức thanh toán:</label>
                  <span>{{ getPaymentMethodText(selectedOrder.paymentMethod) }}</span>
                </div>
                <div class="info-item">
                  <label>Đã thanh toán:</label>
                  <span [class.paid]="selectedOrder.isPaid" [class.unpaid]="!selectedOrder.isPaid">
                    {{ selectedOrder.isPaid ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán' }}
                  </span>
                </div>
                <div class="info-item" *ngIf="selectedOrder.paidAt">
                  <label>Ngày thanh toán:</label>
                  <span>{{ formatDate(selectedOrder.paidAt) }}</span>
                </div>
                <div class="info-item">
                  <label>Ngày tạo:</label>
                  <span>{{ formatDate(selectedOrder.createdAt) }}</span>
                </div>
                <div class="info-item">
                  <label>Cập nhật lần cuối:</label>
                  <span>{{ formatDate(selectedOrder.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="info-card">
              <h3>Thông tin giao hàng</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Người nhận:</label>
                  <span>{{ selectedOrder.shippingAddress?.fullName }}</span>
                </div>
                <div class="info-item">
                  <label>Số điện thoại:</label>
                  <span>{{ selectedOrder.shippingAddress?.phoneNumber }}</span>
                </div>
                <div class="info-item" *ngIf="selectedOrder.shippingAddress?.email">
                  <label>Email:</label>
                  <span>{{ selectedOrder.shippingAddress?.email }}</span>
                </div>
                <div class="info-item full-width">
                  <label>Địa chỉ giao hàng:</label>
                  <span>{{ selectedOrder.shippingAddress?.address }}</span>
                </div>
              </div>
            </div>

            <!-- Products -->
            <div class="info-card">
              <h3>Sản phẩm</h3>
              <div class="products-list">
                <div class="product-item" *ngFor="let product of selectedOrder.products || selectedOrder.items">
                  <div class="product-image">
                    <img
                      [src]="product.imageProduct || product.image"
                      [alt]="product.nameProduct || product.productName"
                      onerror="this.src='https://via.placeholder.com/100'"
                    />
                  </div>
                  <div class="product-info">
                    <h4>{{ product.nameProduct || product.productName }}</h4>
                    <div class="product-meta">
                      <span *ngIf="product.size">Size: {{ product.size }} | </span>
                      <span>Số lượng: x{{ product.quantity }}</span>
                    </div>
                    <div class="product-price">
                      <span class="unit-price">{{ formatPrice(product.price || 0) }} / sản phẩm</span>
                      <span class="total-price">{{ formatPrice((product.price || 0) * product.quantity) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="info-card">
              <h3>Tổng kết đơn hàng</h3>
              <div class="summary">
                <div class="summary-row">
                  <span>Tạm tính:</span>
                  <span>{{ formatPrice(selectedOrder.totalPrice || 0) }}</span>
                </div>
                <div class="summary-row" *ngIf="selectedOrder.discountAmount && selectedOrder.discountAmount > 0">
                  <span>Giảm giá:</span>
                  <span class="discount">-{{ formatPrice(selectedOrder.discountAmount) }}</span>
                </div>
                <div class="summary-row" *ngIf="selectedOrder.couponId">
                  <label>Mã giảm giá:</label>
                  <span>{{ selectedOrder.couponId.code }} - {{ getCouponDiscountText(selectedOrder.couponId) }}</span>
                </div>
                <div class="summary-row" *ngIf="selectedOrder.shippingFee">
                  <span>Phí vận chuyển:</span>
                  <span>{{ formatPrice(selectedOrder.shippingFee) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Tổng cộng:</span>
                  <strong>{{ formatPrice(selectedOrder.finalPrice || 0) }}</strong>
                </div>
              </div>
            </div>

            <!-- Status History -->
            <div class="info-card" *ngIf="selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0">
              <h3>Lịch sử trạng thái</h3>
              <div class="status-history">
                <div class="history-item" *ngFor="let history of selectedOrder.statusHistory">
                  <div class="history-status">{{ getStatusText(history.status) }}</div>
                  <div class="history-date">{{ formatDate(history.updatedAt) }}</div>
                  <div class="history-note" *ngIf="history.note">{{ history.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      min-height: calc(100vh - 200px);
      background: white;
      padding: 40px 0;
      gap: 0;
      max-width: 1400px;
      margin: 0 auto;
      background-color: white;
    }

    /* Sidebar */
    .profile-sidebar {
      width: 280px;
      background: white;
      background-color: white;
      border-radius: 0;
      padding: 0 20px;
      box-shadow: none;
      border-right: 1px solid #eee;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .logo-section {
      padding-bottom: 20px;
    }

    .logo {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .user-avatar-container {
      flex-shrink: 0;
    }

    .user-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background: #E21B22;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }

    .user-avatar:hover {
      transform: scale(1.05);
    }

    .star {
      color: #1e3a8a;
      font-size: 20px;
      display: inline-block;
      margin: 0 2px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
      letter-spacing: 1px;
    }

    .user-info-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
      text-align: left;
      flex: 1;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      color: white;
      font-size: 36px;
      font-weight: bold;
    }

    .greeting {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .user-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }

    .user-level {
      color: #0ea5e9;
      font-size: 14px;
    }

    .upload-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #0ea5e9;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      margin-top: 8px;
    }

    .upload-link:hover {
      text-decoration: underline;
    }

    .upload-icon {
      font-size: 16px;
      width: 16px;
      text-align: center;
    }

    .nav-separator {
      height: 1px;
      background: #eee;
      margin: 16px 0;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #333;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .nav-link:hover {
      background: #f5f5f5;
    }

    .nav-link.active {
      background: #e3f2fd;
      color: #0ea5e9;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 18px;
      width: 20px;
      text-align: center;
      color: inherit;
    }

    .nav-link.active .nav-icon {
      color: #0ea5e9;
    }

    .nav-link.logout {
      margin-top: 10px;
      border-top: 1px solid #eee;
      padding-top: 16px;
    }

    /* Main Content */
    .profile-main-content {
      flex: 1;
      background: white;
      background-color: white;
      border-radius: 0;
      padding: 30px;
      box-shadow: none;
    }

    /* Order Tabs */
    .order-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 10px 20px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f5f5f5;
    }

    .tab-btn.active {
      background: #e0e0e0;
      color: #333;
      border-color: #bbb;
      font-weight: 600;
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .order-card {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .order-info h3 {
      color: #333;
      margin-bottom: 5px;
      font-size: 18px;
    }

    .order-date {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-confirmed {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-shipped {
      background: #cfe2ff;
      color: #084298;
    }

    .status-delivered {
      background: #d4edda;
      color: #155724;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .order-details {
      margin-bottom: 15px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .item-info {
      display: flex;
      gap: 10px;
      align-items: center;
      flex: 1;
    }

    .item-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .item-text-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-meta {
      color: #999;
      font-size: 12px;
    }

    .item-name {
      color: #333;
    }

    .item-quantity {
      color: #666;
      font-size: 14px;
    }

    .item-price {
      color: #E21B22;
      font-weight: 600;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .order-actions {
      display: flex;
      gap: 10px;
    }

    .btn-view {
      padding: 8px 16px;
      background: #E21B22;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
    }

    .btn-view:hover {
      background: #c5181f;
    }

    .btn-cancel-order {
      padding: 8px 16px;
      background: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
    }

    .btn-cancel-order:hover {
      background: #cf1322;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }

    .empty-icon {
      margin-bottom: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .empty-icon svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .empty-title {
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
    }

    .empty-message {
      color: #666;
      font-size: 15px;
      line-height: 1.8;
      max-width: 550px;
      margin: 0 auto;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    /* Pagination */
    .pagination-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 30px;
      padding: 20px 0;
    }

    .pagination-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      color: #333;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f5f5f5;
      border-color: #E21B22;
      color: #E21B22;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .pagination-pages {
      display: flex;
      gap: 5px;
    }

    .pagination-page {
      min-width: 40px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid #ddd;
      background: white;
      color: #333;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .pagination-page:hover {
      background: #f5f5f5;
      border-color: #E21B22;
      color: #E21B22;
    }

    .pagination-page.active {
      background: #E21B22;
      color: white;
      border-color: #E21B22;
      font-weight: 600;
    }

    .pagination-page.active:hover {
      background: #c5181f;
      border-color: #c5181f;
    }

    .other-section {
      padding: 40px;
      text-align: center;
    }

    .other-section h2 {
      color: #333;
      margin-bottom: 20px;
    }

    /* Address Section */
    .address-section h2 {
      color: #333;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .address-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 20px;
    }

    .address-card {
      display: flex;
      gap: 15px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      transition: all 0.2s;
    }

    .address-card:hover {
      border-color: #E21B22;
      background: #fff8f6;
    }

    .address-content {
      flex: 1;
    }

    .address-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .address-name {
      font-weight: 600;
      color: #333;
    }

    .default-badge {
      background: #E21B22;
      color: white;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .recipient-info {
      color: #333;
      margin-bottom: 5px;
    }

    .address-detail {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .address-actions {
      margin-top: 10px;
      display: flex;
      gap: 15px;
    }

    .btn-link {
      background: none;
      border: none;
      color: #1890ff;
      cursor: pointer;
      font-size: 13px;
      padding: 0;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .btn-link.danger {
      color: #ff4d4f;
    }

    .no-address {
      padding: 30px;
      text-align: center;
      background: #fafafa;
      border-radius: 10px;
      color: #666;
      margin-bottom: 20px;
    }

    .no-address i {
      margin-right: 8px;
      color: #1890ff;
    }

    .add-address-btn {
      width: 100%;
      padding: 15px;
      border: 2px dashed #d9d9d9;
      border-radius: 10px;
      background: white;
      color: #333;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .add-address-btn:hover {
      border-color: #E21B22;
      color: #E21B22;
      background: #fff8f6;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 650px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      color: #333;
    }

    .form-group {
      padding: 0 20px;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #E21B22;
    }

    .form-group input.error,
    .form-group textarea.error {
      border-color: #ff4d4f;
    }

    .error-message {
      color: #ff4d4f;
      font-size: 12px;
      margin-top: 5px;
      display: block;
    }

    .success-message {
      background: #d4edda;
      color: #155724;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      border: 1px solid #c3e6cb;
    }

    .success-message i {
      font-size: 16px;
    }

    .address-section .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      border: 1px solid #f5c6cb;
    }

    .address-section .error-message i {
      font-size: 16px;
    }

    .form-group.checkbox {
      display: flex;
      align-items: center;
    }

    .form-group.checkbox label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      cursor: pointer;
    }

    .form-group.checkbox input[type="checkbox"] {
      width: auto;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #eee;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #333;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-submit {
      background: #E21B22;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #c5181f;
    }

    .btn-submit:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* User Info Edit Section */
    .user-info-edit-section h2 {
      color: #333;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 30px;
    }

    .info-form-container {
      max-width: 600px;
    }

    .info-form-container .form-group {
      margin-bottom: 25px;
    }

    .info-form-container .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .info-form-container .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 15px;
      box-sizing: border-box;
      transition: all 0.2s;
    }

    .info-form-container .form-group input:focus {
      outline: none;
      border-color: #E21B22;
      box-shadow: 0 0 0 3px rgba(226, 27, 34, 0.1);
    }

    .info-form-container .form-group input.readonly {
      background: #f5f5f5;
      color: #666;
    }

    /* Order Detail Modal Styles */
    .order-detail-modal-overlay {
      z-index: 2000;
    }

    .order-detail-modal-content {
      max-width: 1000px;
      width: 95%;
      max-height: 95vh;
    }

    .order-detail-modal-body {
      padding: 20px;
      max-height: calc(95vh - 80px);
      overflow-y: auto;
    }

    .order-detail-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .info-card h3 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E21B22;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      color: #666;
      font-size: 14px;
      font-weight: 600;
    }

    .info-item span, .info-item strong {
      color: #333;
      font-size: 15px;
    }

    .paid {
      color: #28a745;
      font-weight: 600;
    }

    .unpaid {
      color: #ffc107;
      font-weight: 600;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-pending_payment {
      background: #ffeaa7;
      color: #856404;
    }

    .status-confirmed {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-shipping {
      background: #cce5ff;
      color: #004085;
    }

    .status-delivered {
      background: #d4edda;
      color: #155724;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .status-returned {
      background: #e2e3e5;
      color: #383d41;
    }

    .status-failed {
      background: #f8d7da;
      color: #721c24;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .product-item {
      display: flex;
      gap: 15px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .product-image {
      flex-shrink: 0;
    }

    .product-image img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .product-info h4 {
      color: #333;
      margin: 0;
      font-size: 16px;
    }

    .product-meta {
      color: #666;
      font-size: 14px;
    }

    .product-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .unit-price {
      color: #666;
      font-size: 13px;
    }

    .total-price {
      color: #E21B22;
      font-weight: 600;
      font-size: 16px;
    }

    .summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .summary-row.total {
      border-top: 2px solid #333;
      border-bottom: none;
      padding-top: 15px;
      margin-top: 5px;
      font-size: 18px;
    }

    .summary-row.total span {
      font-size: 20px;
    }

    .discount {
      color: #28a745;
      font-weight: 600;
    }

    .status-history {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .history-item {
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #E21B22;
      border-radius: 4px;
    }

    .history-status {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }

    .history-date {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .history-note {
      color: #666;
      font-size: 13px;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .order-detail-modal-content {
        width: 98%;
        max-height: 98vh;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .product-item {
        flex-direction: column;
      }

      .product-image img {
        width: 100%;
        height: 200px;
      }

      .pagination-container {
        flex-wrap: wrap;
        gap: 8px;
      }

      .pagination-btn {
        padding: 6px 12px;
        font-size: 13px;
      }

      .pagination-page {
        min-width: 36px;
        height: 36px;
        padding: 0 8px;
        font-size: 13px;
      }
    }

    .form-hint {
      margin-top: 6px;
      font-size: 12px;
      color: #999;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 30px;
    }

    .btn-save {
      padding: 12px 24px;
      background: #E21B22;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-save:hover:not(:disabled) {
      background: #c5181f;
    }

    .btn-save:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .info-form-container .btn-cancel {
      padding: 12px 24px;
      background: #f5f5f5;
      color: #333;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }

    .info-form-container .btn-cancel:hover {
      background: #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .profile-container {
        flex-direction: column;
        padding: 10px;
      }

      .profile-sidebar {
        width: 100%;
      }

      .order-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .tab-btn {
        white-space: nowrap;
        flex-shrink: 0;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: any = null;
  error: string = '';
  successMessage: string = '';
  isUploadingAvatar = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  // Navigation
  activeSection: string = 'orders';
  showChangePasswordModal: boolean = false;
  hasPassword: boolean = false;
  
  // Orders
  orders: any[] = [];
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];
  selectedStatus: string = 'pending';
  isLoadingOrders = false;
  ordersWithPendingReviews: any[] = [];
  isCancellingOrder: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  
  // Order Detail Modal
  showOrderDetailModal: boolean = false;
  selectedOrder: any = null;
  isLoadingOrderDetail: boolean = false;
  orderDetailError: string = '';

  // Addresses
  addresses: Address[] = [];
  showAddAddressModal: boolean = false;
  addressForm: FormGroup;

  // User Info Edit
  userInfoForm: FormGroup;
  canEditName: boolean = true;
  daysUntilNextEdit: number = 0;
  isSavingUserInfo: boolean = false;
  private readonly EDIT_COOLDOWN_DAYS = 7;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private orderService: OrderService,
    private reviewService: ReviewService,
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

    this.userInfoForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadOrders();
    this.loadPendingReviews();
  }

  loadUserProfile() {
    this.userService.getAuth().subscribe({
      next: (user: any) => {
        this.user = user;
        this.previewUrl = user.avatar || null;
        this.hasPassword = !!(user.password || (!user.googleId && !user.facebookId));
        this.addresses = user.addresses || [];
        this.userInfoForm.patchValue({
          fullName: user.fullName || ''
        });
        this.checkEditCooldown();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Không thể tải thông tin người dùng';
      }
    });
  }

  checkEditCooldown() {
    const lastEditKey = `lastNameEdit_${this.user?._id}`;
    const lastEditTime = localStorage.getItem(lastEditKey);
    
    if (lastEditTime) {
      const lastEdit = new Date(lastEditTime);
      const now = new Date();
      const diffTime = now.getTime() - lastEdit.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < this.EDIT_COOLDOWN_DAYS) {
        this.canEditName = false;
        this.daysUntilNextEdit = this.EDIT_COOLDOWN_DAYS - diffDays;
      } else {
        this.canEditName = true;
        this.daysUntilNextEdit = 0;
      }
    } else {
      this.canEditName = true;
      this.daysUntilNextEdit = 0;
    }
  }

  loadOrders() {
    this.isLoadingOrders = true;
    this.orderService.getMyOrders().subscribe({
      next: (orders: any) => {
        this.orders = orders;
        if (!this.selectedStatus || this.selectedStatus === 'all') {
          this.selectedStatus = 'pending';
        }
        this.filterOrders(this.selectedStatus);
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = 'Không thể tải danh sách đơn hàng';
        this.isLoadingOrders = false;
      }
    });
  }

  loadPendingReviews() {
    this.reviewService.getMyPendingReviews().subscribe({
      next: (orders: any) => {
        this.ordersWithPendingReviews = orders;
      },
      error: (err) => {
        console.error('Error loading pending reviews:', err);
      }
    });
  }

  filterOrders(status: string) {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset to first page when filtering
    this.filteredOrders = this.orders.filter(order => {
      if (status === 'pending') {
        return order.status === 'pending' || order.status === 'pending_payment';
      } else if (status === 'confirmed') {
        return order.status === 'confirmed';
      } else if (status === 'shipped') {
        return order.status === 'shipping';
      } else if (status === 'delivered') {
        return order.status === 'delivered';
      } else if (status === 'cancelled') {
        return order.status === 'cancelled';
      }
      return false;
    });
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      // Scroll to top of orders list
      const ordersContent = document.querySelector('.orders-content');
      if (ordersContent) {
        ordersContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  canCancelOrder(order: any): boolean {
    // Chỉ có thể hủy đơn hàng pending và chưa quá 3 giờ
    if (order.status !== 'pending' && order.status !== 'pending_payment') {
      return false;
    }

    if (!order.createdAt) {
      return false;
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - orderDate.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    return diffHours <= 3;
  }

  cancelOrder(order: any) {
    if (!this.canCancelOrder(order)) {
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    this.isCancellingOrder = true;
    this.error = '';

    this.orderService.cancelOrder(order._id).subscribe({
      next: () => {
        this.isCancellingOrder = false;
        // Reload orders
        this.loadOrders();
      },
      error: (err: any) => {
        console.error('Error cancelling order:', err);
        this.error = err?.error?.message || 'Không thể hủy đơn hàng';
        this.isCancellingOrder = false;
      }
    });
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  getSectionTitle(): string {
    const titles: { [key: string]: string } = {
      'address': 'Sổ địa chỉ',
      'info': 'Thông tin của tôi'
    };
    return titles[this.activeSection] || '';
  }

  openChangePasswordModal() {
    this.showChangePasswordModal = true;
  }

  onPasswordChangeSuccess() {
    this.showChangePasswordModal = false;
  }

  onLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      this.auth.logout().subscribe({
        next: () => {
          this.router.navigate(['/store']);
        },
        error: (err) => {
          console.error('Logout error:', err);
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error = 'Vui lòng chọn file ảnh';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Kích thước ảnh không được vượt quá 5MB';
      return;
    }

    this.selectedFile = file;
    this.error = '';

    // Create preview and auto-upload
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
      this.uploadAvatar();
    };
    reader.readAsDataURL(file);
  }

  uploadAvatar() {
    if (!this.selectedFile) {
      this.error = 'Vui lòng chọn ảnh đại diện';
      return;
    }

    this.isUploadingAvatar = true;
    this.error = '';

    this.userService.uploadAvatar(this.selectedFile).subscribe({
      next: (user: any) => {
        this.isUploadingAvatar = false;
        this.user = user;
        this.previewUrl = user.avatar || null;
        this.selectedFile = null;

        // Reset file input
        const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        // Update localStorage if user is stored there
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.avatar = user.avatar;
          localStorage.setItem('user', JSON.stringify(userObj));
        }

        // Refresh auth service
        this.auth.authUser().subscribe();
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.error = err?.error?.message || 'Không thể cập nhật ảnh đại diện';
        console.error('Error uploading avatar:', err);
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'pending_payment': 'Chờ thanh toán',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đã gửi hàng',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng',
      'failed': 'Thất bại'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'shipping') return 'status-shipped';
    if (status === 'pending_payment') return 'status-pending';
    return `status-${status}`;
  }

  getShortName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Address Management
  openAddAddressModal() {
    this.addressForm.reset({ isDefault: this.addresses.length === 0 });
    this.showAddAddressModal = true;
  }

  closeAddAddressModal() {
    this.showAddAddressModal = false;
    this.addressForm.reset();
  }

  submitAddAddress() {
    if (this.addressForm.invalid) {
      this.error = 'Vui lòng điền đầy đủ thông tin địa chỉ';
      return;
    }

    const addressData = this.addressForm.value;

    this.userService.addAddress(addressData).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.closeAddAddressModal();
        this.error = '';
      },
      error: (err) => {
        console.error('Error adding address:', err);
        this.error = err?.error?.message || 'Không thể thêm địa chỉ. Vui lòng thử lại.';
      }
    });
  }

  setDefaultAddress(address: Address) {
    if (!address._id) return;

    this.userService.setDefaultAddress(address._id).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.error = '';
        this.successMessage = `Đã đặt "${address.name}" làm địa chỉ mặc định`;
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        // Reload user profile to update addresses
        this.loadUserProfile();
      },
      error: (err) => {
        console.error('Error setting default address:', err);
        this.error = err?.error?.message || 'Không thể đặt địa chỉ mặc định';
        this.successMessage = '';
      }
    });
  }

  deleteAddress(address: Address) {
    if (!address._id) return;
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    this.userService.deleteAddress(address._id).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.error = '';
      },
      error: (err) => {
        console.error('Error deleting address:', err);
        this.error = 'Không thể xóa địa chỉ';
      }
    });
  }

  // User Info Management
  submitUserInfo() {
    if (this.userInfoForm.invalid || !this.canEditName) {
      return;
    }

    const newFullName = this.userInfoForm.value.fullName;
    if (newFullName === this.user?.fullName) {
      return; // No change
    }

    this.isSavingUserInfo = true;
    this.error = '';

    this.userService.updateProfile({ fullName: newFullName }).subscribe({
      next: (updatedUser: any) => {
        this.user = updatedUser;
        this.userInfoForm.patchValue({ fullName: updatedUser.fullName });
        this.isSavingUserInfo = false;
        
        // Save last edit time
        const lastEditKey = `lastNameEdit_${this.user._id}`;
        localStorage.setItem(lastEditKey, new Date().toISOString());
        
        // Update cooldown
        this.canEditName = false;
        this.daysUntilNextEdit = this.EDIT_COOLDOWN_DAYS;
        
        // Refresh auth service
        this.auth.authUser().subscribe();
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.error = err?.error?.message || 'Không thể cập nhật thông tin';
        this.isSavingUserInfo = false;
      }
    });
  }

  openOrderDetailModal(orderId: string) {
    this.showOrderDetailModal = true;
    this.selectedOrder = null;
    this.orderDetailError = '';
    this.loadOrderDetail(orderId);
  }

  closeOrderDetailModal() {
    this.showOrderDetailModal = false;
    this.selectedOrder = null;
    this.orderDetailError = '';
  }

  loadOrderDetail(orderId: string) {
    this.isLoadingOrderDetail = true;
    this.orderDetailError = '';

    this.orderService.getOrderDetail(orderId).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.isLoadingOrderDetail = false;
      },
      error: (err) => {
        console.error('Error loading order detail:', err);
        this.orderDetailError = err?.error?.message || 'Không thể tải chi tiết đơn hàng';
        this.isLoadingOrderDetail = false;
      }
    });
  }

  getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'vnpay': 'VNPay',
      'momo': 'Momo'
    };
    return methodMap[method] || method;
  }

  getCouponDiscountText(coupon: any): string {
    if (!coupon) return '';
    if (coupon.type === 'PERCENTAGE') {
      return `Giảm ${coupon.value}%`;
    }
    return `Giảm ${this.formatPrice(coupon.value)}`;
  }

  cancelEditUserInfo() {
    if (this.user) {
      this.userInfoForm.patchValue({
        fullName: this.user.fullName
      });
      this.userInfoForm.markAsPristine();
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

