import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogoService, Logo } from '../../../services/logo/logo.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-logo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logo-list.component.html',
  styleUrls: ['./logo-list.component.css'],
})
export class LogoListComponent implements OnInit {
  logos: Logo[] = [];
  isLoading = false;
  showAddModal = false;
  showEditModal = false;
  selectedLogo: Logo | null = null;
  
  // Form data
  formData: {
    title: string;
    description: string;
  } = {
    title: '',
    description: ''
  };
  selectedFile: File | null = null;
  previewImage: string | null = null;

  constructor(
    private logoService: LogoService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadLogos();
  }

  loadLogos() {
    this.isLoading = true;
    this.logoService.getAll().subscribe({
      next: (logos) => {
        this.logos = logos || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải logo:', err);
        this.toastService.error('Không thể tải danh sách logo. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  openAddModal() {
    this.formData = {
      title: '',
      description: ''
    };
    this.selectedFile = null;
    this.previewImage = null;
    this.showAddModal = true;
  }

  openEditModal(logo: Logo) {
    this.selectedLogo = logo;
    this.formData = {
      title: logo.title || '',
      description: logo.description || ''
    };
    this.previewImage = logo.imageUrl;
    this.selectedFile = null;
    this.showEditModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.selectedLogo = null;
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
      this.createLogo();
    } else if (this.showEditModal && this.selectedLogo) {
      this.updateLogo();
    }
  }

  createLogo() {
    if (!this.selectedFile) {
      this.toastService.error('Vui lòng chọn ảnh logo');
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);

    this.isLoading = true;
    this.logoService.create(formData).subscribe({
      next: () => {
        this.toastService.success('Tạo logo thành công');
        this.closeModals();
        this.loadLogos();
      },
      error: (err) => {
        console.error('Lỗi khi tạo logo:', err);
        this.toastService.error('Không thể tạo logo. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  updateLogo() {
    if (!this.selectedLogo?._id) return;

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);

    this.isLoading = true;
    this.logoService.update(this.selectedLogo._id, formData).subscribe({
      next: () => {
        this.toastService.success('Cập nhật logo thành công');
        this.closeModals();
        this.loadLogos();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật logo:', err);
        this.toastService.error('Không thể cập nhật logo. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  onDelete(logoId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa logo này?')) {
      return;
    }

    this.isLoading = true;
    this.logoService.delete(logoId).subscribe({
      next: () => {
        this.toastService.success('Xóa logo thành công');
        this.loadLogos();
      },
      error: (err) => {
        console.error('Lỗi khi xóa logo:', err);
        this.toastService.error('Không thể xóa logo. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }

  moveUp(index: number) {
    if (index === 0) return;
    const logos = [...this.logos];
    [logos[index - 1], logos[index]] = [logos[index], logos[index - 1]];
    this.updateLogoOrder(logos);
  }

  moveDown(index: number) {
    if (index === this.logos.length - 1) return;
    const logos = [...this.logos];
    [logos[index], logos[index + 1]] = [logos[index + 1], logos[index]];
    this.updateLogoOrder(logos);
  }

  updateLogoOrder(logos: Logo[]) {
    const orderData = logos.map((logo, index) => ({
      id: logo._id!,
      order: index
    }));

    this.logoService.updateOrder(orderData).subscribe({
      next: () => {
        this.loadLogos();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật thứ tự:', err);
        this.toastService.error('Không thể cập nhật thứ tự logo.');
      }
    });
  }

  togglePin(logo: Logo) {
    if (!logo._id) return;

    this.isLoading = true;
    this.logoService.togglePin(logo._id).subscribe({
      next: (updatedLogo) => {
        this.toastService.success(updatedLogo.isPinned ? 'Đã ghim logo' : 'Đã bỏ ghim logo');
        this.loadLogos();
      },
      error: (err) => {
        console.error('Lỗi khi ghim/bỏ ghim logo:', err);
        this.toastService.error('Không thể ghim/bỏ ghim logo. Vui lòng thử lại.');
        this.isLoading = false;
      }
    });
  }
}

