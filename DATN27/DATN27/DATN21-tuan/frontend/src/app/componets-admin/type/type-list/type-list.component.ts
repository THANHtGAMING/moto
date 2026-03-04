import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Type } from '../../../models/type';
import { TypeService } from '../../../services/type/type.service';
import { GenderService } from '../../../services/gender/gender.service';
import { TagService } from '../../../services/tag/tag.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-type-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxPaginationModule],
  templateUrl: './type-list.component.html',
  styleUrls: ['./type-list.component.css'],
})
export class TypeListComponent implements OnInit, OnDestroy {
  types: Type[] = [];
  filteredTypes: Type[] = [];
  p: number = 1;
  keyword: string = '';
  genders: any[] = [];
  tags: any[] = [];
  selectedGenderFilter: string = '';
  selectedTagFilter: string = '';
  private refreshSubscription?: Subscription;

  constructor(
    private typeService: TypeService,
    private genderService: GenderService,
    private tagService: TagService,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadGenders();
    this.loadTags();
    this.loadTypes();
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.typeRefresh$.subscribe(() => {
      this.p = 1;
      this.loadTypes();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadGenders() {
    this.genderService.getAll().subscribe({
      next: (data: any) => {
        this.genders = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải giới tính:', err);
      }
    });
  }

  loadTags() {
    this.tagService.getAll().subscribe({
      next: (data: any) => {
        this.tags = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải tags:', err);
      }
    });
  }

  loadTypes() {
    this.typeService.getAll().subscribe({
      next: (data: any) => {
        console.log('Types loaded:', data);
        // Handle different response structures
        if (Array.isArray(data)) {
          this.types = data;
        } else if (data && Array.isArray(data.metadata)) {
          this.types = data.metadata;
        } else if (data && Array.isArray(data.data)) {
          this.types = data.data;
        } else {
          this.types = [];
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi khi tải loại:', err);
        const errorMsg = err?.error?.message || 'Không thể tải danh sách loại. Vui lòng thử lại.';
        this.toastService.error(errorMsg);
        this.types = [];
        this.filteredTypes = [];
      }
    });
  }

  applyFilters() {
    let filtered = [...this.types];

    // Apply search filter
    if (this.keyword.trim() !== '') {
      filtered = filtered.filter(t =>
        (t.name || '').toLowerCase().includes(this.keyword.toLowerCase())
      );
    }

    // Apply gender filter
    if (this.selectedGenderFilter) {
      filtered = filtered.filter(t => {
        if (!t.genders || !Array.isArray(t.genders)) return false;
        const genderIds = t.genders.map((g: any) => g._id || g);
        return genderIds.includes(this.selectedGenderFilter);
      });
    }

    // Apply tag filter
    if (this.selectedTagFilter) {
      filtered = filtered.filter(t => {
        if (!t.tags || !Array.isArray(t.tags)) return false;
        const tagIds = t.tags.map((tag: any) => tag._id || tag);
        return tagIds.includes(this.selectedTagFilter);
      });
    }

    this.filteredTypes = filtered;
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

    if (confirm('Bạn có chắc muốn xóa loại này không?')) {
      this.typeService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách types
          this.refreshService.refreshTypes();
        },
        error: (err) => {
          console.error('Lỗi khi xóa loại:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa loại.');
        }
      });
    }
  }

  getGenderClass(gender: any): string {
    const genderName = (gender?.name || gender || '').toLowerCase().trim();
    
    // Nữ / Phụ nữ
    if (genderName.includes('nữ') || genderName.includes('phụ nữ') || 
        genderName === 'female' || genderName === 'women' || genderName === 'woman') {
      return 'badge-gender badge-gender-nu';
    }
    
    // Nam / Đàn ông
    if (genderName.includes('nam') || genderName.includes('đàn ông') || 
        genderName === 'male' || genderName === 'men' || genderName === 'man') {
      return 'badge-gender badge-gender-nam';
    }
    
    // Unisex / Chung
    if (genderName.includes('unisex') || genderName.includes('chung') || 
        genderName === 'both' || genderName === 'all') {
      return 'badge-gender badge-gender-unisex';
    }
    
    // Trẻ em / Kids
    if (genderName.includes('trẻ em') || genderName.includes('trẻ') || 
        genderName === 'kids' || genderName === 'children' || genderName === 'child') {
      return 'badge-gender badge-gender-kids';
    }
    
    // Mặc định
    return 'badge-gender badge-gender-default';
  }
}
