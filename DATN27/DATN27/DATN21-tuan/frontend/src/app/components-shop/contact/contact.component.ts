import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService } from '../../services/contact/contact.service';
import { ContactInfoService, ContactInfo } from '../../services/contact/contact-info.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,NgIf],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  contactInfo: ContactInfo | null = null;
  isLoading = false;
  isLoadingInfo = true;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;
  mapUrl: SafeResourceUrl | null = null;
  googleMapEmbedUrl: SafeResourceUrl;

  constructor(
    private contactService: ContactService,
    private contactInfoService: ContactInfoService,
    private sanitizer: DomSanitizer
  ) {
    // Google Maps embed URL
    const mapEmbedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62705.69133613962!2d106.61205885415198!3d10.803215272733523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175293818af3a73%3A0xcd8d16d1180acc8b!2zVMOibiBCw6xuaCwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1764527679030!5m2!1svi!2s';
    this.googleMapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbedUrl);
  }

  ngOnInit() {
    this.loadContactInfo();
  }

  loadContactInfo() {
    this.isLoadingInfo = true;
    this.contactInfoService.get().subscribe({
      next: (data: any) => {
        this.contactInfo = data;
        if (data.mapUrl) {
          this.mapUrl = this.sanitizeMapUrl(data.mapUrl);
        }
        this.isLoadingInfo = false;
      },
      error: (err: any) => {
        console.error('Lỗi khi tải thông tin liên hệ:', err);
        this.isLoadingInfo = false;
      }
    });
  }

  sanitizeMapUrl(url: string): SafeResourceUrl {
    // Nếu URL đã là embed URL, sử dụng trực tiếp
    if (url.includes('/embed') || url.includes('output=embed')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // Chuyển đổi Google Maps URL thành embed URL
    // Lấy tọa độ từ URL (format: @lat,lng hoặc @lat,lng,zoom)
    const coordMatch = url.match(/@([\d.-]+),([\d.-]+)(?:,(\d+)z)?/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      const zoom = coordMatch[3] || '17';

      // Sử dụng format embed đơn giản với tọa độ
      // Format: https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d... hoặc
      // Format đơn giản: https://www.google.com/maps?q=lat,lng&output=embed
      const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=vi&z=${zoom}&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Thử lấy địa chỉ từ URL để tạo embed
    const placeMatch = url.match(/place\/([^/@?]+)/);
    if (placeMatch) {
      const place = placeMatch[1];
      // Decode URL encoded address
      const decodedPlace = decodeURIComponent(place.replace(/\+/g, ' '));
      // Tạo embed URL với địa chỉ
      const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(decodedPlace)}&hl=vi&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Fallback: Thử chuyển đổi URL thành embed format
    // Thêm output=embed vào query string
    try {
      // Đảm bảo URL có protocol
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }

      const urlObj = new URL(fullUrl);
      urlObj.searchParams.set('output', 'embed');
      return this.sanitizer.bypassSecurityTrustResourceUrl(urlObj.toString());
    } catch (e) {
      // Nếu không parse được URL, thêm output=embed vào cuối
      const separator = url.includes('?') ? '&' : '?';
      const embedUrl = `https://${url}${separator}output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
  }

  onSubmit() {
    // Clear previous errors
    this.submitError = null;
    this.submitSuccess = false;

    // Validate form
    if (!this.contactForm.name.trim()) {
      this.submitError = 'Vui lòng nhập tên của bạn';
      this.scrollToTop();
      return;
    }

    if (!this.contactForm.email.trim()) {
      this.submitError = 'Vui lòng nhập email của bạn';
      this.scrollToTop();
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactForm.email.trim())) {
      this.submitError = 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.';
      this.scrollToTop();
      return;
    }

    // Phone validation (optional but if provided, should be valid)
    if (this.contactForm.phone && this.contactForm.phone.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      const cleanPhone = this.contactForm.phone.trim().replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        this.submitError = 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.';
        this.scrollToTop();
        return;
      }
    }

    if (!this.contactForm.subject.trim()) {
      this.submitError = 'Vui lòng nhập tiêu đề thư';
      this.scrollToTop();
      return;
    }

    if (this.contactForm.subject.trim().length < 3) {
      this.submitError = 'Tiêu đề thư phải có ít nhất 3 ký tự';
      this.scrollToTop();
      return;
    }

    if (!this.contactForm.message.trim()) {
      this.submitError = 'Vui lòng nhập nội dung thư';
      this.scrollToTop();
      return;
    }

    if (this.contactForm.message.trim().length < 10) {
      this.submitError = 'Nội dung thư phải có ít nhất 10 ký tự';
      this.scrollToTop();
      return;
    }

    // All validations passed, submit form
    this.isSubmitting = true;

    this.contactService.create({
      name: this.contactForm.name.trim(),
      email: this.contactForm.email.trim(),
      phone: this.contactForm.phone?.trim() || undefined,
      subject: this.contactForm.subject.trim(),
      message: this.contactForm.message.trim()
    }).subscribe({
      next: (res: any) => {
        this.submitSuccess = true;
        this.submitError = null;
        this.isSubmitting = false;

        // Reset form
        this.contactForm = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        };

        // Reset form validation state
        if (document.querySelector('form')) {
          const form = document.querySelector('form') as HTMLFormElement;
          form.reset();
        }

        // Scroll to top to show success message
        this.scrollToTop();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      },
      error: (err: any) => {
        console.error('Lỗi khi gửi thư liên hệ:', err);

        // Handle different error types
        if (err?.error?.message) {
          this.submitError = err.error.message;
        } else if (err?.status === 0) {
          this.submitError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.';
        } else if (err?.status === 400) {
          this.submitError = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
        } else if (err?.status >= 500) {
          this.submitError = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          this.submitError = 'Không thể gửi thư liên hệ. Vui lòng thử lại.';
        }

        this.isSubmitting = false;
        this.scrollToTop();
      }
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

