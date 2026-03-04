import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Review, CreateReviewRequest, PendingReview, OrderWithPendingReviews } from '../../models/review';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/review`;

  constructor(private httpClient: HttpClient) {}

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Get reviews by product ID
  getReviewsByProduct(productId: string): Observable<Review[]> {
    return this.httpClient.get<any>(`${this.url}/product/${productId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  // Create review
  createReview(reviewData: CreateReviewRequest): Observable<Review> {
    const formData = new FormData();
    formData.append('productId', reviewData.productId);
    formData.append('orderId', reviewData.orderId);
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);

    // Append images if provided
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    return this.httpClient.post<any>(`${this.url}/create`, formData, {
      withCredentials: true
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get pending reviews for an order
  getPendingReviews(orderId: string): Observable<{ orderId: string; orderCode: string; pendingProducts: PendingReview[]; count: number }> {
    return this.httpClient.get<any>(`${this.url}/pending/order/${orderId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Get all orders with pending reviews
  getMyPendingReviews(): Observable<OrderWithPendingReviews[]> {
    return this.httpClient.get<any>(`${this.url}/pending/my-orders`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  // Like/Dislike Review
  toggleLike(reviewId: string): Observable<Review> {
    return this.httpClient.post<any>(`${this.url}/${reviewId}/like`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  toggleDislike(reviewId: string): Observable<Review> {
    return this.httpClient.post<any>(`${this.url}/${reviewId}/dislike`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Add Reply
  addReply(reviewId: string, comment: string): Observable<Review> {
    return this.httpClient.post<any>(`${this.url}/${reviewId}/reply`, { comment }, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Delete Reply
  deleteReply(reviewId: string, replyId: string): Observable<Review> {
    return this.httpClient.delete<any>(`${this.url}/${reviewId}/reply/${replyId}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Admin: Get all reviews
  getAllReviews(params?: { productId?: string; page?: number; limit?: number }): Observable<any> {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${this.url}/admin/list?${queryString}` : `${this.url}/admin/list`;

    return this.httpClient.get<any>(url, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  // Admin: Toggle hide review
  toggleHideReview(reviewId: string): Observable<Review> {
    return this.httpClient.patch<any>(`${this.url}/admin/${reviewId}/toggle-hide`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}

