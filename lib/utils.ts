import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | string | null): string {
  if (price === null || price === undefined) return '₹0';
  const num = typeof price === 'number' ? price : parseFloat(String(price));
  const validNum = isNaN(num) ? 0 : num;
  return `₹${validNum.toLocaleString('en-IN')}`;
}

export function isRestaurantProduct(p: any): boolean {
  if (!p) return false;
  const catSlug = (p.category?.slug || p.categorySlug || '').toLowerCase();
  const tags = p.tags?.map((t: string) => t.toLowerCase()) || [];

  if (catSlug === 'restaurant') return true;
  return tags.includes('restaurant') && !tags.includes('cafe');
}

export function isCafeProduct(p: any): boolean {
  if (!p) return false;
  const catSlug = (p.category?.slug || p.categorySlug || '').toLowerCase();
  const tags = p.tags?.map((t: string) => t.toLowerCase()) || [];
  
  if (catSlug === 'fastkirana-cafe') return true;
  return tags.includes('cafe');
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
  if (address === 'Current Location') return 'Current Location';
  
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

export function getCategoryEmoji(nameOrSlug: string | null | undefined): string {
  if (!nameOrSlug) return '🍽️';
  const n = nameOrSlug.toLowerCase();

  if (n === 'all') return '🛒';
  if (n.includes('roti') || n.includes('naan') || n.includes('kulcha') || n.includes('paratha')) return '🫓';
  if (n.includes('burger')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('chinese') || n.includes('noodle') || n.includes('momo') || n.includes('manchurian') || n.includes('wok')) return '🥢';
  if (n.includes('biryani') || n.includes('thali') || n.includes('curry') || n.includes('paneer') || n.includes('rice') || n.includes('dal') || n.includes('north indian')) return '🍛';
  if (n.includes('south indian') || n.includes('dosa') || n.includes('idli') || n.includes('sambar') || n.includes('vada')) return '🥞';
  if (n.includes('shake') || n.includes('drink') || n.includes('coffee') || n.includes('beverage') || n.includes('tea') || n.includes('brew') || n.includes('sod') || n.includes('chilled') || n.includes('sip')) return '🧋';
  if (n.includes('dessert') || n.includes('ice cream') || n.includes('ice-cream') || n.includes('sweet') || n.includes('cake') || n.includes('muffin') || n.includes('gulab')) return '🍰';
  if (n.includes('sandwich') || n.includes('toast') || n.includes('bombay')) return '🥪';
  if (n.includes('roll') || n.includes('frankie') || n.includes('wrap') || n.includes('kathi')) return '🌯';
  if (n.includes('pasta') || n.includes('italian')) return '🍝';
  if (n.includes('snack') || n.includes('bite') || n.includes('samosa') || n.includes('patty') || n.includes('fries') || n.includes('munch')) return '🍟';
  if (n.includes('fruit') || n.includes('veg')) return '🥦';
  if (n.includes('milk') || n.includes('dairy') || n.includes('butter') || n.includes('cheese')) return '🥛';
  if (n.includes('bread') || n.includes('bakery') || n.includes('biscuit') || n.includes('cookie')) return '🍞';
  if (n.includes('soap') || n.includes('shampoo') || n.includes('clean') || n.includes('wash') || n.includes('care') || n.includes('hygiene') || n.includes('house')) return '🧴';
  if (n.includes('restaurant') || n.includes('food') || n.includes('cafe')) return '🍱';
  return '🍽️';
}

export function normalizeCategorySlug(slug: string | null | undefined): string {
  if (!slug) return 'grocery-essential';
  const s = slug.toLowerCase().trim();
  if (s === 'atta-rice-dal' || s === 'staples' || s === 'staples-pulses' || s === 'groceries' || s === 'grocery-essentials' || s === 'atta-dal') {
    return 'grocery-essential';
  }
  if (s === 'dairy' || s === 'milk-dairy' || s === 'breakfast' || s === 'milk') {
    return 'dairy-breakfast';
  }
  if (s === 'snacks' || s === 'munchies' || s === 'biscuits' || s === 'biscuits-snacks' || s === 'munch') {
    return 'snacks-biscuits';
  }
  if (s === 'drinks' || s === 'soft-drinks' || s === 'beverage' || s === 'coolers') {
    return 'beverages';
  }
  if (s === 'icecream' || s === 'ice-creams' || s === 'desserts' || s === 'frozen') {
    return 'ice-cream';
  }
  if (s === 'home-care' || s === 'cleaning' || s === 'cleaners' || s === 'house-hold' || s === 'home') {
    return 'household';
  }
  if (s === 'personal' || s === 'hygiene' || s === 'beauty' || s === 'care') {
    return 'personal-care';
  }
  if (s === 'fastkirana-cafe' || s === 'as-cafe' || s === 'café') {
    return 'cafe';
  }
  return s;
}

export function formatDisplayOrderId(id: string | number | null | undefined, readableId?: number | null): string {
  if (readableId !== undefined && readableId !== null && typeof readableId === 'number' && readableId > 0) {
    return `${600000 + (readableId % 100000)}`;
  }

  if (!id) return '600101';

  if (typeof id === 'number') {
    return `${600000 + (id % 100000)}`;
  }

  const str = String(id).trim();

  // If already a 6-digit number starting with 600xxx
  if (/^\d{6}$/.test(str)) {
    return str;
  }

  // Extract any 3-6 digit number inside string (e.g. FK-600408 or ord-408)
  const matchNum = str.match(/\d{3,6}/);
  if (matchNum) {
    const extracted = parseInt(matchNum[0], 10);
    if (extracted >= 600000 && extracted <= 699999) {
      return `${extracted}`;
    }
    return `${600000 + (extracted % 100000)}`;
  }

  // Fallback for short numeric string
  if (/^\d{1,5}$/.test(str)) {
    const num = parseInt(str, 10);
    return `${600000 + num}`;
  }

  // Fallback for alpha-numeric IDs
  return str.slice(-6).toUpperCase();
}
