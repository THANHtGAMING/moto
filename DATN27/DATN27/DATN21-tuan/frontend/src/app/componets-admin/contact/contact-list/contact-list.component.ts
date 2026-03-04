import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { ContactService, Contact } from '../../../services/contact/contact.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgxPaginationModule],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css'],
})
export class ContactListComponent implements OnInit {
  contacts: Contact[] = [];
  filteredContacts: Contact[] = [];
  p: number = 1;
  keyword: string = '';
  statusFilter: string = '';
  isReadFilter: string = '';
  selectedContact: Contact | null = null;
  showDetailModal: boolean = false;
  showReplyModal: boolean = false;
  replyMessage: string = '';

  constructor(
    private contactService: ContactService,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    const isRead = this.isReadFilter === 'true' ? true : this.isReadFilter === 'false' ? false : undefined;
    this.contactService.getAll(this.statusFilter || undefined, isRead).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.contacts = data;
        } else if (data && Array.isArray(data.metadata)) {
          this.contacts = data.metadata;
        } else if (data && Array.isArray(data.data)) {
          this.contacts = data.data;
        } else {
          this.contacts = [];
        }
        this.applyFilters();
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách thư:', err);
        this.toastService.error(err?.error?.message || 'Không thể tải danh sách thư. Vui lòng thử lại.');
        this.contacts = [];
        this.filteredContacts = [];
      }
    });
  }

  applyFilters() {
    let filtered = [...this.contacts];

    // Apply search filter
    if (this.keyword.trim() !== '') {
      const keywordLower = this.keyword.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name || '').toLowerCase().includes(keywordLower) ||
        (c.email || '').toLowerCase().includes(keywordLower) ||
        (c.subject || '').toLowerCase().includes(keywordLower) ||
        (c.message || '').toLowerCase().includes(keywordLower)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // Apply isRead filter
    if (this.isReadFilter === 'true') {
      filtered = filtered.filter(c => c.isRead === true);
    } else if (this.isReadFilter === 'false') {
      filtered = filtered.filter(c => c.isRead === false);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    this.filteredContacts = filtered;
    this.p = 1; // Reset to first page when filtering
  }

  onFilterChange() {
    this.loadContacts();
    this.p = 1;
  }

  onSearch() {
    this.applyFilters();
    this.p = 1;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status?: string): string {
    const statusMap: { [key: string]: string } = {
      'new': 'Mới',
      'read': 'Đã đọc',
      'replied': 'Đã trả lời',
      'archived': 'Đã lưu trữ'
    };
    return statusMap[status || 'new'] || 'Mới';
  }

  getStatusClass(status?: string): string {
    const classMap: { [key: string]: string } = {
      'new': 'status-new',
      'read': 'status-read',
      'replied': 'status-replied',
      'archived': 'status-archived'
    };
    return classMap[status || 'new'] || 'status-new';
  }

  viewDetail(contact: Contact) {
    this.selectedContact = contact;
    this.showDetailModal = true;
    // Đánh dấu đã đọc khi xem chi tiết
    if (!contact.isRead) {
      this.contactService.updateStatus(contact._id!, { status: 'read' }).subscribe({
        next: () => {
          contact.isRead = true;
          contact.status = 'read';
        }
      });
    }
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedContact = null;
  }

  openReplyModal(contact: Contact) {
    this.selectedContact = contact;
    this.replyMessage = contact.replyMessage || '';
    this.showReplyModal = true;
  }

  closeReplyModal() {
    this.showReplyModal = false;
    this.selectedContact = null;
    this.replyMessage = '';
  }

  sendReply() {
    if (!this.selectedContact || !this.selectedContact._id) return;
    if (!this.replyMessage.trim()) {
      this.toastService.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    this.contactService.updateStatus(this.selectedContact._id, {
      replyMessage: this.replyMessage,
      status: 'replied'
    }).subscribe({
      next: (res: any) => {
        this.toastService.success('Trả lời thư thành công!');
        this.closeReplyModal();
        // Emit refresh event
        this.refreshService.refreshContacts();
      },
      error: (err: any) => {
        console.error('Lỗi khi trả lời thư:', err);
        this.toastService.error(err?.error?.message || 'Không thể trả lời thư, vui lòng thử lại.');
      }
    });
  }

  updateStatus(contact: Contact, newStatus: string) {
    if (!contact._id) return;

    this.contactService.updateStatus(contact._id, { status: newStatus }).subscribe({
      next: () => {
        contact.status = newStatus as any;
        if (newStatus === 'read' || newStatus === 'replied') {
          contact.isRead = true;
        }
        this.toastService.success(`Đã cập nhật trạng thái thành ${this.getStatusLabel(newStatus)}`);
        // Emit refresh event
        this.refreshService.refreshContacts();
      },
      error: (err: any) => {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        this.toastService.error(err?.error?.message || 'Không thể cập nhật trạng thái, vui lòng thử lại.');
      }
    });
  }

  onDelete(contact: Contact) {
    if (!contact._id) return;

    if (confirm('Bạn có chắc muốn xóa thư liên hệ này không?')) {
      this.contactService.delete(contact._id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách contacts
          this.refreshService.refreshContacts();
        },
        error: (err: any) => {
          console.error('Lỗi khi xóa thư:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa thư.');
        }
      });
    }
  }

  getUnreadCount(): number {
    return this.filteredContacts.filter(c => !c.isRead).length;
  }

  getRepliedCount(): number {
    return this.filteredContacts.filter(c => c.status === 'replied').length;
  }
}

