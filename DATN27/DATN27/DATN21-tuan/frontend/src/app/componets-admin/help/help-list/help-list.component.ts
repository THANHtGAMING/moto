import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { HelpService, Help } from '../../../services/help/help.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-help-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxPaginationModule],
  templateUrl: './help-list.component.html',
  styleUrls: ['./help-list.component.css'],
})
export class HelpListComponent implements OnInit, OnDestroy {
  helps: Help[] = [];
  filteredHelps: Help[] = [];
  p: number = 1;
  keyword: string = '';
  statusFilter: string = '';
  private refreshSubscription?: Subscription;

  constructor(
    private helpService: HelpService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadHelps();
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.helpRefresh$.subscribe(() => {
      this.p = 1;
      this.loadHelps();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadHelps() {
    this.helpService.getAll().subscribe({
      next: (data: any) => {
        console.log('Helps loaded:', data);
        // Handle different response structures
        if (Array.isArray(data)) {
          this.helps = data;
        } else if (data && Array.isArray(data.metadata)) {
          this.helps = data.metadata;
        } else if (data && Array.isArray(data.data)) {
          this.helps = data.data;
        } else {
          this.helps = [];
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách trợ giúp:', err);
        const errorMsg = err?.error?.message || 'Không thể tải danh sách trợ giúp. Vui lòng thử lại.';
        this.toastService.error(errorMsg);
        this.helps = [];
        this.filteredHelps = [];
      }
    });
  }

  applyFilters() {
    let filtered = [...this.helps];

    // Apply search filter
    if (this.keyword.trim() !== '') {
      filtered = filtered.filter(h =>
        (h.name || '').toLowerCase().includes(this.keyword.toLowerCase()) ||
        (h.description || '').toLowerCase().includes(this.keyword.toLowerCase())
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(h => h.status === this.statusFilter);
    }

    // Sort by order
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    this.filteredHelps = filtered;
    this.p = 1; // Reset về trang 1 khi filter thay đổi
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  onDelete(id: string) {
    if (!id) {
      this.toastService.error('ID không hợp lệ');
      return;
    }

    if (confirm('Bạn có chắc muốn xóa mục trợ giúp này không?')) {
      this.helpService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách helps
          this.refreshService.refreshHelps();
        },
        error: (err) => {
          console.error('Lỗi khi xóa trợ giúp:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa trợ giúp.');
        }
      });
    }
  }

  toggleStatus(help: Help) {
    const newStatus = help.status === 'active' ? 'inactive' : 'active';
    this.helpService.update(help._id, { status: newStatus }).subscribe({
      next: (res: any) => {
        help.status = newStatus;
        this.toastService.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} thành công!`);
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        const errorMsg = err?.error?.message || 'Không thể cập nhật trạng thái, vui lòng thử lại.';
        this.toastService.error(errorMsg);
      }
    });
  }
}

