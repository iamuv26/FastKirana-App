import { Platform } from 'react-native';

export const APP_NAME = 'FastKirana';
export const APP_DESCRIPTION = 'Fast grocery delivery at your doorstep';

const getDevApiUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return `http://${hostname}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }
  return 'http://192.168.31.206:3000/api';
};

const getApiUrl = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
  } catch (e) {
    console.warn('Failed to read process.env:', e);
  }
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3999/api';
      }
    }
  }
  return 'https://www.fastkirana.in/api';
};

export const API_BASE_URL = getApiUrl();

export const FREE_DELIVERY_THRESHOLD = 199
export const GROCERY_FREE_DELIVERY_THRESHOLD = 199
export const CAFE_FREE_DELIVERY_THRESHOLD = 199
export const COMBINED_FREE_DELIVERY_THRESHOLD = 300
export const DELIVERY_FEE = 25
export const TAX_RATE = 0.05 // 5% GST

// Operational Control Defaults
export const MIN_ORDER_VALUE = 99
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
  { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', emoji: '🌾' },
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

export interface CafeMenuSection {
  tag: string
  matchTags: string[]
  title: string
  emoji: string
  description: string
}

export const DEFAULT_CAFE_MENU_SECTIONS: CafeMenuSection[] = [
  {
    tag: 'hot-beverage',
    matchTags: ['hot-beverage', 'tea', 'coffee'],
    title: 'Steaming Hot Brews',
    emoji: '☕',
    description: 'Chai, coffee, and fresh brewing mixes',
  },
  {
    tag: 'hot-bite',
    matchTags: ['hot-bite', 'snacks'],
    title: 'Quick Bites & Snacks',
    emoji: '🥟',
    description: 'Samosas, Momos, and warm treats',
  },
  {
    tag: 'sandwiches',
    matchTags: ['sandwiches', 'sandwich'],
    title: 'Gourmet Sandwiches',
    emoji: '🥪',
    description: 'Freshly grilled sandwiches loaded with cheese, paneer, and veggies',
  },
  {
    tag: 'frankie-rolls',
    matchTags: ['frankie-rolls', 'frankie rolls', 'frankie-roll', 'frankie roll', 'rolls', 'roll', 'kathi roll', 'kathi-roll'],
    title: 'Gourmet Frankie Rolls',
    emoji: '🌯',
    description: 'Fresh rolls stuffed with paneer, cheese, and veg patties',
  },
  {
    tag: 'chinese',
    matchTags: ['chinese', 'chinese-cuisine', 'chinese cuisine'],
    title: 'Chinese Cuisine',
    emoji: '🥡',
    description: 'Momos, noodles, fried dishes & sauces',
  },
  {
    tag: 'italian-pasta',
    matchTags: ['italian-pasta', 'italian-pastas', 'italian pasta\'s', 'pasta'],
    title: "Italian Pasta's",
    emoji: '🍝',
    description: 'Fresh penne tossed in aromatic red & white sauces',
  },
  {
    tag: 'bombay-bites',
    matchTags: ['bombay-bites', 'bombay bites', 'bombay-bite', 'bombay bite'],
    title: 'Bombay Bites',
    emoji: '🥪',
    description: 'Vada Pav, special Bombay Masala Toast, and street snacks',
  },
  {
    tag: 'rice-dishes',
    matchTags: ['rice-dishes', 'rice dishes', 'rice-dish', 'rice dish', 'biryani', 'pulav'],
    title: 'Rice Dishes',
    emoji: '🍚',
    description: 'Flavourful biryani, fried rice, and combos',
  },
  {
    tag: 'shakes',
    matchTags: ['shakes', 'shake', 'milkshake', 'milkshakes'],
    title: 'Thick Shakes',
    emoji: '🥤',
    description: 'Creamy strawberry, chocolate, and Oreo sips',
  },
  {
    tag: 'mocktails',
    matchTags: ['mocktails', 'mocktail', 'coolers', 'cooler'],
    title: 'Refreshing Mocktails',
    emoji: '🍹',
    description: 'Iced coolers, Virgin Mojito, and summer drinks',
  },
  {
    tag: 'cold-coffee',
    matchTags: ['cold-coffee', 'cold coffee', 'iced coffee', 'iced-coffee'],
    title: 'Chilled Cold Coffee',
    emoji: '🧋',
    description: 'Classic cold brews, hazelnut cold coffee & iced sips',
  },
  {
    tag: 'south-indian',
    matchTags: ['south-indian', 'south indian'],
    title: 'South Indian Favorites',
    emoji: '🍛',
    description: 'Dosa, Idli, Vada, Uttapam & more',
  },
  {
    tag: 'cafe-bakery',
    matchTags: ['bakery'],
    title: 'Bakery & Sweet Cravings',
    emoji: '🥐',
    description: 'Freshly baked croissants, muffins, and sweet nibbles',
  },
  {
    tag: 'chilled',
    matchTags: ['chilled', 'cold-drink'],
    title: 'Chilled Sips & Sodas',
    emoji: '🥤',
    description: 'Carbonated soft drinks and cold energy boosts',
  }
]
