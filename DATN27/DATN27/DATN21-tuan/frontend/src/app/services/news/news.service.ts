import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private baseUrl = 'http://localhost:8000';
  url = `${this.baseUrl}/api/news`;

  constructor(private httpClient: HttpClient) { }

  private getHttpOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  private getHttpOptionsForFileUpload() {
    return {
      withCredentials: true
      // Don't set Content-Type header for FormData, browser will set it automatically with boundary
    };
  }

  getAll() {
    return this.httpClient.get(`${this.url}/list`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata?.news || res?.metadata || res || [])
    );
  }

  delete(id: string) {
    return this.httpClient.delete(`${this.url}/delete/${id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // News list không có cache, chỉ cần refresh service
      })
    );
  }

  addnews(body: FormData) {
    return this.httpClient.post(`${this.url}/create`, body, this.getHttpOptionsForFileUpload()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // News list không có cache, chỉ cần refresh service
      })
    );
  }

  getnewsDetail(_id: string) {
    return this.httpClient.get(`${this.url}/detail/${_id}`, this.getHttpOptions()).pipe(
      map((res: any) => res?.metadata || res)
    );
  }

  updatenews(id: string, body: FormData) {
    return this.httpClient.put(`${this.url}/update/${id}`, body, this.getHttpOptionsForFileUpload()).pipe(
      map((res: any) => res?.metadata || res),
      tap(() => {
        // News list không có cache, chỉ cần refresh service
      })
    );
  }

}
