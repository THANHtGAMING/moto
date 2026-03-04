import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { StatisticService } from '../../services/statistic/statistic.service';
import { DashboardStats, RevenuePoint, TopProduct } from '../../models/statistic.model';
import { OrderListParams } from '../../services/admin-order/admin-order.service';

@Component({
  selector: 'app-statistic',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BaseChartDirective],
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css']
})
export class StatisticComponent implements OnInit {
  // Dashboard stats
  dashboardStats: DashboardStats | null = null;
  isLoadingStats = false;

  // Revenue chart
  revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Doanh thu',
      borderColor: '#ee4d2d',
      backgroundColor: 'rgba(238, 77, 45, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };
  revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `Doanh thu: ${this.currencyVN(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return this.currencyVN(Number(value));
          }
        }
      }
    }
  };
  isLoadingChart = false;

  // Top products
  topProducts: TopProduct[] = [];
  isLoadingTopProducts = false;

  // Recent orders
  recentOrders: DashboardStats['recentOrders'] = [];
  isLoadingRecentOrders = false;

  // Filtered orders (for advanced filtering)
  filteredOrders: any[] = [];
  isLoadingFilteredOrders = false;
  filters: OrderListParams = {
    page: 1,
    limit: 5
  };
  pagination = {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  };

  constructor(private statisticService: StatisticService) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoadingStats = true;
    this.isLoadingChart = true;
    this.isLoadingTopProducts = true;
    this.isLoadingRecentOrders = true;

    forkJoin({
      dashboard: this.statisticService.getDashboard(),
      chart: this.statisticService.getRevenueChart(),
      topProducts: this.statisticService.getTopProducts()
    }).subscribe({
      next: (results) => {
        // Dashboard stats
        this.dashboardStats = results.dashboard;
        this.recentOrders = results.dashboard.recentOrders || [];
        this.isLoadingStats = false;
        this.isLoadingRecentOrders = false;

        // Revenue chart
        this.updateRevenueChart(results.chart);
        this.isLoadingChart = false;

        // Top products
        this.topProducts = results.topProducts;
        this.isLoadingTopProducts = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoadingStats = false;
        this.isLoadingChart = false;
        this.isLoadingTopProducts = false;
        this.isLoadingRecentOrders = false;
      }
    });
  }

  updateRevenueChart(data: RevenuePoint[]) {
    // Sort by date to ensure correct order
    const sortedData = [...data].sort((a, b) => a._id.localeCompare(b._id));

    // Format dates for display (DD/MM)
    const labels = sortedData.map(item => {
      const date = new Date(item._id);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const revenues = sortedData.map(item => item.revenue);

    this.revenueChartData = {
      labels,
      datasets: [{
        data: revenues,
        label: 'Doanh thu',
        borderColor: '#ee4d2d',
        backgroundColor: 'rgba(238, 77, 45, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadFilteredOrders();
  }

  loadFilteredOrders() {
    this.isLoadingFilteredOrders = true;
    this.statisticService.getAdminOrders(this.filters).subscribe({
      next: (response) => {
        this.filteredOrders = response.orders || [];
        this.pagination = response.pagination || this.pagination;
        this.isLoadingFilteredOrders = false;
      },
      error: (error) => {
        console.error('Error loading filtered orders:', error);
        this.isLoadingFilteredOrders = false;
      }
    });
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.loadFilteredOrders();
    window.scrollTo(0, 0);
  }

  // Helper methods
  currencyVN(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0 đ';
    return value.toLocaleString('vi-VN') + ' đ';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-pending',
      'pending_payment': 'badge-pending-payment',
      'confirmed': 'badge-confirmed',
      'shipping': 'badge-shipping',
      'delivered': 'badge-delivered',
      'cancelled': 'badge-cancelled',
      'returned': 'badge-returned',
      'failed': 'badge-failed'
    };
    return statusMap[status] || 'badge-default';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'pending_payment': 'Chờ thanh toán',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng',
      'failed': 'Thất bại'
    };
    return statusMap[status] || status;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}

