export interface Reply {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
    isAdmin?: boolean;
  };
  comment: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  productId: string;
  orderId: string;
  rating: number; // 1-5
  comment: string;
  images: string[];
  likes: Array<{ _id: string; fullName: string }>;
  dislikes: Array<{ _id: string; fullName: string }>;
  replies: Reply[];
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  images?: File[];
}

export interface PendingReview {
  productId: string;
  nameProduct: string;
  imageProduct: string;
  price: number;
  quantity: number;
  size: string | null;
  productDetails: {
    descriptionProduct: string;
    discountProduct: number;
  } | null;
}

export interface OrderWithPendingReviews {
  orderId: string;
  orderCode: string;
  deliveredAt: string;
  totalProducts: number;
  reviewedCount: number;
  pendingCount: number;
  hasPending: boolean;
}

