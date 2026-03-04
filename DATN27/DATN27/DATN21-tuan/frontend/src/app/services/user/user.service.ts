import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Address {
  _id?: string;
  name: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  addresses?: Address[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/user`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get all users (admin)
  getAll(): Observable<any> {
    return this.httpClient.get(`${this.url}/get`, this.getHttpOptions()).pipe(
      map((res: any) => {
        // Backend có thể trả về { metadata: [...] } hoặc array trực tiếp
        const metadata = res?.metadata;
        if (Array.isArray(metadata)) {
          return metadata;
        }
        // Fallback for direct array response
        return Array.isArray(res) ? res : [];
      })
    );
  }

  // Delete user (admin)
  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions());
  }

  // Get current authenticated user (includes addresses)
  getAuth(): Observable<User> {
    return this.httpClient.get<any>(`${this.url}/auth`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Add new address
  addAddress(address: Omit<Address, '_id'>): Observable<Address[]> {
    return this.httpClient.post<any>(`${this.url}/address`, address, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Delete address
  deleteAddress(addressId: string): Observable<Address[]> {
    return this.httpClient.delete<any>(`${this.url}/address/${addressId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Set default address
  setDefaultAddress(addressId: string): Observable<Address[]> {
    return this.httpClient.patch<any>(`${this.url}/address/set-default`, { addressId }, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Upload avatar
  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.httpClient.put<any>(`${this.url}/upload-avatar`, formData, {
      withCredentials: true,
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Update profile (fullName)
  updateProfile(data: { fullName: string }): Observable<User> {
    return this.httpClient.put<any>(`${this.url}/update-profile`, data, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}
