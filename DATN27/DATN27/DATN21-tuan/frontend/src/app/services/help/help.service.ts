import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Help {
  _id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/help`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  getAll(): Observable<Help[]> {
    return this.httpClient.get(`${this.url}/list`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res || [])
    );
  }

  getDetail(id: string): Observable<Help> {
    return this.httpClient.get(`${this.url}/detail/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  create(help: { name: string; description: string; icon: string; iconColor?: string; order?: number }): Observable<Help> {
    return this.httpClient.post(`${this.url}/create`, help, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Help list không có cache, chỉ cần refresh service
      })
    );
  }

  update(id: string, help: { name?: string; description?: string; icon?: string; iconColor?: string; order?: number; status?: string }): Observable<Help> {
    return this.httpClient.put(`${this.url}/update/${id}`, help, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Help list không có cache, chỉ cần refresh service
      })
    );
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // Help list không có cache, chỉ cần refresh service
      })
    );
  }
}

