import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-error-container">
      <div class="auth-error-box">
        <div class="error-icon">❌</div>
        <h2>Đăng nhập thất bại</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <button class="retry-btn" (click)="goToLogin()">Quay lại đăng nhập</button>
      </div>
    </div>
  `,
  styles: [`
    .auth-error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .auth-error-box {
      background: white;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      max-width: 400px;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h2 {
      color: #333;
      margin-bottom: 10px;
    }
    .error-message {
      color: #e63946;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .retry-btn {
      padding: 10px 20px;
      background-color: #E21B22;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
    .retry-btn:hover {
      background-color: #c5181f;
    }
  `]
})
export class AuthErrorComponent implements OnInit {
  errorMessage = 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Lấy error message từ query params
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message) {
        this.errorMessage = decodeURIComponent(message);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

