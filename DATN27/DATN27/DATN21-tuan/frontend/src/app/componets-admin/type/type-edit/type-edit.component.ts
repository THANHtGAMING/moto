import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TypeService } from '../../../services/type/type.service';
import { GenderService } from '../../../services/gender/gender.service';
import { TagService } from '../../../services/tag/tag.service';
import { Type } from '../../../models/type';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-type-edit',
  standalone: true,
  templateUrl: './type-edit.component.html',
  styleUrls: ['./type-edit.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class TypeEditComponent implements OnInit {
  id!: string;
  type!: Type;
  typeForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  genders: any[] = [];
  selectedGenders: string[] = [];
  tags: any[] = [];
  selectedTags: string[] = [];

  constructor(
    private typeService: TypeService,
    private genderService: GenderService,
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.typeForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1)])
    });
  }

  ngOnInit() {
    this.loadGenders();
    this.loadTags();
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.loadType();
      } else {
        this.errorMessage = 'ID không hợp lệ';
        this.router.navigate(['/admin/type-list']);
      }
    });
  }

  loadGenders() {
    this.genderService.getAll().subscribe({
      next: (data: any) => {
        this.genders = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải giới tính:', err);
      }
    });
  }

  onGenderChange(genderId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedGenders.includes(genderId)) {
        this.selectedGenders.push(genderId);
      }
    } else {
      this.selectedGenders = this.selectedGenders.filter(id => id !== genderId);
    }
  }

  isGenderSelected(genderId: string): boolean {
    return this.selectedGenders.includes(genderId);
  }

  loadTags() {
    this.tagService.getAll().subscribe({
      next: (data: any) => {
        this.tags = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Lỗi khi tải tags:', err);
      }
    });
  }

  onTagChange(tagId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedTags.includes(tagId)) {
        this.selectedTags.push(tagId);
      }
    } else {
      this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    }
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTags.includes(tagId);
  }

  loadType() {
    this.isLoading = true;
    this.typeForm.disable();

    this.typeService.getTypeDetail(this.id).subscribe({
      next: (data: any) => {
        if (data) {
          this.type = data;
          this.typeForm.patchValue({
            name: this.type.name
          });
          // Load selected genders
          if (this.type.genders && Array.isArray(this.type.genders)) {
            this.selectedGenders = this.type.genders.map((g: any) => g._id || g);
          } else {
            this.selectedGenders = [];
          }
          // Load selected tags
          if (this.type.tags && Array.isArray(this.type.tags)) {
            this.selectedTags = this.type.tags.map((t: any) => t._id || t);
          } else {
            this.selectedTags = [];
          }
        } else {
          this.toastService.error('Không tìm thấy loại!');
          this.router.navigate(['/admin/type-list']);
        }
        this.isLoading = false;
        this.typeForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi tải loại:', err);
        this.errorMessage = 'Không thể tải thông tin loại. Vui lòng thử lại.';
        this.isLoading = false;
        this.typeForm.enable();
        this.router.navigate(['/admin/type-list']);
      }
    });
  }

  onSubmit() {
    if (this.typeForm.invalid) {
      this.errorMessage = 'Vui lòng nhập tên loại hợp lệ';
      // Mark all fields as touched to show validation errors
      Object.keys(this.typeForm.controls).forEach(key => {
        this.typeForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.id) {
      this.errorMessage = 'ID không hợp lệ';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.typeForm.disable();

    const typeData = {
      name: this.typeForm.value.name?.trim(),
      genders: this.selectedGenders,
      tags: this.selectedTags
    };

    if (!typeData.name || typeData.name.length === 0) {
      this.errorMessage = 'Tên loại không được để trống';
      this.isLoading = false;
      this.typeForm.enable();
      return;
    }

    this.typeService.updateType(this.id, typeData).subscribe({
      next: (res: any) => {
        console.log('Update response:', res);
        this.toastService.success('Cập nhật loại thành công!');
        // Emit refresh event
        this.refreshService.refreshTypes();
        this.router.navigate(['/admin/type-list']);
        this.isLoading = false;
        this.typeForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật loại:', err);
        console.error('Error details:', err.error);
        const errorMsg = err?.error?.message || err?.error?.error || 'Không thể cập nhật loại, vui lòng thử lại.';
        this.errorMessage = errorMsg;
        this.isLoading = false;
        this.typeForm.enable();
      }
    });
  }
}
