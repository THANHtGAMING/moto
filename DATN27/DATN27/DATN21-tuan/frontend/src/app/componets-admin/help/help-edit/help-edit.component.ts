import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HelpService } from '../../../services/help/help.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-help-edit',
  standalone: true,
  templateUrl: './help-edit.component.html',
  styleUrls: ['./help-edit.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class HelpEditComponent implements OnInit {
  helpForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  errorMessage: string | null = null;
  helpId: string | null = null;

  // Common Font Awesome icons
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

  // Common colors
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

  constructor(
    private helpService: HelpService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.helpForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1)]),
      description: new FormControl('', [Validators.required, Validators.minLength(1)]),
      icon: new FormControl('fas fa-question-circle', [Validators.required]),
      iconColor: new FormControl('#6c757d', [Validators.required]),
      order: new FormControl(0, [Validators.min(0)]),
      status: new FormControl('active', [Validators.required])
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.helpId = params['id'];
      if (this.helpId) {
        this.loadHelp();
      } else {
        this.errorMessage = 'Không tìm thấy ID trợ giúp';
        this.isLoadingData = false;
      }
    });
  }

  loadHelp() {
    if (!this.helpId) return;

    this.isLoadingData = true;
    this.helpService.getDetail(this.helpId).subscribe({
      next: (help: any) => {
        console.log('Help loaded:', help);
        this.helpForm.patchValue({
          name: help.name || '',
          description: help.description || '',
          icon: help.icon || 'fas fa-question-circle',
          iconColor: help.iconColor || '#6c757d',
          order: help.order || 0,
          status: help.status || 'active'
        });
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông tin trợ giúp:', err);
        const errorMsg = err?.error?.message || 'Không thể tải thông tin trợ giúp. Vui lòng thử lại.';
        this.errorMessage = errorMsg;
        this.isLoadingData = false;
      }
    });
  }

  onSubmit() {
    if (this.helpForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ';
      // Mark all fields as touched to show validation errors
      Object.keys(this.helpForm.controls).forEach(key => {
        this.helpForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.helpId) {
      this.errorMessage = 'Không tìm thấy ID trợ giúp';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.helpForm.disable();

    const helpData = {
      name: this.helpForm.value.name?.trim(),
      description: this.helpForm.value.description?.trim(),
      icon: this.helpForm.value.icon?.trim(),
      iconColor: this.helpForm.value.iconColor?.trim(),
      order: this.helpForm.value.order || 0,
      status: this.helpForm.value.status || 'active'
    };

    if (!helpData.name || helpData.name.length === 0) {
      this.errorMessage = 'Tên không được để trống';
      this.isLoading = false;
      this.helpForm.enable();
      return;
    }

    if (!helpData.description || helpData.description.length === 0) {
      this.errorMessage = 'Mô tả không được để trống';
      this.isLoading = false;
      this.helpForm.enable();
      return;
    }

    this.helpService.update(this.helpId, helpData).subscribe({
      next: (res: any) => {
        console.log('Help updated successfully:', res);
        this.toastService.success('Cập nhật trợ giúp thành công!');
        // Emit refresh event
        this.refreshService.refreshHelps();
        this.router.navigate(['/admin/help-list']);
        this.isLoading = false;
        this.helpForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trợ giúp:', err);
        console.error('Error details:', err.error);
        const errorMsg = err?.error?.message || err?.error?.error || 'Không thể cập nhật trợ giúp, vui lòng thử lại.';
        this.errorMessage = errorMsg;
        this.isLoading = false;
        this.helpForm.enable();
      },
    });
  }
}

