import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GenderService } from '../../../services/gender/gender.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-gender-add',
  standalone: true,
  templateUrl: './gender-add.component.html',
  styleUrls: ['./gender-add.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class GenderAddComponent {
  private genderService = inject(GenderService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  genderForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)])
  });
  isLoading = false;

  onSubmit() {
    if (this.genderForm.invalid) {
      Object.keys(this.genderForm.controls).forEach(key => {
        this.genderForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    this.genderService.create({ name: this.genderForm.value.name! })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm giới tính thành công!');
          this.genderForm.reset();
          this.genderForm.markAsPristine();
          // Emit refresh event để reload danh sách genders
          this.refreshService.refreshGenders();
          this.router.navigate(['/admin/gender-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm giới tính, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}

