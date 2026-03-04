import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GenderService } from '../../../services/gender/gender.service';
import { Gender } from '../../../models/gender';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-gender-edit',
  standalone: true,
  templateUrl: './gender-edit.component.html',
  styleUrls: ['./gender-edit.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class GenderEditComponent implements OnInit {
  id!: string;
  gender!: Gender;
  genderForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private genderService: GenderService,
    private route: ActivatedRoute,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.id = route.snapshot.params['id'];
    this.genderForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1)])
    });
  }

  ngOnInit() {
    this.loadGender();
  }

  loadGender() {
    this.isLoading = true;
    this.genderForm.disable();

    this.genderService.getById(this.id).subscribe({
      next: (data: any) => {
        if (data) {
          this.gender = data;
          this.genderForm.patchValue({
            name: this.gender.name
          });
        } else {
          this.toastService.error('Không tìm thấy giới tính!');
          this.router.navigate(['/admin/gender-list']);
        }
        this.isLoading = false;
        this.genderForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi tải giới tính:', err);
        this.errorMessage = 'Không thể tải thông tin giới tính. Vui lòng thử lại.';
        this.isLoading = false;
        this.genderForm.enable();
        this.router.navigate(['/admin/gender-list']);
      }
    });
  }

  onSubmit() {
    if (this.genderForm.invalid) {
      this.errorMessage = 'Dữ liệu không hợp lệ';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.genderForm.disable();

    const genderData = {
      name: this.genderForm.value.name
    };

    this.genderService.update(this.id, genderData).subscribe({
      next: (res: any) => {
        console.log('Update response:', res);
        this.toastService.success('Cập nhật giới tính thành công!');
        // Emit refresh event
        this.refreshService.refreshGenders();
        this.router.navigate(['/admin/gender-list']);
        this.isLoading = false;
        this.genderForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật giới tính:', err);
        console.error('Error details:', err.error);
        this.errorMessage = err?.error?.message || 'Không thể cập nhật giới tính, vui lòng thử lại.';
        this.isLoading = false;
        this.genderForm.enable();
      }
    });
  }
}

