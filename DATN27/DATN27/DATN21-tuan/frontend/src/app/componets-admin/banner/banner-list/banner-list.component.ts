import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BannerService, Banner } from '../../../services/banner/banner.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-banner-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-list.component.html',
  styleUrls: ['./banner-list.component.css'],
})
export class BannerListComponent implements OnInit {
  banners: Banner[] = [];
  isLoading = false;
  showAddModal = false;
  showEditModal = false;
  selectedBanner: Banner | null = null;
  
  // Form data
  formData: {
    title: string;
    description: string;
    order: number;
    isActive: boolean;
    isModal: boolean;
  } = {
    title: '',
    description: '',
    order: 0,
    isActive: true,
    isModal: false
  };
  selectedFile: File | null = null;
  previewImage: string | null = null;

  constructor(
    private bannerService: BannerService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.isLoading = true;
    this.bannerService.getAll().subscribe({
      next: (banners) => {
        this.banners = banners || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải banner:', err);
        this.toastService.error('Không thể tải danh sách banner. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  openAddModal() {
    this.formData = {
      title: '',
      description: '',
      order: this.banners.length,
      isActive: true,
      isModal: false
    };
    this.selectedFile = null;
    this.previewImage = null;
    this.showAddModal = true;
  }

  openEditModal(banner: Banner) {
    this.selectedBanner = banner;
    this.formData = {
      title: banner.title || '',
      description: banner.description || '',
      order: banner.order || 0,
      isActive: banner.isActive !== false,
      isModal: banner.isModal === true
    };
    this.previewImage = banner.imageUrl;
    this.selectedFile = null;
    this.showEditModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.selectedBanner = null;
    this.selectedFile = null;
    this.previewImage = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Kích thước file không được vượt quá 10MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.showAddModal) {
      this.createBanner();
    } else if (this.showEditModal && this.selectedBanner) {
      this.updateBanner();
    }
  }

  createBanner() {
    if (!this.selectedFile) {
      this.toastService.error('Vui lòng chọn ảnh banner');
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);
    formData.append('order', this.formData.order.toString());
    formData.append('isModal', this.formData.isModal.toString());

    this.isLoading = true;
    this.bannerService.create(formData).subscribe({
      next: () => {
        this.toastService.success('Tạo banner thành công');
        this.closeModals();
        this.loadBanners();
      },
      error: (err) => {
        console.error('Lỗi khi tạo banner:', err);
        this.toastService.error('Không thể tạo banner. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  updateBanner() {
    if (!this.selectedBanner?._id) return;

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);
    formData.append('order', this.formData.order.toString());
    formData.append('isActive', this.formData.isActive.toString());
    formData.append('isModal', this.formData.isModal.toString());

    this.isLoading = true;
    this.bannerService.update(this.selectedBanner._id, formData).subscribe({
      next: () => {
        this.toastService.success('Cập nhật banner thành công');
        this.closeModals();
        this.loadBanners();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật banner:', err);
        this.toastService.error('Không thể cập nhật banner. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  onDelete(bannerId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      return;
    }

    this.isLoading = true;
    this.bannerService.delete(bannerId).subscribe({
      next: () => {
        this.toastService.success('Xóa banner thành công');
        this.loadBanners();
      },
      error: (err) => {
        console.error('Lỗi khi xóa banner:', err);
        this.toastService.error('Không thể xóa banner. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  moveUp(index: number) {
    if (index === 0) return;
    const banners = [...this.banners];
    [banners[index - 1], banners[index]] = [banners[index], banners[index - 1]];
    this.updateBannerOrder(banners);
  }

  moveDown(index: number) {
    if (index === this.banners.length - 1) return;
    const banners = [...this.banners];
    [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    this.updateBannerOrder(banners);
  }

  updateBannerOrder(banners: Banner[]) {
    const orderData = banners.map((banner, index) => ({
      id: banner._id!,
      order: index
    }));

    this.bannerService.updateOrder(orderData).subscribe({
      next: () => {
        this.loadBanners();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật thứ tự:', err);
        this.toastService.error('Không thể cập nhật thứ tự banner.');
      }
    });
  }

  togglePin(banner: Banner) {
    if (!banner._id) return;

    this.isLoading = true;
    this.bannerService.toggleModal(banner._id).subscribe({
      next: (updatedBanner) => {
        this.toastService.success(updatedBanner.isModal ? 'Đã ghim banner làm modal' : 'Đã bỏ ghim banner');
        this.loadBanners();
      },
      error: (err) => {
        console.error('Lỗi khi ghim/bỏ ghim banner:', err);
        this.toastService.error('Không thể ghim/bỏ ghim banner. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }
}

