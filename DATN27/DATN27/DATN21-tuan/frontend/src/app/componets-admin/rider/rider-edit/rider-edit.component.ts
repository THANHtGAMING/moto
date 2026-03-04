import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RiderService } from '../../../services/rider/rider.service';
import { Rider } from '../../../models/rider';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-rider-edit',
  standalone: true,
  templateUrl: './rider-edit.component.html',
  styleUrls: ['./rider-edit.component.css'],
  imports: [RouterModule, ReactiveFormsModule, CommonModule]
})
export class RiderEditComponent implements OnInit {
  id!: string;
  rider!: Rider;
  riderForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private riderService: RiderService,
    private route: ActivatedRoute,
    private router: Router,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {
    this.id = route.snapshot.params['id'];
    this.riderForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1)]),
      image: new FormControl(null),
      team: new FormControl('')
    });
  }

  ngOnInit() {
    this.loadRider();
  }

  loadRider() {
    this.isLoading = true;
    this.riderForm.disable();

    this.riderService.getRiderDetail(this.id).subscribe({
      next: (data: any) => {
        if (data) {
          this.rider = data;
          this.riderForm.patchValue({
            name: this.rider.name,
            team: this.rider.team || ''
          });
          this.imagePreview = this.rider.image;
        } else {
          this.toastService.error('Không tìm thấy tay đua!');
          this.router.navigate(['/admin/rider-list']);
        }
        this.isLoading = false;
        this.riderForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi tải tay đua:', err);
        this.errorMessage = 'Không thể tải thông tin tay đua. Vui lòng thử lại.';
        this.isLoading = false;
        this.riderForm.enable();
        this.router.navigate(['/admin/rider-list']);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.riderForm.patchValue({ image: file });

      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.riderForm.invalid) {
      this.errorMessage = 'Dữ liệu không hợp lệ';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.riderForm.disable();

    const formData = new FormData();
    formData.append('name', this.riderForm.value.name);
    if (this.riderForm.value.team) {
      formData.append('team', this.riderForm.value.team);
    }

    // Only append image if a new file is selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.riderService.updateRider(this.id, formData).subscribe({
      next: (res: any) => {
        console.log('Update response:', res);
        this.toastService.success('Cập nhật tay đua thành công!');
        // Emit refresh event
        this.refreshService.refreshRiders();
        this.router.navigate(['/admin/rider-list']);
        this.isLoading = false;
        this.riderForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật tay đua:', err);
        console.error('Error details:', err.error);
        this.errorMessage = err?.error?.message || 'Không thể cập nhật tay đua, vui lòng thử lại.';
        this.isLoading = false;
        this.riderForm.enable();
      }
    });
  }
}
