import { Platform } from 'react-native';

export const APP_NAME = 'FastKirana';
export const APP_DESCRIPTION = 'Fast grocery delivery at your doorstep';
export const SUPPORT_PHONE = '+917054470303';

// Single source of truth for the production API URL.
// On Vercel: set EXPO_PUBLIC_API_BASE_URL in the project's Environment Variables.
// Locally (web): when hostname is localhost/127.0.0.1, fall back to LAN dev server.
const PRODUCTION_API_URL = 'https://fast-kirana-0ezx.onrender.com/api';

const getApiUrl = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) {
      const url = process.env.EXPO_PUBLIC_API_BASE_URL.trim();
      if (url) return url;
    }
  } catch {
    // ignore
  }

  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiUrl();

export const FREE_DELIVERY_THRESHOLD = 199
export const GROCERY_FREE_DELIVERY_THRESHOLD = 199
export const DELIVERY_FEE = 25
export const TAX_RATE = 0.05 // 5% GST

// Operational Control Defaults
export const MIN_ORDER_VALUE = 20
export const SURGE_MULTIPLIER = 1.0
export const STORE_OPEN_HOUR = 7
export const STORE_CLOSE_HOUR = 23

export const CATEGORIES = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', emoji: '🥛' },
  { name: 'Snacks & Munchies', slug: 'snacks-biscuits', emoji: '🍿' },
  { name: 'Beverages', slug: 'beverages', emoji: '🥤' },
  { name: 'Personal Care', slug: 'personal-care', emoji: '🧴' },
  { name: 'Household', slug: 'household', emoji: '🏠' },
  { name: 'Bakery & Biscuits', slug: 'bakery', emoji: '🍞' },
  { name: 'Atta, Rice & Dal', slug: 'grocery-essential', emoji: '🌾' },
] as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export interface MenuSection {
  tag: string
  matchTags: string[]
  title: string
  emoji: string
  description: string
  imageUrl?: string
  image?: string
  disabled?: boolean
}

export const DEFAULT_RESTAURANT_MENU_SECTIONS: MenuSection[] = [
  {
    tag: 'main-course',
    matchTags: ['main-course', 'curry', 'paneer-butter-masala', 'paneer'],
    title: 'Main Course & Paneer Specialties',
    emoji: '🥘',
    description: 'Rich paneer butter masala, kadhai paneer, and authentic North Indian curries',
  },
  {
    tag: 'roti-naan-kulcha',
    matchTags: ['roti-naan-kulcha', 'roti', 'naan', 'kulcha', 'paratha'],
    title: 'Rotis, Naans & Breads',
    emoji: '🫓',
    description: 'Butter naans, tandoori rotis, stuffed kulchas & lachha parathas',
  },
  {
    tag: 'basmati-rice-biryani',
    matchTags: ['basmati-rice-/-biryani', 'basmati-rice-biryani', 'biryani-rice', 'biryani', 'pulav', 'fried-rice', 'jeera-rice'],
    title: 'Biryani, Rice & Pulav',
    emoji: '🍚',
    description: 'Aromatic basmati veg biryanis, paneer pulavs & steamed jeera rice',
  },
  {
    tag: 'dal-specialities',
    matchTags: ['dal', 'dal-makhani', 'dal-tadka', 'dal-fry'],
    title: 'Dal Specialities',
    emoji: '🍲',
    description: 'Creamy Dal Makhani, Dal Tadka, and Dhaba style Dal Fry',
  },
  {
    tag: 'starters-kebabs',
    matchTags: ['special-starters', 'starter', 'tandoori-nawab-nawab'],
    title: 'Tandoori Starters & Kebabs',
    emoji: '🍢',
    description: 'Paneer tikka, dahi kebabs, soya malai chaap & tandoori platters',
  },
  {
    tag: 'breakfast-combos',
    matchTags: ['breakfast'],
    title: 'Breakfast & Traditional Combos',
    emoji: '🍛',
    description: 'Chole bhature, stuffed aloo/paneer parathas, poha & poori bhaji',
  },
  {
    tag: 'soups',
    matchTags: ['soup', 'soups'],
    title: 'Soups',
    emoji: '🥣',
    description: 'Hot Veg Manchow, Sweet Corn & Cream of Mushroom soups',
  },
  {
    tag: 'chinese',
    matchTags: ['chinese', 'noodles', 'manchurian', 'chilli-paneer', 'spring-rolls'],
    title: 'Chinese Wok',
    emoji: '🥡',
    description: 'Stir-fried noodles, saucy veg manchurian, and crispy spring rolls',
  },
  {
    tag: 'burgers-bites',
    matchTags: ['burger', 'burgers'],
    title: 'Burgers & Bites',
    emoji: '🍔',
    description: 'Juicy veg burgers, paneer burgers, and crispy double tikki burgers',
  },
  {
    tag: 'pizza-pasta',
    matchTags: ['pizza', 'pasta'],
    title: 'Pizzas & Pastas',
    emoji: '🍕',
    description: 'Fresh baked pizzas, red & white sauce pastas, and grilled sandwiches',
  },
  {
    tag: 'shakes',
    matchTags: ['shake', 'shakes'],
    title: 'Thick Shakes',
    emoji: '🥤',
    description: 'Cold creamy shakes - Oreo, Chocolate, Strawberry & Butterscotch',
  },
  {
    tag: 'desserts',
    matchTags: ['desserts', 'gulab-jamun', 'ice-cream', 'kheer', 'dessert'],
    title: 'Desserts',
    emoji: '🍨',
    description: 'Hot gulab jamuns, premium ice creams, and traditional sweets',
  }
];

export type CafeMenuSection = MenuSection;
export const DEFAULT_CAFE_MENU_SECTIONS = DEFAULT_RESTAURANT_MENU_SECTIONS;
export const CAFE_FREE_DELIVERY_THRESHOLD = FREE_DELIVERY_THRESHOLD;
