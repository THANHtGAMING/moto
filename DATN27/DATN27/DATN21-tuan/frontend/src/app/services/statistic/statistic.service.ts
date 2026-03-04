import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, RevenuePoint, TopProduct } from '../../models/statistic.model';
import { OrderListResponse, OrderListParams } from '../admin-order/admin-order.service';

@Injectable({
  providedIn: 'root'
})
export class StatisticService {
  private baseUrl = 'http://localhost:8000';
  private statisticUrl = `${this.baseUrl}/api/statistic`;
  private adminOrderUrl = `${this.baseUrl}/api/admin/order`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get dashboard statistics
  getDashboard(): Observable<DashboardStats> {
    return this.httpClient.get<any>(`${this.statisticUrl}/dashboard`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      catchError((error) => {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      })
    );
  }

  // Get revenue chart data (7 days)
  getRevenueChart(): Observable<RevenuePoint[]> {
    return this.httpClient.get<any>(`${this.statisticUrl}/revenue-chart`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || []),
      catchError((error) => {
        console.error('Error fetching revenue chart:', error);
        throw error;
      })
    );
  }

  // Get top selling products
  getTopProducts(): Observable<TopProduct[]> {
    return this.httpClient.get<any>(`${this.statisticUrl}/top-products`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || []),
      catchError((error) => {
        console.error('Error fetching top products:', error);
        throw error;
      })
    );
  }

  // Get admin orders list with filters (reuse from AdminOrderService pattern)
  getAdminOrders(params: OrderListParams = {}): Observable<OrderListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `${this.adminOrderUrl}/list?${queryString}` : `${this.adminOrderUrl}/list`;

    return this.httpClient.get<any>(url, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      catchError((error) => {
        console.error('Error fetching admin orders:', error);
        throw error;
      })
    );
  }
}

