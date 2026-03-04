import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  GuardResult,
  MaybeAsync,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ShopGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    return this.authService
      .isAdmin() // trả về 1 Promise
      .then((isAdmin: boolean) => {
        if (isAdmin) {
          // Admin không được phép truy cập trang cửa hàng, redirect về admin dashboard
          this.router.navigate(['/admin']);
          return false; // không cho phép sử dụng route
        } else {
          return true; // cho phép User truy cập trang cửa hàng
        }
      });
  }
}

