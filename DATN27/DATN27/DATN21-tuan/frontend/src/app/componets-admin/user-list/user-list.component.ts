import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user';
import { CommonModule, NgFor } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgxPaginationModule,
    FormsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {


  users: User[] = [];
  filteredusers: User[] = [];
  p: number = 1;
  keyword: string = '';
  roleFilter: string = ''; // 'all', 'admin', 'user'
  selectedUser: User | null = null;
  showUserDetailModal: boolean = false;

  constructor(
    private userService: UserService ,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getAll().subscribe({
      next: (data) => {
        console.log('Users data received:', data);
        // Đảm bảo data là array
        if (Array.isArray(data)) {
          this.users = data as User[];
          this.filteredusers = this.users;
          console.log('Users loaded:', this.users.length);
        } else {
          console.warn('Expected array but got:', data);
          this.users = [];
          this.filteredusers = [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách người dùng:', err);
        console.error('Error details:', err.error);
        this.users = [];
        this.filteredusers = [];
      }
    });
  }

  onSearch() {
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];

    // Filter by keyword
    if (this.keyword.trim() !== '') {
      const keywordLower = this.keyword.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(keywordLower) ||
        u.email.toLowerCase().includes(keywordLower)
      );
    }

    // Filter by role
    if (this.roleFilter === 'admin') {
      filtered = filtered.filter(u => u.isAdmin);
    } else if (this.roleFilter === 'user') {
      filtered = filtered.filter(u => !u.isAdmin);
    }

    this.filteredusers = filtered;
    this.p = 1;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  formatCurrency(amount?: number): string {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  viewUserDetail(userId: string) {
    // Tìm user từ danh sách đã load
    const user = this.users.find(u => u._id === userId);
    if (user) {
      this.selectedUser = user;
      this.showUserDetailModal = true;
    }
  }

  closeUserDetailModal() {
    this.showUserDetailModal = false;
    this.selectedUser = null;
  }

  getTotalOrders(): number {
    return this.filteredusers.reduce((sum, u) => sum + (u.orderCount || 0), 0);
  }

  getTotalRevenue(): number {
    return this.filteredusers.reduce((sum, u) => sum + (u.totalSpent || 0), 0);
  }

}
