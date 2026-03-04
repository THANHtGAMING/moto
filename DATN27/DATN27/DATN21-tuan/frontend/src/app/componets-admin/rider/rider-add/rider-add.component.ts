import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RiderService } from '../../../services/rider/rider.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-rider-add',
  standalone: true,
  templateUrl: './rider-add.component.html',
  styleUrls: ['./rider-add.component.css'],
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
})
export class RiderAddComponent {
  private riderService = inject(RiderService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  riderForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
    image: new FormControl(null, Validators.required),
    team: new FormControl('')
  });
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.riderForm.patchValue({ image: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.riderForm.invalid) {
      Object.keys(this.riderForm.controls).forEach(key => {
        this.riderForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.selectedFile) {
      this.toastService.error('Vui lòng chọn ảnh tay đua');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('name', this.riderForm.value.name!);
    if (this.riderForm.value.team) {
      formData.append('team', this.riderForm.value.team);
    }
    formData.append('image', this.selectedFile);

    this.riderService.addRider(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm tay đua thành công!');
          this.riderForm.reset();
          this.riderForm.markAsPristine();
          this.selectedFile = null;
          this.imagePreview = null;
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          // Emit refresh event để reload danh sách riders
          this.refreshService.refreshRiders();
          this.router.navigate(['/admin/rider-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm tay đua, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}
