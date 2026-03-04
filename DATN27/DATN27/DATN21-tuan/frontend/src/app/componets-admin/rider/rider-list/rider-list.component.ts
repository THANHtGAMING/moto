import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Rider } from '../../../models/rider';
import { RiderService } from '../../../services/rider/rider.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rider-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
  templateUrl: './rider-list.component.html',
  styleUrls: ['./rider-list.component.css'],
})
export class RiderListComponent implements OnInit, OnDestroy {
  riders: Rider[] = [];
  filteredRiders: Rider[] = [];
  p: number = 1;
  keyword: string = '';
  private refreshSubscription?: Subscription;

  constructor(
    private riderService: RiderService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadRiders();
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.riderRefresh$.subscribe(() => {
      this.p = 1;
      this.loadRiders();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadRiders() {
    this.riderService.getAll().subscribe({
      next: (data: any) => {
        this.riders = Array.isArray(data) ? data : [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi khi tải tay đua:', err);
        this.toastService.error('Không thể tải danh sách tay đua. Vui lòng thử lại.');
      }
    });
  }

  onSearch() {
    this.applyFilters();
    this.p = 1;
  }

  applyFilters() {
    let filtered = [...this.riders];

    // Filter by keyword
    if (this.keyword.trim() !== '') {
      filtered = filtered.filter(r =>
        (r.name || '').toLowerCase().includes(this.keyword.toLowerCase())
      );
    }

    this.filteredRiders = filtered;
  }

  getRiderTeamLabel(rider: Rider): string {
    const team = rider.team || '';
    return team || 'Không có đội';
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa tay đua này không?')) {
      this.riderService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách riders
          this.refreshService.refreshRiders();
        },
        error: (err) => {
          console.error('Lỗi khi xóa tay đua:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa tay đua.');
        }
      });
    }
  }
}
