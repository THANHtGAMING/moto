// Product size interface
export interface ProductSize {
  name: string;
  stock: number;
}

// Product interface matching backend API response
export interface Product {
  _id: string;
  nameProduct: string;
  priceProduct: number;
  discountProduct?: number;
  descriptionProduct?: string;
  imagesProduct: string[];
  sizes?: ProductSize[];
  stockProduct?: number;
  sizeType?: 'standard' | 'age' | 'month' | null; // Loại size: chuẩn, theo tuổi, theo tháng, hoặc null
  genderProduct?: any; // Gender reference
  typeProduct?: any; // Type reference (required)
  riderProduct?: any; // Rider reference
  brandProduct?: any; // Brand reference
  tags?: any[]; // Tags array
  isActive?: boolean; // Active status
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to calculate discounted price
export function getDiscountedPrice(product: Product): number {
  if (product.discountProduct && product.discountProduct > 0) {
    return product.priceProduct * (1 - product.discountProduct / 100);
  }
  return product.priceProduct;
}

// Helper function to check if product is in stock
export function isProductInStock(product: Product): boolean {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.some(size => size.stock > 0);
  }
  return (product.stockProduct ?? 0) > 0;
}

// Helper function to get total stock
export function getTotalStock(product: Product): number {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.reduce((total, size) => total + size.stock, 0);
  }
  return product.stockProduct ?? 0;
}
