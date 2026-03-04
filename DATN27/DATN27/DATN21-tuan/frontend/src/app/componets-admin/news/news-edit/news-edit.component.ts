import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news/news.service';
import { RefreshService } from '../../../services/refresh.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-news-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './news-edit.component.html',
  styleUrls: ['./news-edit.component.css']
})
export class NewsEditComponent implements OnInit {
  newsForm!: FormGroup;
  newsId!: string;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute,
    private refreshService: RefreshService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.newsId = this.route.snapshot.paramMap.get('id') || '';
    
    this.newsForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      category_code: ['', [Validators.required]],
      status_code: ['published']
    });

    if (this.newsId) {
      this.loadNews();
    }
  }

  loadNews(): void {
    this.isLoading = true;
    this.newsService.getnewsDetail(this.newsId).subscribe({
      next: (news: any) => {
        this.newsForm.patchValue({
          title: news.title || news.name || '',
          content: news.content || '',
          category_code: news.category_code || '',
          status_code: news.status_code || news.status || 'published'
        });
        
        if (news.cover_image_url) {
          this.imagePreview = news.cover_image_url;
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải tin tức:', err);
        this.errorMessage = 'Không thể tải thông tin tin tức';
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
    if (this.newsForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;
    this.newsForm.disable();

    const formData = new FormData();
    formData.append('title', this.newsForm.value.title);
    formData.append('content', this.newsForm.value.content);
    formData.append('category_code', this.newsForm.value.category_code);
    formData.append('status_code', this.newsForm.value.status_code);
    
    if (this.selectedFile) {
      formData.append('cover_image', this.selectedFile);
    }

    this.newsService.updatenews(this.newsId, formData).subscribe({
      next: (res: any) => {
        this.toastService.success('Cập nhật tin tức thành công!');
        // Emit refresh event
        this.refreshService.refreshNews();
        this.router.navigate(['/admin/news-list']);
        this.isLoading = false;
        this.newsForm.enable();
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật tin tức:', err);
        this.errorMessage = err?.error?.message || 'Không thể cập nhật tin tức, vui lòng thử lại.';
        this.isLoading = false;
        this.newsForm.enable();
      }
    });
  }
}
