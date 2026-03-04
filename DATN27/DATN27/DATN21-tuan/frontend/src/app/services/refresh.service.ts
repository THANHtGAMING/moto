import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  private tagRefreshSubject = new Subject<void>();
  private productRefreshSubject = new Subject<void>();
  private typeRefreshSubject = new Subject<void>();
  private brandRefreshSubject = new Subject<void>();
  private riderRefreshSubject = new Subject<void>();
  private genderRefreshSubject = new Subject<void>();
  private couponRefreshSubject = new Subject<void>();
  private newsRefreshSubject = new Subject<void>();
  private helpRefreshSubject = new Subject<void>();
  private contactRefreshSubject = new Subject<void>();

  tagRefresh$ = this.tagRefreshSubject.asObservable();
  productRefresh$ = this.productRefreshSubject.asObservable();
  typeRefresh$ = this.typeRefreshSubject.asObservable();
  brandRefresh$ = this.brandRefreshSubject.asObservable();
  riderRefresh$ = this.riderRefreshSubject.asObservable();
  genderRefresh$ = this.genderRefreshSubject.asObservable();
  couponRefresh$ = this.couponRefreshSubject.asObservable();
  newsRefresh$ = this.newsRefreshSubject.asObservable();
  helpRefresh$ = this.helpRefreshSubject.asObservable();
  contactRefresh$ = this.contactRefreshSubject.asObservable();

  refreshTags() {
    this.tagRefreshSubject.next();
  }

  refreshProducts() {
    this.productRefreshSubject.next();
  }

  refreshTypes() {
    this.typeRefreshSubject.next();
  }

  refreshBrands() {
    this.brandRefreshSubject.next();
  }

  refreshRiders() {
    this.riderRefreshSubject.next();
  }

  refreshGenders() {
    this.genderRefreshSubject.next();
  }

  refreshCoupons() {
    this.couponRefreshSubject.next();
  }

  refreshNews() {
    this.newsRefreshSubject.next();
  }

  refreshHelps() {
    this.helpRefreshSubject.next();
  }

  refreshContacts() {
    this.contactRefreshSubject.next();
  }
}

