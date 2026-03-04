import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface WishlistItem {
  productId: {
    _id: string;
    nameProduct: string;
    priceProduct: number;
    imagesProduct: string[];
    discountProduct?: number;
  };
  addedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = 'http://localhost:8000';
  private url = `${this.baseUrl}/api/wishlist`;

  // BehaviorSubject để track số lượng wishlist items
  private wishlistCountSubject = new BehaviorSubject<number>(0);
  public wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor(private httpClient: HttpClient) {
    // Load wishlist count on init if user is logged in
    this.refreshWishlistCount();
  }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Toggle wishlist (thêm/xóa sản phẩm)
  toggleWishlist(productId: string): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/toggle`, { productId }, this.getHttpOptions()).pipe(
      map((res: any) => {
        const result = res?.metadata || res;
        // Refresh count after toggle
        this.refreshWishlistCount();
        return result;
      }),
      catchError((error) => {
        console.error('Error toggling wishlist:', error);
        throw error;
      })
    );
  }

  // Lấy danh sách yêu thích
  getMyWishlist(): Observable<WishlistItem[]> {
    return this.httpClient.get<any>(`${this.url}/my-wishlist`, this.getHttpOptions()).pipe(
      map((res: any) => {
        const items = res?.metadata || res || [];
        // Update count
        this.wishlistCountSubject.next(items.length);
        return items;
      }),
      catchError((error) => {
        console.error('Error fetching wishlist:', error);
        return [];
      })
    );
  }

  // Refresh wishlist count
  refreshWishlistCount() {
    this.getMyWishlist().subscribe({
      next: (items) => {
        this.wishlistCountSubject.next(items.length);
      },
      error: () => {
        // If error (e.g., not logged in), set count to 0
        this.wishlistCountSubject.next(0);
      }
    });
  }

  // Get current count (synchronous)
  getWishlistCount(): number {
    return this.wishlistCountSubject.value;
  }
}

