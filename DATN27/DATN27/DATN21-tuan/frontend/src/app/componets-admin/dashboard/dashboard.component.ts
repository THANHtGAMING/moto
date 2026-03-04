import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { firstValueFrom, Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService, Notification } from '../../services/notification/notification.service';
import { ContactService, Contact } from '../../services/contact/contact.service';
import { ChatService } from '../../services/chat/chat.service';
import { AdminOrderService } from '../../services/admin-order/admin-order.service';
import { UserService } from '../../services/user/user.service';
import { ToastService } from '../../services/toast/toast.service';
import { LogoService, Logo } from '../../services/logo/logo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterOutlet, CommonModule, RouterLink, NgxPaginationModule, FormsModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  isProductMenuOpen: boolean = false;
  isCategoryMenuOpen: boolean = false;
  isSupportMenuOpen: boolean = false;
  isUserMenuOpen: boolean = false;

  // Admin info
  adminUser: any = null;
  adminName: string = '';
  adminInitials: string = '';
  adminAvatar: string = '';

  // Notifications
  showNotificationDropdown: boolean = false;
  notifications: Notification[] = [];
  unreadNotificationCount: number = 0;

  // Orders
  pendingOrdersCount: number = 0;

  // Contacts/Chat
  showContactDropdown: boolean = false;
  contacts: Contact[] = [];
  unreadContactCount: number = 0;
  unreadChatCount: number = 0;

  // User dropdown
  showUserDropdown: boolean = false;

  // Edit Profile Modal
  showEditProfileModal: boolean = false;
  editProfileForm: { fullName: string } = { fullName: '' };
  selectedAvatarFile: File | null = null;
  previewAvatar: string | null = null;
  isUpdating: boolean = false;

  // Pinned Logo
  pinnedLogo: Logo | null = null;

  private routerSubscription?: Subscription;
  private refreshInterval?: any;
  private previousUrl: string = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private contactService: ContactService,
    private chatService: ChatService,
    private adminOrderService: AdminOrderService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
    private logoService: LogoService
  ) { 
    // Lưu URL hiện tại khi khởi tạo
    this.previousUrl = this.router.url;
  }

  ngOnInit() {
    this.loadAdminInfo();
    this.loadNotifications();
    this.loadContacts();
    this.loadUnreadContactCount();
    this.loadUnreadChatCount();
    this.loadPendingOrders();
    this.loadPinnedLogo();
    
    // Refresh counts every 10 seconds (giảm xuống để cập nhật nhanh hơn)
    this.refreshInterval = setInterval(() => {
      this.loadUnreadChatCount();
      this.loadUnreadContactCount();
    }, 10000);
    
    // Refresh unread counts khi quay lại từ chat hoặc contact pages
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects || event.url || '';
      
      // Nếu URL trước đó là chat/contact và URL hiện tại không phải chat/contact => đã quay lại
      const wasOnChatOrContact = this.previousUrl.includes('/admin/chat') || this.previousUrl.includes('/admin/contact');
      const isNotOnChatOrContact = !currentUrl.includes('/admin/chat') && !currentUrl.includes('/admin/contact');
      
      if (wasOnChatOrContact && isNotOnChatOrContact) {
        // Đã quay lại từ chat/contact page, refresh counts
        this.loadUnreadChatCount();
        this.loadUnreadContactCount();
      }
      
      // Cập nhật previousUrl
      this.previousUrl = currentUrl;
    });
    
    // Đóng dropdown khi click bên ngoài
    document.addEventListener('click', (event: any) => {
      if (!event.target.closest('.notification-btn') && !event.target.closest('.notification-dropdown')) {
        this.showNotificationDropdown = false;
      }
      if (!event.target.closest('.contact-btn') && !event.target.closest('.contact-dropdown')) {
        this.showContactDropdown = false;
      }
      if (!event.target.closest('.user-profile') && !event.target.closest('.user-dropdown')) {
        this.showUserDropdown = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadAdminInfo() {
    this.authService.authUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.adminUser = user;
          this.adminName = user.fullName || user.name || 'Admin';
          this.adminAvatar = user.avatar || '';
          // Tạo initials từ tên
          const names = this.adminName.split(' ');
          if (names.length >= 2) {
            this.adminInitials = (names[0][0] + names[names.length - 1][0]).toUpperCase();
          } else {
            this.adminInitials = this.adminName.substring(0, 2).toUpperCase();
          }
        }
      },
      error: () => {
        this.adminName = 'Admin';
        this.adminInitials = 'AD';
        this.adminAvatar = '';
      }
    });
  }

  loadNotifications() {
    this.notificationService.getMyNotifications(1, 10).subscribe({
      next: (data: any) => {
        this.notifications = data.notifications || data || [];
        this.unreadNotificationCount = data.unreadCount || this.notifications.filter(n => !n.isRead).length;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông báo:', err);
        this.notifications = [];
        this.unreadNotificationCount = 0;
      }
    });
  }

  loadContacts() {
    this.contactService.getAll().subscribe({
      next: (data: Contact[]) => {
        this.contacts = data || [];
      },
      error: (err) => {
        console.error('Lỗi khi tải thư liên hệ:', err);
        this.contacts = [];
      }
    });
  }

  loadUnreadContactCount() {
    this.contactService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadContactCount = count || 0;
      },
      error: (err) => {
        console.error('Lỗi khi tải số thư chưa đọc:', err);
        this.unreadContactCount = 0;
      }
    });
  }

  loadUnreadChatCount() {
    this.chatService.getAdminUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadChatCount = count || 0;
      },
      error: (err) => {
        console.error('Lỗi khi tải số tin nhắn chat chưa đọc:', err);
        this.unreadChatCount = 0;
      }
    });
  }

  loadPendingOrders() {
    this.adminOrderService.getOrderList({ status: 'pending', page: 1, limit: 1 }).subscribe({
      next: (data: any) => {
        this.pendingOrdersCount = data.pagination?.total || 0;
      },
      error: (err) => {
        console.error('Lỗi khi tải đơn hàng chờ xử lý:', err);
        this.pendingOrdersCount = 0;
      }
    });
  }

  // Tổng số thông báo (notifications + pending orders + chat + contact)
  getTotalNotificationCount(): number {
    return this.unreadNotificationCount + this.pendingOrdersCount + this.unreadChatCount + this.unreadContactCount;
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    this.showContactDropdown = false;
    this.showUserDropdown = false;
  }

  toggleContactDropdown() {
    this.showContactDropdown = !this.showContactDropdown;
    this.showNotificationDropdown = false;
    this.showUserDropdown = false;
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotificationDropdown = false;
    this.showContactDropdown = false;
  }

  markNotificationAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        this.loadNotifications();
      }
    });
  }

  goToContactList() {
    this.router.navigate(['/admin/contact-list']);
    this.showContactDropdown = false;
  }

  goToChat() {
    this.router.navigate(['/admin/chat']);
    this.showContactDropdown = false;
    // Refresh unread count khi điều hướng đến chat
    setTimeout(() => {
      this.loadUnreadChatCount();
    }, 500);
  }

  goToPendingOrders() {
    this.router.navigate(['/admin/order-list'], { queryParams: { status: 'pending' } });
    this.showNotificationDropdown = false;
  }

  loadPinnedLogo() {
    this.logoService.getPinnedLogo().subscribe({
      next: (logo) => {
        this.pinnedLogo = logo;
      },
      error: (err) => {
        console.error('Lỗi khi tải logo đã ghim:', err);
        // Không hiển thị lỗi, chỉ để fallback về chữ C
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  toggleProductMenu() {
    this.isProductMenuOpen = !this.isProductMenuOpen;
  }

  toggleCategoryMenu() {
    this.isCategoryMenuOpen = !this.isCategoryMenuOpen;
  }

  toggleSupportMenu() {
    this.isSupportMenuOpen = !this.isSupportMenuOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openEditProfileModal() {
    this.editProfileForm.fullName = this.adminName;
    this.previewAvatar = null;
    this.selectedAvatarFile = null;
    this.showEditProfileModal = true;
    this.showUserDropdown = false;
  }

  closeEditProfileModal() {
    this.showEditProfileModal = false;
    this.editProfileForm = { fullName: '' };
    this.selectedAvatarFile = null;
    this.previewAvatar = null;
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Vui lòng chọn file ảnh!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Kích thước file không được vượt quá 5MB!');
        return;
      }

      this.selectedAvatarFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewAvatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.selectedAvatarFile = null;
    this.previewAvatar = null;
  }

  async updateProfile() {
    if (this.isUpdating) return;

    this.isUpdating = true;

    try {
      // Update avatar first if selected
      if (this.selectedAvatarFile) {
        await firstValueFrom(this.userService.uploadAvatar(this.selectedAvatarFile));
      }

      // Update fullName if changed
      if (this.editProfileForm.fullName !== this.adminName) {
        await firstValueFrom(this.userService.updateProfile({ fullName: this.editProfileForm.fullName }));
      }

      // Reload admin info to reflect changes
      this.loadAdminInfo();
      this.closeEditProfileModal();
      this.toastService.success('Cập nhật hồ sơ thành công!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.toastService.error('Có lỗi xảy ra khi cập nhật hồ sơ: ' + (error.error?.message || error.message || 'Lỗi không xác định'));
    } finally {
      this.isUpdating = false;
    }
  }
}
