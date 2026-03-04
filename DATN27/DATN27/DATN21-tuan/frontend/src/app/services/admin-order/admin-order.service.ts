import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Order {
  _id: string;
  orderCode: string;
  userId?: any;
  products: Array<{
    productId: string;
    nameProduct: string;
    imageProduct: string;
    price: number;
    quantity: number;
    size?: string | null;
  }>;
  totalPrice: number;
  finalPrice: number;
  shippingFee?: number;
  discountAmount?: number;
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    address: string;
    email: string;
  };
  couponId?: any;
  paymentMethod: 'cod' | 'vnpay' | 'momo';
  status: 'pending' | 'pending_payment' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned' | 'failed';
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{
    status: string;
    updatedAt: string;
    updatedBy?: string;
    note?: string;
  }>;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderListParams {
  status?: string;
  paymentMethod?: string;
  isPaid?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/admin/order`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get order list with filters
  getOrderList(params: OrderListParams = {}): Observable<OrderListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.url}/list?${queryString}` : `${this.url}/list`;
    
    return this.httpClient.get<any>(url, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get order detail
  getOrderDetail(orderId: string): Observable<Order> {
    return this.httpClient.get<any>(`${this.url}/${orderId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Update order status
  updateOrderStatus(orderId: string, status: string, note?: string): Observable<Order> {
    return this.httpClient.patch<any>(
      `${this.url}/${orderId}/status`,
      { status, note },
      this.getHttpOptions()
    ).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Mark order as paid
  markOrderPaid(orderId: string, isPaid: boolean): Observable<Order> {
    return this.httpClient.patch<any>(
      `${this.url}/${orderId}/mark-paid`,
      { isPaid },
      this.getHttpOptions()
    ).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}

