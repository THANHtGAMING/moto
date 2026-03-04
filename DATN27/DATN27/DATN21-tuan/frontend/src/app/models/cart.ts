import { Product } from './product';

// Cart item interface - matches backend cart.products[] structure
export interface CartItem {
  productId: Product | string; // Can be populated Product object or just the ID string
  size: string | null;
  quantity: number;
}

// Cart interface - matches backend cart object
export interface Cart {
  _id?: string;
  userId?: string;
  products: CartItem[];
  totalPrice: number;
  finalPrice: number;
  couponId?: string | null;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Coupon interface for available coupons (matches new schema)
export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
  // Frontend-specific fields added by backend
  isEligible: boolean;
  remainingAmount: number;
}

// Cart API response - GET /api/cart/get
export interface CartResponse {
  cart: Cart;
  coupons: Coupon[];
}

// User info for cart update
export interface CartUserInfo {
  fullName: string;
  phoneNumber: string;
  address: string;
  email: string;
}

// Helper function to get product from cart item (handles both populated and unpopulated)
export function getCartItemProduct(item: CartItem): Product | null {
  if (typeof item.productId === 'object' && item.productId !== null) {
    return item.productId as Product;
  }
  return null;
}

// Helper function to get product ID from cart item
export function getCartItemProductId(item: CartItem): string {
  if (typeof item.productId === 'string') {
    return item.productId;
  }
  return (item.productId as Product)._id;
}

// Helper function to calculate item subtotal
export function calculateItemSubtotal(item: CartItem): number {
  const product = getCartItemProduct(item);
  if (!product) return 0;
  
  const price = product.discountProduct && product.discountProduct > 0
    ? product.priceProduct * (1 - product.discountProduct / 100)
    : product.priceProduct;
  
  return price * item.quantity;
}

// Helper function to get available stock for a cart item
export function getAvailableStock(item: CartItem): number {
  const product = getCartItemProduct(item);
  if (!product) return 0;
  
  if (product.sizes && product.sizes.length > 0 && item.size) {
    const sizeObj = product.sizes.find(s => s.name === item.size);
    return sizeObj ? sizeObj.stock : 0;
  }
  
  return product.stockProduct ?? 0;
}

