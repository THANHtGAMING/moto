import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { TypeService } from '../../../services/type/type.service';
import { RiderService } from '../../../services/rider/rider.service';
import { BrandService } from '../../../services/brand/brand.service';
import { GenderService } from '../../../services/gender/gender.service';
import { TagService } from '../../../services/tag/tag.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {
  productForm!: FormGroup;
  genders: any[] = [];
  types: any[] = [];
  riders: any[] = [];
  brands: any[] = [];
  tags: any[] = [];
  selectedTags: string[] = [];
  productId!: string;
  hasSize: boolean = false;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  selectedImageIndices: number[] = [];
  displayedImages: Array<{url: string, originalIndex: number}> = [];
  autoSelectNewImages: boolean = false;
  failedImages: Set<number> = new Set();
  isLoading = false;
  errorMessage: string | null = null;

  sizeOptions: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
  sizeType: string = 'standard'; // 'standard', 'age', 'month', 'custom'

  // Size options based on type
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

  // Check if should use dropdown or text input
  get useSizeDropdown(): boolean {
    return this.sizeType !== 'custom';
  }

  // Handle size type change
  onSizeTypeChange(): void {
    this.sizeOptions = this.getSizeOptions();
  }
  private formInitialized = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private typeService: TypeService,
    private riderService: RiderService,
    private brandService: BrandService,
    private genderService: GenderService,
    private tagService: TagService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

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
      if (!this.formInitialized) return;
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

    if (this.productId) {
      this.loadProduct();
    }
  }

  createSizeGroup(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || ''],
      stock: [data?.stock || 0]
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

  onFileSelected(event: any, index: number): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = [];
      const newPreviews: string[] = [];
      const fileArray = Array.from(files);
      let loadedCount = 0;

      fileArray.forEach((file: any) => {
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;

          if (loadedCount === fileArray.length) {
            const oldLength = this.imagePreviews.length;
            this.imagePreviews = [...this.existingImages, ...newPreviews];

            if (newPreviews.length > 0 && this.autoSelectNewImages) {
              this.selectedImageIndices = [];
              const newImageStartIndex = oldLength;
              const imagesToSelect = Math.min(3, newPreviews.length);
              for (let i = 0; i < imagesToSelect; i++) {
                this.selectedImageIndices.push(newImageStartIndex + i);
              }
            } else if (newPreviews.length > 0) {
              const needMore = 3 - this.selectedImageIndices.length;
              if (needMore > 0) {
                const newImageStartIndex = oldLength;
                const imagesToSelect = Math.min(needMore, newPreviews.length);
                for (let i = 0; i < imagesToSelect; i++) {
                  if (this.selectedImageIndices.length < 3) {
                    this.selectedImageIndices.push(newImageStartIndex + i);
                  }
                }
              }
            }

            this.updateDisplayedImages();
          }
        };
        reader.readAsDataURL(file);
      });
    }
    event.target.value = '';
  }

  removeImage(originalIndex: number): void {
    const isExistingImage = originalIndex < this.existingImages.length;

    this.imagePreviews.splice(originalIndex, 1);

    if (isExistingImage) {
      this.existingImages.splice(originalIndex, 1);
    } else {
      const newImageIndex = originalIndex - this.existingImages.length;
      if (newImageIndex >= 0 && newImageIndex < this.selectedFiles.length) {
        this.selectedFiles.splice(newImageIndex, 1);
      }
    }

    this.selectedImageIndices = this.selectedImageIndices
      .filter(idx => idx !== originalIndex)
      .map(idx => idx > originalIndex ? idx - 1 : idx);

    this.failedImages.delete(originalIndex);
    const newFailedImages = new Set<number>();
    this.failedImages.forEach(idx => {
      if (idx < originalIndex) {
        newFailedImages.add(idx);
      } else if (idx > originalIndex) {
        newFailedImages.add(idx - 1);
      }
    });
    this.failedImages = newFailedImages;

    this.updateDisplayedImages();
  }

  toggleImageSelection(index: number): void {
    const idx = this.selectedImageIndices.indexOf(index);
    if (idx > -1) {
      this.selectedImageIndices.splice(idx, 1);
    } else {
      if (this.selectedImageIndices.length < 3) {
        this.selectedImageIndices.push(index);
      } else {
        this.toastService.error('Chỉ có thể chọn tối đa 3 ảnh chính! Vui lòng bỏ chọn một ảnh trước.');
        return;
      }
    }
    this.updateDisplayedImages();
  }

  isImageSelected(index: number): boolean {
    return this.selectedImageIndices.indexOf(index) > -1;
  }

  updateDisplayedImages(): void {
    const selectedItems: Array<{url: string, originalIndex: number}> = [];
    const unselectedItems: Array<{url: string, originalIndex: number}> = [];

    this.selectedImageIndices.forEach(idx => {
      if (this.imagePreviews[idx] !== undefined) {
        selectedItems.push({
          url: this.imagePreviews[idx],
          originalIndex: idx
        });
      }
    });

    this.imagePreviews.forEach((img, index) => {
      if (this.selectedImageIndices.indexOf(index) === -1) {
        unselectedItems.push({
          url: img,
          originalIndex: index
        });
      }
    });

    this.displayedImages = [...selectedItems, ...unselectedItems];
  }

  onImageError(index: number, originalIndex: number): void {
    this.failedImages.add(originalIndex);
    const selectedIdx = this.selectedImageIndices.indexOf(originalIndex);
    if (selectedIdx > -1) {
      this.selectedImageIndices.splice(selectedIdx, 1);
      this.updateDisplayedImages();
    }
  }

  isImageFailed(originalIndex: number): boolean {
    return this.failedImages.has(originalIndex);
  }

  getSelectedImages(): string[] {
    return this.selectedImageIndices
      .slice(0, 3)
      .map(idx => this.imagePreviews[idx])
      .filter(img => img !== undefined);
  }

  getSelectedImageOriginalIndex(displayIndex: number): number {
    if (displayIndex < this.selectedImageIndices.length) {
      return this.selectedImageIndices[displayIndex];
    }
    return -1;
  }

  loadGenders(): void {
    this.genderService.getAll().subscribe({
      next: (res: any) => this.genders = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải giới tính:', err)
    });
  }

  loadTypes(): void {
    this.typeService.getAll().subscribe({
      next: (res: any) => this.types = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải loại:', err)
    });
  }

  loadRiders(): void {
    this.riderService.getAll().subscribe({
      next: (res: any) => this.riders = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải tay đua:', err)
    });
  }

  loadBrands(): void {
    this.brandService.getAll().subscribe({
      next: (res: any) => this.brands = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải nhãn hàng:', err)
    });
  }

  loadTags(): void {
    this.tagService.getAll().subscribe({
      next: (res: any) => this.tags = Array.isArray(res) ? res : [],
      error: err => console.error('Lỗi khi tải tags:', err)
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

  loadProduct(): void {
    this.isLoading = true;
    this.formInitialized = false;

    this.productService.getProductDetail(this.productId).subscribe({
      next: (res: any) => {
        const hasSizes = res.sizes && Array.isArray(res.sizes) && res.sizes.length > 0;

        this.productForm.patchValue({
          nameProduct: res.nameProduct || '',
          priceProduct: res.priceProduct || 0,
          discountProduct: res.discountProduct || 0,
          stockProduct: res.stockProduct || 0,
          descriptionProduct: res.descriptionProduct || '',
          genderProduct: res.genderProduct?._id || res.genderProduct || '',
          typeProduct: res.typeProduct?._id || res.typeProduct || '',
          riderProduct: res.riderProduct?._id || res.riderProduct || '',
          brandProduct: res.brandProduct?._id || res.brandProduct || '',
          hasSize: hasSizes
        });

        // Load tags
        if (res.tags && Array.isArray(res.tags)) {
          this.selectedTags = res.tags.map((t: any) => t._id || t);
          this.productForm.patchValue({ tags: this.selectedTags });
        }

        if (res.imagesProduct && Array.isArray(res.imagesProduct)) {
          this.existingImages = res.imagesProduct;
          this.imagePreviews = [...this.existingImages];
          this.failedImages.clear();
          this.selectedImageIndices = [];
          const maxSelect = Math.min(3, this.imagePreviews.length);
          for (let i = 0; i < maxSelect; i++) {
            this.selectedImageIndices.push(i);
          }
          this.updateDisplayedImages();
        }

        if (hasSizes) {
          while (this.sizes.length > 0) {
            this.sizes.removeAt(0);
          }
          res.sizes.forEach((s: any) => {
            this.sizes.push(this.createSizeGroup(s));
          });
          this.hasSize = true;

          // Load sizeType from product, or detect from existing sizes
          if (res.sizeType) {
            this.sizeType = res.sizeType;
          } else {
            // Try to detect sizeType from existing sizes
            const firstSize = res.sizes[0]?.name || '';
            if (['S', 'M', 'L', 'XL', 'XXL'].includes(firstSize)) {
              this.sizeType = 'standard';
            } else if (firstSize.includes('tháng')) {
              this.sizeType = 'month';
            } else if (firstSize.includes('tuổi')) {
              this.sizeType = 'age';
            } else {
              this.sizeType = 'custom';
            }
          }
          this.sizeOptions = this.getSizeOptions();
        } else {
          while (this.sizes.length > 0) {
            this.sizes.removeAt(0);
          }
          this.hasSize = false;
        }

        this.isLoading = false;
        this.formInitialized = true;
      },
      error: err => {
        console.error('Lỗi khi tải sản phẩm:', err);
        this.toastService.error('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
        this.isLoading = false;
        this.formInitialized = true;
      }
    });
  }

  onSubmit(): void {
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
    formData.append('typeProduct', formValue.typeProduct || '');

    if (formValue.genderProduct) {
      formData.append('genderProduct', formValue.genderProduct);
    } else {
      formData.append('genderProduct', '');
    }

    formData.append('riderProduct', formValue.riderProduct || '');
    formData.append('brandProduct', formValue.brandProduct || '');

    // Append tags - always send, even if empty array
    formData.append('tags', JSON.stringify(this.selectedTags || []));

    const validExistingImages = this.existingImages.filter((img, idx) => {
      return !this.failedImages.has(idx);
    });

    formData.append('oldImagesProduct', JSON.stringify(validExistingImages));

    this.selectedFiles.forEach((file) => {
      if (file) {
        formData.append('imagesProduct', file);
      }
    });

    if (this.hasSize) {
      formData.append('sizes', JSON.stringify(this.sizes.value));
      if (this.sizeType && this.sizeType !== 'custom') {
        formData.append('sizeType', this.sizeType);
      }
    } else {
      formData.append('sizes', JSON.stringify([]));
    }

    this.productService.updateProduct(this.productId, formData).subscribe({
      next: (res: any) => {
        console.log('Product updated successfully:', res);
        this.toastService.success('Cập nhật sản phẩm thành công!');
        // Emit refresh event
        this.refreshService.refreshProducts();
        this.isLoading = false;
        this.router.navigate(['/admin/product-list']);
      },
      error: err => {
        console.error('Lỗi khi cập nhật sản phẩm:', err);
        const errorMessage = err?.error?.message || 'Không thể cập nhật sản phẩm, vui lòng thử lại.';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }
}
