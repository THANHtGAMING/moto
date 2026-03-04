import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Gender } from '../../models/gender';
import { clearCache } from '../../interceptors/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class GenderService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/gender`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  getAll(): Observable<Gender[]> {
    return this.httpClient.get(`${this.url}/list`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  getById(id: string): Observable<Gender> {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  create(gender: { name: string }): Observable<Gender> {
    return this.httpClient.post(`${this.url}/create`, gender, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/gender/list'))
    );
  }

  update(id: string, gender: { name: string }): Observable<Gender> {
    return this.httpClient.put(`${this.url}/update/${id}`, gender, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/gender/list'))
    );
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => clearCache('/api/gender/list'))
    );
  }
}

