import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  showOnHeader?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponPayload {
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minOrderValue?: number;
  usageLimit?: number;
}

export interface UpdateCouponPayload {
  code?: string;
  name?: string;
  description?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value?: number;
  startDate?: string;
  endDate?: string;
  minOrderValue?: number;
  usageLimit?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/coupon`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get all coupons (admin)
  getAll(): Observable<Coupon[]> {
    return this.httpClient.get<any>(`${this.url}/list`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get coupon by ID (admin)
  getById(id: string): Observable<Coupon> {
    return this.httpClient.get<any>(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Create coupon (admin)
  create(payload: CreateCouponPayload): Observable<Coupon> {
    return this.httpClient.post<any>(`${this.url}/create`, payload, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Coupon list không có cache, chỉ cần refresh service
      })
    );
  }

  // Update coupon (admin)
  update(id: string, payload: UpdateCouponPayload): Observable<Coupon> {
    return this.httpClient.put<any>(`${this.url}/update/${id}`, payload, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Coupon list không có cache, chỉ cần refresh service
      })
    );
  }

  // Delete coupon (admin)
  delete(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Coupon list không có cache, chỉ cần refresh service
      })
    );
  }

  // Toggle showOnHeader (admin)
  toggleShowOnHeader(id: string): Observable<Coupon> {
    return this.httpClient.put<any>(`${this.url}/toggle-header/${id}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get coupon displayed on header (public)
  getHeaderCoupon(): Observable<Coupon | null> {
    return this.httpClient.get<any>(`${this.url}/header`).pipe(
      map((res: any) => res?.metadata || null)
    );
  }
}

