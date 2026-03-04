import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChatMessage {
  _id?: string;
  message: string;
  sender: 'user' | 'admin';
  userId?: string;
  adminId?: string;
  createdAt?: Date;
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8000';
  private chatUrl = `${this.baseUrl}/api/chat`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  /**
   * GET /api/chat/messages - Get all messages for current user
   */
  getMessages(): Observable<ChatMessage[]> {
    return this.httpClient.get<any>(`${this.chatUrl}/messages`, this.getHttpOptions()).pipe(
      map((res: any) => {
        const messages = res?.metadata?.messages || res?.metadata || res || [];
        return messages.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
        }));
      })
    );
  }

  /**
   * POST /api/chat/send - Send a new message
   */
  sendMessage(message: string): Observable<{ message: ChatMessage }> {
    return this.httpClient.post<any>(`${this.chatUrl}/send`, { message }, this.getHttpOptions()).pipe(
      map((res: any) => {
        const data = res?.metadata || res;
        if (data.message && data.message.createdAt) {
          data.message.createdAt = new Date(data.message.createdAt);
        }
        return data;
      })
    );
  }

  /**
   * PUT /api/chat/mark-read/:messageId - Mark message as read
   */
  markAsRead(messageId: string): Observable<any> {
    return this.httpClient.put<any>(`${this.chatUrl}/mark-read/${messageId}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/chat/mark-all-admin-read - Mark all admin messages as read
   */
  markAllAdminMessagesAsRead(): Observable<any> {
    return this.httpClient.put<any>(`${this.chatUrl}/mark-all-admin-read`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * GET /api/chat/unread-count - Get count of unread messages
   */
  getUnreadCount(): Observable<number> {
    return this.httpClient.get<any>(`${this.chatUrl}/unread-count`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata?.count || res?.count || 0)
    );
  }

  /**
   * Admin: GET /api/chat/admin/conversations - Get all conversations
   */
  getAdminConversations(): Observable<any[]> {
    return this.httpClient.get<any>(`${this.chatUrl}/admin/conversations`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata?.conversations || res?.metadata || res || [])
    );
  }

  /**
   * Admin: GET /api/chat/admin/messages/:userId - Get messages by userId
   */
  getAdminMessages(userId: string): Observable<ChatMessage[]> {
    return this.httpClient.get<any>(`${this.chatUrl}/admin/messages/${userId}`, this.getHttpOptions()).pipe(
      map((res: any) => {
        const messages = res?.metadata?.messages || res?.metadata || res || [];
        return messages.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
        }));
      })
    );
  }

  /**
   * Admin: POST /api/chat/admin/send - Send admin message
   */
  sendAdminMessage(userId: string, message: string): Observable<{ message: ChatMessage }> {
    return this.httpClient.post<any>(`${this.chatUrl}/admin/send`, { userId, message }, this.getHttpOptions()).pipe(
      map((res: any) => {
        const data = res?.metadata || res;
        if (data.message && data.message.createdAt) {
          data.message.createdAt = new Date(data.message.createdAt);
        }
        return data;
      })
    );
  }

  /**
   * Admin: GET /api/chat/admin/unread-count - Get count of unread messages from users
   */
  getAdminUnreadCount(): Observable<number> {
    return this.httpClient.get<any>(`${this.chatUrl}/admin/unread-count`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata?.count || res?.count || 0)
    );
  }

  /**
   * Admin: PUT /api/chat/admin/mark-read/:messageId - Mark a message as read
   */
  markAdminAsRead(messageId: string): Observable<any> {
    return this.httpClient.put<any>(`${this.chatUrl}/admin/mark-read/${messageId}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * Admin: PUT /api/chat/admin/mark-all-read/:userId - Mark all messages from a user as read
   */
  markAllAsReadByUserId(userId: string): Observable<any> {
    return this.httpClient.put<any>(`${this.chatUrl}/admin/mark-all-read/${userId}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}

