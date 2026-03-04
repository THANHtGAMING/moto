import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { CartService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-success-container">
      <div class="auth-success-box">
        <div class="success-icon-wrapper">
          <div class="success-icon">✓</div>
          <div class="success-circle"></div>
        </div>
        <h2>Đăng nhập thành công!</h2>
        <p>Đang chuyển hướng...</p>
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes checkmark {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes circle {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }

    @keyframes progress {
      from {
        width: 0%;
      }
      to {
        width: 100%;
      }
    }

    @keyframes gradient {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .auth-success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .auth-success-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: gradient 20s linear infinite;
    }

    .auth-success-box {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 50px 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
      max-width: 450px;
      width: 100%;
      animation: fadeInUp 0.6s ease-out;
      position: relative;
      z-index: 1;
      transition: transform 0.3s ease;
    }

    .auth-success-box:hover {
      transform: translateY(-5px);
    }

    .success-icon-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 30px;
      width: 100px;
      height: 100px;
    }

    .success-icon {
      position: relative;
      z-index: 2;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      margin: 0 auto;
      animation: checkmark 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .success-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid rgba(102, 126, 234, 0.3);
      animation: circle 1.5s ease-out infinite;
    }

    h2 {
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      animation: fadeInUp 0.6s ease-out 0.2s both;
    }

    p {
      color: #718096;
      font-size: 16px;
      margin-bottom: 30px;
      animation: fadeInUp 0.6s ease-out 0.3s both;
    }

    .loading-bar {
      width: 100%;
      height: 4px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 20px;
      animation: fadeInUp 0.6s ease-out 0.4s both;
    }

    .loading-progress {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      animation: progress 1.5s ease-out forwards;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    }

    @media (max-width: 480px) {
      .auth-success-box {
        padding: 40px 30px;
        border-radius: 15px;
      }

      h2 {
        font-size: 24px;
      }

      .success-icon-wrapper {
        width: 80px;
        height: 80px;
      }

      .success-icon {
        width: 70px;
        height: 70px;
        font-size: 40px;
      }

      .success-circle {
        width: 80px;
        height: 80px;
      }
    }
  `]
})
export class AuthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Lấy token từ query params (nếu có)
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        console.log('OAuth token received:', token);
      }

      // Lấy thông tin user từ server (cookies đã được set)
      this.auth.authUser().subscribe({
        next: (user: any) => {
          if (user) {
            console.log('User authenticated:', user);
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
            // Nếu là Admin thì redirect đến trang quản trị, nếu không thì đến store
            setTimeout(() => {
              if (user.isAdmin === true) {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/store']);
              }
            }, 1500);
          } else {
            console.error('Failed to get user info');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          }
        },
        error: (err) => {
          console.error('Error getting user info:', err);
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        }
      });
    });
  }
}

