import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ContactInfo {
  _id?: string;
  address: string;
  phone: string;
  email: string;
  mapUrl?: string;
  workingHours?: string;
  facebook?: string;
  instagram?: string;
  zalo?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactInfoService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/contact-info`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Lấy thông tin liên hệ (public)
  get(): Observable<ContactInfo> {
    return this.httpClient.get(`${this.url}/get`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Tạo hoặc cập nhật thông tin liên hệ (admin)
  createOrUpdate(contactInfo: {
    address: string;
    phone: string;
    email: string;
    mapUrl?: string;
    workingHours?: string;
    facebook?: string;
    instagram?: string;
    zalo?: string;
  }): Observable<ContactInfo> {
    return this.httpClient.post(`${this.url}/create-or-update`, contactInfo, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Cập nhật thông tin liên hệ (admin)
  update(id: string, contactInfo: Partial<ContactInfo>): Observable<ContactInfo> {
    return this.httpClient.put(`${this.url}/update/${id}`, contactInfo, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}

