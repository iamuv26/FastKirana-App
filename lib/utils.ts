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
  if (p.category?.slug === 'cafe') return true;
  if (p.tags?.includes('cafe')) return true;
  return false;
}

export function getOptimizedImageUrl(url: string | null | undefined, width = 300): string | null {
  if (!url) return null;
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    // Remove f_auto to prevent Cloudinary from serving AVIF or advanced formats that fail to render on some mobile platforms
    return url.replace('/image/upload/', `/image/upload/q_auto,w_${width},c_limit/`);
  }
  return url;
}

export function getAppImageSource(imgUrl: string | null | undefined): { uri: string } | null {
  if (!imgUrl) return null;
  if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) {
    let url = imgUrl;
    if (url.includes('localhost:3000')) {
      url = url.replace('localhost:3000', 'www.fastkirana.in');
    } else if (url.includes('127.0.0.1:3000')) {
      url = url.replace('127.0.0.1:3000', 'www.fastkirana.in');
    }
    return { uri: url };
  }
  if (imgUrl.startsWith('/')) {
    const baseDomain = API_BASE_URL.replace('/api', '');
    return { uri: `${baseDomain}${imgUrl}` };
  }
  return null;
}
