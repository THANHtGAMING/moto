import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CouponService } from '../../../services/coupon/coupon.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-coupon-add',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './coupon-add.component.html',
  styleUrls: ['./coupon-add.component.css']
})
export class CouponAddComponent {
  private fb = inject(FormBuilder);
  private couponService = inject(CouponService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  couponForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    type: ['PERCENTAGE', Validators.required],
    value: [10, [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    minOrderValue: [0, [Validators.min(0)]],
    usageLimit: [100, [Validators.required, Validators.min(1)]]
  });
  isLoading = false;

  constructor() {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.couponForm.patchValue({
      startDate: this.formatDateForInput(today),
      endDate: this.formatDateForInput(nextMonth)
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.couponForm.invalid) {
      Object.keys(this.couponForm.controls).forEach(key => {
        this.couponForm.get(key)?.markAsTouched();
      });
      return;
    }

    const startDate = new Date(this.couponForm.value.startDate!);
    const endDate = new Date(this.couponForm.value.endDate!);
    if (endDate <= startDate) {
      this.toastService.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    this.isLoading = true;

    const formValue = this.couponForm.value;
    const payload = {
      code: formValue.code!.toUpperCase(),
      name: formValue.name!,
      description: formValue.description || '',
      type: formValue.type! as 'PERCENTAGE' | 'FIXED_AMOUNT',
      value: formValue.value!,
      startDate: formValue.startDate!,
      endDate: formValue.endDate!,
      minOrderValue: formValue.minOrderValue || 0,
      usageLimit: formValue.usageLimit!
    };

    this.couponService.create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (coupon) => {
          this.toastService.success(`Tạo mã "${coupon.code}" thành công!`);
          this.couponForm.reset();
          this.couponForm.markAsPristine();
          const today = new Date();
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          this.couponForm.patchValue({
            type: 'PERCENTAGE',
            value: 10,
            startDate: this.formatDateForInput(today),
            endDate: this.formatDateForInput(nextMonth),
            minOrderValue: 0,
            usageLimit: 100
          });
          // Emit refresh event để reload danh sách coupons
          this.refreshService.refreshCoupons();
          this.router.navigate(['/admin/coupon-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể tạo mã giảm giá');
          this.isLoading = false;
        }
      });
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.couponForm.patchValue({ code });
  }
}

