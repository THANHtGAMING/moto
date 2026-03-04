import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Tag } from '../../models/tag';
import { clearCache } from '../../interceptors/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/tag`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  getAll(): Observable<Tag[]> {
    return this.httpClient.get(`${this.url}/list`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  getById(id: string): Observable<Tag> {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  create(tag: { name: string }): Observable<Tag> {
    return this.httpClient.post(`${this.url}/create`, tag, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/tag/list'))
    );
  }

  update(id: string, tag: { name: string }): Observable<Tag> {
    return this.httpClient.put(`${this.url}/update/${id}`, tag, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/tag/list'))
    );
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/tag/list'))
    );
  }
}

