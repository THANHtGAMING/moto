import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/product`;

  constructor(private httpClient: HttpClient) { }

  // Get HTTP options with credentials for cookie-based auth
  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      observe: 'body' as const,
      responseType: 'json' as const
    };
  }

  // Get HTTP options for file upload
  private getHttpOptionsForFileUpload() {
    return {
      withCredentials: true,
      observe: 'body' as const,
      responseType: 'json' as const
      // Don't set Content-Type header - let browser set it with multipart/form-data boundary
    };
  }

  getAll() {
    // Load tất cả products bằng cách set limit lớn
    // Backend mặc định limit=20, cần set limit cao để lấy tất cả
    return this.httpClient.get(`${this.url}/list?limit=1000`, this.getHttpOptions()).pipe(
      map((res: any) => {
        // Backend returns { metadata: { products: [...], pagination: {...} } }
        const metadata = res?.metadata;
        if (metadata?.products) {
          return metadata.products;
        }
        // Fallback for old response format (direct array)
        return Array.isArray(metadata) ? metadata : (Array.isArray(res) ? res : []);
      })
    );
  }

  addProduct(formData: FormData) {
    return this.httpClient.post(`${this.url}/create`, formData, this.getHttpOptionsForFileUpload()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Product list không có cache, chỉ cần refresh service
      })
    );
  }

  delete(id: string) {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Product list không có cache, chỉ cần refresh service
      })
    );
  }

  // Fixed: use the correct backend route for product detail (/detail/:id)
  getProductDetail(id: string) {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  updateProduct(id: string, formData: FormData) {
    return this.httpClient.put(`${this.url}/update/${id}`, formData, this.getHttpOptionsForFileUpload()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Product list không có cache, chỉ cần refresh service
      })
    );
  }

  getProductByQuery(params: any) {
    const queryParams = new URLSearchParams();

    // Add all query parameters
    if (params.keyword) queryParams.set('keyword', params.keyword);
    if (params.gender) queryParams.set('gender', params.gender);
    if (params.type) queryParams.set('type', params.type);
    if (params.rider) queryParams.set('rider', params.rider);
    if (params.brand) queryParams.set('brand', params.brand);
    if (params.tags) {
      // tags can be array or comma-separated string
      const tagsValue = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
      queryParams.set('tags', tagsValue);
    }
    if (params.minPrice) queryParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString());
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.searchMode) queryParams.set('searchMode', params.searchMode);

    const queryString = queryParams.toString();
    return this.httpClient.get(`${this.url}/list${queryString ? '?' + queryString : ''}`, this.getHttpOptions()).pipe(
      map((res: any) => {
        // Backend returns { metadata: { products: [...], pagination: {...} } }
        const metadata = res?.metadata;
        if (metadata?.products) {
          return {
            products: metadata.products,
            pagination: metadata.pagination
          };
        }
        // Fallback for old response format (direct array)
        const products = Array.isArray(metadata) ? metadata : (Array.isArray(res) ? res : []);
        return {
          products,
          pagination: {
            total: products.length,
            page: 1,
            limit: products.length,
            totalPages: 1
          }
        };
      })
    );
  }
}
