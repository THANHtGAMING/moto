import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Logo {
  _id?: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  location?: string; // header, footer, etc.
  isPinned?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LogoService {
  private baseUrl = 'http://localhost:8000';
  private logoUrl = `${this.baseUrl}/api/logo`;

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
   * GET /api/logo/list - Get all logos
   */
  getAll(activeOnly: boolean = false): Observable<Logo[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.httpClient.get<any>(`${this.logoUrl}/list`, { 
      ...this.getHttpOptions(),
      params 
    }).pipe(
      map((res: any) => res?.metadata?.logos || res?.logos || [])
    );
  }

  /**
   * POST /api/logo/create - Create new logo
   */
  create(formData: FormData): Observable<Logo> {
    return this.httpClient.post<any>(`${this.logoUrl}/create`, formData, {
      withCredentials: true
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/logo/update/:id - Update logo
   */
  update(id: string, formData: FormData): Observable<Logo> {
    return this.httpClient.put<any>(`${this.logoUrl}/update/${id}`, formData, {
      withCredentials: true
    }).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * DELETE /api/logo/delete/:id - Delete logo
   */
  delete(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.logoUrl}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/logo/update-order - Update logo order
   */
  updateOrder(logos: { id: string; order: number }[]): Observable<any> {
    return this.httpClient.put<any>(`${this.logoUrl}/update-order`, { logos }, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * PUT /api/logo/toggle-pin/:id - Toggle pin logo
   */
  togglePin(id: string): Observable<Logo> {
    return this.httpClient.put<any>(`${this.logoUrl}/toggle-pin/${id}`, {}, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  /**
   * GET /api/logo/pinned - Get pinned logo
   */
  getPinnedLogo(): Observable<Logo | null> {
    return this.httpClient.get<any>(`${this.logoUrl}/pinned`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || null)
    );
  }
}

