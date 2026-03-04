import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Banner {
  _id?: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  isModal?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private baseUrl = 'http://localhost:8000';
  private bannerUrl = `${this.baseUrl}/api/banner`;

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
   * GET /api/banner/list - Get all banners
   */
  getAll(activeOnly: boolean = false, modalOnly: boolean = false): Observable<Banner[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    if (modalOnly) {
      params = params.set('modalOnly', 'true');
    }
    return this.httpClient.get<any>(`${this.bannerUrl}/list`, { 
      ...this.getHttpOptions(),
      params 
    }).pipe(
      map((res: any) => res?.metadata?.banners || res?.banners || [])
    );
  }

  /**
   * POST /api/banner/create - Create new banner
   */
  create(formData: FormData): Observable<Banner> {
    return this.httpClient.post<any>(`${this.bannerUrl}/create`, formData, {
      withCredentials: true
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/banner/update/:id - Update banner
   */
  update(id: string, formData: FormData): Observable<Banner> {
    return this.httpClient.put<any>(`${this.bannerUrl}/update/${id}`, formData, {
      withCredentials: true
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * DELETE /api/banner/delete/:id - Delete banner
   */
  delete(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.bannerUrl}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/banner/update-order - Update banner order
   */
  updateOrder(banners: { id: string; order: number }[]): Observable<any> {
    return this.httpClient.put<any>(`${this.bannerUrl}/update-order`, { banners }, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/banner/toggle-modal/:id - Toggle modal banner (pin/unpin)
   */
  toggleModal(id: string): Observable<Banner> {
    return this.httpClient.put<any>(`${this.bannerUrl}/toggle-modal/${id}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }
}

