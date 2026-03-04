import { Component, OnInit, OnDestroy, HostListener, isDevMode } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart/cart.service';
import { WishlistService } from '../../services/wishlist/wishlist.service';
import { CouponService } from '../../services/coupon/coupon.service';
import { BrandService } from '../../services/brand/brand.service';
import { RiderService } from '../../services/rider/rider.service';
import { TypeService } from '../../services/type/type.service';
import { GenderService } from '../../services/gender/gender.service';
import { TagService } from '../../services/tag/tag.service';
import { Subscription, forkJoin } from 'rxjs';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';
import { ChatboxComponent } from '../chatbox/chatbox.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Cart } from '../../models/cart';
import { BannerService } from '../../services/banner/banner.service';

@Component({
  selector: 'app-header-shop',
  standalone: true,
  templateUrl: './header-shop.component.html',
  styleUrls: ['./header-shop.component.css'],
  imports: [RouterModule, CommonModule, ChangePasswordModalComponent, ChatboxComponent, RouterLink, FormsModule],
})
export class HeaderShopComponent implements OnInit, OnDestroy {
  brands: any[] = []; // Danh sách nhãn hàng
  riders: any[] = []; // Danh sách tay đua
  menTypes: any[] = []; // Danh sách loại sản phẩm cho đàn ông
  menGenderId: string | null = null; // ID của gender "Đàn ông"
  womenTypes: any[] = []; // Danh sách loại sản phẩm cho phụ nữ
  womenGenderId: string | null = null; // ID của gender "Phụ nữ"
  kidTypes: any[] = []; // Danh sách loại sản phẩm cho trẻ em
  kidGenderId: string | null = null; // ID của gender "Trẻ em"
  giftTypes: any[] = []; // Danh sách loại sản phẩm cho quà tặng & phụ kiện
  giftTagId: string | null = null; // ID của tag "QUÀ TẶNG & PHỤ KIỆN"
  discountTypes: any[] = []; // Danh sách loại sản phẩm cho giảm giá sll sản phẩm
  discountTagId: string | null = null; // ID của tag "GIẢM GIÁ SLL SẢN PHẨM"
  showWomenMenu = false; // Flag để hiển thị menu phụ nữ
  showKidMenu = false; // Flag để hiển thị menu trẻ em
  isADM: any;
  isLogin: any;
  cartCount: number = 0;
  wishlistCount: number = 0;
  showProfileDropdown = false;
  showChangePasswordModal = false;
  searchKeyword: string = '';
  showShopByTeam = false;
  showShopByRider = false;
  MenuMan = false;
  showGiftMenu = false;
  showDiscountMenu = false;
  currentCoupon: any = null; // Store current coupon info
  isCouponBannerDismissed = false; // Track if user dismissed the banner
  showAdModal = false; // Track if ad modal should be shown
  modalBannerImage: string = ''; // Banner image for modal
  private searchSubject = new Subject<string>();

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private couponService: CouponService,
    private brandService: BrandService,
    private riderService: RiderService,
    private typeService: TypeService,
    private genderService: GenderService,
    private tagService: TagService,
    private bannerService: BannerService
  ) {
    this.isADM = auth.checkAdmin();
    this.isLogin = auth.checkLogin();
  }

  ngOnInit(): void {
    // Load data in parallel using forkJoin for better performance
    forkJoin({
      genders: this.genderService.getAll(),
      tags: this.tagService.getAll(),
      brands: this.brandService.getAll(),
      riders: this.riderService.getAll()
    }).subscribe({
      next: (data: any) => {
        // Process genders
        const gendersList = Array.isArray(data.genders) ? data.genders : [];
        this.findMenAndWomenGenderIds(gendersList);
        this.findKidGenderId(gendersList);

        // Load types based on gender IDs
        if (this.menGenderId) {
          this.loadMenTypes();
        } else {
          this.loadMenTypes(); // Fallback
        }

        if (this.womenGenderId) {
          this.loadWomenTypes();
        } else {
          this.loadWomenTypes(); // Fallback
        }

        if (this.kidGenderId) {
          this.loadKidTypes();
        } else {
          this.loadKidTypes(); // Fallback
        }

        // Process tags
        this.processTags(data.tags);
        if (this.giftTagId) {
          this.loadGiftTypes();
        }
        if (this.discountTagId) {
          this.loadDiscountTypes();
        }

        // Process brands
        this.brands = Array.isArray(data.brands)
          ? data.brands.filter((brand: any) => brand.status === 'active')
          : [];

        // Process riders
        this.riders = Array.isArray(data.riders) ? data.riders : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu:', err);
        // Fallback: load individually if parallel loading fails
        this.loadBrands();
        this.loadRiders();
        this.genderService.getAll().subscribe({
          next: (genders: any) => {
            const gendersList = Array.isArray(genders) ? genders : [];
            this.findMenAndWomenGenderIds(gendersList);
            this.findKidGenderId(gendersList);
            this.loadMenTypes();
            this.loadWomenTypes();
            this.loadKidTypes();
          },
          error: () => {
            this.loadMenTypes();
            this.loadWomenTypes();
          }
        });
        this.loadTags().then(() => {
          if (this.giftTagId) this.loadGiftTypes();
          if (this.discountTagId) this.loadDiscountTypes();
        }).catch(() => {});
      }
    });

    // Subscribe to cart count updates
    this.subscriptions.push(
      this.cartService.cartCount$.subscribe(count => {
        this.cartCount = count;
      })
    );

    // Load coupon from header (coupon được chọn hiển thị)
    this.loadHeaderCoupon();

    // Subscribe to wishlist count updates
    this.subscriptions.push(
      this.wishlistService.wishlistCount$.subscribe(count => {
        this.wishlistCount = count;
      })
    );

    // Setup search debounce (300ms)
    this.subscriptions.push(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(keyword => {
        // Optional: Could trigger search suggestions here
        // For now, we'll just handle Enter/click to navigate
      })
    );

    // Check for keyword in current route
    this.route.queryParams.subscribe(params => {
      if (params['keyword']) {
        this.searchKeyword = params['keyword'];
      }
    });

    // Refresh user info, cart and wishlist if user is logged in
    if (this.isLogin) {
      this.refreshUserInfo();
      this.cartService.refreshCart();
      this.wishlistService.refreshWishlistCount();
    }

    // Subscribe to user changes (login/logout events)
    this.subscriptions.push(
      this.auth.user$.subscribe(user => {
        if (user) {
          this.isLogin = user;
          this.isADM = user.isAdmin === true;
          // Refresh cart and wishlist when user logs in
          this.cartService.refreshCart();
          this.wishlistService.refreshWishlistCount();
        } else {
          this.isLogin = false;
          this.isADM = false;
        }
      })
    );

    // Refresh header coupon every 30 seconds to catch updates from admin
    setInterval(() => {
      if (!this.isCouponBannerDismissed) {
        this.loadHeaderCoupon();
      }
    }, 30000);

    // Show ad modal on first visit to homepage only (check localStorage)
    this.checkAndShowAdModal();

    // Listen to route changes to check if we're on homepage
    this.subscriptions.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects || event.url;
        const isHomepage = currentUrl === '/store' || currentUrl === '/' || currentUrl === '';
        if (isHomepage) {
          this.checkAndShowAdModal();
        }
      })
    );
  }

  refreshUserInfo() {
    this.auth.authUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.isLogin = user;
          this.isADM = user.isAdmin === true;
        }
      },
      error: () => {
        this.isLogin = false;
        this.isADM = false;
      }
    });
  }

  // Kiểm tra user có password không (OAuth users không có password)
  get hasPassword(): boolean {
    if (!this.isLogin) return false;
    // OAuth users có googleId hoặc facebookId
    // Nếu có googleId hoặc facebookId => đăng nhập bằng OAuth => không hiển thị "Đổi mật khẩu"
    const isOAuthUser = !!(this.isLogin.googleId || this.isLogin.facebookId);
    return !isOAuthUser;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Profile dropdown methods
  toggleProfileDropdown() {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.showProfileDropdown = false;
    }
  }

  onProfileClick() {
    this.router.navigate(['/profile']);
    this.showProfileDropdown = false;
  }


  onChangePasswordClick() {
    this.showChangePasswordModal = true;
    this.showProfileDropdown = false;
  }

  onCloseChangePasswordModal() {
    this.showChangePasswordModal = false;
  }

  onChangePasswordSuccess() {
    this.showChangePasswordModal = false;
    // Optionally refresh user info
    this.refreshUserInfo();
  }

  getShortName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Search functionality
  onSearchInput() {
    this.searchSubject.next(this.searchKeyword);
  }

  onSearchSubmit() {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/allproduct'], {
        queryParams: { keyword: this.searchKeyword.trim() }
      });
    } else {
      // If empty, navigate to all products without keyword
      this.router.navigate(['/allproduct']);
    }
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearchSubmit();
    }
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => {
        this.isLogin = false;
        this.isADM = false;
        this.cartService.clearLocalCart(); // Clear cart state on logout
        this.wishlistCount = 0; // Clear wishlist count on logout
        this.currentCoupon = null; // Clear coupon on logout
        this.router.navigate(['/store']);
      },
      error: (err) => {
        console.error("Logout error:", err);
        // Clear local data even if API call fails
        this.isLogin = false;
        this.isADM = false;
        this.cartService.clearLocalCart();
        this.wishlistCount = 0;
        this.currentCoupon = null;
        localStorage.removeItem('user');
        this.router.navigate(['/store']);
      }
    });
  }

  // Load coupon được chọn hiển thị trên header
  loadHeaderCoupon(): void {
    if (!this.isCouponBannerDismissed) {
      this.couponService.getHeaderCoupon().subscribe({
        next: (coupon) => {
          this.currentCoupon = coupon;
        },
        error: (err) => {
          console.error('Error loading header coupon:', err);
          this.currentCoupon = null;
        }
      });
    }
  }

  // Dismiss coupon banner
  dismissCouponBanner(): void {
    this.isCouponBannerDismissed = true;
    this.currentCoupon = null;
  }

  // Navigate to cart when clicking on banner
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // Process tags from API response
  processTags(tags: any): void {
    const tagsList = Array.isArray(tags) ? tags : [];
    const giftKeywords = ['quà tặng', 'phụ kiện', 'gift', 'accessory'];
    const discountKeywords = ['giảm giá', 'sale', 'discount', 'clearance'];

    const giftTag = tagsList.find((t: any) => {
      const name = (t.name || '').toLowerCase();
      return giftKeywords.some(keyword => name.includes(keyword));
    });
    this.giftTagId = giftTag?._id || null;

    const discountTag = tagsList.find((t: any) => {
      const name = (t.name || '').toLowerCase();
      return discountKeywords.some(keyword => name.includes(keyword));
    });
    this.discountTagId = discountTag?._id || null;
  }

  // Load brands
  loadBrands(): void {
    this.brandService.getAll().subscribe({
      next: (data: any) => {
        // Chỉ lấy các brand đang active
        this.brands = Array.isArray(data)
          ? data.filter((brand: any) => brand.status === 'active')
          : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải nhãn hàng:', err);
        this.brands = [];
      }
    });
  }

  // Navigate to products by brand
  navigateToBrand(brandId: string): void {
    this.router.navigate(['/allproduct'], {
      queryParams: { brand: brandId }
    });
    this.showShopByTeam = false; // Close submenu after navigation
  }

  // Get column indices for 4 columns
  getColumnIndices(): number[] {
    return [0, 1, 2, 3];
  }

  // Get brands for a specific column (4 columns, 2 rows each, first column can have 3 if total is 9)
  getBrandsForColumn(columnIndex: number): any[] {
    const totalBrands = this.brands.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      // First column: 3 items if total >= 9, otherwise 2
      itemsInColumn = (totalBrands >= 9) ? 3 : Math.min(2, totalBrands);
      startIndex = 0;
    } else if (columnIndex === 1) {
      // Second column: start after first column
      const firstColumnItems = (totalBrands >= 9) ? 3 : Math.min(2, totalBrands);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalBrands - startIndex);
    } else if (columnIndex === 2) {
      // Third column
      const firstColumnItems = (totalBrands >= 9) ? 3 : Math.min(2, totalBrands);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalBrands - startIndex);
    } else if (columnIndex === 3) {
      // Fourth column
      const firstColumnItems = (totalBrands >= 9) ? 3 : Math.min(2, totalBrands);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalBrands - startIndex);
    }

    return this.brands.slice(startIndex, startIndex + itemsInColumn);
  }

  // Handle brand image error
  onBrandImageError(event: any, brandName: string): void {
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23f0f0f0' width='40' height='40'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='9' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(brandName.substring(0, 2))}%3C/text%3E%3C/svg%3E`;
    event.target.src = placeholder;
  }

  // Load riders
  loadRiders(): void {
    this.riderService.getAll().subscribe({
      next: (data: any) => {
        // Chỉ lấy các rider đang active (nếu có status field)
        this.riders = Array.isArray(data)
          ? data.filter((rider: any) => !rider.status || rider.status === 'active')
          : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải tay đua:', err);
        this.riders = [];
      }
    });
  }

  // Navigate to products by rider
  navigateToRider(riderId: string): void {
    this.router.navigate(['/allproduct'], {
      queryParams: { rider: riderId }
    });
    this.showShopByRider = false; // Close submenu after navigation
  }

  // Get riders for a specific column (4 columns, 2 rows each, first column can have 3 if total is 9)
  getRidersForColumn(columnIndex: number): any[] {
    const totalRiders = this.riders.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      // First column: 3 items if total >= 9, otherwise 2
      itemsInColumn = (totalRiders >= 9) ? 3 : Math.min(2, totalRiders);
      startIndex = 0;
    } else if (columnIndex === 1) {
      // Second column: start after first column
      const firstColumnItems = (totalRiders >= 9) ? 3 : Math.min(2, totalRiders);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalRiders - startIndex);
    } else if (columnIndex === 2) {
      // Third column
      const firstColumnItems = (totalRiders >= 9) ? 3 : Math.min(2, totalRiders);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalRiders - startIndex);
    } else if (columnIndex === 3) {
      // Fourth column
      const firstColumnItems = (totalRiders >= 9) ? 3 : Math.min(2, totalRiders);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalRiders - startIndex);
    }

    return this.riders.slice(startIndex, startIndex + itemsInColumn);
  }


  // Find men and women gender IDs
  findMenAndWomenGenderIds(genders: any[]): void {
    const menKeywords = ['đàn ông', 'nam', 'men', 'male'];
    const womenKeywords = ['phụ nữ', 'nữ', 'woman', 'women', 'female'];

    const menGender = genders.find((g: any) => {
      const name = (g.name || '').toLowerCase();
      return menKeywords.some(keyword => name.includes(keyword));
    });
    this.menGenderId = menGender?._id || null;
    console.log('Men Gender ID:', this.menGenderId, 'Found from:', genders.map((g: any) => g.name));

    const womenGender = genders.find((g: any) => {
      const name = (g.name || '').toLowerCase();
      return womenKeywords.some(keyword => name.includes(keyword));
    });
    this.womenGenderId = womenGender?._id || null;
    console.log('Women Gender ID:', this.womenGenderId, 'Found from:', genders.map((g: any) => g.name));
  }

  // Find kid gender ID
  findKidGenderId(genders: any[]): void {
    const kidKeywords = ['trẻ em', 'trẻ', 'kid', 'kids', 'children', 'child'];

    const kidGender = genders.find((g: any) => {
      const name = (g.name || '').toLowerCase();
      return kidKeywords.some(keyword => name.includes(keyword));
    });
    this.kidGenderId = kidGender?._id || null;
    console.log('Kid Gender ID:', this.kidGenderId, 'Found from:', genders.map((g: any) => g.name));
  }

  // Load men types
  loadMenTypes(): void {
    // Filter types by men gender
    if (this.menGenderId) {
      console.log('Loading men types with gender ID:', this.menGenderId);
      this.typeService.getAll(this.menGenderId).subscribe({
        next: (data: any) => {
          const allTypes = Array.isArray(data) ? data : [];
          // Filter: lấy tất cả types có gender "Đàn Ông" (kể cả khi có cả gender "Phụ Nữ")
          this.menTypes = allTypes.filter((type: any) => {
            const genders = type.genders || [];
            const genderIds = genders.map((g: any) => g._id || g);
            const hasMenGender = genderIds.includes(this.menGenderId);
            // Hiển thị nếu có gender đàn ông (không cần loại trừ gender phụ nữ)
            return hasMenGender;
          });
          console.log('Men types loaded (filtered):', this.menTypes.length, this.menTypes);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm đàn ông:', err);
          this.menTypes = [];
        }
      });
    } else {
      // Fallback: load all types if gender not found
      console.log('Men gender ID not found, loading all types');
      this.typeService.getAll().subscribe({
        next: (data: any) => {
          this.menTypes = Array.isArray(data) ? data : [];
          console.log('All types loaded for men (fallback):', this.menTypes.length);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm đàn ông:', err);
          this.menTypes = [];
        }
      });
    }
  }

  // Load women types
  loadWomenTypes(): void {
    // Filter types by women gender
    if (this.womenGenderId) {
      console.log('Loading women types with gender ID:', this.womenGenderId);
      this.typeService.getAll(this.womenGenderId).subscribe({
        next: (data: any) => {
          const allTypes = Array.isArray(data) ? data : [];
          // Filter: lấy tất cả types có gender "Phụ Nữ" (kể cả khi có cả gender "Đàn Ông")
          this.womenTypes = allTypes.filter((type: any) => {
            const genders = type.genders || [];
            const genderIds = genders.map((g: any) => g._id || g);
            const hasWomenGender = genderIds.includes(this.womenGenderId);
            // Hiển thị nếu có gender phụ nữ (không cần loại trừ gender đàn ông)
            return hasWomenGender;
          });
          console.log('Women types loaded (filtered):', this.womenTypes.length, this.womenTypes);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm phụ nữ:', err);
          this.womenTypes = [];
        }
      });
    } else {
      // Fallback: load all types if gender not found
      console.log('Women gender ID not found, loading all types');
      this.typeService.getAll().subscribe({
        next: (data: any) => {
          this.womenTypes = Array.isArray(data) ? data : [];
          console.log('All types loaded for women (fallback):', this.womenTypes.length);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm phụ nữ:', err);
          this.womenTypes = [];
        }
      });
    }
  }

  // Load kid types
  loadKidTypes(): void {
    // Filter types by kid gender
    if (this.kidGenderId) {
      console.log('Loading kid types with gender ID:', this.kidGenderId);
      this.typeService.getAll(this.kidGenderId).subscribe({
        next: (data: any) => {
          const allTypes = Array.isArray(data) ? data : [];
          // Filter: lấy tất cả types có gender "Trẻ em"
          this.kidTypes = allTypes.filter((type: any) => {
            const genders = type.genders || [];
            const genderIds = genders.map((g: any) => g._id || g);
            const hasKidGender = genderIds.includes(this.kidGenderId);
            return hasKidGender;
          });
          console.log('Kid types loaded (filtered):', this.kidTypes.length, this.kidTypes);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm trẻ em:', err);
          this.kidTypes = [];
        }
      });
    } else {
      // Fallback: load all types if gender not found
      console.log('Kid gender ID not found, loading all types');
      this.typeService.getAll().subscribe({
        next: (data: any) => {
          this.kidTypes = Array.isArray(data) ? data : [];
          console.log('All types loaded for kids (fallback):', this.kidTypes.length);
        },
        error: (err: any) => {
          console.error('Lỗi khi tải loại sản phẩm trẻ em:', err);
          this.kidTypes = [];
        }
      });
    }
  }

  // Load gift types (filter types by gift tag)
  loadGiftTypes(): void {
    if (!this.giftTagId) {
      console.log('Gift tag ID not found, skipping gift types load');
      this.giftTypes = [];
      return;
    }
    // Load all types and filter by gift tag
    this.typeService.getAll().subscribe({
      next: (data: any) => {
        const allTypes = Array.isArray(data) ? data : [];
        // Filter: lấy tất cả types có tag "Quà tặng & Phụ kiện"
        this.giftTypes = allTypes.filter((type: any) => {
          const tags = type.tags || [];
          const tagIds = tags.map((t: any) => t._id || t);
          const hasGiftTag = tagIds.includes(this.giftTagId);
          return hasGiftTag;
        });
        console.log('Gift types loaded (filtered):', this.giftTypes.length, this.giftTypes);
      },
      error: (err) => {
        console.error('Lỗi khi tải loại sản phẩm quà tặng:', err);
        this.giftTypes = [];
      }
    });
  }

  // Load discount types (filter types by discount tag)
  loadDiscountTypes(): void {
    if (!this.discountTagId) {
      console.log('Discount tag ID not found, skipping discount types load');
      this.discountTypes = [];
      return;
    }
    // Load all types and filter by discount tag
    this.typeService.getAll().subscribe({
      next: (data: any) => {
        const allTypes = Array.isArray(data) ? data : [];
        // Filter: lấy tất cả types có tag "Giảm giá SLL sản phẩm"
        this.discountTypes = allTypes.filter((type: any) => {
          const tags = type.tags || [];
          const tagIds = tags.map((t: any) => t._id || t);
          const hasDiscountTag = tagIds.includes(this.discountTagId);
          return hasDiscountTag;
        });
        console.log('Discount types loaded (filtered):', this.discountTypes.length, this.discountTypes);
      },
      error: (err) => {
        console.error('Lỗi khi tải loại sản phẩm giảm giá:', err);
        this.discountTypes = [];
      }
    });
  }

  // Get men types for a specific column (4 columns, similar to brands/riders)
  getMenTypesForColumn(columnIndex: number): any[] {
    const totalTypes = this.menTypes.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      // First column: 3 items if total >= 9, otherwise 2
      itemsInColumn = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = 0;
    } else if (columnIndex === 1) {
      // Second column: start after first column
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 2) {
      // Third column
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 3) {
      // Fourth column
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    }

    return this.menTypes.slice(startIndex, startIndex + itemsInColumn);
  }

  // Get women types for a specific column (4 columns, similar to men types)
  getWomenTypesForColumn(columnIndex: number): any[] {
    const totalTypes = this.womenTypes.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      itemsInColumn = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = 0;
    } else if (columnIndex === 1) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 2) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 3) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    }

    return this.womenTypes.slice(startIndex, startIndex + itemsInColumn);
  }

  // Get kid types for a specific column (4 columns, similar to men/women types)
  getKidTypesForColumn(columnIndex: number): any[] {
    const totalTypes = this.kidTypes.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      itemsInColumn = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = 0;
    } else if (columnIndex === 1) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 2) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 3) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    }

    return this.kidTypes.slice(startIndex, startIndex + itemsInColumn);
  }

  // Get gift types for a specific column (4 columns)
  getGiftTypesForColumn(columnIndex: number): any[] {
    const totalTypes = this.giftTypes.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      itemsInColumn = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = 0;
    } else if (columnIndex === 1) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 2) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 3) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    }

    return this.giftTypes.slice(startIndex, startIndex + itemsInColumn);
  }

  // Get discount types for a specific column (4 columns)
  getDiscountTypesForColumn(columnIndex: number): any[] {
    const totalTypes = this.discountTypes.length;
    let startIndex = 0;
    let itemsInColumn = 2;

    // Calculate start index based on previous columns
    if (columnIndex === 0) {
      itemsInColumn = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = 0;
    } else if (columnIndex === 1) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 2) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 2;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    } else if (columnIndex === 3) {
      const firstColumnItems = (totalTypes >= 9) ? 3 : Math.min(2, totalTypes);
      startIndex = firstColumnItems + 4;
      itemsInColumn = Math.min(2, totalTypes - startIndex);
    }

    return this.discountTypes.slice(startIndex, startIndex + itemsInColumn);
  }

  // Load tags and find gift/discount tag IDs
  loadTags(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tagService.getAll().subscribe({
        next: (tags: any) => {
          const tagsList = Array.isArray(tags) ? tags : [];

          // Find gift tag (QUÀ TẶNG & PHỤ KIỆN)
          const giftKeywords = ['quà tặng', 'phụ kiện', 'gift', 'accessory'];
          const giftTag = tagsList.find((tag: any) => {
            const name = (tag.name || '').toLowerCase();
            return giftKeywords.some(keyword => name.includes(keyword));
          });
          this.giftTagId = giftTag?._id || null;
          console.log('Gift Tag ID:', this.giftTagId);

          // Find discount tag (GIẢM GIÁ SLL SẢN PHẨM)
          const discountKeywords = ['giảm giá', 'sll', 'sale', 'discount'];
          const discountTag = tagsList.find((tag: any) => {
            const name = (tag.name || '').toLowerCase();
            return discountKeywords.some(keyword => name.includes(keyword));
          });
          this.discountTagId = discountTag?._id || null;
          console.log('Discount Tag ID:', this.discountTagId);
          resolve();
        },
        error: (err) => {
          console.error('Lỗi khi tải tags:', err);
          reject(err);
        }
      });
    });
  }

  // Navigate to products by gender only
  navigateToGender(genderId: string | null): void {
    if (!genderId) {
      console.warn('Gender ID is null, cannot navigate');
      return;
    }
    const queryParams: any = { gender: genderId };
    this.router.navigate(['/allproduct'], { queryParams });
    this.MenuMan = false; // Close submenu after navigation
    this.showWomenMenu = false; // Close women menu
    this.showKidMenu = false; // Close kid menu
    this.showGiftMenu = false; // Close gift menu
  }

  // Navigate to products by type
  navigateToType(typeId: string, genderId?: string | null): void {
    const queryParams: any = { type: typeId };
    // Add gender filter if provided
    if (genderId) {
      queryParams.gender = genderId;
    }
    this.router.navigate(['/allproduct'], { queryParams });
    this.MenuMan = false; // Close submenu after navigation
    this.showWomenMenu = false; // Close women menu
    this.showKidMenu = false; // Close kid menu
    this.showGiftMenu = false; // Close gift menu
  }

  // Navigate to products by tag
  navigateToTag(tagId: string | null, typeId?: string): void {
    if (!tagId) {
      console.warn('Tag ID is null, cannot navigate');
      return;
    }
    const queryParams: any = { tags: tagId };
    // Add type filter if provided (for submenu items)
    if (typeId) {
      queryParams.type = typeId;
    }
    this.router.navigate(['/allproduct'], { queryParams });
    this.showGiftMenu = false; // Close gift menu
    this.showDiscountMenu = false; // Close discount menu
  }

  // Ad Modal methods
  checkAndShowAdModal(): void {
    // Only show modal on homepage (/store or /)
    const currentUrl = this.router.url;
    const isHomepage = currentUrl === '/store' || currentUrl === '/' || currentUrl === '';
    
    if (!isHomepage) {
      return; // Don't show modal if not on homepage
    }

    // In development mode, always reset localStorage to make testing easier
    if (isDevMode()) {
      localStorage.removeItem('adModalClosed');
      console.log('Development mode: Ad modal localStorage reset for testing');
    }

    // Check if user has already closed the ad modal (stored in localStorage)
    const adModalClosed = localStorage.getItem('adModalClosed');
    if (!adModalClosed) {
      // Load modal banner from API
      this.loadModalBanner();
    } else {
      console.log('Ad modal was already closed by user. To test again, run: localStorage.removeItem("adModalClosed") and refresh');
    }
  }

  loadModalBanner(): void {
    this.bannerService.getAll(false, true).subscribe({
      next: (banners: any[]) => {
        if (banners && banners.length > 0) {
          // Lấy banner đầu tiên được ghim (đã được filter từ API)
          const modalBanner = banners.find((b: any) => b.isModal === true);
          if (modalBanner) {
            this.modalBannerImage = modalBanner.imageUrl;
            // Show modal after a short delay for better UX
            setTimeout(() => {
              this.showAdModal = true;
            }, 500);
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading modal banner:', err);
      }
    });
  }

  closeAdModal(): void {
    this.showAdModal = false;
    // Store in localStorage so it doesn't show again
    localStorage.setItem('adModalClosed', 'true');
  }

  // Method to force show ad modal (for testing)
  showAdModalForced(): void {
    localStorage.removeItem('adModalClosed');
    this.showAdModal = true;
  }

  onAdClick(): void {
    // Optional: Navigate to a specific page when clicking on ad
    // Example: this.router.navigate(['/promotion']);
  }

}
