import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HelpService } from '../../../services/help/help.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-help-add',
  standalone: true,
  templateUrl: './help-add.component.html',
  styleUrls: ['./help-add.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class HelpAddComponent {
  private helpService = inject(HelpService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  helpForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
    description: new FormControl('', [Validators.required, Validators.minLength(1)]),
    icon: new FormControl('fas fa-question-circle', [Validators.required]),
    iconColor: new FormControl('#6c757d', [Validators.required]),
    order: new FormControl(0, [Validators.min(0)]),
    status: new FormControl('active', [Validators.required])
  });
  isLoading = false;

  commonIcons = [
    { class: 'fas fa-question-circle', label: 'Câu hỏi' },
    { class: 'fas fa-user', label: 'Người dùng' },
    { class: 'fas fa-shopping-cart', label: 'Giỏ hàng' },
    { class: 'fas fa-credit-card', label: 'Thanh toán' },
    { class: 'fas fa-truck', label: 'Vận chuyển' },
    { class: 'fas fa-undo', label: 'Đổi trả' },
    { class: 'fas fa-gift', label: 'Khuyến mãi' },
    { class: 'fas fa-shield-alt', label: 'Bảo hành' },
    { class: 'fas fa-envelope', label: 'Liên hệ' },
    { class: 'fas fa-info-circle', label: 'Thông tin' },
    { class: 'fas fa-star', label: 'Đánh giá' },
    { class: 'fas fa-heart', label: 'Yêu thích' },
  ];

  commonColors = [
    { value: '#6c757d', label: 'Xám' },
    { value: '#d00', label: 'Đỏ' },
    { value: '#007bff', label: 'Xanh dương' },
    { value: '#28a745', label: 'Xanh lá' },
    { value: '#ffc107', label: 'Vàng' },
    { value: '#17a2b8', label: 'Xanh nhạt' },
    { value: '#6f42c1', label: 'Tím' },
    { value: '#e83e8c', label: 'Hồng' },
  ];

  onSubmit() {
    if (this.helpForm.invalid) {
      Object.keys(this.helpForm.controls).forEach(key => {
        this.helpForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    const helpData = {
      name: this.helpForm.value.name?.trim(),
      description: this.helpForm.value.description?.trim(),
      icon: this.helpForm.value.icon?.trim(),
      iconColor: this.helpForm.value.iconColor?.trim(),
      order: this.helpForm.value.order || 0,
      status: this.helpForm.value.status || 'active'
    };

    const name = this.helpForm.value.name?.trim();
    const description = this.helpForm.value.description?.trim();
    const icon = this.helpForm.value.icon?.trim();

    if (!name || name.length === 0) {
      this.toastService.error('Tên không được để trống');
      this.isLoading = false;
      return;
    }

    if (!description || description.length === 0) {
      this.toastService.error('Mô tả không được để trống');
      this.isLoading = false;
      return;
    }

    if (!icon || icon.length === 0) {
      this.toastService.error('Icon không được để trống');
      this.isLoading = false;
      return;
    }

    this.helpService.create({
      name,
      description,
      icon,
      iconColor: this.helpForm.value.iconColor || undefined,
      order: this.helpForm.value.order || undefined
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm trợ giúp thành công!');
          this.helpForm.reset();
          this.helpForm.markAsPristine();
          this.helpForm.patchValue({
            icon: 'fas fa-question-circle',
            iconColor: '#6c757d',
            order: 0,
            status: 'active'
          });
          this.router.navigate(['/admin/help-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || err?.error?.error || 'Không thể thêm trợ giúp, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}

