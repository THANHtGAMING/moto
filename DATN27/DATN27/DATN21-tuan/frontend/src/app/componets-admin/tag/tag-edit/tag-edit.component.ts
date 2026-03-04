import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TagService } from '../../../services/tag/tag.service';
import { Tag } from '../../../models/tag';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-tag-edit',
  standalone: true,
  templateUrl: './tag-edit.component.html',
  styleUrls: ['./tag-edit.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class TagEditComponent implements OnInit {
  id!: string;
  tag!: Tag;
  tagForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.id = route.snapshot.params['id'];
    this.tagForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1)])
    });
  }

  ngOnInit() {
    this.loadTag();
  }

  loadTag() {
    this.isLoading = true;
    this.tagForm.disable();

    this.tagService.getById(this.id).subscribe({
      next: (data: any) => {
        if (data) {
          this.tag = data;
          this.tagForm.patchValue({
            name: this.tag.name
          });
        } else {
          this.toastService.error('Không tìm thấy tag!');
          this.router.navigate(['/admin/tag-list']);
        }
        this.isLoading = false;
        this.tagForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi tải tag:', err);
        this.errorMessage = 'Không thể tải thông tin tag. Vui lòng thử lại.';
        this.isLoading = false;
        this.tagForm.enable();
        this.router.navigate(['/admin/tag-list']);
      }
    });
  }

  onSubmit() {
    if (this.tagForm.invalid) {
      this.errorMessage = 'Dữ liệu không hợp lệ';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.tagForm.disable();

    const tagData = {
      name: this.tagForm.value.name
    };

    this.tagService.update(this.id, tagData).subscribe({
      next: (res: any) => {
        console.log('Update response:', res);
        this.toastService.success('Cập nhật tag thành công!');
        // Emit refresh event
        this.refreshService.refreshTags();
        this.router.navigate(['/admin/tag-list']);
        this.isLoading = false;
        this.tagForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật tag:', err);
        console.error('Error details:', err.error);
        this.errorMessage = err?.error?.message || 'Không thể cập nhật tag, vui lòng thử lại.';
        this.isLoading = false;
        this.tagForm.enable();
      }
    });
  }
}

