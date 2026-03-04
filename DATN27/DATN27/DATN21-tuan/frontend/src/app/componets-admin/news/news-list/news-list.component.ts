import { Component, OnInit, OnDestroy } from '@angular/core';
import { New } from '../../../models/news';
import { NewsService } from '../../../services/news/news.service';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-news-list',
  standalone:true,
  templateUrl: './news-list.component.html',
  styleUrls: ['./news-list.component.css'],
   imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
})
export class NewsListComponent implements OnInit, OnDestroy {
 news: New[] = [];
  filterednews: New[] = [];
  p: number = 1;
  keyword: string = '';
  private refreshSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private newsService: NewsService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadNews();
    // Reload khi quay lại từ add/edit page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/admin/news-list' || event.urlAfterRedirects === '/admin/news-list') {
          this.loadNews();
        }
      });
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.newsRefresh$.subscribe(() => {
      this.p = 1;
      this.loadNews();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadNews() {
    this.newsService.getAll().subscribe({
      next: (data) => {
        this.news = data as New[];
        this.filterednews = this.news;
        if (this.keyword.trim() !== '') {
          this.onSearch();
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh mục:', err);
      }
    });
  }

  onSearch() {
    if (this.keyword.trim() === '') {
      this.filterednews = this.news;
    } else {
      this.filterednews = this.news.filter(c =>
        (c.title || c.name || '').toLowerCase().includes(this.keyword.toLowerCase())
      );
    }
    this.p = 1;
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa danh mục này không?')) {
      this.newsService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách news
          this.refreshService.refreshNews();
        },
        error: (err) => {
          console.error('Lỗi khi xóa danh mục:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa danh mục.');
        }
      });
    }
  }
}
