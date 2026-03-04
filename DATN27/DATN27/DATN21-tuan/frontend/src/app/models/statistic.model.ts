export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: OrderSummary[];
}

export interface OrderSummary {
  _id: string;
  orderCode: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  userId?: {
    fullName: string;
    email: string;
  };
}

export interface RevenuePoint {
  _id: string; // Date in format "YYYY-MM-DD"
  revenue: number;
  count: number;
}

export interface TopProduct {
  _id: string; // productId
  name: string;
  totalSold: number;
  revenue: number;
}

