import { Component, inject, DestroyRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { TypeService } from '../../../services/type/type.service';
import { RiderService } from '../../../services/rider/rider.service';
import { BrandService } from '../../../services/brand/brand.service';
import { GenderService } from '../../../services/gender/gender.service';
import { TagService } from '../../../services/tag/tag.service';
import { ToastService } from '../../../services/toast/toast.service';
import { RefreshService } from '../../../services/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './product-add.component.html',
  styleUrls: ['./product-add.component.css']
})
export class ProductAddComponent {
  productForm!: FormGroup;
  genders: any[] = [];
  types: any[] = [];
  riders: any[] = [];
  brands: any[] = [];
  tags: any[] = [];
  selectedTags: string[] = [];
  hasSize: boolean = false;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isLoading = false;
  sizeOptions: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
  sizeType: string = 'standard';

  getSizeOptions(): string[] {
    switch (this.sizeType) {
      case 'standard':
        return ['S', 'M', 'L', 'XL', 'XXL'];
      case 'month':
        return ['3 tháng', '6 tháng', '9 tháng', '12 tháng', '18 tháng', '24 tháng'];
      case 'age':
        return ['2 tuổi', '3 tuổi', '4 tuổi', '5 tuổi', '6 tuổi', '7 tuổi', '8 tuổi', '9 tuổi', '10 tuổi', '11 tuổi', '12 tuổi'];
      default:
        return [];
    }
  }

  get useSizeDropdown(): boolean {
    return this.sizeType !== 'custom';
  }

  onSizeTypeChange(): void {
    this.sizeOptions = this.getSizeOptions();
  }

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private typeService = inject(TypeService);
  private riderService = inject(RiderService);
  private brandService = inject(BrandService);
  private genderService = inject(GenderService);
  private tagService = inject(TagService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.productForm = this.fb.group({
      nameProduct: ['', [Validators.required, Validators.minLength(4)]],
      priceProduct: [0, [Validators.required, Validators.min(0)]],
      discountProduct: [0, [Validators.min(0)]],
      stockProduct: [0, [Validators.min(0)]],
      descriptionProduct: ['', [Validators.required]],
      genderProduct: [''],
      typeProduct: ['', [Validators.required]],
      riderProduct: [''],
      brandProduct: [''],
      tags: [[]],
      hasSize: [false],
      sizes: this.fb.array([])
    });

    this.loadGenders();
    this.loadTypes();
    this.loadRiders();
    this.loadBrands();
    this.loadTags();

    this.productForm.get('hasSize')?.valueChanges.subscribe(hasSize => {
      this.hasSize = hasSize;
      if (hasSize) {
        if (this.sizes.length === 0) {
          this.addSize();
        }
      } else {
        while (this.sizes.length > 0) {
          this.sizes.removeAt(0);
        }
      }
    });
  }

  createSizeGroup(): FormGroup {
    return this.fb.group({
      name: [''],
      stock: [0]
    });
  }

  get sizes(): FormArray {
    return this.productForm.get('sizes') as FormArray;
  }

  addSize(): void {
    this.sizes.push(this.createSizeGroup());
  }

  removeSize(index: number): void {
    if (this.sizes.length > 1) {
      this.sizes.removeAt(index);
    }
  }

  get totalStock(): number {
    try {
      return this.sizes.value.reduce((acc: number, s: any) => acc + Number(s.stock || 0), 0);
    } catch {
      return 0;
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = [];
      this.imagePreviews = [];

      Array.from(files).forEach((file: any) => {
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviews.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  loadGenders(): void {
    this.genderService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.genders = Array.isArray(res) ? res : [];
          console.log('Genders loaded:', this.genders);
        },
        error: (err) => {
          console.error('Lỗi khi tải giới tính:', err);
          this.genders = [];
        }
      });
  }

  loadTypes(): void {
    this.typeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.types = Array.isArray(res) ? res : []
      });
  }

  loadRiders(): void {
    this.riderService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.riders = Array.isArray(res) ? res : []
      });
  }

  loadBrands(): void {
    this.brandService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.brands = Array.isArray(res) ? res : []
      });
  }

  loadTags(): void {
    this.tagService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.tags = Array.isArray(res) ? res : []
      });
  }

  onTagToggle(tagId: string): void {
    const index = this.selectedTags.indexOf(tagId);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tagId);
    }
    this.productForm.patchValue({ tags: this.selectedTags });
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTags.includes(tagId);
  }

  onSubmit() {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });

    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.getRawValue();

    if (!formValue.nameProduct || formValue.nameProduct.length < 4) {
      this.toastService.error('Tên sản phẩm phải có ít nhất 4 ký tự');
      return;
    }
    if (!formValue.descriptionProduct) {
      this.toastService.error('Vui lòng nhập mô tả sản phẩm');
      return;
    }
    if (!formValue.typeProduct) {
      this.toastService.error('Vui lòng chọn loại sản phẩm');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.toastService.error('Vui lòng chọn ít nhất 1 ảnh sản phẩm');
      return;
    }

    if (this.hasSize) {
      if (this.sizes.length === 0) {
        this.toastService.error('Vui lòng thêm ít nhất 1 size');
        return;
      }
      const sizesValue = this.sizes.getRawValue();
      const invalidSize = sizesValue.some((s: any) => !s.name);
      if (invalidSize) {
        this.toastService.error('Vui lòng chọn size cho tất cả các mục size');
        return;
      }
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('nameProduct', formValue.nameProduct);
    formData.append('priceProduct', formValue.priceProduct.toString());
    formData.append('discountProduct', formValue.discountProduct.toString());

    let stockToAppend = formValue.stockProduct;
    if (this.hasSize && this.sizes.length > 0) {
      stockToAppend = this.totalStock;
    }
    formData.append('stockProduct', stockToAppend.toString());

    formData.append('descriptionProduct', formValue.descriptionProduct);
    formData.append('typeProduct', formValue.typeProduct);

    if (formValue.genderProduct) {
      formData.append('genderProduct', formValue.genderProduct);
    }

    if (formValue.riderProduct) {
      formData.append('riderProduct', formValue.riderProduct);
    }

    if (formValue.brandProduct) {
      formData.append('brandProduct', formValue.brandProduct);
    }

    formData.append('tags', JSON.stringify(this.selectedTags || []));

    this.selectedFiles.forEach((file) => {
      if (file) {
        formData.append('imagesProduct', file);
      }
    });

    if (this.hasSize && this.sizes.length > 0) {
      formData.append('sizes', JSON.stringify(this.sizes.value));
      if (this.sizeType && this.sizeType !== 'custom') {
        formData.append('sizeType', this.sizeType);
      }
    }

    this.productService.addProduct(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Thêm sản phẩm thành công!');
          this.productForm.reset();
          this.productForm.markAsPristine();
          this.selectedFiles = [];
          this.imagePreviews = [];
          this.selectedTags = [];
          this.hasSize = false;
          this.sizeType = 'standard';
          this.sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];
          while (this.sizes.length > 0) {
            this.sizes.removeAt(0);
          }
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach((input: any) => input.value = '');
          // Emit refresh event để reload danh sách products
          this.refreshService.refreshProducts();
          this.router.navigate(['/admin/product-list']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Không thể thêm sản phẩm, vui lòng thử lại.');
          this.isLoading = false;
        },
      });
  }
}
