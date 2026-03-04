import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { BrandService } from '../../../services/brand/brand.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.css'],
})
export class BrandListComponent implements OnInit, OnDestroy {
  brands: any[] = [];
  filteredBrands: any[] = [];
  p: number = 1;
  keyword: string = '';
  statusFilter: string = '';
  private refreshSubscription?: Subscription;

  constructor(
    private brandService: BrandService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadBrands();
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.brandRefresh$.subscribe(() => {
      this.p = 1;
      this.loadBrands();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadBrands() {
    this.brandService.getAll().subscribe({
      next: (data: any) => {
        this.brands = Array.isArray(data) ? data : [];
        this.applyFilters(); // Apply filters after loading
      },
      error: (err) => {
        console.error('Lỗi khi tải nhãn hàng:', err);
        this.toastService.error('Không thể tải danh sách nhãn hàng. Vui lòng thử lại.');
      }
    });
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.brands];

    // Filter by keyword
    if (this.keyword.trim() !== '') {
      result = result.filter(b =>
        (b.name || '').toLowerCase().includes(this.keyword.toLowerCase())
      );
    }

    // Filter by status
    if (this.statusFilter) {
      result = result.filter(b => b.status === this.statusFilter);
    }

    this.filteredBrands = result;
    this.p = 1;
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa nhãn hàng này không?')) {
      this.brandService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách brands
          this.refreshService.refreshBrands();
        },
        error: (err) => {
          console.error('Lỗi khi xóa nhãn hàng:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa nhãn hàng.');
        }
      });
    }
  }

  getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  onImageError(event: any) {
    event.target.src = this.getDefaultImage();
  }

  toggleActive(brand: any) {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    const formData = new FormData();
    formData.append('status', newStatus);
    formData.append('name', brand.name || '');
    formData.append('description', brand.description || '');
    
    // Handle logo if exists
    if (brand.logoUrl) {
      formData.append('oldLogoUrl', brand.logoUrl);
    }
    
    this.brandService.updateBrand(brand._id, formData).subscribe({
      next: (res: any) => {
        // Update the brand in the brands array first
        const brandIndex = this.brands.findIndex(b => b._id === brand._id);
        if (brandIndex !== -1) {
          this.brands[brandIndex].status = newStatus;
        }
        
        // Also update the brand object passed in (for immediate UI update)
        brand.status = newStatus;
        
        this.toastService.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'tắt'} nhãn hàng "${brand.name}"`);
        
        // Apply filters again to reflect the change
        // Brand will show/hide based on current filter
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        this.toastService.error(err?.error?.message || 'Không thể cập nhật trạng thái, vui lòng thử lại.');
      }
    });
  }
}

