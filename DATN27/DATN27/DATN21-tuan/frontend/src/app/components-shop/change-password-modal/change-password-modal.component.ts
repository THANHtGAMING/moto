import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Đổi mật khẩu</h3>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </div>

        <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Mật khẩu hiện tại *</label>
            <input
              type="password"
              formControlName="currentPassword"
              class="form-control"
              [class.error]="changePasswordForm.get('currentPassword')?.invalid && changePasswordForm.get('currentPassword')?.touched"
              placeholder="Nhập mật khẩu hiện tại">
            <div class="error-message" *ngIf="changePasswordForm.get('currentPassword')?.invalid && changePasswordForm.get('currentPassword')?.touched">
              Vui lòng nhập mật khẩu hiện tại
            </div>
          </div>

          <div class="form-group">
            <label>Mật khẩu mới *</label>
            <input
              type="password"
              formControlName="newPassword"
              class="form-control"
              [class.error]="changePasswordForm.get('newPassword')?.invalid && changePasswordForm.get('newPassword')?.touched"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)">
            <div class="error-message" *ngIf="changePasswordForm.get('newPassword')?.invalid && changePasswordForm.get('newPassword')?.touched">
              <span *ngIf="changePasswordForm.get('newPassword')?.errors?.['required']">Vui lòng nhập mật khẩu mới</span>
              <span *ngIf="changePasswordForm.get('newPassword')?.errors?.['minlength']">Mật khẩu phải có ít nhất 6 ký tự</span>
            </div>
          </div>

          <div class="form-group">
            <label>Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="form-control"
              [class.error]="changePasswordForm.get('confirmPassword')?.invalid && changePasswordForm.get('confirmPassword')?.touched"
              placeholder="Nhập lại mật khẩu mới">
            <div class="error-message" *ngIf="changePasswordForm.get('confirmPassword')?.invalid && changePasswordForm.get('confirmPassword')?.touched">
              <span *ngIf="changePasswordForm.get('confirmPassword')?.errors?.['required']">Vui lòng xác nhận mật khẩu</span>
              <span *ngIf="changePasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']">Mật khẩu xác nhận không khớp</span>
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage" style="margin-top: 10px;">
            {{ errorMessage }}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Hủy</button>
            <button type="submit" class="btn-submit" [disabled]="changePasswordForm.invalid || isLoading">
              {{ isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 30px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 22px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    form {
      padding: 30px;
    }

    .form-group {
      margin-bottom: 24px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 15px;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 15px;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #E21B22;
    }

    .form-control.error {
      border-color: #e63946;
    }

    .error-message {
      color: #e63946;
      font-size: 12px;
      margin-top: 5px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }

    .btn-cancel,
    .btn-submit {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #333;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-submit {
      background: #E21B22;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #c5181f;
    }

    .btn-submit:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class ChangePasswordModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator để kiểm tra mật khẩu xác nhận khớp
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched(this.changePasswordForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        alert('Đổi mật khẩu thành công!');
        this.success.emit();
        this.onClose();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

