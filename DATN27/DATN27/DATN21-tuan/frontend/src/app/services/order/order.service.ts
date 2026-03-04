import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

export interface CheckoutPayload {
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  shippingAddress: ShippingAddress;
}

export interface CheckoutResponse {
  order: any;
  paymentUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/order`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Checkout - Create order from cart
  checkout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.httpClient.post<any>(`${this.url}/checkout`, payload, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Legacy: Create order (old method - kept for compatibility)
  createOrder(order: any): Observable<any> {
    return this.httpClient.post(`${this.url}/checkout`, order, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get orders by current user
  getMyOrders(): Observable<any[]> {
    return this.httpClient.get<any>(`${this.url}/my-orders`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get order detail
  getOrderDetail(orderId: string): Observable<any> {
    return this.httpClient.get<any>(`${this.url}/detail/${orderId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Cancel order (user can cancel their own order within 3 hours)
  cancelOrder(orderId: string): Observable<any> {
    return this.httpClient.patch<any>(`${this.url}/cancel/${orderId}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Legacy methods (old API - if needed)
  getOrdersByUser(userId: string) {
    return this.httpClient.get(`/v1/order/user/${userId}`);
  }

  getOrderById(id: string) {
    return this.httpClient.get(`/v1/order/${id}`);
  }

  getAllOrders(): Observable<any> {
    return this.httpClient.get(`/v1/order`);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.httpClient.put(`/v1/order/${id}`, { status });
  }
}
