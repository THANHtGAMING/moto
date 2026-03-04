import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CouponService, Coupon } from '../../../services/coupon/coupon.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-coupon-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './coupon-edit.component.html',
  styleUrls: ['./coupon-edit.component.css']
})
export class CouponEditComponent implements OnInit {
  couponForm: FormGroup;
  couponId: string = '';
  coupon: Coupon | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private couponService: CouponService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['PERCENTAGE', Validators.required],
      value: [10, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      minOrderValue: [0, [Validators.min(0)]],
      usageLimit: [100, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.couponId = this.route.snapshot.paramMap.get('id') || '';
    if (this.couponId) {
      this.loadCoupon();
    }
  }

  loadCoupon() {
    this.isLoading = true;
    this.couponService.getById(this.couponId).subscribe({
      next: (coupon) => {
        this.coupon = coupon;
        this.couponForm.patchValue({
          code: coupon.code,
          name: coupon.name,
          description: coupon.description || '',
          type: coupon.type,
          value: coupon.value,
          startDate: this.formatDateForInput(coupon.startDate),
          endDate: this.formatDateForInput(coupon.endDate),
          minOrderValue: coupon.minOrderValue,
          usageLimit: coupon.usageLimit,
          isActive: coupon.isActive
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Không thể tải thông tin mã giảm giá';
        this.isLoading = false;
      }
    });
  }

  formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.couponForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin';
      return;
    }

    // Validate dates
    const startDate = new Date(this.couponForm.value.startDate);
    const endDate = new Date(this.couponForm.value.endDate);
    if (endDate <= startDate) {
      this.errorMessage = 'Ngày kết thúc phải sau ngày bắt đầu';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const payload = {
      ...this.couponForm.value,
      code: this.couponForm.value.code.toUpperCase()
    };

    this.couponService.update(this.couponId, payload).subscribe({
      next: (coupon) => {
        this.isSaving = false;
        this.toastService.success(`Cập nhật mã "${coupon.code}" thành công!`);
        // Emit refresh event
        this.refreshService.refreshCoupons();
        this.router.navigate(['/admin/coupon-list']);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err?.error?.message || 'Không thể cập nhật mã giảm giá';
      }
    });
  }
}

