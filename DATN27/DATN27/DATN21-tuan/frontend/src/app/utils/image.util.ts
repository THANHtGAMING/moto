/**
 * Utility functions for handling image URLs
 */

/**
 * Gets a valid image URL from a product image string
 * Handles both full Cloudinary URLs and relative paths
 * @param imageUrl - The image URL from the product (could be full URL or filename)
 * @returns A valid image URL string
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return ''; // Return empty string for missing images
  }

  // If it's already a full URL (http:// or https://), use it as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it starts with //, add https: protocol
  if (imageUrl.startsWith('//')) {
    return `https:${imageUrl}`;
  }

  // If it's a Cloudinary URL without protocol (starts with res.cloudinary.com)
  if (imageUrl.includes('cloudinary.com')) {
    return `https://${imageUrl}`;
  }

  // If it's just a filename, it might be a Cloudinary public ID
  // In this case, we can't construct the full URL without Cloudinary config
  // So we'll return empty string or a placeholder
  // You might want to add your Cloudinary base URL here if needed
  return '';
}

/**
 * Gets the first image from a product's images array
 * @param images - Array of image URLs
 * @returns The first valid image URL or empty string
 */
export function getProductImage(images: string[] | null | undefined): string {
  if (!images || images.length === 0) {
    return '';
  }
  return getImageUrl(images[0]);
}

