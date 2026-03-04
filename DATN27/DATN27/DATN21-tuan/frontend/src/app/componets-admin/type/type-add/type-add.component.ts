import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TypeService } from '../../../services/type/type.service';
import { GenderService } from '../../../services/gender/gender.service';
import { TagService } from '../../../services/tag/tag.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-type-add',
  standalone: true,
  templateUrl: './type-add.component.html',
  styleUrls: ['./type-add.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class TypeAddComponent {
  private typeService = inject(TypeService);
  private genderService = inject(GenderService);
  private tagService = inject(TagService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  typeForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)])
  });
  isLoading = false;
  genders: any[] = [];
  selectedGenders: string[] = [];
  tags: any[] = [];
  selectedTags: string[] = [];

  constructor() {
    this.loadGenders();
    this.loadTags();
  }

  loadGenders() {
    this.genderService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.genders = Array.isArray(data) ? data : [];
        }
      });
  }

  onGenderChange(genderId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedGenders.includes(genderId)) {
        this.selectedGenders.push(genderId);
      }
    } else {
      this.selectedGenders = this.selectedGenders.filter(id => id !== genderId);
    }
  }

  isGenderSelected(genderId: string): boolean {
    return this.selectedGenders.includes(genderId);
  }

  loadTags() {
    this.tagService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.tags = Array.isArray(data) ? data : [];
        }
      });
  }

  onTagChange(tagId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedTags.includes(tagId)) {
        this.selectedTags.push(tagId);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    }
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTags.includes(tagId);
  }

  onSubmit() {
    if (this.typeForm.invalid) {
      Object.keys(this.typeForm.controls).forEach(key => {
        this.typeForm.get(key)?.markAsTouched();
      });
      return;
    }

    const name = this.typeForm.value.name?.trim();
    if (!name || name.length === 0) {
      this.toastService.error('Tên loại không được để trống');
      return;
    }

    this.isLoading = true;

    this.typeService.addType({
      name,
      genders: this.selectedGenders,
      tags: this.selectedTags
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm loại thành công!');
          this.typeForm.reset();
          this.typeForm.markAsPristine();
          this.selectedGenders = [];
          this.selectedTags = [];
          // Emit refresh event để reload danh sách types
          this.refreshService.refreshTypes();
          this.router.navigate(['/admin/type-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || err?.error?.error || 'Không thể thêm loại, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}
