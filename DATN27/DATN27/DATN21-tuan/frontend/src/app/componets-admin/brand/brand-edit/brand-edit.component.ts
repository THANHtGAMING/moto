import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BrandService } from '../../../services/brand/brand.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-brand-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './brand-edit.component.html',
  styleUrls: ['./brand-edit.component.css']
})
export class BrandEditComponent implements OnInit {
  brandForm!: FormGroup;
  brandId!: string;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  existingLogo: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.brandId = this.route.snapshot.paramMap.get('id') || '';
    
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['active']
    });

    this.loadBrand();
  }

  loadBrand(): void {
    this.isLoading = true;
    this.brandService.getBrandDetail(this.brandId).subscribe({
      next: (brand: any) => {
        this.brandForm.patchValue({
          name: brand.name || '',
          description: brand.description || '',
          status: brand.status || 'active'
        });
        
        if (brand.logoUrl) {
          this.existingLogo = brand.logoUrl;
          this.imagePreview = brand.logoUrl;
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải nhãn hàng:', err);
        this.toastService.error('Không thể tải thông tin nhãn hàng');
        this.router.navigate(['/admin/brand-list']);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      this.toastService.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    this.isLoading = true;
    this.brandForm.disable();

    const formData = new FormData();
    formData.append('name', this.brandForm.value.name);
    formData.append('description', this.brandForm.value.description || '');
    formData.append('status', this.brandForm.value.status);
    
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    this.brandService.updateBrand(this.brandId, formData).subscribe({
      next: (res: any) => {
        this.toastService.success('Cập nhật nhãn hàng thành công!');
        // Emit refresh event
        this.refreshService.refreshBrands();
        this.router.navigate(['/admin/brand-list']);
        this.isLoading = false;
        this.brandForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật nhãn hàng:', err);
        const errorMessage = err?.error?.message || 'Không thể cập nhật nhãn hàng, vui lòng thử lại.';
        this.toastService.error(errorMessage);
        this.isLoading = false;
        this.brandForm.enable();
      }
    });
  }
}

