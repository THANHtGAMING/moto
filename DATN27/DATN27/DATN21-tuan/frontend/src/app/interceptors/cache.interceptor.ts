import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

// Cache storage với TTL (Time To Live)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

// Routes nên được cache
const CACHEABLE_ROUTES = [
  '/api/brand/list',
  '/api/type/list',
  '/api/gender/list',
  '/api/tag/list',
  '/api/rider/list'
];

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Chỉ cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Kiểm tra xem route có nên được cache không
  const shouldCache = CACHEABLE_ROUTES.some(route => req.url.includes(route));

  if (!shouldCache) {
    return next(req);
  }

  // Tạo cache key từ URL
  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);

  // Kiểm tra cache còn hiệu lực không
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return of(cached.response.clone());
  }

  // Gọi API và cache response
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          response: event.clone(),
          timestamp: Date.now()
        });
      }
    })
  );
};

// Hàm để xóa cache khi cần (ví dụ: sau khi update/delete)
export function clearCache(urlPattern?: string): void {
  if (urlPattern) {
    for (const key of cache.keys()) {
      if (key.includes(urlPattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

