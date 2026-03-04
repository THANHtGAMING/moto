import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule]
})
export class ForgotPasswordComponent implements OnInit {
  step: 'email' | 'verify' = 'email';
  isLoading = false;

  emailForm!: FormGroup;
  verifyForm!: FormGroup;

  email: string = '';

  constructor(private auth: AuthService, private router: Router) {
    this.emailForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    this.verifyForm = new FormGroup({
      otp: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit() {}

  onSendEmail() {
    if (this.emailForm.invalid) {
      alert('Vui lòng nhập email hợp lệ');
      return;
    }

    this.isLoading = true;
    this.email = this.emailForm.value.email;

    this.auth.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        console.log("Forgot password response:", res);
        if (res && res.message) {
          alert('Mã OTP đã được gửi đến email của bạn!');
          this.step = 'verify';
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại!');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Forgot password error:", err);
        const errorMessage = err?.error?.message || "Có lỗi xảy ra. Vui lòng thử lại!";
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  onVerifyOTP() {
    if (this.verifyForm.invalid) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const { otp, password, confirmPassword } = this.verifyForm.value;

    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    this.isLoading = true;

    this.auth.verifyForgotPassword(otp, password).subscribe({
      next: (res: any) => {
        console.log("Verify forgot password response:", res);
        if (res && res.message) {
          alert('Đặt lại mật khẩu thành công!');
          this.router.navigate(['/login']);
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại!');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Verify forgot password error:", err);
        const errorMessage = err?.error?.message || "Mã OTP không hợp lệ hoặc đã hết hạn!";
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  togglePassword(field: string) {
    const input = document.getElementById(field) as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  backToEmail() {
    this.step = 'email';
    this.verifyForm.reset();
  }
}
