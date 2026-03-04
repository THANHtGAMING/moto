import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Contact {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied' | 'archived';
  isRead?: boolean;
  replyMessage?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/contact`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Tạo thư liên hệ mới (public)
  create(contact: { name: string; email: string; phone?: string; subject: string; message: string }): Observable<Contact> {
    return this.httpClient.post(`${this.url}/create`, contact, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Lấy danh sách thư liên hệ (admin)
  getAll(status?: string, isRead?: boolean): Observable<Contact[]> {
    let queryParams = '';
    if (status) queryParams += `?status=${status}`;
    if (isRead !== undefined) queryParams += queryParams ? `&isRead=${isRead}` : `?isRead=${isRead}`;

    return this.httpClient.get(`${this.url}/list${queryParams}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  // Lấy chi tiết thư liên hệ
  getDetail(id: string): Observable<Contact> {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Cập nhật trạng thái thư
  updateStatus(id: string, data: { status?: string; replyMessage?: string }): Observable<Contact> {
    return this.httpClient.put(`${this.url}/update/${id}`, data, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Contact list không có cache, chỉ cần refresh service
      })
    );
  }

  // Xóa thư liên hệ
  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Contact list không có cache, chỉ cần refresh service
      })
    );
  }

  // Lấy số thư chưa đọc
  getUnreadCount(): Observable<number> {
    return this.httpClient.get(`${this.url}/unread-count`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata?.count || 0)
    );
  }
}

