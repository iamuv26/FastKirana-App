import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

export function isCafeProduct(p: any): boolean {
  if (!p) return false;
  const categorySlug = p.category?.slug || p.categorySlug;
  if (categorySlug === 'cafe' || categorySlug === 'restaurant') return true;
  if (p.tags?.includes('cafe') || p.tags?.includes('restaurant')) return true;
  return false;
}

export function getOptimizedImageUrl(url: string | null | undefined, width = 300): string | null {
  if (!url) return null;
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    // Force WebP format to dramatically reduce image sizes and load times on mobile
    return url.replace('/image/upload/', `/image/upload/f_webp,q_auto,w_${width},c_limit/`);
  }
  return url;
}

export function getAppImageSource(imgUrl: string | null | undefined, width = 250): { uri: string } | null {
  if (!imgUrl) return null;
  const optimizedUrl = getOptimizedImageUrl(imgUrl, width);
  if (!optimizedUrl) return null;

  if (optimizedUrl.startsWith('http') || optimizedUrl.startsWith('data:')) {
    let url = optimizedUrl;
    if (url.includes('localhost:3000')) {
      url = url.replace('localhost:3000', 'www.fastkirana.in');
    } else if (url.includes('127.0.0.1:3000')) {
      url = url.replace('127.0.0.1:3000', 'www.fastkirana.in');
    }
    return { uri: url };
  }
  if (optimizedUrl.startsWith('/')) {
    const baseDomain = API_BASE_URL.replace('/api', '');
    return { uri: `${baseDomain}${optimizedUrl}` };
  }
  return null;
}

export function formatHeaderAddress(address: string | null | undefined): string {
  if (!address || address === 'Select Location') return 'Select Location';
  if (address.startsWith('Lat:')) return address;
  
  const parts = address.split(',')
    .map(p => p.trim())
    // Remove plus codes containing '+'
    .filter(p => !p.includes('+'))
    // Remove 6-digit postal/pin codes
    .filter(p => !/^\d{6}$/.test(p))
    // Remove country name
    .filter(p => p.toLowerCase() !== 'india');

  if (parts.length === 0) return address;
  
  // Take first 2 readable parts (e.g., street/area and city)
  return parts.slice(0, 2).join(', ');
}
