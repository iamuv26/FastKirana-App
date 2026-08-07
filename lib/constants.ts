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
export const CAFE_FREE_DELIVERY_THRESHOLD = 199
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
  { name: 'Ice Cream', slug: 'ice-cream', emoji: '🍦' },
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

export interface CafeMenuSection {
  tag: string
  matchTags: string[]
  title: string
  emoji: string
  description: string
  imageUrl?: string
  image?: string
  disabled?: boolean
}

export const DEFAULT_CAFE_MENU_SECTIONS: CafeMenuSection[] = [
  {
    tag: 'hot-beverage',
    matchTags: ['hot-beverage', 'tea', 'coffee'],
    title: 'Hot Brews',
    emoji: '☕',
    description: 'Chai, coffee, and fresh brewing mixes',
  },
  {
    tag: 'hot-bite',
    matchTags: ['hot-bite', 'snacks'],
    title: 'Quick Bites',
    emoji: '🥟',
    description: 'Samosas, Momos, and warm treats',
  },
  {
    tag: 'sandwiches',
    matchTags: ['sandwiches', 'sandwich'],
    title: 'Sandwiches',
    emoji: '🥪',
    description: 'Freshly grilled sandwiches loaded with cheese, paneer, and veggies',
  },
  {
    tag: 'frankie-rolls',
    matchTags: ['frankie-rolls', 'frankie rolls', 'frankie-roll', 'frankie roll', 'rolls', 'roll', 'kathi roll', 'kathi-roll'],
    title: 'Frankie & Rolls',
    emoji: '🌯',
    description: 'Fresh rolls stuffed with paneer, cheese, and veg patties',
  },
  {
    tag: 'chinese',
    matchTags: ['chinese', 'chinese-cuisine', 'chinese cuisine'],
    title: 'Chinese',
    emoji: '🥡',
    description: 'Momos, noodles, fried dishes & sauces',
  },
  {
    tag: 'italian-pasta',
    matchTags: ['italian-pasta', 'italian-pastas', 'italian pasta\'s', 'pasta'],
    title: "Pasta & Italian",
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
    title: 'Rice & Biryani',
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
    title: 'Mocktails',
    emoji: '🍹',
    description: 'Iced coolers, Virgin Mojito, and summer drinks',
  },
  {
    tag: 'cold-coffee',
    matchTags: ['cold-coffee', 'cold coffee', 'iced coffee', 'iced-coffee'],
    title: 'Cold Coffee',
    emoji: '🧋',
    description: 'Classic cold brews, hazelnut cold coffee & iced sips',
  },
  {
    tag: 'south-indian',
    matchTags: ['south-indian', 'south indian'],
    title: 'South Indian',
    emoji: '🍛',
    description: 'Dosa, Idli, Vada, Uttapam & more',
  },
  {
    tag: 'cafe-bakery',
    matchTags: ['bakery'],
    title: 'Bakery & Sweets',
    emoji: '🥐',
    description: 'Freshly baked croissants, muffins, and sweet nibbles',
  },
  {
    tag: 'chilled',
    matchTags: ['chilled', 'cold-drink', 'beverages', 'beverage', 'drinks', 'drink'],
    title: 'Chilled Drinks',
    emoji: '🥤',
    description: 'Carbonated soft drinks and cold energy boosts',
  },
  {
    tag: 'pizza',
    matchTags: ['pizza', 'pizzas'],
    title: 'Pizza',
    emoji: '🍕',
    description: 'Fresh oven-baked pizzas with loaded cheese toppings',
  },
  {
    tag: 'garlic-bread',
    matchTags: ['garlic-bread', 'garlic bread', 'garlic-breads'],
    title: 'Garlic Bread',
    emoji: '🧄',
    description: 'Crispy cheesy garlic bread baked to perfection',
  },
  {
    tag: 'burgers-bites',
    matchTags: ['burgers', 'burger', 'pav-bhaji', 'pav bhaji', 'pavbhaji'],
    title: 'Burgers & Pav',
    emoji: '🍔',
    description: 'Juicy burgers, cheesy paneer burgers & butter pav bhaji',
  },
  {
    tag: 'desserts',
    matchTags: ['desserts', 'ice-cream', 'ice cream', 'icecream', 'kulfi', 'dessert', 'sweet'],
    title: 'Ice Creams',
    emoji: '🍦',
    description: 'Chilled premium ice creams, kulfis, and desserts',
  }
]

export const DEFAULT_RESTAURANT_MENU_SECTIONS: CafeMenuSection[] = [
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
]
