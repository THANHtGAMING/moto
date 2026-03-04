import { Component, OnInit, OnDestroy } from '@angular/core';
import { Product, isProductInStock, getTotalStock } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { BrandService } from '../../services/brand/brand.service';
import { RiderService } from '../../services/rider/rider.service';
import { TypeService } from '../../services/type/type.service';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { getProductImage } from '../../utils/image.util';

@Component({
  selector: 'app-all-product',
  standalone: true,
  templateUrl: './all-product.component.html',
  styleUrls: ['./all-product.component.css'],
  imports: [RouterModule, CommonModule, FormsModule]
})
export class AllProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading: boolean = false;
  error: string | null = null;
  pagination: any = {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  };
  currentKeyword: string = '';
  private subscriptions: Subscription[] = [];
  openDropdowns: { [key: string]: boolean } = {};
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Filter data
  brands: any[] = [];
  riders: any[] = [];
  types: any[] = [];
  allCategories: any[] = [];
  menCategoryId: string | null = null;
  womenCategoryId: string | null = null;
  currentCategoryId: string | null = null;

  // Selected filters
  selectedBrands: string[] = [];
  selectedRiders: string[] = [];
  selectedTypes: string[] = [];

  constructor(
    private productService: ProductService,
    private brandService: BrandService,
    private riderService: RiderService,
    private typeService: TypeService,

    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Load categories first to find men/women categories


    // Subscribe to route params
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        this.currentCategoryId = params['category'] || null;

        // Initialize selected filters from query params
        if (params['brand']) {
          this.selectedBrands = params['brand'].split(',').filter((id: string) => id.trim());
        } else {
          this.selectedBrands = [];
        }

        if (params['rider']) {
          this.selectedRiders = params['rider'].split(',').filter((id: string) => id.trim());
        } else {
          this.selectedRiders = [];
        }

        if (params['type']) {
          this.selectedTypes = params['type'].split(',').filter((id: string) => id.trim());
        } else {
          this.selectedTypes = [];
        }

        // Load products
        this.loadProducts(params);

        // Always load filters to ensure checkboxes are properly checked
        this.loadFilters();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProducts(params: any) {
    this.loading = true;
    this.error = null;
    this.currentKeyword = params.keyword || '';

    // Set default pagination params if not provided
    const queryParams = {
      ...params,
      page: params.page || 1,
      limit: params.limit || 20
    };

    this.subscriptions.push(
      this.productService.getProductByQuery(queryParams).subscribe({
        next: (data: any) => {
          this.products = data.products || [];
          this.pagination = data.pagination || {
            total: this.products.length,
            page: 1,
            limit: 20,
            totalPages: 1
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.error = 'Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại.';
          this.products = [];
          this.loading = false;
        }
      })
    );
  }

  onPageChange(page: number) {
    const currentParams = { ...this.route.snapshot.queryParams };
    this.router.navigate(['/allproduct'], {
      queryParams: { ...currentParams, page }
    });
  }

  onLimitChange(limit: number) {
    const currentParams = { ...this.route.snapshot.queryParams };
    this.router.navigate(['/allproduct'], {
      queryParams: { ...currentParams, limit, page: 1 }
    });
  }

  onSortChange(sort: string) {
    const currentParams = { ...this.route.snapshot.queryParams };
    this.router.navigate(['/allproduct'], {
      queryParams: { ...currentParams, sort, page: 1 }
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;

    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Adjust if we're near the start or end
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Check if product has sizes
  hasSizes(product: Product): boolean {
    return !!(product.sizes && product.sizes.length > 0);
  }

  // Check if product is in stock
  isInStock(product: Product): boolean {
    return isProductInStock(product);
  }

  // Get stock info text
  getStockInfo(product: Product): string {
    if (this.hasSizes(product)) {
      const availableSizes = product.sizes!.filter(s => s.stock > 0);
      if (availableSizes.length === 0) {
        return 'Hết hàng';
      }
      return `${availableSizes.length} sizes còn hàng`;
    }
    const stock = product.stockProduct ?? 0;
    if (stock === 0) return 'Hết hàng';
    if (stock <= 5) return `Còn ${stock} sản phẩm`;
    return 'Còn hàng';
  }

  // Get available sizes as string
  getAvailableSizes(product: Product): string {
    if (!this.hasSizes(product)) return '';
    const availableSizes = product.sizes!.filter(s => s.stock > 0);
    if (availableSizes.length === 0) return 'Hết size';
    return availableSizes.map(s => s.name).join(', ');
  }

  // Get total stock
  getTotalStock(product: Product): number {
    return getTotalStock(product);
  }

  // Check if product has discount
  hasDiscount(product: Product): boolean {
    return !!(product.discountProduct && product.discountProduct > 0);
  }

  // Get discounted price
  getDiscountedPrice(product: Product): number {
    if (product.discountProduct && product.discountProduct > 0) {
      return product.priceProduct * (1 - product.discountProduct / 100);
    }
    return product.priceProduct;
  }

  // Get product image URL
  getProductImage(images: string[] | null | undefined): string {
    return getProductImage(images);
  }

  getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'250\' height=\'250\'%3E%3Crect fill=\'%23ddd\' width=\'250\' height=\'250\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
  }

  toggleDropdown(key: string) {
    this.openDropdowns[key] = !this.openDropdowns[key];
  }

  isOpen(key: string): boolean {
    return !!this.openDropdowns[key];
  }

  onPriceChange() {
    // Optional: có thể thêm validation hoặc auto-apply ở đây
  }

  applyPriceFilter() {
    const currentParams = { ...this.route.snapshot.queryParams };
    const queryParams: any = { ...currentParams, page: 1 };

    if (this.minPrice !== null && this.minPrice > 0) {
      queryParams.minPrice = this.minPrice;
    }

    if (this.maxPrice !== null && this.maxPrice > 0) {
      queryParams.maxPrice = this.maxPrice;
    }

    this.router.navigate(['/allproduct'], { queryParams });
  }

  // Load categories to find men/women category IDs


  // Find men and women category IDs
  findMenAndWomenCategories() {
    const menKeywords = ['đàn ông', 'nam', 'men'];
    this.menCategoryId = this.allCategories.find((c: any) => {
      const name = (c.nameCategory || '').toLowerCase();
      return menKeywords.some(keyword => name.includes(keyword));
    })?._id || null;

    const womenKeywords = ['phụ nữ', 'nữ', 'woman', 'women'];
    this.womenCategoryId = this.allCategories.find((c: any) => {
      const name = (c.nameCategory || '').toLowerCase();
      return womenKeywords.some(keyword => name.includes(keyword));
    })?._id || null;
  }

  // Load filter data (brands, riders, types)
  loadFilters() {
    // Determine which category to filter by
    const categoryId = this.currentCategoryId || undefined;

    // Load types (no longer filtered by category)
    this.typeService.getAll().subscribe({
      next: (data: any) => {
        this.types = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error loading types:', err);
        this.types = [];
      }
    });

    // Load all brands and riders, then filter by products in current category
    forkJoin({
      brands: this.brandService.getAll(),
      riders: this.riderService.getAll()
    }).subscribe({
      next: (data: any) => {
        const allBrands = Array.isArray(data.brands) ? data.brands : [];
        const allRiders = Array.isArray(data.riders) ? data.riders : [];

        // If there's a category filter, get brands/riders from products in that category
        if (categoryId) {
          this.loadBrandsAndRidersFromProducts(categoryId, allBrands, allRiders);
        } else {
          // Show all brands and riders
          this.brands = allBrands.filter((brand: any) => !brand.status || brand.status === 'active');
          this.riders = allRiders; // Rider doesn't have status field
        }
      },
      error: (err) => {
        console.error('Error loading brands/riders:', err);
        this.brands = [];
        this.riders = [];
      }
    });
  }

  // Load brands and riders from products in a specific category
  loadBrandsAndRidersFromProducts(categoryId: string, allBrands: any[], allRiders: any[]) {
    // Load products in this category to extract unique brands and riders
    this.productService.getProductByQuery({ category: categoryId, limit: 1000 }).subscribe({
      next: (data: any) => {
        const categoryProducts = data.products || [];

        // Extract unique brand IDs
        const brandIds = new Set<string>();
        const riderIds = new Set<string>();

        categoryProducts.forEach((product: Product) => {
          const brandId = product.brandProduct?._id || product.brandProduct;
          const riderId = product.riderProduct?._id || product.riderProduct;

          if (brandId) brandIds.add(String(brandId));
          if (riderId) riderIds.add(String(riderId));
        });

        // Filter brands and riders
        this.brands = allBrands.filter((brand: any) =>
          (!brand.status || brand.status === 'active') && brandIds.has(String(brand._id))
        );
        this.riders = allRiders.filter((rider: any) =>
          riderIds.has(String(rider._id))
        );
      },
      error: (err) => {
        console.error('Error loading products for filters:', err);
        // Fallback to all active brands/riders
        this.brands = allBrands.filter((brand: any) => !brand.status || brand.status === 'active');
        this.riders = allRiders; // Rider doesn't have status field
      }
    });
  }

  // Handle checkbox changes
  onBrandChange(brandId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedBrands.includes(brandId)) {
        this.selectedBrands.push(brandId);
      }
    } else {
      this.selectedBrands = this.selectedBrands.filter(id => id !== brandId);
    }
    this.applyFilters();
  }

  onRiderChange(riderId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedRiders.includes(riderId)) {
        this.selectedRiders.push(riderId);
      }
    } else {
      this.selectedRiders = this.selectedRiders.filter(id => id !== riderId);
    }
    this.applyFilters();
  }

  onTypeChange(typeId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedTypes.includes(typeId)) {
        this.selectedTypes.push(typeId);
      }
    } else {
      this.selectedTypes = this.selectedTypes.filter(id => id !== typeId);
    }
    this.applyFilters();
  }

  isBrandSelected(brandId: string): boolean {
    return this.selectedBrands.includes(brandId);
  }

  isRiderSelected(riderId: string): boolean {
    return this.selectedRiders.includes(riderId);
  }

  isTypeSelected(typeId: string): boolean {
    return this.selectedTypes.includes(typeId);
  }

  // Apply filters by navigating with query params
  applyFilters() {
    const currentParams = { ...this.route.snapshot.queryParams };
    const queryParams: any = { ...currentParams, page: 1 };

    // Add brand filter (use first selected if backend only supports single value)
    if (this.selectedBrands.length > 0) {
      queryParams.brand = this.selectedBrands[0]; // Use first selected for now
    } else {
      delete queryParams.brand;
    }

    // Add rider filter (use first selected if backend only supports single value)
    if (this.selectedRiders.length > 0) {
      queryParams.rider = this.selectedRiders[0]; // Use first selected for now
    } else {
      delete queryParams.rider;
    }

    // Add type filter (use first selected if backend only supports single value)
    if (this.selectedTypes.length > 0) {
      queryParams.type = this.selectedTypes[0]; // Use first selected for now
    } else {
      delete queryParams.type;
    }

    this.router.navigate(['/allproduct'], { queryParams });
  }
}
