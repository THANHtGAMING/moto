import { Component, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news/news.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-news-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './news-add.component.html',
  styleUrls: ['./news-add.component.css']
})
export class NewsAddComponent {
  private fb = inject(FormBuilder);
  private newsService = inject(NewsService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  newsForm = this.fb.group({
    title: ['', [Validators.required]],
    content: ['', [Validators.required]],
    category_code: ['', [Validators.required]],
    status_code: ['published']
  });
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.newsForm.invalid) {
      Object.keys(this.newsForm.controls).forEach(key => {
        this.newsForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    const formValue = this.newsForm.value;
    const formData = new FormData();
    formData.append('title', formValue.title!);
    formData.append('content', formValue.content!);
    formData.append('category_code', formValue.category_code!);
    formData.append('status_code', formValue.status_code!);

    if (this.selectedFile) {
      formData.append('cover_image', this.selectedFile);
    }

    this.newsService.addnews(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm tin tức thành công!');
          this.newsForm.reset();
          this.newsForm.markAsPristine();
          this.newsForm.patchValue({ status_code: 'published' });
          this.selectedFile = null;
          this.imagePreview = null;
          const fileInput = document.getElementById('cover_image') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          // Emit refresh event để reload danh sách news
          this.refreshService.refreshNews();
          this.router.navigate(['/admin/news-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm tin tức, vui lòng thử lại.');
          this.isLoading = false;
        }
      });
  }
}
