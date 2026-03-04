import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContactInfoService, ContactInfo } from '../../../services/contact/contact-info.service';

@Component({
  selector: 'app-contact-infor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './contact-infor.component.html',
  styleUrls: ['./contact-infor.component.css'],
})
export class ContactInforComponent implements OnInit {
  contactInfoForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  contactInfo: ContactInfo | null = null;

  constructor(
    private contactInfoService: ContactInfoService
  ) {
    this.contactInfoForm = new FormGroup({
      address: new FormControl('', [Validators.required, Validators.minLength(1)]),
      phone: new FormControl('', [Validators.required, Validators.minLength(1)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      mapUrl: new FormControl(''),
      workingHours: new FormControl(''),
      facebook: new FormControl(''),
      instagram: new FormControl(''),
      zalo: new FormControl('')
    });
  }

  ngOnInit() {
    this.loadContactInfo();
  }

  loadContactInfo() {
    this.isLoadingData = true;
    this.contactInfoService.get().subscribe({
      next: (data: any) => {
        console.log('Contact info loaded:', data);
        this.contactInfo = data;
        this.contactInfoForm.patchValue({
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          mapUrl: data.mapUrl || '',
          workingHours: data.workingHours || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          zalo: data.zalo || ''
        });
        this.isLoadingData = false;
      },
      error: (err: any) => {
        console.error('Lỗi khi tải thông tin liên hệ:', err);
        this.errorMessage = err?.error?.message || 'Không thể tải thông tin liên hệ. Vui lòng thử lại.';
        this.isLoadingData = false;
      }
    });
  }

  onSubmit() {
    if (this.contactInfoForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ';
      Object.keys(this.contactInfoForm.controls).forEach(key => {
        this.contactInfoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;
    this.contactInfoForm.disable();

    const contactInfoData = {
      address: this.contactInfoForm.value.address?.trim(),
      phone: this.contactInfoForm.value.phone?.trim(),
      email: this.contactInfoForm.value.email?.trim(),
      mapUrl: this.contactInfoForm.value.mapUrl?.trim() || '',
      workingHours: this.contactInfoForm.value.workingHours?.trim() || '',
      facebook: this.contactInfoForm.value.facebook?.trim() || '',
      instagram: this.contactInfoForm.value.instagram?.trim() || '',
      zalo: this.contactInfoForm.value.zalo?.trim() || ''
    };

    if (!contactInfoData.address || contactInfoData.address.length === 0) {
      this.errorMessage = 'Địa chỉ không được để trống';
      this.isLoading = false;
      this.contactInfoForm.enable();
      return;
    }

    if (!contactInfoData.phone || contactInfoData.phone.length === 0) {
      this.errorMessage = 'Số điện thoại không được để trống';
      this.isLoading = false;
      this.contactInfoForm.enable();
      return;
    }

    if (!contactInfoData.email || contactInfoData.email.length === 0) {
      this.errorMessage = 'Email không được để trống';
      this.isLoading = false;
      this.contactInfoForm.enable();
      return;
    }

    this.contactInfoService.createOrUpdate(contactInfoData).subscribe({
      next: (res: any) => {
        console.log('Contact info saved successfully:', res);
        this.successMessage = 'Cập nhật thông tin liên hệ thành công!';
        this.contactInfo = res;
        this.isLoading = false;
        this.contactInfoForm.enable();

        // Auto hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err: any) => {
        console.error('Lỗi khi cập nhật thông tin liên hệ:', err);
        const errorMsg = err?.error?.message || err?.error?.error || 'Không thể cập nhật thông tin liên hệ, vui lòng thử lại.';
        this.errorMessage = errorMsg;
        this.isLoading = false;
        this.contactInfoForm.enable();
      },
    });
  }
}

