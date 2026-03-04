import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product, getDiscountedPrice } from '../../models/product';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getProductImage } from '../../utils/image.util';
import { BrandService } from '../../services/brand/brand.service';
import { RiderService } from '../../services/rider/rider.service';
import { TagService } from '../../services/tag/tag.service';
import { TypeService } from '../../services/type/type.service';
import { BannerService, Banner } from '../../services/banner/banner.service';
import { Rider } from '../../models/rider';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home-shop',
  standalone: true,
  templateUrl: './home-shop.component.html',
  styleUrls: ['./home-shop.component.css'],
  imports: [RouterModule, CommonModule, FormsModule]
})
export class HomeShopComponent implements OnInit, OnDestroy {
  @ViewChild('sliderTrack', { static: false }) sliderTrack!: ElementRef;
  @ViewChild('ridersTrack', { static: false }) ridersTrack!: ElementRef;

  title = "trang sản phẩm";
  products!: Product[] ; // khởi tạo rỗng luôn
  displayProducts: Product[] = []; // Sản phẩm hiển thị (tối đa 10)
  brands: any[] = []; // Danh sách nhãn hàng
  riders: Rider[] = []; // Danh sách tay đua
  displayRiders: Rider[] = []; // Tay đua hiển thị
  paymentMessage: string | null = null;
  paymentSuccess: boolean = false;
  orderCode: string | null = null;

  // Slideshow properties
  bannerImages: string[] = [];
  currentSlideIndex: number = 0;
  isLoadingBanners: boolean = true;
  private slideInterval: any;

  constructor(
    private productService: ProductService,
    private brandService: BrandService,
    private riderService: RiderService,
    private tagService: TagService,
    private typeService: TypeService,
    private bannerService: BannerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Load brands, riders, and tags first
    forkJoin({
      brands: this.brandService.getAll(),
      riders: this.riderService.getAll(),
      tags: this.tagService.getAll()
    }).subscribe({
      next: (data: any) => {
        // Process brands - chỉ lấy 9 brand đầu tiên
        this.brands = Array.isArray(data.brands)
          ? data.brands.filter((brand: any) => brand.status === 'active').slice(0, 9)
          : [];

        // Process riders
        this.riders = Array.isArray(data.riders) ? data.riders : [];
        this.displayRiders = this.riders.slice(0, 10);

        // Find discount tag and load products
        const tagsList = Array.isArray(data.tags) ? data.tags : [];
        const discountKeywords = ['giảm giá', 'sll', 'sale', 'discount'];
        const discountTag = tagsList.find((tag: any) => {
          const name = (tag.name || '').toLowerCase();
          return discountKeywords.some(keyword => name.includes(keyword));
        });

        // Load products filtered by discount tag
        this.loadProductsByDiscountTag(discountTag?._id);
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu:', err);
        // Fallback: load individually
        this.loadProductsWithDiscountTag();
        this.loadBrands();
        this.loadRiders();
      }
    });

    // Kiểm tra query parameters cho payment callback
    this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success') {
        this.paymentSuccess = true;
        this.orderCode = params['orderCode'] || null;
        this.paymentMessage = this.orderCode
          ? `Thanh toán thành công! Đơn hàng ${this.orderCode} đã được xác nhận.`
          : 'Thanh toán thành công!';

        // Xóa query parameters sau 5 giây
        setTimeout(() => {
          this.clearPaymentMessage();
        }, 5000);
      } else if (params['payment'] === 'failed') {
        this.paymentSuccess = false;
        this.paymentMessage = params['reason'] || 'Thanh toán thất bại. Vui lòng thử lại.';

        // Xóa query parameters sau 5 giây
        setTimeout(() => {
          this.clearPaymentMessage();
        }, 5000);
      }
    });

    // Load banners (will start slideshow after loading)
    this.loadBanners();
  }

  ngOnDestroy() {
    // Clean up slideshow interval
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // Slideshow methods
  startSlideshow() {
    // Clear existing interval if any
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    // Auto-advance slides every 5 seconds (only if more than 1 banner)
    if (this.bannerImages.length > 1) {
      this.slideInterval = setInterval(() => {
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.bannerImages.length;
      }, 5000);
    }
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
    // Reset interval when user manually selects a slide
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.startSlideshow();
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.bannerImages.length;
    // Reset interval when user manually navigates
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.startSlideshow();
  }

  prevSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.bannerImages.length) % this.bannerImages.length;
    // Reset interval when user manually navigates
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.startSlideshow();
  }

  loadBanners() {
    this.isLoadingBanners = true;
    this.bannerService.getAll(true).subscribe({
      next: (banners: Banner[]) => {
        this.isLoadingBanners = false;
        if (banners && banners.length > 0) {
          // Sắp xếp banner theo order và lấy imageUrl
          const sortedBanners = banners
            .filter((banner: Banner) => banner.isActive !== false)
            .sort((a: Banner, b: Banner) => (a.order || 0) - (b.order || 0));
          
          this.bannerImages = sortedBanners.map((banner: Banner) => banner.imageUrl);
          
          // Start slideshow if we have banners
          if (this.bannerImages.length > 0) {
            this.currentSlideIndex = 0; // Reset về slide đầu tiên
            this.startSlideshow();
          }
        }
        // Nếu không có banner, bannerImages sẽ là mảng rỗng và slideshow sẽ không hiển thị
      },
      error: (err: any) => {
        console.error('Lỗi khi tải banner:', err);
        this.isLoadingBanners = false;
        // Không hiển thị banner nếu có lỗi
        this.bannerImages = [];
      }
    });
  }

  clearPaymentMessage() {
    this.paymentMessage = null;
    this.paymentSuccess = false;
    this.orderCode = null;
    // Xóa query parameters khỏi URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  getProductImage(images: string[] | null | undefined): string {
    return getProductImage(images);
  }

  getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'250\' height=\'250\'%3E%3Crect fill=\'%23ddd\' width=\'250\' height=\'250\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
  }

  loadBrands() {
    this.brandService.getAll().subscribe({
      next: (data: any) => {
        // Chỉ lấy các brand đang active và giới hạn 9 brand
        this.brands = Array.isArray(data)
          ? data.filter((brand: any) => brand.status === 'active').slice(0, 9)
          : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải nhãn hàng:', err);
      }
    });
  }

  onBrandImageError(event: any, brandName: string) {
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='80'%3E%3Crect fill='%23f0f0f0' width='150' height='80'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(brandName)}%3C/text%3E%3C/svg%3E`;
    event.target.src = placeholder;
  }

  // Navigate to products by brand
  navigateToBrand(brandId: string): void {
    this.router.navigate(['/allproduct'], {
      queryParams: { brand: brandId }
    });
  }

  // Navigate to products by rider
  navigateToRider(riderId: string): void {
    this.router.navigate(['/allproduct'], {
      queryParams: { rider: riderId }
    });
  }

  // Navigate to products by type (mũ or phụ kiện)
  navigateToType(typeName: string): void {
    // Load types and find matching type
    this.typeService.getAll().subscribe({
      next: (types: any) => {
        const typesList = Array.isArray(types) ? types : [];
        // Tìm type có tên chứa từ khóa (không phân biệt hoa thường)
        const matchingType = typesList.find((type: any) => {
          const name = (type.name || '').toLowerCase();
          const searchTerm = typeName.toLowerCase();
          return name.includes(searchTerm) || searchTerm.includes(name);
        });

        if (matchingType && matchingType._id) {
          // Navigate với type ID
          this.router.navigate(['/allproduct'], {
            queryParams: { type: matchingType._id }
          });
        } else {
          // Fallback: dùng keyword search nếu không tìm thấy type
          this.router.navigate(['/allproduct'], {
            queryParams: { keyword: typeName }
          });
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải types:', err);
        // Fallback: dùng keyword search
        this.router.navigate(['/allproduct'], {
          queryParams: { keyword: typeName }
        });
      }
    });
  }

  getDiscountedPrice(product: Product): number {
    return getDiscountedPrice(product);
  }

  scrollLeft() {
    if (this.sliderTrack) {
      const track = this.sliderTrack.nativeElement;
      track.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.sliderTrack) {
      const track = this.sliderTrack.nativeElement;
      track.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }

  loadRiders() {
    this.riderService.getAll().subscribe({
      next: (data: any) => {
        this.riders = Array.isArray(data) ? data : [];
        // Hiển thị tất cả riders hoặc giới hạn số lượng
        this.displayRiders = this.riders.slice(0, 10);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách tay đua:', err);
      }
    });
  }

  scrollRidersLeft() {
    if (this.ridersTrack) {
      const track = this.ridersTrack.nativeElement;
      track.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  scrollRidersRight() {
    if (this.ridersTrack) {
      const track = this.ridersTrack.nativeElement;
      track.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }

  getRiderNumber(rider: Rider): string {
    // Lấy số từ tên rider nếu có, hoặc dùng index
    const match = rider.name.match(/\d+/);
    if (match) {
      return match[0];
    }
    // Nếu không có số trong tên, dùng index + 1
    const index = this.displayRiders.indexOf(rider);
    return (index + 1).toString();
  }

  getCategoryName(product: Product): string {
    // Category no longer exists, use type instead
    if (!product.typeProduct) return '';
    if (typeof product.typeProduct === 'object' && product.typeProduct.name) {
      return product.typeProduct.name;
    }
    return '';
  }

  getTypeName(product: Product): string {
    if (!product.typeProduct) return '';
    if (typeof product.typeProduct === 'object' && product.typeProduct.name) {
      return product.typeProduct.name;
    }
    return '';
  }

  getTagNames(product: Product): string[] {
    if (!product.tags || !Array.isArray(product.tags)) return [];
    return product.tags
      .map((tag: any) => {
        if (typeof tag === 'object' && tag.name) {
          return tag.name;
        }
        return null;
      })
      .filter((name: string | null): name is string => name !== null);
  }

  getCategoryAndTypeLabel(product: Product): string {
    const categoryName = this.getCategoryName(product);
    const typeName = this.getTypeName(product);

    if (categoryName && typeName) {
      return `${categoryName} - ${typeName}`;
    } else if (categoryName) {
      return categoryName;
    } else if (typeName) {
      return typeName;
    }
    return '';
  }

  // Load products filtered by discount tag using API
  loadProductsByDiscountTag(tagId: string | undefined) {
    if (tagId) {
      // Use API to filter products by tag
      this.productService.getProductByQuery({
        tags: tagId,
        limit: 10,
        page: 1
      }).subscribe({
        next: (result: any) => {
          this.products = Array.isArray(result.products) ? result.products as Product[] : [];
          this.displayProducts = this.products.slice(0, 10);
        },
        error: (err) => {
          console.error('Lỗi khi tải sản phẩm theo tag:', err);
          // Fallback: load all products and filter client-side
          this.loadProductsWithDiscountTag();
        }
      });
    } else {
      // Fallback: load products with discount > 0
      this.productService.getProductByQuery({
        limit: 10,
        page: 1
      }).subscribe({
        next: (result: any) => {
          this.products = Array.isArray(result.products) ? result.products as Product[] : [];
          // Filter products with discount > 0
          this.displayProducts = this.products
            .filter((p: Product) => p.discountProduct && p.discountProduct > 0)
            .slice(0, 10);
        },
        error: (err) => {
          console.error('Lỗi khi tải sản phẩm:', err);
          this.products = [];
          this.displayProducts = [];
        }
      });
    }
  }

  // Load products filtered by discount tag (fallback method)
  loadProductsWithDiscountTag() {
    // First load tags to find discount tag
    this.tagService.getAll().subscribe({
      next: (tags: any) => {
        const tagsList = Array.isArray(tags) ? tags : [];

        // Find discount tag (GIẢM GIÁ SLL SẢN PHẨM)
        const discountKeywords = ['giảm giá', 'sll', 'sale', 'discount'];
        const discountTag = tagsList.find((tag: any) => {
          const name = (tag.name || '').toLowerCase();
          return discountKeywords.some(keyword => name.includes(keyword));
        });

        // Load products using API filter
        if (discountTag && discountTag._id) {
          this.loadProductsByDiscountTag(discountTag._id);
        } else {
          // Fallback: load all products and filter by discount
          this.productService.getAll().subscribe({
            next: (products: any) => {
              this.products = Array.isArray(products) ? products as Product[] : [];
              this.displayProducts = this.products
                .filter((p: Product) => p.discountProduct && p.discountProduct > 0)
                .slice(0, 10);
            },
            error: (err) => {
              console.error('Lỗi khi tải sản phẩm:', err);
              this.products = [];
              this.displayProducts = [];
            }
          });
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải tags:', err);
        // Fallback: load products without tag filter
        this.productService.getAll().subscribe({
          next: (products: any) => {
            this.products = Array.isArray(products) ? products as Product[] : [];
            this.displayProducts = this.products
              .filter((p: Product) => p.discountProduct && p.discountProduct > 0)
              .slice(0, 10);
          }
        });
      }
    });
  }

}
