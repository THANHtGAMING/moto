import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'SECURITY' | 'REVIEW';
  metadata?: {
    orderId?: string;
    image?: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/notification`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get user's notifications
  getMyNotifications(page: number = 1, limit: number = 20): Observable<{ notifications: Notification[]; unreadCount: number }> {
    return this.httpClient.get<any>(`${this.url}/my-notifications?page=${page}&limit=${limit}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Mark notification as read
  markAsRead(notificationId?: string): Observable<boolean> {
    const body = notificationId ? { notificationId } : {};
    return this.httpClient.patch<any>(`${this.url}/mark-read`, body, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || true)
    );
  }
}

