import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { CartService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cartService: CartService
  ) {
    this.loginForm = new FormGroup(
      {
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      },
    );
  }

  ngOnInit() {
  }

  onLogin() {
    if (this.loginForm.invalid) {
      alert('Dữ liệu không hợp lệ');
      return;
    }

    this.isLoading = true;
    this.auth.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        console.log("API response:", res);

        // Backend trả về { message, metadata: { accessToken, refreshToken } }
        // Tokens được lưu trong cookies, không cần lưu vào localStorage
        if (res && res.message) {
          // Sau khi login thành công, gọi API auth để lấy thông tin user
          this.auth.authUser().subscribe({
            next: (user: any) => {
              if (user) {
                // Merge guest cart to server cart after successful login (chỉ cho User, không phải Admin)
                if (!user.isAdmin) {
                  this.cartService.mergeGuestCartToServer().subscribe({
                    next: () => {
                      console.log('Guest cart merged successfully');
                    },
                    error: (err) => {
                      console.error('Error merging guest cart:', err);
                    }
                  });
                }
                alert("Đăng nhập thành công!");
                // Nếu là Admin thì redirect đến trang quản trị, nếu không thì đến store
                if (user.isAdmin === true) {
                  this.router.navigate(['/admin']);
                } else {
                  this.router.navigate(['/store']);
                }
              } else {
                alert("Đăng nhập thành công nhưng không thể lấy thông tin người dùng!");
              }
              this.isLoading = false;
            },
            error: (err) => {
              console.error("Error getting user info:", err);
              alert("Đăng nhập thành công nhưng không thể lấy thông tin người dùng!");
              this.isLoading = false;
            }
          });
        } else {
          alert("Sai email hoặc mật khẩu!");
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error("Login error:", err);
        const errorMessage = err?.error?.message || "Tài khoản hoặc mật khẩu không chính xác!";
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

  onGoogleLogin() {
    // Redirect to backend Google OAuth endpoint
    this.auth.loginWithGoogle();
  }

  onFacebookLogin() {
    // Redirect to backend Facebook OAuth endpoint
    this.auth.loginWithFacebook();
  }
}
