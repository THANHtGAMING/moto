import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injector } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  public toast$: Observable<ToastMessage> = this.toastSubject.asObservable();

  constructor() {}

  /**
   * Show success toast message
   * @param message - Success message to display
   */
  success(message: string): void {
    const toast: ToastMessage = {
      id: this.generateId(),
      message,
      type: 'success',
      duration: 3000
    };
    this.toastSubject.next(toast);
  }

  /**
   * Show error toast message
   * @param message - Error message to display
   */
  error(message: string): void {
    const toast: ToastMessage = {
      id: this.generateId(),
      message,
      type: 'error',
      duration: 5000
    };
    this.toastSubject.next(toast);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

