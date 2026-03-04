import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HelpService, Help } from '../../services/help/help.service';

@Component({
  selector: 'app-footer-shop',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer-shop.component.html',
  styleUrls: ['./footer-shop.component.css']
})
export class FooterShopComponent implements OnInit {
  helpItems: Help[] = [];
  helpItemsCol1: Help[] = [];
  helpItemsCol2: Help[] = [];
  helpItemsCol3: Help[] = [];
  loading: boolean = false;

  constructor(private helpService: HelpService) { }

  ngOnInit() {
    this.loadHelpItems();
  }

  loadHelpItems() {
    this.loading = true;
    this.helpService.getAll().subscribe({
      next: (data) => {
        const allItems = Array.isArray(data) ? data.filter(item => item.status === 'active') : [];
        this.helpItems = allItems;
        
        // Phân loại help items theo ảnh mẫu
        // Cột 1: Dịch vụ khách hàng - Help, Track Order, Size Chart
        this.helpItemsCol1 = allItems.filter(item => {
          const name = item.name.toLowerCase();
          return name.includes('theo dõi') || 
                 name.includes('đặt hàng') || 
                 name.includes('kích thước');
                 
        });
        
        // Cột 2: Mua sắm không lo lắng - Promo Terms, Safe Shopping, Delivery & Shipping, Returns
        this.helpItemsCol2 = allItems.filter(item => {
          const name = item.name.toLowerCase();
          return name.includes('giao hàng') || 
                 name.includes('vận chuyển') || 
                 name.includes('bảo mật') || 
                 name.includes('điều khoản') || 
                 name.includes('chính sách') || 
                 name.includes('cookie') || 
                 name.includes('khuyến mãi')
        });
        
        // Cột 3: Thông tin - My Account, About Us
        this.helpItemsCol3 = allItems.filter(item => {
          const name = item.name.toLowerCase();
          return name.includes('tài khoản') || 
                 name.includes('giới thiệu');
        });
        
        // Sắp xếp theo order
        this.helpItemsCol1.sort((a, b) => (a.order || 0) - (b.order || 0));
        this.helpItemsCol2.sort((a, b) => (a.order || 0) - (b.order || 0));
        this.helpItemsCol3.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading help items:', err);
        this.loading = false;
      }
    });
  }

}
