import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { clearCache } from '../../interceptors/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class TypeService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/type`;

  constructor(private httpClient: HttpClient) { }

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

  getAll(genderId?: string) {
    let url = `${this.url}/list`;
    if (genderId) {
      url += `?gender=${genderId}`;
    }
    return this.httpClient.get(url, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  delete(id: string) {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/type/list'))
    );
  }

  addType(type: { name: string; genders?: string[]; tags?: string[] }) {
    return this.httpClient.post(`${this.url}/create`, type, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/type/list'))
    );
  }

  getTypeDetail(id: string) {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  updateType(id: string, type: { name: string; genders?: string[]; tags?: string[] }) {
    return this.httpClient.put(`${this.url}/update/${id}`, type, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/type/list'))
    );
  }
}
