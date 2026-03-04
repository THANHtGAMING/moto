  import { CommonModule } from '@angular/common';
  import { Component, OnInit, OnDestroy } from '@angular/core';
  import { Router, RouterLink, NavigationEnd } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { NgxPaginationModule } from 'ngx-pagination';
  import { Tag } from '../../../models/tag';
  import { TagService } from '../../../services/tag/tag.service';
  import { RefreshService } from '../../../services/refresh.service';
  import { ToastService } from '../../../services/toast/toast.service';
  import { filter, Subscription } from 'rxjs';

  @Component({
    selector: 'app-tag-list',
    standalone: true,
    imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
    templateUrl: './tag-list.component.html',
    styleUrls: ['./tag-list.component.css'],
  })
  export class TagListComponent implements OnInit, OnDestroy {
    tags: Tag[] = [];
    filteredTags: Tag[] = [];
    p: number = 1;
    keyword: string = '';
    private routerSubscription?: Subscription;
    private refreshSubscription?: Subscription;

    constructor(
      private tagService: TagService,
      private router: Router,
      private refreshService: RefreshService,
      private toastService: ToastService
    ) {}

    ngOnInit() {
      this.loadTags();
      // Reload khi quay lại từ add/edit page
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          if (event.url === '/admin/tag-list' || event.urlAfterRedirects === '/admin/tag-list') {
            this.loadTags();
          }
        });
      // Subscribe to refresh events
      this.refreshSubscription = this.refreshService.tagRefresh$.subscribe(() => {
        this.p = 1;
        this.loadTags();
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

    loadTags() {
      this.tagService.getAll().subscribe({
        next: (data: any) => {
          this.tags = Array.isArray(data) ? data : [];
          this.applyFilters();
        },
        error: (err) => {
          console.error('Lỗi khi tải tags:', err);
          this.toastService.error('Không thể tải danh sách tags. Vui lòng thử lại.');
        }
      });
    }

    applyFilters() {
      let filtered = [...this.tags];

      // Apply search filter
      if (this.keyword.trim() !== '') {
        filtered = filtered.filter(t =>
          (t.name || '').toLowerCase().includes(this.keyword.toLowerCase())
        );
      }

      this.filteredTags = filtered;
    }

    onSearch() {
      this.applyFilters();
      this.p = 1;
    }

    onDelete(id: string) {
      if (confirm('Bạn có chắc muốn xóa tag này không?')) {
        this.tagService.delete(id).subscribe({
          next: () => {
            this.toastService.success('Xóa thành công!');
            // Emit refresh event để reload danh sách tags
            this.refreshService.refreshTags();
          },
          error: (err) => {
            console.error('Lỗi khi xóa tag:', err);
            this.toastService.error(err?.error?.message || 'Không thể xóa tag.');
          }
        });
      }
    }
  }

