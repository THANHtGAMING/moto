import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        (click)="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <i [class]="toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="removeToast(toast.id); $event.stopPropagation()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      background: white;
      pointer-events: all;
      cursor: pointer;
      animation: slideInRight 0.3s ease-out;
      transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
      min-width: 300px;
    }

    .toast:hover {
      transform: translateX(-4px);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    }

    .toast-success {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
    }

    .toast-error {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      color: white;
    }

    .toast-error .toast-icon {
      color: white;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
      color: white;
      font-weight: 500;
    }

    .toast-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      font-size: 16px;
      width: 24px;
      height: 24px;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 20px;
        right: 20px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  
  toasts: ToastMessage[] = [];

  ngOnInit(): void {
    this.toastService.toast$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toast => {
        this.toasts.push(toast);
        if (toast.duration && toast.duration > 0) {
          setTimeout(() => {
            this.removeToast(toast.id);
          }, toast.duration);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}

