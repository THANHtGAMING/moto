export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

export interface Order {
  _id?: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  phone: string;
  address: string;
  status?: string;      // pending | paid | shipping | completed
  createdAt?: string;
}
