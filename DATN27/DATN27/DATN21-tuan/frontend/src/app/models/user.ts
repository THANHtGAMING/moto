export interface Address {
  _id?: string;
  name: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;          // MongoDB ObjectId
  fullName: string;     // tên đầy đủ
  email: string;        // email unique
  password?: string;    // optional vì không được trả về khi GET
  isAdmin: boolean;     // quyền admin
  status?: string;      // active/blocked
  orderCount?: number;  // số đơn hàng đã đặt
  totalSpent?: number;  // tổng tiền đã mua
  addresses?: Address[]; // danh sách địa chỉ
  avatar?: string;      // avatar URL
  createdAt?: string;   // timestamps (tự sinh bởi MongoDB)
  updatedAt?: string;   // timestamps (tự sinh bởi MongoDB)
}
