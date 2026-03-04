import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TagService } from '../../../services/tag/tag.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tag-add',
  standalone: true,
  templateUrl: './tag-add.component.html',
  styleUrls: ['./tag-add.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class TagAddComponent {
  private tagService = inject(TagService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  tagForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)])
  });
  isLoading = false;

  onSubmit() {
    if (this.tagForm.invalid) {
      Object.keys(this.tagForm.controls).forEach(key => {
        this.tagForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    this.tagService.create({ name: this.tagForm.value.name! })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm tag thành công!');
          this.tagForm.reset();
          this.tagForm.markAsPristine();
          // Emit refresh event để reload danh sách tags
          this.refreshService.refreshTags();
          this.router.navigate(['/admin/tag-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm tag, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}

