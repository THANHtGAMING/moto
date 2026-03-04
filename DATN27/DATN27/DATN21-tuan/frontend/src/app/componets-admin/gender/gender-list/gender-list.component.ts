import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { Gender } from '../../../models/gender';
import { GenderService } from '../../../services/gender/gender.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-gender-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
  templateUrl: './gender-list.component.html',
  styleUrls: ['./gender-list.component.css'],
})
export class GenderListComponent implements OnInit, OnDestroy {
  genders: Gender[] = [];
  filteredGenders: Gender[] = [];
  p = 1;
  keyword = '';
  private routerSubscription?: Subscription;
  private refreshSubscription?: Subscription;

  constructor(
    private genderService: GenderService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadGenders();
    // Reload khi quay lại từ add/edit page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/admin/gender-list' || event.urlAfterRedirects === '/admin/gender-list') {
          this.loadGenders();
        }
      });
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.genderRefresh$.subscribe(() => {
      this.p = 1;
      this.loadGenders();
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadGenders() {
    this.genderService.getAll().subscribe({
      next: (data: any) => {
        this.genders = Array.isArray(data) ? data : [];
        this.applyFilters();
      },
      error: () => this.toastService.error('Không thể tải danh sách giới tính.')
    });
  }

  applyFilters() {
    const keyword = this.keyword.trim().toLowerCase();
    this.filteredGenders = this.genders.filter(g =>
      g.name?.toLowerCase().includes(keyword)
    );
  }

  onSearch() {
    this.applyFilters();
    this.p = 1;
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa giới tính này không?')) {
      this.genderService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách genders
          this.refreshService.refreshGenders();
        },
        error: (err) => this.toastService.error(err?.error?.message || 'Không thể xóa giới tính.')
      });
    }
  }
}
