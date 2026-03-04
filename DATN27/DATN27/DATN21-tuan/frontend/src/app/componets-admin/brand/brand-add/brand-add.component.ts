import { Component, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BrandService } from '../../../services/brand/brand.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-brand-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './brand-add.component.html',
  styleUrls: ['./brand-add.component.css']
})
export class BrandAddComponent {
  private fb = inject(FormBuilder);
  private brandService = inject(BrandService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  brandForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
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
    if (this.brandForm.invalid) {
      Object.keys(this.brandForm.controls).forEach(key => {
        this.brandForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.selectedFile) {
      this.toastService.error('Vui lòng chọn logo nhãn hàng');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('name', this.brandForm.value.name!);
    formData.append('description', this.brandForm.value.description || '');
    formData.append('logo', this.selectedFile);

    this.brandService.addBrand(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm nhãn hàng thành công!');
          this.brandForm.reset();
          this.brandForm.markAsPristine();
          this.selectedFile = null;
          this.imagePreview = null;
          const fileInput = document.getElementById('logo') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          // Emit refresh event để reload danh sách brands
          this.refreshService.refreshBrands();
          this.router.navigate(['/admin/brand-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm nhãn hàng, vui lòng thử lại.');
          this.isLoading = false;
        }
      });
  }
}

