import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Product } from '../../../models/product';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { TypeService } from '../../../services/type/type.service';
import { RiderService } from '../../../services/rider/rider.service';
import { BrandService } from '../../../services/brand/brand.service';
import { GenderService } from '../../../services/gender/gender.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxPaginationModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  p: number = 1;
  keyword: string = '';
  private refreshSubscription?: Subscription;
  private routerSubscription?: Subscription;

  // Filters
  types: any[] = [];
  riders: any[] = [];
  brands: any[] = [];
  genders: any[] = [];

  typeFilter: string = '';
  riderFilter: string = '';
  brandFilter: string = '';
  genderFilter: string = '';
  sizeFilter: string = ''; // '', 'has_size', 'accessory'

  // Sort option: '', 'price_asc', 'price_desc', 'stock_asc', 'stock_desc'
  sortOption: string = '';

  // Filter dropdown state
  showFilterDropdown: string = ''; // 'type', 'rider', 'brand', 'gender', 'size', or ''

  constructor(
    private productService: ProductService,
    private typeService: TypeService,
    private riderService: RiderService,
    private brandService: BrandService,
    private genderService: GenderService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadFilters();
    this.loadAllProducts();
    // Reload khi quay lại từ add/edit page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/admin/product-list' || event.urlAfterRedirects === '/admin/product-list') {
          this.loadAllProducts();
        }
      });
    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.productRefresh$.subscribe(() => {
      this.p = 1;
      this.loadAllProducts();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadAllProducts() {
    // Backend có limit tối đa 100, nên cần load nhiều trang để lấy tất cả
    // Load trang đầu để biết tổng số trang
    this.productService.getProductByQuery({ page: 1, limit: 100 }).subscribe({
      next: (data: any) => {
        let allProducts = data.products || [];
        const pagination = data.pagination || { totalPages: 1, total: allProducts.length };
        
        // Nếu có nhiều hơn 1 trang, load các trang còn lại
        if (pagination.totalPages > 1) {
          const remainingRequests = [];
          for (let page = 2; page <= pagination.totalPages; page++) {
            remainingRequests.push(
              this.productService.getProductByQuery({ page, limit: 100 })
            );
          }
          
          // Load tất cả các trang còn lại
          if (remainingRequests.length > 0) {
            forkJoin(remainingRequests).subscribe({
              next: (results: any[]) => {
                results.forEach((result: any) => {
                  if (result?.products && Array.isArray(result.products)) {
                    allProducts = allProducts.concat(result.products);
                  }
                });
                this.products = allProducts as Product[];
                this.applyFilters();
              },
              error: (err) => {
                console.error('Lỗi khi tải các trang còn lại:', err);
                // Vẫn dùng dữ liệu đã load được
                this.products = allProducts as Product[];
                this.applyFilters();
              }
            });
          } else {
            this.products = allProducts as Product[];
            this.applyFilters();
          }
        } else {
          this.products = allProducts as Product[];
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách sản phẩm:', err);
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }

  loadFilters() {
    // Load all types
    this.typeService.getAll().subscribe({
      next: (res: any) => this.types = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải loại:', err)
    });

    this.riderService.getAll().subscribe({
      next: (res: any) => this.riders = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải tay đua:', err)
    });

    this.brandService.getAll().subscribe({
      next: (res: any) => this.brands = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải nhãn hàng:', err)
    });

    this.genderService.getAll().subscribe({
      next: (res: any) => {
        this.genders = Array.isArray(res) ? res : [];
        // Sau khi load genders, kiểm tra query params và set filter
        this.route.queryParams.subscribe(params => {
          if (params['gender']) {
            const genderName = params['gender'];
            const foundGender = this.genders.find(g => g.name === genderName);
            if (foundGender) {
              this.genderFilter = foundGender._id;
              // Áp dụng filter sau khi set genderFilter
              if (this.products.length > 0) {
                this.applyFilters();
              }
            }
          }
        });
      },
      error: err => console.error('Lỗi khi tải giới tính:', err)
    });
  }

  onSearch() {
    // Search still applies immediately
    this.applyFilters();
    this.p = 1;
  }

  onFilterChange() {
    this.applyFilters();
    this.p = 1;
  }

  resetFilters() {
    this.keyword = '';
    this.typeFilter = '';
    this.riderFilter = '';
    this.brandFilter = '';
    this.genderFilter = '';
    this.sizeFilter = '';
    this.sortOption = '';
    this.showFilterDropdown = '';
    this.applyFilters();
  }

  private getProductTypeId(product: any): string | undefined {
    return product?.typeProduct?._id || product?.typeProduct;
  }

  private getProductRiderId(product: any): string | undefined {
    return product?.riderProduct?._id || product?.riderProduct;
  }

  private getProductBrandId(product: any): string | undefined {
    return product?.brandProduct?._id || product?.brandProduct;
  }

  private getProductGenderId(product: any): string | undefined {
    return product?.genderProduct?._id || product?.genderProduct;
  }

  private getProductTypeName(product: any): string {
    if (!product) return '';
    if (product.typeProduct) {
      // if stored as object
      if (typeof product.typeProduct === 'object') {
        return product.typeProduct.name || '';
      }
      // if stored as id string, find in loaded types
      const found = this.types.find(t => t._id === product.typeProduct);
      return found ? found.name : product.typeProduct;
    }
    return '';
  }

  private getProductRiderName(product: any): string {
    if (!product) return '';
    if (product.riderProduct) {
      if (typeof product.riderProduct === 'object') {
        return product.riderProduct.name || '';
      }
      const found = this.riders.find(r => r._id === product.riderProduct);
      return found ? found.name : product.riderProduct;
    }
    return '';
  }

  private getProductBrandName(product: any): string {
    if (!product) return '';
    if (product.brandProduct) {
      if (typeof product.brandProduct === 'object') {
        return product.brandProduct.name || '';
      }
      const found = this.brands.find(b => b._id === product.brandProduct);
      return found ? found.name : product.brandProduct;
    }
    return '';
  }

  applyFilters() {
    const kw = this.keyword?.trim().toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      // keyword filter (by name, brand, type, rider)
      let matchesKeyword = true;
      if (kw) {
        const productName = (p.nameProduct || '').toLowerCase();
        const brandName = this.getProductBrandName(p).toLowerCase();
        const typeName = this.getProductTypeName(p).toLowerCase();
        const riderName = this.getProductRiderName(p).toLowerCase();
        matchesKeyword = productName.includes(kw) || 
                        brandName.includes(kw) || 
                        typeName.includes(kw) || 
                        riderName.includes(kw);
      }

      // type filter
      const pidType = this.getProductTypeId(p) || '';
      const matchesType = !this.typeFilter || pidType === this.typeFilter;

      // rider filter
      const pidRider = this.getProductRiderId(p) || '';
      const matchesRider = !this.riderFilter || pidRider === this.riderFilter;

      // brand filter
      const pidBrand = this.getProductBrandId(p) || '';
      const matchesBrand = !this.brandFilter || pidBrand === this.brandFilter;

      // gender filter
      const pidGender = this.getProductGenderId(p) || '';
      const matchesGender = !this.genderFilter || pidGender === this.genderFilter;

      // size/accessory filter
      const hasSizes = this.hasSizes(p);
      let matchesSizeFilter = true;
      if (this.sizeFilter === 'has_size') {
        matchesSizeFilter = hasSizes;
      } else if (this.sizeFilter === 'accessory') {
        matchesSizeFilter = !hasSizes;
      }

      return matchesKeyword && matchesType && matchesRider && matchesBrand && matchesGender && matchesSizeFilter;
    });

    // Apply sorting if any
    this.applySort();
  }

  applySort() {
    if (!this.sortOption) return;

    const option = this.sortOption;
    this.filteredProducts.sort((a, b) => {
      const aPrice = Number(a.priceProduct ?? 0);
      const bPrice = Number(b.priceProduct ?? 0);
      const aStock = this.getTotalStock(a);
      const bStock = this.getTotalStock(b);

      switch (option) {
        case 'price_asc': return aPrice - bPrice;
        case 'price_desc': return bPrice - aPrice;
        case 'stock_asc': return aStock - bStock;
        case 'stock_desc': return bStock - aStock;
        default: return 0;
      }
    });
  }

  // helper to get first N sizes for UI
  getFirstSizes(product: any, limit = 3) {
    const sizes = product?.sizes;
    if (!Array.isArray(sizes)) return [];
    return sizes.slice(0, limit);
  }

  // returns how many more sizes beyond limit
  getRemainingSizeCount(product: any, limit = 3) {
    const sizes = product?.sizes;
    if (!Array.isArray(sizes)) return 0;
    return Math.max(0, sizes.length - limit);
  }

  hasSizes(product: any): boolean {
    return Array.isArray(product?.sizes) && product.sizes.length > 0;
  }

  // Helper để tính tổng tồn kho
  getTotalStock(product: any): number {
    if (this.hasSizes(product)) {
      // Tính tổng stock từ các sizes
      return product.sizes.reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
    }
    // Không có size -> lấy stockProduct
    return product?.stockProduct || 0;
  }

  onDelete(id: string) {
    const product = this.products.find(p => p._id === id);
    const productName = product?.nameProduct || 'sản phẩm này';
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}" không?`)) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.toastService.success('Xóa thành công!');
          // Emit refresh event để reload danh sách products
          this.refreshService.refreshProducts();
        },
        error: (err) => {
          console.error('Lỗi khi xóa sản phẩm:', err);
          this.toastService.error(err?.error?.message || 'Không thể xóa sản phẩm.');
        }
      });
    }
  }

  // expose type/rider name for template
  productTypeName(product: any) {
    return this.getProductTypeName(product);
  }

  productRiderName(product: any) {
    return this.getProductRiderName(product);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-btn-wrapper')) {
      this.showFilterDropdown = '';
    }
  }

  toggleFilter(filterType: string) {
    if (this.showFilterDropdown === filterType) {
      this.showFilterDropdown = '';
    } else {
      this.showFilterDropdown = filterType;
    }
  }

  selectFilter(filterType: string, value: string) {
    switch (filterType) {
      case 'type':
        this.typeFilter = this.typeFilter === value ? '' : value;
        break;
      case 'rider':
        this.riderFilter = this.riderFilter === value ? '' : value;
        break;
      case 'brand':
        this.brandFilter = this.brandFilter === value ? '' : value;
        break;
      case 'gender':
        this.genderFilter = this.genderFilter === value ? '' : value;
        break;
      case 'size':
        this.sizeFilter = this.sizeFilter === value ? '' : value;
        break;
    }
    this.showFilterDropdown = '';
    this.onFilterChange();
  }

  getTypeName(id: string): string {
    const type = this.types.find(t => t._id === id);
    return type ? type.name : '';
  }

  getRiderName(id: string): string {
    const rider = this.riders.find(r => r._id === id);
    return rider ? rider.name : '';
  }

  getBrandName(id: string): string {
    const brand = this.brands.find(b => b._id === id);
    return brand ? brand.name : '';
  }

  getGenderName(id: string): string {
    const gender = this.genders.find(g => g._id === id);
    return gender ? gender.name : '';
  }

  toggleActive(product: any) {
    const newStatus = product.isActive !== false ? false : true;
    const formData = new FormData();
    formData.append('isActive', newStatus.toString());
    
    // Cần thêm các field bắt buộc để update không bị lỗi
    formData.append('nameProduct', product.nameProduct || '');
    formData.append('priceProduct', (product.priceProduct || 0).toString());
    formData.append('discountProduct', (product.discountProduct || 0).toString());
    formData.append('descriptionProduct', product.descriptionProduct || '');
    formData.append('typeProduct', this.getProductTypeId(product) || '');
    
    // Handle gender, rider, brand
    const genderId = this.getProductGenderId(product);
    if (genderId) {
      formData.append('genderProduct', genderId);
    }
    
    const riderId = this.getProductRiderId(product);
    if (riderId) {
      formData.append('riderProduct', riderId);
    }
    
    const brandId = this.getProductBrandId(product);
    if (brandId) {
      formData.append('brandProduct', brandId);
    }
    
    // Handle tags
    if (product.tags && Array.isArray(product.tags)) {
      const tagIds = product.tags.map((tag: any) => typeof tag === 'object' ? tag._id : tag);
      formData.append('tags', JSON.stringify(tagIds));
    }
    
    formData.append('oldImagesProduct', JSON.stringify(product.imagesProduct || []));
    formData.append('sizes', JSON.stringify(product.sizes || []));
    
    // Handle stockProduct if no sizes
    if (!product.sizes || product.sizes.length === 0) {
      formData.append('stockProduct', (product.stockProduct || 0).toString());
    }
    
    this.productService.updateProduct(product._id, formData).subscribe({
      next: (res: any) => {
        product.isActive = newStatus;
        this.toastService.success(`Đã ${newStatus ? 'kích hoạt' : 'tắt'} sản phẩm "${product.nameProduct}"`);
        // Emit refresh event to update list
        this.refreshService.refreshProducts();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        this.toastService.error(err?.error?.message || 'Không thể cập nhật trạng thái, vui lòng thử lại.');
      }
    });
  }
}
