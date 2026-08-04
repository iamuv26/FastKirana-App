import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Alert, Modal, Switch, Platform, Linking, useWindowDimensions, TouchableOpacity, InteractionManager } from 'react-native';
import { StyleSheet } from 'react-native';
import { THEME } from '../../lib/theme';
import { Image } from 'expo-image';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, Circle, CheckCircle, Package, Truck, ChefHat, Search, Play, Phone, MapPin, IndianRupee, Camera, QrCode, Sparkles, RefreshCw, Barcode, X, Settings, Ticket, Plus, Minus, Users, ShoppingBag, Star, Zap, AlertTriangle, TrendingUp, Building2, Calendar, Activity, Layers, Hourglass, XCircle, PlusCircle, ChevronRight, Utensils, Clock, ArrowRight, BrainCircuit, RotateCcw, HelpCircle, Undo, Download, Save, Heart, Sliders, ArrowUp, ArrowDown, ChevronDown, Sun, Moon, Send, MessageSquare, Edit2, Trash2, LogOut } from 'lucide-react-native';
import Svg, { Path, Rect, Circle as SvgCircle, Line, Text as SvgText, G } from 'react-native-svg';
import { useCart } from '../hooks/use-cart';
import { formatPrice, getAppImageSource, formatHeaderAddress } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { API_BASE_URL } from '../lib/constants';
import { registerForPushNotificationsAsync } from '../lib/push-notifications';
import OrdersTab from '../components/operations/OrdersTab';
import InventoryTab from '../components/operations/InventoryTab';
import UsersTab from '../components/operations/UsersTab';
import { useNewOrderAlert } from '../hooks/use-new-order-alert';
import { NewOrderAlertModal } from '../components/operations/NewOrderAlertModal';
import { useTheme } from './context/ThemeContext';
import { useOrderStream } from '../hooks/use-order-stream';
import Logo from '../components/shared/Logo';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DEFAULT_CAFE_MENU_SECTIONS = [
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
    tag: 'bakery',
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
];

// ------------------- Interfaces -------------------
interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  location?: string | null;
  categorySlug?: string;
  cooked: boolean;
  selectedVariant?: string | null;
  notes?: string | null;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  deliveryFee?: number;
  miscFee?: number;
  discount?: number;
  createdAt: string;
  paymentMethod: 'UPI' | 'COD' | 'CARD';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  user: {
    name: string;
    phone: string;
  };
  address: {
    houseNo: string;
    street: string;
    area: string;
    city: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  items: OrderItem[];
  binName?: string;
  shopName?: string;
}

// ------------------- Aisle Rack mapping -------------------
const CATEGORY_AISLES: Record<string, string> = {
  'fruits-vegetables': 'Aisle 1 (Produce Rack)',
  'dairy-breakfast': 'Aisle 2 (Chilled Dairy)',
  'snacks-biscuits': 'Aisle 3 (Snacks)',
  'beverages': 'Aisle 4 (Beverages)',
  'grocery-essential': 'Aisle 5 (Staples)',
  'personal-care': 'Aisle 6 (Hygiene)',
  'household': 'Aisle 7 (Cleaning)',
  'bakery': 'Aisle 8 (Bakery)',
};

function getItemAisle(item: OrderItem): string {
  if (item.location) return item.location;
  const slug = item.categorySlug || '';
  return CATEGORY_AISLES[slug] || 'Aisle 9 (General Shelves)';
}

export const mockOrdersList: Order[] = [
  {
    id: 'ord-101',
    status: 'PENDING',
    total: 350,
    createdAt: new Date().toISOString(),
    paymentMethod: 'UPI',
    deliveryMethod: 'DELIVERY',
    user: { name: 'Rahul Sharma', phone: '9876543210' },
    address: { houseNo: '123', street: 'MG Road', area: 'Ghatampur', city: 'Kanpur', pincode: '209206' },
    items: [
      { id: 'it-1', name: 'Fresh Paneer 200g', price: 80, quantity: 2, imageUrl: null, location: 'Aisle 1 (Dairy)', categorySlug: 'dairy', cooked: false },
      { id: 'it-2', name: 'Amul Butter 100g', price: 60, quantity: 3, imageUrl: null, location: 'Aisle 1 (Dairy)', categorySlug: 'dairy', cooked: false }
    ],
    binName: undefined
  },
  {
    id: 'ord-102',
    status: 'CONFIRMED',
    total: 520,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    paymentMethod: 'UPI',
    deliveryMethod: 'DELIVERY',
    user: { name: 'Priya Singh', phone: '9123456789' },
    address: { houseNo: 'House 12', street: 'Shanti Nagar', area: 'Ghatampur', city: 'Kanpur', pincode: '209206' },
    items: [
      { id: 'it-3', name: 'Lay\'s Magic Masala Chips', price: 20, quantity: 5, imageUrl: null, location: 'Aisle 3 (Snacks)', categorySlug: 'snacks-biscuits', cooked: false },
      { id: 'it-4', name: 'Coca Cola 2L', price: 90, quantity: 2, imageUrl: null, location: 'Aisle 4 (Beverages)', categorySlug: 'beverages', cooked: false }
    ],
    binName: undefined
  },
  {
    id: 'ord-103',
    status: 'PACKED',
    total: 180,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    paymentMethod: 'COD',
    deliveryMethod: 'DELIVERY',
    user: { name: 'Amit Verma', phone: '8877665544' },
    address: { houseNo: 'Shop 5', street: 'Main Bazar', area: 'Ghatampur', city: 'Kanpur', pincode: '209206' },
    items: [
      { id: 'it-5', name: 'FastKirana Special Veg Momos', price: 120, quantity: 1, imageUrl: null, location: 'Kitchen Section', categorySlug: 'cafe', cooked: true }
    ],
    binName: 'Bin-A4'
  },
  {
    id: 'ord-104',
    status: 'DELIVERED',
    total: 890,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    paymentMethod: 'UPI',
    deliveryMethod: 'DELIVERY',
    user: { name: 'Sanjay Kumar', phone: '7766554433' },
    address: { houseNo: 'Plot 88', street: 'Kalyanpur', area: 'Ghatampur', city: 'Kanpur', pincode: '209206' },
    items: [
      { id: 'it-6', name: 'Aashirvaad Atta 5kg', price: 270, quantity: 2, imageUrl: null, location: 'Aisle 5 (Staples)', categorySlug: 'grocery-essential', cooked: false },
      { id: 'it-7', name: 'Fortune Soya Oil 1L', price: 140, quantity: 2, imageUrl: null, location: 'Aisle 5 (Staples)', categorySlug: 'grocery-essential', cooked: false }
    ],
    binName: 'Bin-B12'
  }
];

export default function OperationsScreen() {
  const { width } = useWindowDimensions();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'PICKER' | 'RIDER' | 'CHEF' | 'CHEF_RESTAURANT' | 'ANALYTICS' | 'SETTINGS' | 'INVENTORY' | 'NOTIFICATIONS' | 'COUPONS' | 'ORDERS' | 'BANNERS' | 'USERS' | 'REVIEWS' | 'HIGHLIGHTS' | 'LIVEOPS' | 'CATEGORIES' | 'ALERTS' | 'INWARD' | 'BULK_UPDATE' | 'REPORTS' | 'FORECAST' | null>(null);
  const [activeHub, setActiveHub] = useState<'BI' | 'OPS' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitioning(false);
    });
    return () => task.cancel();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab && ['ANALYTICS', 'FORECAST', 'REPORTS'].includes(activeTab)) {
      setActiveHub('BI');
    } else if (activeTab && ['LIVEOPS', 'ORDERS', 'USERS', 'REVIEWS', 'PICKER', 'RIDER', 'CHEF', 'CHEF_RESTAURANT'].includes(activeTab)) {
      setActiveHub('OPS');
    }
  }, [activeTab]);

  const WorkspaceContainer = Platform.OS === 'web' ? View : ScrollView;

  const getAuthHeaders = (): Record<string, string> => {
    const { token } = useAuthStore.getState();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role;
      headers['x-user-email'] = user.email || '';
      headers['x-user-name'] = user.name || '';
      headers['x-user-phone'] = user.phone || '';
    }
    return headers;
  };

  const { activeAlertOrder, acknowledgeAlert, acceptOrder } = useNewOrderAlert(user?.role === 'ADMIN');

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [activeGpsSimulations, setActiveGpsSimulations] = useState<Record<string, { lat: number; lng: number; step: number; totalSteps: number }>>({});
  const [stockForecast, setStockForecast] = useState<any[]>([]);
  const [isInwardingForecast, setIsInwardingForecast] = useState<string | null>(null);

  const [liveopsOrders, setLiveopsOrders] = useState<any[]>([]);
  const [isLiveopsLoading, setIsLiveopsLoading] = useState<boolean>(false);
  const [activeCarts, setActiveCarts] = useState<any[]>([]);
  const [activeCartsCount, setActiveCartsCount] = useState<number>(0);
  const [isLoadingCarts, setIsLoadingCarts] = useState<boolean>(false);

  // --- Categories Tab States ---
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(false);
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState<string>('');
  const [newCategorySortOrder, setNewCategorySortOrder] = useState<string>('0');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // --- Café Sections Editor States ---
  const [categorySubView, setCategorySubView] = useState<'grocery' | 'cafe'>('grocery');
  const [cafeMenuSections, setCafeMenuSections] = useState<any[]>([]);
  const [isCafeSectionsLoading, setIsCafeSectionsLoading] = useState<boolean>(false);
  const [isSavingCafeSections, setIsSavingCafeSections] = useState<boolean>(false);

  // Café Section form states
  const [isAddingNewCafeSec, setIsAddingNewCafeSec] = useState<boolean>(false);
  const [editingCafeSecIndex, setEditingCafeSecIndex] = useState<number | null>(null);
  const [secTag, setSecTag] = useState<string>('');
  const [secTitle, setSecTitle] = useState<string>('');
  const [secEmoji, setSecEmoji] = useState<string>('');
  const [secDescription, setSecDescription] = useState<string>('');
  const [secMatchTags, setSecMatchTags] = useState<string>('');

  // --- Inventory Alerts Tab States ---
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsCounts, setAlertsCounts] = useState<any>({ outOfStock: 0, lowStock: 0, expiringSoon: 0, expired: 0, packingDelay: 0, total: 0 });
  const [isAlertsLoading, setIsAlertsLoading] = useState<boolean>(false);
  const [isAlertsRefreshing, setIsAlertsRefreshing] = useState<boolean>(false);
  const [activeAlertSubTab, setActiveAlertSubTab] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'PACKING_DELAY'>('ALL');
  const [alertRestockAmount, setAlertRestockAmount] = useState<Record<string, string>>({});
  const [submittingRestockId, setSubmittingRestockId] = useState<string | null>(null);
  const [submittingAlertAction, setSubmittingAlertAction] = useState<string | null>(null);

  // --- GRN Inwarding Tab States ---
  const [inwardSearchQuery, setInwardSearchQuery] = useState<string>('');
  const [inwardQuantity, setInwardQuantity] = useState<string>('50');
  const [inwardCostPrice, setInwardCostPrice] = useState<string>('');
  const [inwardExpiryDate, setInwardExpiryDate] = useState<string>('');
  const [inwardBatchCode, setInwardBatchCode] = useState<string>('');
  const [selectedInwardProduct, setSelectedInwardProduct] = useState<any | null>(null);
  const [isInwardSubmitting, setIsInwardSubmitting] = useState<boolean>(false);
  const [inwardProductsList, setInwardProductsList] = useState<any[]>([]);
  const [recentInwardLogs, setRecentInwardLogs] = useState<any[]>([]);

  // --- Bulk Update Tab States ---
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('ALL');
  const [bulkUpdateType, setBulkUpdateType] = useState<'PRICE' | 'STOCK' | 'AVAILABILITY' | 'MIN_STOCK'>('PRICE');
  const [bulkMode, setBulkMode] = useState<'FLAT_INCREASE' | 'FLAT_DECREASE' | 'PERCENT_INCREASE' | 'PERCENT_DECREASE' | 'SET_VALUE'>('FLAT_INCREASE');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkPreviews, setBulkPreviews] = useState<any[]>([]);
  const [isBulkPreviewing, setIsBulkPreviewing] = useState<boolean>(false);
  const [isBulkApplying, setIsBulkApplying] = useState<boolean>(false);
  const [bulkHistory, setBulkHistory] = useState<any[]>([]);
  const [isBulkHistoryLoading, setIsBulkHistoryLoading] = useState<boolean>(false);
  const [undoingBatchId, setUndoingBatchId] = useState<string | null>(null);

  // --- Sales Reports Tab States ---
  const [reportDateRange, setReportDateRange] = useState<'today' | '7days' | '30days' | 'custom'>('30days');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [reportSummary, setReportSummary] = useState<any>({ totalSales: 0, totalProfit: 0, totalCost: 0, totalOrders: 0, averageOrderValue: 0, profitMargin: 0 });
  const [reportDailySales, setReportDailySales] = useState<any[]>([]);
  const [reportCategorySales, setReportCategorySales] = useState<any[]>([]);
  const [reportTopProducts, setReportTopProducts] = useState<any[]>([]);
  const [reportSegment, setReportSegment] = useState<'all' | 'grocery' | 'cafe' | 'restaurant'>('all');

  // --- AI Forecasting Tab States ---
  const [forecastList, setForecastList] = useState<any[]>([]);
  const [forecastMetrics, setForecastMetrics] = useState<any>({ itemsAtRisk: 0, totalRevenueAtRisk: 0, averageVelocity: 0 });
  const [isForecastLoading, setIsForecastLoading] = useState<boolean>(false);
  const [isForecastRestocking, setIsForecastRestocking] = useState<boolean>(false);
  const [forecastSearchQuery, setForecastSearchQuery] = useState<string>('');
  const [forecastCategoryFilter, setForecastCategoryFilter] = useState<string>('ALL');

  // Keep simulation intervals stored in a ref to prevent multiple runs
  const simIntervalsRef = useRef<Record<string, any>>({});

  // Setup push registration effect
  useEffect(() => {
    const setupPush = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        try {
          const headers = getAuthHeaders();
          await fetch(`${API_BASE_URL}/push/subscribe`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              subscription: {
                endpoint: token,
                keys: {
                  p256dh: 'expo',
                  auth: 'expo'
                }
              }
            })
          });
          console.log('[Push Notification] Registered subscription on server.');
        } catch (err) {
          console.warn('[Push Notification] Failed to subscribe on server:', err);
        }
      }
    };
    if (user) {
      setupPush();
    }
  }, [user]);

  // Zustand local store sync
  const setLocalStoreStatus = useUIStore((s) => s.setStoreStatus);
  const localGroceryOpen = useUIStore((s) => s.groceryMartOpen);
  const localCafeOpen = useUIStore((s) => s.cafeOpen);
  const localRadius = useUIStore((s) => s.deliveryRadius);

  // Set console activeTab based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'CHEF') {
        setActiveTab('CHEF');
      } else if (user.role === 'DELIVERY') {
        setActiveTab('RIDER');
      } else if (user.role === 'PICKER') {
        setActiveTab('PICKER');
      } else if (user.role === 'ADMIN') {
        setActiveTab(null); // No tab selected initially, show Welcome Overview
      }
    }
  }, [user]);

  // Admin settings tab states
  const [groceryOpenState, setGroceryOpenState] = useState<boolean>(localGroceryOpen);
  const [cafeOpenState, setCafeOpenState] = useState<boolean>(localCafeOpen);
  const [radiusState, setRadiusState] = useState<string>(String(localRadius));
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'ops' | 'pricing' | 'cosmetics' | 'finance' | 'greetings'>('ops');

  // Extended settings state variables
  const [deliveryFeeState, setDeliveryFeeState] = useState<string>('25');
  const [groceryThresholdState, setGroceryThresholdState] = useState<string>('199');
  const [cafeThresholdState, setCafeThresholdState] = useState<string>('199');
  const [deliveriesCount, setDeliveriesCount] = useState<string>('10,000+');
  const [ratingValue, setRatingValue] = useState<string>('4.8');
  const [happyFamilies, setHappyFamilies] = useState<string>('5,000+');
  const [trustedText, setTrustedText] = useState<string>('✨ Trusted by 5,000+ families in your town');
  const [onlyCod, setOnlyCod] = useState<boolean>(false);
  const [storeLat, setStoreLat] = useState<string>('26.1534185');
  const [storeLng, setStoreLng] = useState<string>('80.1714024');
  const [avgDeliveryTime, setAvgDeliveryTime] = useState<string>('8 min');
  const [deliveredToday, setDeliveredToday] = useState<string>('1,231+');
  const [freshStockLoaded, setFreshStockLoaded] = useState<string>('2 hrs ago');
  const [taxRate, setTaxRate] = useState<string>('5');
  const [miscFee, setMiscFee] = useState<string>('0');
  const [miscFeeLabel, setMiscFeeLabel] = useState<string>('Miscellaneous Additions');
  const [contactPhone, setContactPhone] = useState<string>('+91 70544 70303');
  const [contactEmail, setContactEmail] = useState<string>('help@fastkirana.com');
  const [contactTimings, setContactTimings] = useState<string>('6 AM - 12 AM');
  const [contactAddress, setContactAddress] = useState<string>('NH34, Ghatampur, Kanpur Nagar');
  const [notifyPhone1, setNotifyPhone1] = useState<boolean>(true);
  const [notifyPhone2, setNotifyPhone2] = useState<boolean>(true);

  // Greetings states
  const [greetingsSubTab, setGreetingsSubTab] = useState<'closed' | 'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [heroGreetingClosed, setHeroGreetingClosed] = useState<string>("We're resting right now 💤");
  const [heroSubtitleClosed, setHeroSubtitleClosed] = useState<string>("FastKirana Cafe & Mart are resting. We will be back to serve you fresh & hot goodies soon!");
  const [heroGreetingMorning, setHeroGreetingMorning] = useState<string>("Good morning, let's get breakfast! 🌅");
  const [heroSubtitleMorningMartClosed, setHeroSubtitleMorningMartClosed] = useState<string>("Grocery Mart is resting, but our Cafe is firing up fresh hot brews and breakfast specials! ☕✨");
  const [heroSubtitleMorningCafeClosed, setHeroSubtitleMorningCafeClosed] = useState<string>("Cafe is taking a break, but Grocery Mart is wide open and delivering fresh milk & fruits! 🥛📦");
  const [heroSubtitleMorningBothOpen, setHeroSubtitleMorningBothOpen] = useState<string>("Fresh milk, fruits, hot brews, and breakfast essentials delivered in minutes.");
  const [heroGreetingAfternoon, setHeroGreetingAfternoon] = useState<string>("Good afternoon! Ready for lunch? 🍛");
  const [heroSubtitleAfternoonMartClosed, setHeroSubtitleAfternoonMartClosed] = useState<string>("Grocery Mart is resting, but our Cafe is cooking delicious hot lunch dishes and rolls! 🥡✨");
  const [heroSubtitleAfternoonCafeClosed, setHeroSubtitleAfternoonCafeClosed] = useState<string>("Cafe is taking a break, but Grocery Mart is delivering lunch staples, dal, and rice! 🌾📦");
  const [heroSubtitleAfternoonBothOpen, setHeroSubtitleAfternoonBothOpen] = useState<string>("Atta, rice, dal, fresh vegetables, and delicious hot rolls delivered fast.");
  const [heroGreetingEvening, setHeroGreetingEvening] = useState<string>("It's snack o'clock! Tea & snacks are ready ☕");
  const [heroSubtitleEveningMartClosed, setHeroSubtitleEveningMartClosed] = useState<string>("Grocery Mart is taking a break, but our Cafe is steaming hot chai & fresh samosas! ☕🥟");
  const [heroSubtitleEveningCafeClosed, setHeroSubtitleEveningCafeClosed] = useState<string>("Cafe is resting, but Grocery Mart is delivering chips, biscuits, and munchies! 🍿📦");
  const [heroSubtitleEveningBothOpen, setHeroSubtitleEveningBothOpen] = useState<string>("Samosas, munchies, chips, and chilled soft drinks ready for tea time.");
  const [heroGreetingNight, setHeroGreetingNight] = useState<string>("Late night cravings? We got you! 🌙");
  const [heroSubtitleNightMartClosed, setHeroSubtitleNightMartClosed] = useState<string>("Grocery Mart is closed. Cafe is open to deliver hot night snacks & dessert cravings! 🍧✨");
  const [heroSubtitleNightCafeClosed, setHeroSubtitleNightCafeClosed] = useState<string>("Cafe kitchen is resting, but Grocery Mart is active for ice cream, drinks & munchies! 🍦📦");
  const [heroSubtitleNightBothOpen, setHeroSubtitleNightBothOpen] = useState<string>("Indulge in ice creams, chocolates, late night munchies, and cafe specialties.");

  // Cloudinary settings
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string>('');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState<string>('');

  // Category-wise open statuses
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, boolean>>({});

  // New Operational Settings State variables
  const [minOrderValueState, setMinOrderValueState] = useState<string>('0');
  const [storeOpenHourState, setStoreOpenHourState] = useState<string>('7');
  const [storeCloseHourState, setStoreCloseHourState] = useState<string>('23');
  const [holidaysState, setHolidaysState] = useState<string>('');
  const [surgeMultiplierState, setSurgeMultiplierState] = useState<string>('1.0');


  // Admin push notifications tab states
  const [pushTitle, setPushTitle] = useState<string>('');
  const [pushBody, setPushBody] = useState<string>('');
  const [pushSegment, setPushSegment] = useState<'ALL' | 'NEW' | 'INACTIVE'>('ALL');
  const [pushScheduledTime, setPushScheduledTime] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [pastNotifications, setPastNotifications] = useState<any[]>([]);

  // Admin coupons tab states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState<boolean>(false);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState<boolean>(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponType, setNewCouponType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [newCouponValue, setNewCouponValue] = useState<string>('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<string>('');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<string>('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState<boolean>(false);

  // Admin analytics states
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);
  const [analyticsStats, setAnalyticsStats] = useState({
    todayRevenue: 0,
    todayTotalOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    lowStockCount: 0,
    userCount: 0,
    couponCount: 0,
    groceryRevenue: 0,
    restaurantRevenue: 0,
    cafeRevenue: 0,
    groceryTotalOrders: 0,
    restaurantTotalOrders: 0,
    cafeTotalOrders: 0,
    groceryActiveOrders: 0,
    restaurantActiveOrders: 0,
    cafeActiveOrders: 0,
    groceryDeliveredOrders: 0,
    restaurantDeliveredOrders: 0,
    cafeDeliveredOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]);
  const [categoryShareData, setCategoryShareData] = useState<any[]>([
    { label: 'Grocery', pct: 0, color: 'bg-indigo-600' },
    { label: 'Cafe', pct: 0, color: 'bg-rose-500' },
    { label: 'Dairy', pct: 0, color: 'bg-emerald-500' },
    { label: 'Beverages', pct: 0, color: 'bg-amber-500' },
  ]);



  // Launcher States
  const [isLauncherVisible, setIsLauncherVisible] = useState<boolean>(false);
  const [launcherSearchQuery, setLauncherSearchQuery] = useState<string>('');

  // Banner states (API-backed)
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalVisible, setIsBannerModalVisible] = useState<boolean>(false);
  const [isBannersLoading, setIsBannersLoading] = useState<boolean>(false);
  const [bannerSubmitting, setBannerSubmitting] = useState<boolean>(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState<string>('');
  const [bannerDescription, setBannerDescription] = useState<string>('');
  const [bannerCode, setBannerCode] = useState<string>('');
  const [bannerGradient, setBannerGradient] = useState<string>('from-rose-500 via-rose-500 to-orange-400');
  const [bannerType, setBannerType] = useState<string>('festival');
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState<string>('');
  const [bannerIsActive, setBannerIsActive] = useState<boolean>(true);
  const [bannerSortOrder, setBannerSortOrder] = useState<string>('0');
  const [bannerTemplateExpanded, setBannerTemplateExpanded] = useState<boolean>(false);



  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false);

  // Store Highlights tab states
  const [highlightMode, setHighlightMode] = useState<'PINNED' | 'SEARCH'>('PINNED');
  const [highlightType, setHighlightType] = useState<'flash' | 'toppicks' | 'bestsellers'>('flash');
  const [highlightSearchQuery, setHighlightSearchQuery] = useState<string>('');
  const [highlightSearchProducts, setHighlightSearchProducts] = useState<any[]>([]);
  const [flashDealsList, setFlashDealsList] = useState<any[]>([]);
  const [topPicksList, setTopPicksList] = useState<any[]>([]);
  const [bestSellersList, setBestSellersList] = useState<any[]>([]);
  const [isHighlightsLoading, setIsHighlightsLoading] = useState<boolean>(false);
  const [togglingHighlightId, setTogglingHighlightId] = useState<string | null>(null);

  // API Call Throttling Cooldowns Utility
  const lastFetchTime = useRef<Record<string, number>>({});
  const shouldFetch = (key: string, cooldownMs = 3000) => {
    const now = Date.now();
    const lastTime = lastFetchTime.current[key] || 0;
    if (now - lastTime < cooldownMs) {
      return false;
    }
    lastFetchTime.current[key] = now;
    return true;
  };

  // Load initial settings data on mount (lightweight settings required for switches)
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSettingsData();
    }
  }, [user]);

  // Trigger loading data depending on tab selections
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      if (activeTab === 'ANALYTICS') fetchAnalyticsData();
      if (activeTab === 'BANNERS') fetchBannersData();
      if (activeTab === 'COUPONS') fetchCouponsData();
      if (activeTab === 'NOTIFICATIONS') fetchNotificationsData();
      if (activeTab === 'REVIEWS') fetchReviewsData();
      if (activeTab === 'HIGHLIGHTS') fetchHighlightsData();
      if (activeTab === 'CATEGORIES') {
        fetchCategoriesData();
        fetchCafeSectionsData();
      }
      if (activeTab === 'ALERTS') fetchAlertsData();
      if (activeTab === 'BULK_UPDATE') fetchBulkUpdateData();
      if (activeTab === 'REPORTS') fetchReportsData();
      if (activeTab === 'FORECAST') fetchForecastData();
      if (activeTab === 'SETTINGS') {
        fetchSettingsData();
      }
    }
  }, [activeTab]);

  // Stream LiveOps data (orders + active carts) reactively
  useOrderStream({
    role: 'ADMIN',
    enabled: user?.role === 'ADMIN' && activeHub === 'OPS',
    onEvent: (event) => {
      // Refresh data on any incoming SSE event or poll fallback tick
      fetchLiveopsData();
      if (activeTab === 'ANALYTICS') {
        fetchAnalyticsData();
      }
    }
  });

  // --- API Integrations for Admin Workspace ---
  // --- Settings Management ---
  const fetchSettingsData = async (force = false) => {
    if (!force && !shouldFetch('settings')) return;
    setIsSettingsLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders()
      });
      let cats: any[] = [];
      if (catRes.ok) {
        cats = await catRes.json();
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
      }

      // 2. Fetch settings
      const res = await fetch(`${API_BASE_URL}/settings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.grocery_mart_open !== undefined) setGroceryOpenState(data.grocery_mart_open === 'true');
        if (data.cafe_open !== undefined) setCafeOpenState(data.cafe_open === 'true');
        if (data.delivery_radius !== undefined) setRadiusState(String(data.delivery_radius));
        if (data.deliveries_count) setDeliveriesCount(data.deliveries_count);
        if (data.rating_value) setRatingValue(data.rating_value);
        if (data.happy_families) setHappyFamilies(data.happy_families);
        if (data.trusted_text) setTrustedText(data.trusted_text);
        if (data.only_cod !== undefined) setOnlyCod(data.only_cod === 'true');
        if (data.store_lat) setStoreLat(data.store_lat);
        if (data.store_lng) setStoreLng(data.store_lng);
        if (data.avg_delivery_time) setAvgDeliveryTime(data.avg_delivery_time);
        if (data.delivered_today) setDeliveredToday(data.delivered_today);
        if (data.fresh_stock_loaded) setFreshStockLoaded(data.fresh_stock_loaded);
        if (data.tax_rate !== undefined) setTaxRate(data.tax_rate);
        if (data.misc_fee !== undefined) setMiscFee(data.misc_fee);
        if (data.misc_fee_label !== undefined) setMiscFeeLabel(data.misc_fee_label);
        if (data.contact_phone) setContactPhone(data.contact_phone);
        if (data.contact_email) setContactEmail(data.contact_email);
        if (data.contact_timings) setContactTimings(data.contact_timings);
        if (data.contact_address) setContactAddress(data.contact_address);
        if (data.cloudinary_cloud_name) setCloudinaryCloudName(data.cloudinary_cloud_name);
        if (data.cloudinary_upload_preset) setCloudinaryUploadPreset(data.cloudinary_upload_preset);
        
        // Dynamic Operational & Pricing Settings
        if (data.delivery_fee !== undefined) setDeliveryFeeState(String(data.delivery_fee));
        if (data.grocery_free_delivery_threshold !== undefined) setGroceryThresholdState(String(data.grocery_free_delivery_threshold));
        if (data.cafe_free_delivery_threshold !== undefined) setCafeThresholdState(String(data.cafe_free_delivery_threshold));
        if (data.min_order_value !== undefined) setMinOrderValueState(String(data.min_order_value));
        if (data.store_open_hour !== undefined) setStoreOpenHourState(String(data.store_open_hour));
        if (data.store_close_hour !== undefined) setStoreCloseHourState(String(data.store_close_hour));
        if (data.holidays !== undefined) setHolidaysState(data.holidays);
        if (data.surge_multiplier !== undefined) setSurgeMultiplierState(String(data.surge_multiplier));

        // Load greetings parameters
        if (data.hero_greeting_closed) setHeroGreetingClosed(data.hero_greeting_closed);
        if (data.hero_subtitle_closed) setHeroSubtitleClosed(data.hero_subtitle_closed);
        if (data.hero_greeting_morning) setHeroGreetingMorning(data.hero_greeting_morning);
        if (data.hero_subtitle_morning_mart_closed) setHeroSubtitleMorningMartClosed(data.hero_subtitle_morning_mart_closed);
        if (data.hero_subtitle_morning_cafe_closed) setHeroSubtitleMorningCafeClosed(data.hero_subtitle_morning_cafe_closed);
        if (data.hero_subtitle_morning_both_open) setHeroSubtitleMorningBothOpen(data.hero_subtitle_morning_both_open);
        if (data.hero_greeting_afternoon) setHeroGreetingAfternoon(data.hero_greeting_afternoon);
        if (data.hero_subtitle_afternoon_mart_closed) setHeroSubtitleAfternoonMartClosed(data.hero_subtitle_afternoon_mart_closed);
        if (data.hero_subtitle_afternoon_cafe_closed) setHeroSubtitleAfternoonCafeClosed(data.hero_subtitle_afternoon_cafe_closed);
        if (data.hero_subtitle_afternoon_both_open) setHeroSubtitleAfternoonBothOpen(data.hero_subtitle_afternoon_both_open);
        if (data.hero_greeting_evening) setHeroGreetingEvening(data.hero_greeting_evening);
        if (data.hero_subtitle_evening_mart_closed) setHeroSubtitleEveningMartClosed(data.hero_subtitle_evening_mart_closed);
        if (data.hero_subtitle_evening_cafe_closed) setHeroSubtitleEveningCafeClosed(data.hero_subtitle_evening_cafe_closed);
        if (data.hero_subtitle_evening_both_open) setHeroSubtitleEveningBothOpen(data.hero_subtitle_evening_both_open);
        if (data.hero_greeting_night) setHeroGreetingNight(data.hero_greeting_night);
        if (data.hero_subtitle_night_mart_closed) setHeroSubtitleNightMartClosed(data.hero_subtitle_night_mart_closed);
        if (data.hero_subtitle_night_cafe_closed) setHeroSubtitleNightCafeClosed(data.hero_subtitle_night_cafe_closed);
        if (data.hero_subtitle_night_both_open) setHeroSubtitleNightBothOpen(data.hero_subtitle_night_both_open);

        // Parse category statuses
        const catStatusMap: Record<string, boolean> = {};
        cats.forEach((cat: any) => {
          catStatusMap[cat.slug] = data[`category_open_${cat.slug}`] !== 'false';
        });
        setCategoryStatuses(catStatusMap);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const fetchLiveopsData = async (force = false) => {
    if (!force && !shouldFetch('liveops')) return;
    setIsLiveopsLoading(true);
    setIsLoadingCarts(true);
    try {
      const ordersPromise = fetch(`${API_BASE_URL}/orders?all=true`, {
        headers: getAuthHeaders()
      }).then(res => res.json());

      const cartsPromise = fetch(`${API_BASE_URL}/admin/live-carts`, {
        headers: getAuthHeaders()
      }).then(res => res.json());

      const [ordersData, cartsData] = await Promise.all([ordersPromise, cartsPromise]);

      if (Array.isArray(ordersData)) {
        setLiveopsOrders(ordersData);
      }
      if (cartsData && cartsData.success) {
        setActiveCarts(cartsData.carts || []);
        setActiveCartsCount(cartsData.count || 0);
      }
    } catch (err) {
      console.warn('Failed to load LiveOps data:', err);
    } finally {
      setIsLiveopsLoading(false);
      setIsLoadingCarts(false);
    }
  };

  // --- Abandoned Cart Recovery Modal States ---
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [selectedCartForAlert, setSelectedCartForAlert] = useState<any>(null);
  const [alertMessageText, setAlertMessageText] = useState<string>('');
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);

  const handleOpenAlertModal = (cart: any) => {
    setSelectedCartForAlert(cart);
    const defaultMsg = `Hey ${cart.userName}! Your items are waiting. Checkout now for instant delivery!`;
    setAlertMessageText(defaultMsg);
    setAlertModalVisible(true);
  };

  const handleSendPushNotification = async () => {
    if (!selectedCartForAlert) return;
    setIsSendingNotification(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/live-carts/notify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: selectedCartForAlert.userId,
          title: 'Cart Waiting 🛒',
          body: alertMessageText
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Push notification sent successfully!');
        setAlertModalVisible(false);
      } else {
        toast.error(data.error || 'Failed to send push notification');
      }
    } catch (err) {
      toast.error('Failed to send push notification');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedCartForAlert) return;
    triggerHaptic('medium');
    
    let cleanPhone = selectedCartForAlert.userPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    
    const itemsStr = selectedCartForAlert.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ');
    
    let msg = `*Hey ${selectedCartForAlert.userName}!* 🛒\n\n${alertMessageText}\n\n📦 *Items:* ${itemsStr}\n💰 Total: *${formatPrice(selectedCartForAlert.subtotal)}*`;
    
    if (selectedCartForAlert.address) {
      msg += `\n\n📍 *Delivery Address:* ${selectedCartForAlert.address}`;
    }
    if (selectedCartForAlert.lat && selectedCartForAlert.lng) {
      msg += `\n🗺️ *Google Maps:* https://www.google.com/maps/search/?api=1&query=${selectedCartForAlert.lat},${selectedCartForAlert.lng}`;
    }
    
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(fallbackUrl);
      }
      setAlertModalVisible(false);
    } catch (e) {
      console.warn('Failed to open WhatsApp:', e);
      Linking.openURL(fallbackUrl);
      setAlertModalVisible(false);
    }
  };

  // --- Categories Management ---
  const fetchCategoriesData = async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchCafeSectionsData = async () => {
    setIsCafeSectionsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cafe_menu_sections) {
          try {
            const parsed = JSON.parse(data.cafe_menu_sections);
            if (Array.isArray(parsed)) {
              setCafeMenuSections(parsed);
              return;
            }
          } catch (e) {
            console.error('Failed to parse cafe menu sections setting:', e);
          }
        }
      }
      setCafeMenuSections(DEFAULT_CAFE_MENU_SECTIONS);
    } catch (err) {
      console.warn('Failed to load cafe sections:', err);
    } finally {
      setIsCafeSectionsLoading(false);
    }
  };

  const handleSaveCafeSections = async (updatedSections: any[]) => {
    setIsSavingCafeSections(true);
    triggerHaptic('medium');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cafe_menu_sections: JSON.stringify(updatedSections)
        })
      });
      if (res.ok) {
        toast.success('Café menu sections saved successfully!');
        setCafeMenuSections(updatedSections);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      toast.error('Failed to save café menu sections on server.');
    } finally {
      setIsSavingCafeSections(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    setIsCreatingCategory(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCategoryName.trim(),
          imageUrl: newCategoryImageUrl.trim() || '📦',
          sortOrder: parseInt(newCategorySortOrder, 10) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Category created successfully!');
        setNewCategoryName('');
        setNewCategoryImageUrl('');
        setNewCategorySortOrder('0');
        setShowAddCategory(false);
        fetchCategoriesData();
      } else {
        toast.error(data.error || 'Failed to create category');
      }
    } catch (err) {
      toast.error('Network error during category creation');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingCategory.name,
          imageUrl: editingCategory.imageUrl,
          sortOrder: parseInt(editingCategory.sortOrder, 10) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Category updated successfully!');
        setEditingCategory(null);
        fetchCategoriesData();
      } else {
        toast.error(data.error || 'Failed to update category');
      }
    } catch (err) {
      toast.error('Network error updating category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? All associated products will lose their category association.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingCategoryId(id);
            triggerHaptic('medium');
            try {
              const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
              });
              if (res.ok) {
                toast.success('Category deleted!');
                fetchCategoriesData();
              } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete category');
              }
            } catch (err) {
              toast.error('Network error deleting category');
            } finally {
              setDeletingCategoryId(null);
            }
          }
        }
      ]
    );
  };

  // --- Inventory Alerts ---
  const fetchAlertsData = async (showToast = false) => {
    setIsAlertsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/alerts`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts || []);
        setAlertsCounts(data.counts || { outOfStock: 0, lowStock: 0, expiringSoon: 0, expired: 0, packingDelay: 0, total: 0 });
        if (showToast) toast.success('Alerts refreshed!');
      }
    } catch (err) {
      console.warn('Failed to load alerts:', err);
    } finally {
      setIsAlertsLoading(false);
    }
  };

  const handleRecalculateAlerts = async () => {
    setIsAlertsRefreshing(true);
    triggerHaptic('light');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/alerts`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchAlertsData(true);
      } else {
        toast.error('Alert recalculation failed');
      }
    } catch (err) {
      toast.error('Network error recalculating alerts');
    } finally {
      setIsAlertsRefreshing(false);
    }
  };

  const handleRestockAlert = async (productId: string, currentStock: number) => {
    const qtyStr = alertRestockAmount[productId];
    const amount = parseInt(qtyStr, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a quantity greater than 0');
      return;
    }
    setSubmittingRestockId(productId);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bulk-update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productIds: [productId],
          updateType: 'STOCK',
          mode: 'SET_VALUE',
          value: currentStock + amount
        })
      });
      if (res.ok) {
        toast.success('Stock updated successfully!');
        setAlertRestockAmount(prev => ({ ...prev, [productId]: '' }));
        fetchAlertsData();
      } else {
        toast.error('Restock failed');
      }
    } catch (err) {
      toast.error('Network error restocking');
    } finally {
      setSubmittingRestockId(null);
    }
  };

  const handleSnoozeAlert = async (targetId: string, alertType: string) => {
    const actionKey = `${targetId}:${alertType}`;
    setSubmittingAlertAction(actionKey);
    triggerHaptic('light');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/alerts`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetId, alertType })
      });
      if (res.ok) {
        toast.success('Alert snoozed for 30 mins');
        fetchAlertsData();
      } else {
        toast.error('Failed to snooze alert');
      }
    } catch (err) {
      toast.error('Network error snoozing alert');
    } finally {
      setSubmittingAlertAction(null);
    }
  };

  // --- GRN Inwarding ---
  const handleInwardProductSearch = async (query: string) => {
    setInwardSearchQuery(query);
    if (!query.trim()) {
      setInwardProductsList([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}&limit=5`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.products) {
        // Filter out cafe products
        setInwardProductsList(data.products.filter((p: any) => p.category?.slug !== 'cafe'));
      }
    } catch (err) {
      console.warn('Failed to search inward products:', err);
    }
  };

  const handleSelectInwardProduct = (prod: any) => {
    setSelectedInwardProduct(prod);
    setInwardProductsList([]);
    setInwardSearchQuery('');
    setInwardCostPrice(String(prod.costPrice > 0 ? prod.costPrice : Math.round(prod.price * 0.75)));
    
    // Generate batch code B_YYYYMMDD_[4 alphanumeric]
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    setInwardBatchCode(`B_${today}_${rand}`);

    // Set expiry preset (default to +6 months)
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 6);
    setInwardExpiryDate(expiry.toISOString().split('T')[0]);
  };

  const handleSubmitInward = async () => {
    if (!selectedInwardProduct) return;
    if (!inwardQuantity || !inwardCostPrice || !inwardExpiryDate || !inwardBatchCode.trim()) {
      toast.error('Please complete all form fields');
      return;
    }
    setIsInwardSubmitting(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: selectedInwardProduct.id,
          batchCode: inwardBatchCode.trim(),
          quantity: parseInt(inwardQuantity, 10),
          costPrice: parseFloat(inwardCostPrice),
          expiryDate: new Date(inwardExpiryDate).toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('GRN Batch inwarded successfully!');
        setRecentInwardLogs(prev => [
          {
            id: Math.random().toString(),
            productName: selectedInwardProduct.name,
            batchCode: inwardBatchCode.trim(),
            quantity: parseInt(inwardQuantity, 10),
            costPrice: parseFloat(inwardCostPrice),
            expiryDate: inwardExpiryDate,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
        setSelectedInwardProduct(null);
      } else {
        toast.error(data.error || 'Failed to register inward batch');
      }
    } catch (err) {
      toast.error('Network error registering inward batch');
    } finally {
      setIsInwardSubmitting(false);
    }
  };

  // --- Bulk Update ---
  const fetchBulkUpdateData = async () => {
    setIsBulkHistoryLoading(true);
    try {
      // Load categories
      const catRes = await fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders() });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      // Load batch history
      const histRes = await fetch(`${API_BASE_URL}/admin/bulk-update`, { headers: getAuthHeaders() });
      if (histRes.ok) {
        const histData = await histRes.json();
        setBulkHistory(histData.batches || []);
      }
    } catch (err) {
      console.warn('Failed to load bulk update details:', err);
    } finally {
      setIsBulkHistoryLoading(false);
    }
  };

  const handleBulkPreview = async () => {
    const val = parseFloat(bulkValue);
    if (isNaN(val) && bulkUpdateType !== 'AVAILABILITY') {
      toast.error('Please enter a valid numeric value');
      return;
    }
    setIsBulkPreviewing(true);
    triggerHaptic('light');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bulk-update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          categoryId: bulkCategoryId === 'ALL' ? undefined : bulkCategoryId,
          updateType: bulkUpdateType,
          mode: bulkMode,
          value: bulkUpdateType === 'AVAILABILITY' ? parseInt(bulkValue, 10) : val,
          preview: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBulkPreviews(data.changes || []);
        toast.success(`Calculated preview for ${data.updated} products`);
      } else {
        toast.error(data.error || 'Failed to calculate bulk update preview');
      }
    } catch (err) {
      toast.error('Network error during bulk preview computation');
    } finally {
      setIsBulkPreviewing(false);
    }
  };

  const handleBulkApply = async () => {
    if (bulkPreviews.length === 0) return;
    const val = parseFloat(bulkValue);
    setIsBulkApplying(true);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bulk-update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          categoryId: bulkCategoryId === 'ALL' ? undefined : bulkCategoryId,
          updateType: bulkUpdateType,
          mode: bulkMode,
          value: bulkUpdateType === 'AVAILABILITY' ? parseInt(bulkValue, 10) : val,
          preview: false
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Updated ${data.updated} products!`);
        setBulkPreviews([]);
        setBulkValue('');
        fetchBulkUpdateData();
      } else {
        toast.error(data.error || 'Bulk update execution failed');
      }
    } catch (err) {
      toast.error('Network error during bulk update execution');
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkUndo = async (batchId: string) => {
    setUndoingBatchId(batchId);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bulk-update`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ batchId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Reverted changes for ${data.reverted} products!`);
        fetchBulkUpdateData();
      } else {
        toast.error(data.error || 'Undo execution failed');
      }
    } catch (err) {
      toast.error('Network error reverting bulk update batch');
    } finally {
      setUndoingBatchId(null);
    }
  };

  // --- Reports ---
  const fetchReportsData = async () => {
    // Set default dates if empty
    let startStr = reportStartDate;
    let endStr = reportEndDate;
    if (!startStr || !endStr) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      startStr = start.toISOString().split('T')[0];
      endStr = end.toISOString().split('T')[0];
      setReportStartDate(startStr);
      setReportEndDate(endStr);
    }
    
    if (reportDateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      startStr = today;
      endStr = today;
    } else if (reportDateRange === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startStr = d.toISOString().split('T')[0];
      endStr = new Date().toISOString().split('T')[0];
    } else if (reportDateRange === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
      endStr = new Date().toISOString().split('T')[0];
    }

    setIsReportLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reports?startDate=${startStr}&endDate=${endStr}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setReportSummary(data.summary || { totalSales: 0, totalProfit: 0, totalCost: 0, totalOrders: 0, averageOrderValue: 0, profitMargin: 0 });
        setReportDailySales(data.dailySales || []);
        setReportCategorySales(data.categorySales || []);
        setReportTopProducts(data.topProducts || []);
      }
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Reports CSV Sharing
  const handleReportsCSVShare = () => {
    triggerHaptic('light');
    if (reportTopProducts.length === 0) {
      Alert.alert('No Data', 'No sales metrics found to export.');
      return;
    }
    let csv = 'REPORT SUMMARY\n';
    csv += `Total Sales,${reportSummary.totalSales}\n`;
    csv += `Total Cost Basis,${reportSummary.totalCost}\n`;
    csv += `Total Profit,${reportSummary.totalProfit}\n`;
    csv += `Profit Margin (%),${reportSummary.profitMargin}%\n`;
    csv += `Total Orders,${reportSummary.totalOrders}\n`;
    csv += `Average Order Value,${reportSummary.averageOrderValue}\n\n`;

    csv += 'TOP SELLING PRODUCTS\nProduct Name,Quantity Sold,Sales Revenue (INR),Profit Generated (INR)\n';
    reportTopProducts.forEach(row => {
      csv += `"${row.name}",${row.quantity},${row.sales},${row.profit}\n`;
    });
    
    Alert.alert(
      'Sales Report Exported! 📁',
      `Exported top selling items & metrics summary.\n\nFirst few rows:\n${csv.split('\n').slice(0, 5).join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  // --- AI Forecasting ---
  const fetchForecastData = async (showToast = false) => {
    setIsForecastLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders() });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      // Fetch AI forecast
      const res = await fetch(`${API_BASE_URL}/admin/forecast`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setForecastList(data.forecast || []);
        setForecastMetrics(data.metrics || { itemsAtRisk: 0, totalRevenueAtRisk: 0, averageVelocity: 0 });
        if (showToast) toast.success('Forecast computed!');
      }
    } catch (err) {
      console.warn('Failed to fetch forecasting:', err);
    } finally {
      setIsForecastLoading(false);
    }
  };

  const handleAutoReplenish = async () => {
    triggerHaptic('medium');
    const atRiskItems = forecastList.filter(f => f.isAtRisk && f.recommendedReorder > 0);
    if (atRiskItems.length === 0) {
      Alert.alert('AI forecast', 'No items require replenishment at this time.');
      return;
    }
    setIsForecastRestocking(true);
    try {
      let completedCount = 0;
      let totalStockAdded = 0;
      for (const item of atRiskItems) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        const batchCode = `AUTO_AI_${today}_${rand}`;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        const res = await fetch(`${API_BASE_URL}/admin/inward`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            productId: item.id,
            batchCode,
            quantity: item.recommendedReorder,
            costPrice: item.costPrice,
            expiryDate: expiryDate.toISOString()
          })
        });
        if (res.ok) {
          completedCount++;
          totalStockAdded += item.recommendedReorder;
        }
      }
      toast.success(`Auto-restocked ${completedCount} items (${totalStockAdded} units)!`);
      fetchForecastData();
    } catch (err) {
      toast.error('AI Auto-restock failed');
    } finally {
      setIsForecastRestocking(false);
    }
  };

  const handleIndividualRestock = async (productId: string, reorderQty: number, costPrice: number) => {
    triggerHaptic('medium');
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      const batchCode = `AI_REORDER_${today}_${rand}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      const res = await fetch(`${API_BASE_URL}/admin/inward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId,
          batchCode,
          quantity: reorderQty,
          costPrice,
          expiryDate: expiryDate.toISOString()
        })
      });
      if (res.ok) {
        toast.success('Restock batch inwarded!');
        fetchForecastData();
      } else {
        toast.error('Restock failed');
      }
    } catch (err) {
      toast.error('Restock failed due to network error');
    }
  };

  const handleAppRestock = async (product: any) => {
    setIsInwardingForecast(product.id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/inward`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: product.id,
          batchCode: `AUTO_RN_${Date.now().toString().slice(-6)}`,
          quantity: product.suggestedRestock,
          costPrice: product.costPrice,
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success(`Restocked ${product.name}!`);
        fetchAnalyticsData();
      } else {
        toast.error('Failed to restock');
      }
    } catch (e) {
      toast.error('Restock network error');
    } finally {
      setIsInwardingForecast(null);
    }
  };

  const fetchAnalyticsData = async (force = false) => {
    if (!force && !shouldFetch('analytics')) return;
    setIsAnalyticsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/orders?all=true`, { headers });
      
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized');
      }

      const ordersList = await res.json();
      
      const prodRes = await fetch(`${API_BASE_URL}/products?limit=150`);
      const prodsList = await prodRes.json();
      const productsArray = Array.isArray(prodsList) ? prodsList : (prodsList.products || []);
      
      let revenue = 0;
      let deliveredCount = 0;
      let activeCount = 0;
      
      const weeklyRevenue: { [key: string]: number } = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Calculate start and end of the current week (Monday 00:00 to Sunday 23:59)
      const now = new Date();
      const currentDay = now.getDay();
      const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diffToMonday));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const categoryCounts: { [key: string]: number } = { 'grocery': 0, 'cafe': 0, 'dairy': 0, 'beverages': 0 };
      let totalItemsCount = 0;

      let groceryRevenue = 0;
      let restaurantRevenue = 0;
      let cafeRevenue = 0;
      let groceryTotalOrders = 0;
      let restaurantTotalOrders = 0;
      let cafeTotalOrders = 0;
      let groceryActiveOrders = 0;
      let restaurantActiveOrders = 0;
      let cafeActiveOrders = 0;
      let groceryDeliveredOrders = 0;
      let restaurantDeliveredOrders = 0;
      let cafeDeliveredOrders = 0;

      let todayRevenue = 0;
      let todayTotalOrders = 0;
      const todayDateStr = new Date().toDateString();

      if (Array.isArray(ordersList)) {
        ordersList.forEach((o) => {
          const oDateStr = o.createdAt ? new Date(o.createdAt).toDateString() : '';
          if (oDateStr === todayDateStr) {
            todayTotalOrders++;
            if (o.status === 'DELIVERED') {
              todayRevenue += (o.total || 0);
            }
          }
          const isCafe = o.shopName === 'FastKirana Cafe Kitchen';
          const isRestaurant = o.shopName === 'FastKirana Restaurant Kitchen';

          if (isCafe) {
            cafeTotalOrders++;
            if (o.status === 'DELIVERED') {
              cafeRevenue += o.total;
              cafeDeliveredOrders++;
            } else if (o.status !== 'CANCELLED') {
              cafeActiveOrders++;
            }
          } else if (isRestaurant) {
            restaurantTotalOrders++;
            if (o.status === 'DELIVERED') {
              restaurantRevenue += o.total;
              restaurantDeliveredOrders++;
            } else if (o.status !== 'CANCELLED') {
              restaurantActiveOrders++;
            }
          } else {
            groceryTotalOrders++;
            if (o.status === 'DELIVERED') {
              groceryRevenue += o.total;
              groceryDeliveredOrders++;
            } else if (o.status !== 'CANCELLED') {
              groceryActiveOrders++;
            }
          }

          if (o.status === 'DELIVERED') {
            revenue += o.total;
            deliveredCount++;
            
            const orderDate = new Date(o.createdAt);
            // Only add to the weekly chart if the order was placed in the current week
            if (orderDate >= startOfWeek && orderDate <= endOfWeek) {
              const dayName = daysMap[orderDate.getDay()];
              if (dayName in weeklyRevenue) {
                weeklyRevenue[dayName] += o.total;
              }
            }
          } else if (o.status !== 'CANCELLED') {
            activeCount++;
          }

          if (Array.isArray(o.items)) {
            o.items.forEach((it: any) => {
              const slug = (it.categorySlug || 'grocery').toLowerCase();
              const qty = it.quantity || 1;
              if (slug.includes('cafe')) {
                categoryCounts['cafe'] += qty;
              } else if (slug.includes('dairy') || slug.includes('milk')) {
                categoryCounts['dairy'] += qty;
              } else if (slug.includes('beverage') || slug.includes('drink')) {
                categoryCounts['beverages'] += qty;
              } else {
                categoryCounts['grocery'] += qty;
              }
              totalItemsCount += qty;
            });
          }
        });
        setRecentOrders(ordersList.slice(0, 10));
      }

      const formattedWeeklySales = [
        { day: 'Mon', value: weeklyRevenue['Mon'] },
        { day: 'Tue', value: weeklyRevenue['Tue'] },
        { day: 'Wed', value: weeklyRevenue['Wed'] },
        { day: 'Thu', value: weeklyRevenue['Thu'] },
        { day: 'Fri', value: weeklyRevenue['Fri'] },
        { day: 'Sat', value: weeklyRevenue['Sat'] },
        { day: 'Sun', value: weeklyRevenue['Sun'] },
      ];
      setWeeklySalesData(formattedWeeklySales);

      const formattedCategoryShare = [
        { label: 'Grocery', pct: totalItemsCount > 0 ? (categoryCounts['grocery'] / totalItemsCount) * 100 : 0, color: 'bg-indigo-600' },
        { label: 'Cafe', pct: totalItemsCount > 0 ? (categoryCounts['cafe'] / totalItemsCount) * 100 : 0, color: 'bg-rose-500' },
        { label: 'Dairy', pct: totalItemsCount > 0 ? (categoryCounts['dairy'] / totalItemsCount) * 100 : 0, color: 'bg-emerald-500' },
        { label: 'Beverages', pct: totalItemsCount > 0 ? (categoryCounts['beverages'] / totalItemsCount) * 100 : 0, color: 'bg-amber-500' },
      ];
      const sum = formattedCategoryShare.reduce((acc, c) => acc + c.pct, 0);
      if (sum > 0) {
        formattedCategoryShare.forEach(c => {
          c.pct = (c.pct / sum) * 100;
        });
      } else {
        formattedCategoryShare[0].pct = 100;
      }
      setCategoryShareData(formattedCategoryShare);

      const lowStock = productsArray.filter((p: any) => p.stock < 15 && p.isAvailable).length;

      const coupRes = await fetch(`${API_BASE_URL}/admin/coupons`, { headers });
      const couponsList = await coupRes.json();
      const couponCount = Array.isArray(couponsList) ? couponsList.filter(c => c.isActive).length : 0;

      let fetchedUserCount = 48;
      try {
        const usersRes = await fetch(`${API_BASE_URL}/admin/users?limit=1`, { headers });
        const usersData = await usersRes.json();
        if (usersData && typeof usersData.total === 'number') {
          fetchedUserCount = usersData.total;
        }
      } catch (e) {
        console.warn('Failed to fetch users count:', e);
      }

      setAnalyticsStats({
        todayRevenue,
        todayTotalOrders,
        totalRevenue: revenue,
        totalOrders: Array.isArray(ordersList) ? ordersList.length : 0,
        activeOrders: activeCount,
        deliveredOrders: deliveredCount,
        lowStockCount: lowStock,
        userCount: fetchedUserCount,
        couponCount: couponCount || 4,
        groceryRevenue,
        restaurantRevenue,
        cafeRevenue,
        groceryTotalOrders,
        restaurantTotalOrders,
        cafeTotalOrders,
        groceryActiveOrders,
        restaurantActiveOrders,
        cafeActiveOrders,
        groceryDeliveredOrders,
        restaurantDeliveredOrders,
        cafeDeliveredOrders,
      });

      try {
        const forecastRes = await fetch(`${API_BASE_URL}/admin/inventory/forecast`, { headers });
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          setStockForecast(forecastData.forecast || []);
        }
      } catch (e) {
        console.warn('Failed to fetch stock forecast inside app analytics:', e);
      }

    } catch (err) {
      console.warn('Failed to fetch analytics, falling back to mock data:', err);
      let revenue = 0;
      const weeklyRevenue: { [key: string]: number } = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const categoryCounts: { [key: string]: number } = { 'grocery': 0, 'cafe': 0, 'dairy': 0, 'beverages': 0 };
      let totalItemsCount = 0;

      let groceryRevenue = 0;
      let restaurantRevenue = 0;
      let cafeRevenue = 0;
      let groceryTotalOrders = 0;
      let restaurantTotalOrders = 0;
      let cafeTotalOrders = 0;
      let groceryActiveOrders = 0;
      let restaurantActiveOrders = 0;
      let cafeActiveOrders = 0;
      let groceryDeliveredOrders = 0;
      let restaurantDeliveredOrders = 0;
      let cafeDeliveredOrders = 0;

      mockOrdersList.forEach((o) => {
        const isCafe = o.shopName === 'FastKirana Cafe Kitchen';
        const isRestaurant = o.shopName === 'FastKirana Restaurant Kitchen';

        if (isCafe) {
          cafeTotalOrders++;
          if (o.status === 'DELIVERED') {
            cafeRevenue += o.total;
            cafeDeliveredOrders++;
          } else if (o.status !== 'CANCELLED') {
            cafeActiveOrders++;
          }
        } else if (isRestaurant) {
          restaurantTotalOrders++;
          if (o.status === 'DELIVERED') {
            restaurantRevenue += o.total;
            restaurantDeliveredOrders++;
          } else if (o.status !== 'CANCELLED') {
            restaurantActiveOrders++;
          }
        } else {
          groceryTotalOrders++;
          if (o.status === 'DELIVERED') {
            groceryRevenue += o.total;
            groceryDeliveredOrders++;
          } else if (o.status !== 'CANCELLED') {
            groceryActiveOrders++;
          }
        }

        if (o.status === 'DELIVERED') {
          revenue += o.total;
          const orderDate = new Date(o.createdAt);
          const dayName = daysMap[orderDate.getDay()];
          if (dayName in weeklyRevenue) {
            weeklyRevenue[dayName] += o.total;
          }
        }
        if (Array.isArray(o.items)) {
          o.items.forEach((it: any) => {
            const slug = (it.categorySlug || 'grocery').toLowerCase();
            const qty = it.quantity || 1;
            if (slug.includes('cafe')) {
              categoryCounts['cafe'] += qty;
            } else if (slug.includes('dairy') || slug.includes('milk')) {
              categoryCounts['dairy'] += qty;
            } else if (slug.includes('beverage') || slug.includes('drink')) {
              categoryCounts['beverages'] += qty;
            } else {
              categoryCounts['grocery'] += qty;
            }
            totalItemsCount += qty;
          });
        }
      });

      setRecentOrders(mockOrdersList.slice(0, 10));

      const formattedWeeklySales = [
        { day: 'Mon', value: weeklyRevenue['Mon'] },
        { day: 'Tue', value: weeklyRevenue['Tue'] },
        { day: 'Wed', value: weeklyRevenue['Wed'] },
        { day: 'Thu', value: weeklyRevenue['Thu'] },
        { day: 'Fri', value: weeklyRevenue['Fri'] },
        { day: 'Sat', value: weeklyRevenue['Sat'] },
        { day: 'Sun', value: weeklyRevenue['Sun'] },
      ];
      setWeeklySalesData(formattedWeeklySales);

      const formattedCategoryShare = [
        { label: 'Grocery', pct: totalItemsCount > 0 ? (categoryCounts['grocery'] / totalItemsCount) * 100 : 0, color: 'bg-indigo-600' },
        { label: 'Cafe', pct: totalItemsCount > 0 ? (categoryCounts['cafe'] / totalItemsCount) * 100 : 0, color: 'bg-rose-500' },
        { label: 'Dairy', pct: totalItemsCount > 0 ? (categoryCounts['dairy'] / totalItemsCount) * 100 : 0, color: 'bg-emerald-500' },
        { label: 'Beverages', pct: totalItemsCount > 0 ? (categoryCounts['beverages'] / totalItemsCount) * 100 : 0, color: 'bg-amber-500' },
      ];
      const sum = formattedCategoryShare.reduce((acc, c) => acc + c.pct, 0);
      if (sum > 0) {
        formattedCategoryShare.forEach(c => {
          c.pct = (c.pct / sum) * 100;
        });
      } else {
        formattedCategoryShare[0].pct = 100;
      }
      setCategoryShareData(formattedCategoryShare);

      setAnalyticsStats({
        todayRevenue: 0,
        todayTotalOrders: 0,
        totalRevenue: revenue,
        totalOrders: mockOrdersList.length,
        activeOrders: mockOrdersList.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length,
        deliveredOrders: mockOrdersList.filter(o => o.status === 'DELIVERED').length,
        lowStockCount: 4,
        userCount: 52,
        couponCount: 6,
        groceryRevenue,
        restaurantRevenue,
        cafeRevenue,
        groceryTotalOrders,
        restaurantTotalOrders,
        cafeTotalOrders,
        groceryActiveOrders,
        restaurantActiveOrders,
        cafeActiveOrders,
        groceryDeliveredOrders,
        restaurantDeliveredOrders,
        cafeDeliveredOrders,
      });
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // =================== BANNERS API HANDLERS ===================
  const BANNER_FESTIVAL_TEMPLATES = [
    { name: '📦 Fast Delivery', title: 'Fast Delivery in Ghatampur', description: 'Milk, Fruits, Vegetables, Snacks & more', code: '', gradient: 'from-rose-500 via-rose-500 to-orange-400', type: 'express-delivery', linkUrl: '/category/fruits-vegetables' },
    { name: '🥬 Farm Fresh', title: 'Farm Fresh Vegetables & Fruits', description: 'Directly sourced from local farms. Handpicked for premium quality.', code: 'SAVE20', gradient: 'from-emerald-600 via-emerald-500 to-teal-400', type: 'fresh', linkUrl: '/category/fruits-vegetables' },
    { name: '🥛 Super Savings', title: 'Super Savings on First Order!', description: 'Get flat 50% off up to ₹100 on fruits, veggies, dairy, and snacks.', code: 'WELCOME50', gradient: 'from-rose-600 via-rose-500 to-orange-400', type: 'first-order', linkUrl: '/category/fruits-vegetables' },
    { name: '🪔 Diwali Special', title: 'Shubh Deepavali Festive Offer!', description: 'Celebrate with sweets, dry fruits & diyas. Flat ₹150 off!', code: 'DIWALI150', gradient: 'from-amber-600 via-orange-500 to-yellow-500', type: 'festival' },
    { name: '🎨 Holi Splash', title: 'Holi Ke Rang, FastKirana Ke Sang!', description: 'Get herbal gulal, sweets, thandai delivered in 10 minutes!', code: 'HOLI100', gradient: 'from-pink-500 via-purple-500 to-yellow-400', type: 'festival' },
    { name: '🌙 Eid Mubarak', title: 'Eid Mubarak Festive Delights!', description: 'Save 20% on dates, sheer khurma, milk & dry fruits.', code: 'EIDSPECIAL', gradient: 'from-emerald-600 via-teal-500 to-cyan-500', type: 'festival' },
    { name: '🎉 New Year 2027', title: 'Happy New Year 2027!', description: 'Sodas, chips, chocolates & snacks. Flat ₹200 off!', code: 'NY2027', gradient: 'from-violet-600 via-fuchsia-600 to-pink-500', type: 'festival' },
  ];

  const BANNER_GRADIENT_PRESETS = [
    { name: 'Diwali Gold', value: 'from-amber-600 via-orange-500 to-yellow-500' },
    { name: 'Holi Colors', value: 'from-pink-500 via-purple-500 to-yellow-400' },
    { name: 'Eid Emerald', value: 'from-emerald-600 via-teal-500 to-cyan-500' },
    { name: 'New Year Purple', value: 'from-violet-600 via-fuchsia-600 to-pink-500' },
    { name: 'Store Red', value: 'from-rose-500 via-rose-500 to-orange-400' },
    { name: 'Fresh Green', value: 'from-emerald-500 via-emerald-500 to-teal-400' },
    { name: 'Night Neon', value: 'from-indigo-900 via-purple-800 to-blue-600' },
    { name: 'Midnight Snacks', value: 'from-orange-600 via-orange-500 to-amber-400' },
  ];

  const fetchBannersData = async () => {
    setIsBannersLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/banners`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load banners');
      }
    } catch (err) {
      console.warn('Failed to fetch banners:', err);
    } finally {
      setIsBannersLoading(false);
    }
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerDescription('');
    setBannerCode('');
    setBannerGradient('from-rose-500 via-rose-500 to-orange-400');
    setBannerType('festival');
    setBannerImageUrl('');
    setBannerLinkUrl('');
    setBannerIsActive(true);
    setBannerSortOrder('0');
  };

  const handleBannerApplyTemplate = (tpl: any) => {
    setBannerTitle(tpl.title);
    setBannerDescription(tpl.description);
    setBannerCode(tpl.code || '');
    setBannerGradient(tpl.gradient);
    setBannerType(tpl.type);
    setBannerImageUrl('');
    setBannerLinkUrl(tpl.linkUrl || '');
    triggerHaptic('light');
    toast.success(`${tpl.name} template applied!`);
  };

  const handleBannerSubmit = async () => {
    if (!bannerTitle.trim() || !bannerDescription.trim()) {
      toast.error('Please fill in title and description');
      return;
    }
    setBannerSubmitting(true);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const payload = {
        id: editingBannerId || undefined,
        title: bannerTitle.trim(),
        description: bannerDescription.trim(),
        code: bannerCode.trim().toUpperCase(),
        gradient: bannerGradient,
        type: bannerType,
        imageUrl: bannerImageUrl.trim() || null,
        linkUrl: bannerLinkUrl.trim() || null,
        isActive: bannerIsActive,
        sortOrder: parseInt(bannerSortOrder, 10) || 0,
      };
      const method = editingBannerId ? 'PUT' : 'POST';
      const res = await fetch(`${API_BASE_URL}/admin/banners`, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save banner');
      }
      toast.success(editingBannerId ? 'Banner updated!' : 'Banner created!');
      triggerHaptic('success');
      resetBannerForm();
      setIsBannerModalVisible(false);
      fetchBannersData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving banner');
    } finally {
      setBannerSubmitting(false);
    }
  };

  const handleBannerToggleActive = async (b: any) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'PUT', headers, body: JSON.stringify({ id: b.id, isActive: !b.isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      triggerHaptic('light');
      toast.success(`Banner ${!b.isActive ? 'activated' : 'deactivated'}!`);
      fetchBannersData();
    } catch (err: any) {
      toast.error(err.message || 'Error toggling banner');
    }
  };

  const handleBannerReorder = async (b: any, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'PUT', headers, body: JSON.stringify({ id: b.id, sortOrder: (b.sortOrder || 0) + delta }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      triggerHaptic('light');
      fetchBannersData();
    } catch (err: any) {
      toast.error(err.message || 'Error reordering');
    }
  };

  const handleBannerDelete = async (id: string) => {
    const doDelete = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/banners?id=${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete banner');
        triggerHaptic('medium');
        toast.success('Banner deleted!');
        fetchBannersData();
      } catch (err: any) {
        toast.error(err.message || 'Error deleting banner');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this promo banner?')) doDelete();
    } else {
      Alert.alert('Delete Banner', 'Are you sure you want to delete this promo banner?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleBannerEdit = (b: any) => {
    setEditingBannerId(b.id);
    setBannerTitle(b.title || '');
    setBannerDescription(b.description || '');
    setBannerCode(b.code || '');
    setBannerGradient(b.gradient || 'from-rose-500 via-rose-500 to-orange-400');
    setBannerType(b.type || 'festival');
    setBannerImageUrl(b.imageUrl || '');
    setBannerLinkUrl(b.linkUrl || '');
    setBannerIsActive(b.isActive ?? true);
    setBannerSortOrder(String(b.sortOrder || 0));
    setIsBannerModalVisible(true);
    triggerHaptic('light');
  };

  const fetchCouponsData = async () => {
    setIsCouponsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/coupons`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch (err) {
      console.warn('Failed to fetch coupons:', err);
    } finally {
      setIsCouponsLoading(false);
    }
  };

  const fetchNotificationsData = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/push-notifications`, { headers });
      const data = await res.json();
      if (data && Array.isArray(data.notifications)) {
        setPastNotifications(data.notifications);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications logs:', err);
    }
  };



  const fetchReviewsData = async () => {
    setIsReviewsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/reviews`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviewsList(data);
      }
    } catch (err) {
      console.warn('Failed to fetch admin reviews:', err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const fetchHighlightsData = async () => {
    setIsHighlightsLoading(true);
    try {
      const headers = getAuthHeaders();
      const [flashRes, topRes, bestRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/products?flashDeals=true&limit=100`, { headers }),
        fetch(`${API_BASE_URL}/admin/products?topPicks=true&limit=100`, { headers }),
        fetch(`${API_BASE_URL}/admin/products?bestSellers=true&limit=100`, { headers }),
      ]);
      
      const flashData = await flashRes.json();
      const topData = await topRes.json();
      const bestData = await bestRes.json();
      
      if (flashData && Array.isArray(flashData.products)) {
        setFlashDealsList(flashData.products);
      }
      if (topData && Array.isArray(topData.products)) {
        setTopPicksList(topData.products);
      }
      if (bestData && Array.isArray(bestData.products)) {
        setBestSellersList(bestData.products);
      }
    } catch (err) {
      console.warn('Failed to fetch highlights:', err);
    } finally {
      setIsHighlightsLoading(false);
    }
  };

  const handleHighlightsSearch = async () => {
    if (!highlightSearchQuery.trim()) return;
    setIsHighlightsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/products?search=${encodeURIComponent(highlightSearchQuery.trim())}&limit=50`, { headers });
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setHighlightSearchProducts(data.products);
      } else {
        setHighlightSearchProducts([]);
      }
    } catch (err) {
      console.warn('Error searching products for highlights:', err);
      toast.error('Search failed');
    } finally {
      setIsHighlightsLoading(false);
    }
  };

  const toggleProductHighlight = async (product: any, type: 'flash' | 'toppicks' | 'bestsellers') => {
    setTogglingHighlightId(`${product.id}-${type}`);
    triggerHaptic('light');
    
    let field = '';
    let newValue = false;
    if (type === 'flash') {
      field = 'isFlashDeal';
      newValue = !product.isFlashDeal;
    } else if (type === 'toppicks') {
      field = 'isTopPick';
      newValue = !product.isTopPick;
    } else if (type === 'bestsellers') {
      field = 'isBestSeller';
      newValue = !product.isBestSeller;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ [field]: newValue })
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        
        if (newValue) {
          if (type === 'flash') {
            setFlashDealsList(prev => [...prev.filter(p => p.id !== product.id), updatedProduct]);
          } else if (type === 'toppicks') {
            setTopPicksList(prev => [...prev.filter(p => p.id !== product.id), updatedProduct]);
          } else if (type === 'bestsellers') {
            setBestSellersList(prev => [...prev.filter(p => p.id !== product.id), updatedProduct]);
          }
        } else {
          if (type === 'flash') {
            setFlashDealsList(prev => prev.filter(p => p.id !== product.id));
          } else if (type === 'toppicks') {
            setTopPicksList(prev => prev.filter(p => p.id !== product.id));
          } else if (type === 'bestsellers') {
            setBestSellersList(prev => prev.filter(p => p.id !== product.id));
          }
        }

        // Update search results list in-place
        setHighlightSearchProducts(prev =>
          prev.map(p => p.id === product.id ? updatedProduct : p)
        );

        // Also sync the other lists just in case
        setFlashDealsList(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        setTopPicksList(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        setBestSellersList(prev => prev.map(p => p.id === product.id ? updatedProduct : p));

        const label = type === 'flash' ? 'Flash Deal' : type === 'toppicks' ? 'Top Pick' : 'Best Seller';
        toast.success(
          newValue
            ? `Pinned to ${label}!`
            : `Removed from ${label}.`
        );
      } else {
        toast.error('Failed to update promotion details');
      }
    } catch (err) {
      console.warn('Connection error updating promotion:', err);
      toast.error('Connection error');
    } finally {
      setTogglingHighlightId(null);
    }
  };



  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      'Delete Review 🗑️',
      'Are you sure you want to delete this customer review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic('medium');
            try {
              const headers = getAuthHeaders();
              const res = await fetch(`${API_BASE_URL}/admin/reviews`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ reviewId })
              });
              if (res.ok) {
                toast.success('Review deleted successfully');
                fetchReviewsData();
              } else {
                throw new Error('Failed');
              }
            } catch (err: any) {
              toast.error('Error deleting review');
            }
          }
        }
      ]
    );
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    triggerHaptic('medium');
    
    if (
      !deliveriesCount.trim() ||
      !ratingValue.trim() ||
      !happyFamilies.trim() ||
      !trustedText.trim() ||
      !radiusState.trim() ||
      !taxRate.trim() ||
      !miscFee.trim() ||
      !contactPhone.trim() ||
      !contactEmail.trim() ||
      !contactTimings.trim() ||
      !contactAddress.trim() ||
      !heroGreetingClosed.trim() ||
      !heroSubtitleClosed.trim() ||
      !heroGreetingMorning.trim() ||
      !heroSubtitleMorningMartClosed.trim() ||
      !heroSubtitleMorningCafeClosed.trim() ||
      !heroSubtitleMorningBothOpen.trim() ||
      !heroGreetingAfternoon.trim() ||
      !heroSubtitleAfternoonMartClosed.trim() ||
      !heroSubtitleAfternoonCafeClosed.trim() ||
      !heroSubtitleAfternoonBothOpen.trim() ||
      !heroGreetingEvening.trim() ||
      !heroSubtitleEveningMartClosed.trim() ||
      !heroSubtitleEveningCafeClosed.trim() ||
      !heroSubtitleEveningBothOpen.trim() ||
      !heroGreetingNight.trim() ||
      !heroSubtitleNightMartClosed.trim() ||
      !heroSubtitleNightCafeClosed.trim() ||
      !heroSubtitleNightBothOpen.trim() ||
      !minOrderValueState.trim() ||
      !storeOpenHourState.trim() ||
      !storeCloseHourState.trim() ||
      !surgeMultiplierState.trim()
    ) {
      toast.error('Please fill in all required settings');
      setIsSavingSettings(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const radiusNum = parseFloat(radiusState) || 5;
      
      const categorySettingsPayload: Record<string, string> = {};
      Object.entries(categoryStatuses).forEach(([slug, isOpen]) => {
        categorySettingsPayload[`category_open_${slug}`] = isOpen ? 'true' : 'false';
      });

      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grocery_mart_open: String(groceryOpenState),
          cafe_open: String(cafeOpenState),
          only_cod: String(onlyCod),
          delivery_radius: String(radiusNum),
          store_lat: storeLat.trim(),
          store_lng: storeLng.trim(),
          deliveries_count: deliveriesCount.trim(),
          rating_value: ratingValue.trim(),
          happy_families: happyFamilies.trim(),
          trusted_text: trustedText.trim(),
          avg_delivery_time: avgDeliveryTime.trim(),
          delivered_today: deliveredToday.trim(),
          fresh_stock_loaded: freshStockLoaded.trim(),
          delivery_fee: deliveryFeeState.trim(),
          grocery_free_delivery_threshold: groceryThresholdState.trim(),
          cafe_free_delivery_threshold: cafeThresholdState.trim(),
          tax_rate: taxRate.trim(),
          misc_fee: miscFee.trim(),
          misc_fee_label: miscFeeLabel.trim(),
          min_order_value: minOrderValueState.trim(),
          store_open_hour: storeOpenHourState.trim(),
          store_close_hour: storeCloseHourState.trim(),
          holidays: holidaysState.trim(),
          surge_multiplier: surgeMultiplierState.trim(),
          contact_phone: contactPhone.trim(),
          contact_email: contactEmail.trim(),
          contact_timings: contactTimings.trim(),
          contact_address: contactAddress.trim(),
          cloudinary_cloud_name: cloudinaryCloudName.trim(),
          cloudinary_upload_preset: cloudinaryUploadPreset.trim(),
          hero_greeting_closed: heroGreetingClosed.trim(),
          hero_subtitle_closed: heroSubtitleClosed.trim(),
          hero_greeting_morning: heroGreetingMorning.trim(),
          hero_subtitle_morning_mart_closed: heroSubtitleMorningMartClosed.trim(),
          hero_subtitle_morning_cafe_closed: heroSubtitleMorningCafeClosed.trim(),
          hero_subtitle_morning_both_open: heroSubtitleMorningBothOpen.trim(),
          hero_greeting_afternoon: heroGreetingAfternoon.trim(),
          hero_subtitle_afternoon_mart_closed: heroSubtitleAfternoonMartClosed.trim(),
          hero_subtitle_afternoon_cafe_closed: heroSubtitleAfternoonCafeClosed.trim(),
          hero_subtitle_afternoon_both_open: heroSubtitleAfternoonBothOpen.trim(),
          hero_greeting_evening: heroGreetingEvening.trim(),
          hero_subtitle_evening_mart_closed: heroSubtitleEveningMartClosed.trim(),
          hero_subtitle_evening_cafe_closed: heroSubtitleEveningCafeClosed.trim(),
          hero_subtitle_evening_both_open: heroSubtitleEveningBothOpen.trim(),
          hero_greeting_night: heroGreetingNight.trim(),
          hero_subtitle_night_both_open: heroSubtitleNightBothOpen.trim(),
          ...categorySettingsPayload,
        })
      });

      if (res.ok) {
        // Sync local client Zustand store instantly!
        setLocalStoreStatus(
          groceryOpenState, 
          radiusNum, 
          parseFloat(storeLat), 
          parseFloat(storeLng),
          parseInt(minOrderValueState),
          parseInt(storeOpenHourState),
          parseInt(storeCloseHourState),
          holidaysState.split(',').map(h => h.trim()),
          parseFloat(surgeMultiplierState),
          parseFloat(taxRate),
          onlyCod,
          parseFloat(miscFee),
          miscFeeLabel,
          parseFloat(deliveryFeeState) || 25,
          parseFloat(groceryThresholdState) || 199,
          cafeOpenState,
          parseFloat(cafeThresholdState) || 199
        );
        toast.success('Settings saved successfully!');
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      toast.error('Failed to save settings on server.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleStoreStatus = async (type: 'grocery' | 'cafe', nextValue: boolean) => {
    try {
      const headers = getAuthHeaders();
      const payload: Record<string, string> = {};
      if (type === 'grocery') {
        payload['grocery_mart_open'] = String(nextValue);
        setGroceryOpenState(nextValue);
      } else {
        payload['cafe_open'] = String(nextValue);
        setCafeOpenState(nextValue);
      }

      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Sync Zustand store
        setLocalStoreStatus(
          type === 'grocery' ? nextValue : groceryOpenState,
          parseFloat(radiusState) || 5,
          parseFloat(storeLat),
          parseFloat(storeLng),
          parseInt(minOrderValueState) || 0,
          parseInt(storeOpenHourState) || 7,
          parseInt(storeCloseHourState) || 23,
          holidaysState.split(',').map(h => h.trim()),
          parseFloat(surgeMultiplierState) || 1,
          parseFloat(taxRate) || 5,
          onlyCod,
          parseFloat(miscFee) || 0,
          miscFeeLabel,
          parseFloat(deliveryFeeState) || 25,
          parseFloat(groceryThresholdState) || 199,
          type === 'cafe' ? nextValue : cafeOpenState,
          parseFloat(cafeThresholdState) || 199
        );
        toast.success(`${type === 'grocery' ? 'Grocery' : 'Cafe'} status updated!`);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      toast.error('Failed to update status.');
      // Revert local state
      if (type === 'grocery') setGroceryOpenState(!nextValue);
      else setCafeOpenState(!nextValue);
    }
  };



  const handleSendBroadcast = async () => {
    if (!pushTitle || !pushBody) {
      Alert.alert('Required Fields', 'Title and body message cannot be empty.');
      return;
    }
    setIsBroadcasting(true);
    triggerHaptic('light');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/push-notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          segment: pushSegment,
          scheduledAt: pushScheduledTime.trim() || undefined
        })
      });

      if (res.ok) {
        toast.success(pushScheduledTime.trim() ? 'Push notification scheduled!' : 'Push notification broadcasted!');
        setPushTitle('');
        setPushBody('');
        setPushSegment('ALL');
        setPushScheduledTime('');
        fetchNotificationsData();
      } else {
        throw new Error('Broadcast failed');
      }
    } catch (err) {
      toast.error('Failed to broadcast push notifications');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleToggleCoupon = async (coupon: any) => {
    triggerHaptic('light');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          couponId: coupon.id,
          isActive: !coupon.isActive
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success(`Coupon ${coupon.code} ${updated.isActive ? 'activated' : 'disabled'}!`);
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCouponCode || !newCouponValue) {
      Alert.alert('Required Fields', 'Coupon code and value are required.');
      return;
    }
    setIsCreatingCoupon(true);
    triggerHaptic('light');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: newCouponCode.toUpperCase().trim(),
          discountType: newCouponType,
          value: parseFloat(newCouponValue),
          minOrder: parseFloat(newCouponMinOrder) || 0,
          maxUses: parseInt(newCouponMaxUses) || 500,
          isActive: true
        })
      });

      if (res.ok) {
        toast.success('Coupon created successfully!');
        setNewCouponCode('');
        setNewCouponValue('');
        setNewCouponMinOrder('');
        setNewCouponMaxUses('');
        setIsCouponModalVisible(false);
        fetchCouponsData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed');
      }
    } catch (err: any) {
      Alert.alert('Coupon Creation Failed', err.message || 'Could not save new coupon.');
    } finally {
      setIsCreatingCoupon(false);
    }
  };


  
  // Local Database State for in-app Simulation
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- Picker Tab States ---
  const [activePickingOrder, setActivePickingOrder] = useState<Order | null>(null);
  const [pickedQuantities, setPickedQuantities] = useState<Record<string, number>>({}); // itemId -> qty
  const [barcodeQuery, setBarcodeQuery] = useState<string>('');
  
  // --- Rider Tab States ---
  const [codCollected, setCodCollected] = useState<number>(0);
  const [todayDeliveries, setTodayDeliveries] = useState<number>(0);
  const [isPhotoCapturing, setIsPhotoCapturing] = useState<boolean>(false);
  const [photoTargetOrder, setPhotoTargetOrder] = useState<Order | null>(null);
  const [isUpiQrVisible, setIsUpiQrVisible] = useState<boolean>(false);
  const [upiTargetOrder, setUpiTargetOrder] = useState<Order | null>(null);

  // --- Picker & Chef Stats ---
  const [todayPacked, setTodayPacked] = useState<number>(0);
  const [todayPrepared, setTodayPrepared] = useState<number>(0);

  // --- Chef Console Order Edit States ---
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [outOfStockProductIds, setOutOfStockProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTaxRate, setEditTaxRate] = useState<number>(0.05); // Default 5%
  const [deliveryFeeSetting, setDeliveryFeeSetting] = useState<number>(25);
  const [miscFeeSetting, setMiscFeeSetting] = useState<number>(5);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(200);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  const handleEditOrder = async (order: Order) => {
    setEditingOrder(order);
    setEditItems(order.items.map(item => ({
      productId: item.productId || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant || null,
      notes: item.notes || null
    })));
    setOutOfStockProductIds([]);
    setSearchQuery('');
    
    try {
      const category = activeTab === 'CHEF' ? 'cafe' : 'restaurant';
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/products?category=${category}&limit=100`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data.products || []);
      }
    } catch (err) {
      console.warn('Failed to fetch catalog products for edit:', err);
    }
  };

  const updateItemQty = (productId: string, variant: string | null, delta: number) => {
    setEditItems(prev => {
      return prev.map(item => {
        if (item.productId === productId && item.selectedVariant === variant) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const updateItemVariant = (productId: string, oldVariant: string | null, newVariant: string, newPrice: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId && item.selectedVariant === oldVariant) {
        return {
          ...item,
          selectedVariant: newVariant,
          price: newPrice
        };
      }
      return item;
    }));
  };

  const markItemOutOfStock = (productId: string) => {
    if (!outOfStockProductIds.includes(productId)) {
      setOutOfStockProductIds(prev => [...prev, productId]);
    }
    setEditItems(prev => prev.filter(item => item.productId !== productId));
  };

  const addCatalogItem = (product: any) => {
    const exists = editItems.find(item => item.productId === product.id);
    if (exists) {
      updateItemQty(product.id, null, 1);
    } else {
      setEditItems(prev => [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        selectedVariant: null,
        notes: null
      }]);
    }
    setSearchQuery('');
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    setIsSavingEdit(true);
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/orders/${editingOrder.id}/edit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          updatedItems: editItems,
          outOfStockProductIds: outOfStockProductIds
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Order updated successfully!');
        setEditingOrder(null);
        fetchServerOrders(true);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Failed to edit order');
      }
    } catch (err) {
      Alert.alert('Error', 'Error saving order updates');
    } finally {
      setIsSavingEdit(false);
    }
  };
  const fetchServerOrders = async (showLoader = false) => {
    if (!user || user.role === 'USER') {
      setIsOnline(false);
      return;
    }
    if (showLoader) setIsRefreshing(true);
    try {
      const headers = getAuthHeaders();
      let url = `${API_BASE_URL}/picker/orders`;
      if (activeTab === 'CHEF') {
        url = `${API_BASE_URL}/picker/orders?type=cafe`;
      } else if (activeTab === 'CHEF_RESTAURANT') {
        url = `${API_BASE_URL}/picker/orders?type=restaurant`;
      } else if (activeTab === 'RIDER') {
        url = `${API_BASE_URL}/delivery/orders`;
      }

      const res = await fetch(url, { method: 'GET', headers });
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized');
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const mappedOrders = data.map((ord: any) => ({
          id: ord.id,
          status: ord.status,
          total: ord.total,
          deliveryFee: ord.deliveryFee || 0,
          miscFee: ord.miscFee || 0,
          discount: ord.discount || 0,
          createdAt: ord.createdAt,
          paymentMethod: ord.paymentMethod || 'COD',
          deliveryMethod: ord.deliveryMethod || 'DELIVERY',
          user: ord.user ? {
            name: ord.user.name || 'Customer',
            phone: ord.user.phone || ''
          } : { name: 'Customer', phone: '' },
          address: ord.address ? {
            houseNo: ord.address.houseNo || '',
            street: ord.address.street || '',
            area: ord.address.area || '',
            city: ord.address.city || '',
            pincode: ord.address.pincode || '',
            lat: ord.address.lat,
            lng: ord.address.lng
          } : { houseNo: '', street: '', area: '', city: '', pincode: '' },
          items: (ord.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId || it.product?.id || it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl || it.product?.imageUrl || null,
            location: it.product?.location || null,
            categorySlug: it.product?.category?.slug || (ord.shopName === 'FastKirana Cafe Kitchen' ? 'cafe' : ''),
            cooked: it.cooked || false,
            selectedVariant: it.selectedVariant || null,
            notes: it.notes || null
          })),
          binName: ord.binName || null
        }));
        setOrders(mappedOrders);
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      console.warn('fetchServerOrders error, falling back to mock data:', err);
      let filteredMock = mockOrdersList;
      if (activeTab === 'CHEF') {
        filteredMock = mockOrdersList.filter(o => o.items.some(it => it.cooked || it.categorySlug === 'cafe'));
      } else if (activeTab === 'CHEF_RESTAURANT') {
        filteredMock = mockOrdersList.filter(o => o.items.some(it => it.cooked || it.categorySlug === 'restaurant' || it.categorySlug === 'north-indian' || it.categorySlug === 'biryani-rice'));
      } else if (activeTab === 'PICKER') {
        filteredMock = mockOrdersList.filter(o => ['PENDING', 'CONFIRMED', 'PACKED'].includes(o.status));
      } else if (activeTab === 'RIDER') {
        filteredMock = mockOrdersList.filter(o => o.status === 'PACKED' || o.status === 'DELIVERED');
      }
      setOrders(filteredMock);
      setIsOnline(true);
    } finally {
      if (showLoader) setIsRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/settings`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.tax_rate !== undefined) {
            setEditTaxRate(parseFloat(data.tax_rate) / 100);
          }
          if (data.delivery_fee !== undefined) {
            setDeliveryFeeSetting(parseFloat(data.delivery_fee));
          }
          if (data.misc_fee !== undefined) {
            setMiscFeeSetting(parseFloat(data.misc_fee));
          }
          if (data.cafe_free_delivery_threshold !== undefined) {
            setFreeDeliveryThreshold(parseFloat(data.cafe_free_delivery_threshold));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settings, using defaults:', err);
    }
  };

  useEffect(() => {
    if (activeTab && ['PICKER', 'RIDER', 'CHEF', 'CHEF_RESTAURANT'].includes(activeTab)) {
      fetchServerOrders(true);
    }
    fetchSettings();
    
    const intervalId = setInterval(() => {
      if (activeTab && ['PICKER', 'RIDER', 'CHEF', 'CHEF_RESTAURANT'].includes(activeTab)) {
        fetchServerOrders(false);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [activeTab, user]);

  const updateOrderStatus = async (orderId: string, nextStatus: string, extraPayload: any = {}) => {
    if (!isOnline) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: nextStatus,
          ...extraPayload
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchServerOrders(false);
        return true;
      } else {
        toast.error(data.error || 'Failed to update order status');
        return false;
      }
    } catch (err) {
      toast.error('Network error updating order status');
      return false;
    }
  };

  // Sound generator simulation (Web Audio API or Native beep logs)
  const triggerAudioBeep = () => {
    console.log('[Audio] Scanner beep chime');
    triggerHaptic('light');
  };

  const triggerAudioSuccess = () => {
    console.log('[Audio] Order process complete success chime');
    triggerHaptic('success');
  };

  // ------------------- Picker Console Actions -------------------
  
  const startPicking = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'CONFIRMED');
      if (!ok) return;
    } else {
      // Update order status to CONFIRMED (in progress)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
    }
    
    // Initialize picked quantities
    const initQtys: Record<string, number> = {};
    order.items.forEach(it => {
      initQtys[it.id] = 0;
    });
    setPickedQuantities(initQtys);
    setActivePickingOrder({ ...order, status: 'CONFIRMED' });
    triggerHaptic('medium');
    toast.success(`Picking started for #${order.id.toUpperCase()}`);
  };

  const manualPickOne = (itemId: string, max: number) => {
    const current = pickedQuantities[itemId] || 0;
    if (current < max) {
      const next = current + 1;
      const nextQtys = { ...pickedQuantities, [itemId]: next };
      setPickedQuantities(nextQtys);
      triggerAudioBeep();
      
      // Auto pack if checkoff completes
      checkIfAllPicked(nextQtys);
    }
  };

  const manualPickAll = (itemId: string, max: number) => {
    const nextQtys = { ...pickedQuantities, [itemId]: max };
    setPickedQuantities(nextQtys);
    triggerAudioBeep();
    
    // Auto pack if checkoff completes
    checkIfAllPicked(nextQtys);
  };

  const resetItemPicker = (itemId: string) => {
    setPickedQuantities(prev => ({ ...prev, [itemId]: 0 }));
    triggerHaptic('medium');
  };

  const scanBarcodeProduct = () => {
    if (!activePickingOrder || !barcodeQuery.trim()) return;
    const query = barcodeQuery.trim().toLowerCase();
    
    const matched = activePickingOrder.items.find(item => 
      item.name.toLowerCase().includes(query)
    );

    if (matched) {
      const current = pickedQuantities[matched.id] || 0;
      if (current < matched.quantity) {
        const nextQtys = { ...pickedQuantities, [matched.id]: current + 1 };
        setPickedQuantities(nextQtys);
        triggerAudioBeep();
        toast.success(`Scanned: ${matched.name}`);
        checkIfAllPicked(nextQtys);
      } else {
        toast.info(`Already picked all units of ${matched.name}`);
      }
    } else {
      triggerHaptic('warning');
      toast.error(`No item matches keyword "${barcodeQuery}"`);
    }
    setBarcodeQuery('');
  };

  const checkIfAllPicked = (qtys: Record<string, number>) => {
    if (!activePickingOrder) return;
    const allPicked = activePickingOrder.items.every(it => qtys[it.id] === it.quantity);
    if (allPicked) {
      // Auto Pack order
      setTimeout(() => {
        packActiveOrder(activePickingOrder.id);
      }, 500);
    }
  };

  const packActiveOrder = async (orderId: string) => {
    if (isOnline) {
      const ok = await updateOrderStatus(orderId, 'PACKED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PACKED' } : o));
    }
    setTodayPacked(prev => prev + 1);
    triggerAudioSuccess();
    toast.success(`Order #${orderId.toUpperCase()} Packed & Moved to Rider queue!`);
    setActivePickingOrder(null);
    setPickedQuantities({});
  };

  const cancelActivePicking = () => {
    setActivePickingOrder(null);
    setPickedQuantities({});
    triggerHaptic('medium');
  };

  // ------------------- Rider Console Actions -------------------

  const startGpsSimulation = (order: Order) => {
    // Target address lat/lng
    const targetLat = order.address.lat || 26.1542;
    const targetLng = order.address.lng || 80.1724;

    // Start coordinates (Ghatampur Darkstore, slightly shifted from the order coordinates to make route visualization nice)
    const startLat = 26.1512;
    const startLng = 80.1654;

    const totalSteps = 15;
    let step = 0;

    // Clear existing simulation for this order if any
    if (simIntervalsRef.current[order.id]) {
      clearInterval(simIntervalsRef.current[order.id]);
    }

    // Initialize simulation state
    setActiveGpsSimulations(prev => ({
      ...prev,
      [order.id]: { lat: startLat, lng: startLng, step: 0, totalSteps }
    }));

    const intervalId = setInterval(async () => {
      step++;
      const currentLat = startLat + (targetLat - startLat) * (step / totalSteps);
      const currentLng = startLng + (targetLng - startLng) * (step / totalSteps);

      // Update local simulation state
      setActiveGpsSimulations(prev => {
        if (!prev[order.id]) return prev;
        return {
          ...prev,
          [order.id]: { lat: currentLat, lng: currentLng, step, totalSteps }
        };
      });

      // PATCH coordinate on server
      try {
        await fetch(`${API_BASE_URL}/orders/${order.id}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: 'SHIPPED',
            deliveryLat: currentLat,
            deliveryLng: currentLng
          })
        });
      } catch (err) {
        console.warn('GPS Simulator failed to PATCH coordinate:', err);
      }

      if (step >= totalSteps) {
        clearInterval(intervalId);
        delete simIntervalsRef.current[order.id];
        // Clean up simulation state locally
        setActiveGpsSimulations(prev => {
          const updated = { ...prev };
          delete updated[order.id];
          return updated;
        });
        toast.success(`Shipment #${order.id.slice(-6).toUpperCase()} reached destination!`);
      }
    }, 5000);

    simIntervalsRef.current[order.id] = intervalId;
  };

  const acceptShipment = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'SHIPPED');
      if (!ok) return;
      // Start GPS Simulation!
      startGpsSimulation(order);
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'SHIPPED' } : o));
    }
    triggerHaptic('medium');
    toast.success(`Shipment accepted! Out for delivery.`);
  };

  const initiateConfirmDelivery = (order: Order) => {
    if (order.paymentMethod === 'COD') {
      // Show payment selector modal (Simulated UPI QR vs Cash)
      setUpiTargetOrder(order);
      setIsUpiQrVisible(true);
    } else {
      setPhotoTargetOrder(order);
      setIsPhotoCapturing(true);
    }
    triggerHaptic('light');
  };

  const handleCashCollected = (order: Order) => {
    setIsUpiQrVisible(false);
    setUpiTargetOrder(null);
    setCodCollected(prev => prev + order.total);
    
    // Proceed to photo verification
    setPhotoTargetOrder(order);
    setIsPhotoCapturing(true);
  };

  const handleUpiQrPaid = (order: Order) => {
    setIsUpiQrVisible(false);
    setUpiTargetOrder(null);
    toast.success("Payment Received via UPI QR!");
    
    // Proceed to photo verification
    setPhotoTargetOrder(order);
    setIsPhotoCapturing(true);
  };

  const finalizeDelivery = async () => {
    if (!photoTargetOrder) return;
    const orderId = photoTargetOrder.id;
    
    // Clear simulation if active
    if (simIntervalsRef.current[orderId]) {
      clearInterval(simIntervalsRef.current[orderId]);
      delete simIntervalsRef.current[orderId];
      setActiveGpsSimulations(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    }

    // 1x1 transparent GIF base64 as placeholder proof
    const mockPhotoBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    if (isOnline) {
      const ok = await updateOrderStatus(orderId, 'DELIVERED', {
        deliveryPhoto: mockPhotoBase64,
        deliveryLat: 26.1542,
        deliveryLng: 80.1724
      });
      if (!ok) return;
    } else {
      // Mark as delivered in state database
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
    }
    setTodayDeliveries(prev => prev + 1);
    
    triggerAudioSuccess();
    toast.success(`Delivery completed for #${orderId.toUpperCase()}`);
    setIsPhotoCapturing(false);
    setPhotoTargetOrder(null);
  };

  // ------------------- Chef Console Actions -------------------
  
  // Filter cafe items requiring preparation
  const pendingCafeOrders = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'PENDING' || o.status === 'CONFIRMED') && 
      o.items.some(it => it.categorySlug === 'cafe')
    );
  }, [orders]);

  // Filter restaurant items requiring preparation
  const pendingRestaurantOrders = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'PENDING' || o.status === 'CONFIRMED') && 
      o.items.some(it => it.categorySlug === 'restaurant' || it.categorySlug === 'north-indian' || it.categorySlug === 'biryani-rice')
    );
  }, [orders]);

  const aggregatedPrepItems = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') return;
      order.items.forEach(item => {
        if (item.categorySlug !== 'cafe') return;
        if (item.cooked) return; // Only count uncooked/unprepared items

        if (!counts[item.name]) {
          counts[item.name] = {
            name: item.name,
            quantity: 0
          };
        }
        counts[item.name].quantity += item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const aggregatedRestaurantPrepItems = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') return;
      order.items.forEach(item => {
        if (item.categorySlug !== 'restaurant' && item.categorySlug !== 'north-indian' && item.categorySlug !== 'biryani-rice') return;
        if (item.cooked) return; // Only count uncooked/unprepared items

        if (!counts[item.name]) {
          counts[item.name] = {
            name: item.name,
            quantity: 0
          };
        }
        counts[item.name].quantity += item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const startPreparingChef = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'CONFIRMED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
    }
    triggerHaptic('medium');
    toast.success(`Started preparing Kitchen order #${order.id.slice(-6).toUpperCase()}`);
  };

  const markChefItemReady = async (orderId: string, itemId: string) => {
    // Simple toggle state for cafe/restaurant item cooked checklist
    let allChefItemsReady = false;
    let targetOrderUser = 'Customer';
    
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        targetOrderUser = o.user.name;
        const updatedItems = o.items.map(it => 
          it.id === itemId ? { ...it, cooked: !it.cooked } : it
        );
        
        // Check if all items for the specific chef segment are prepared
        const isCafeOrder = o.items.some(it => it.categorySlug === 'cafe');
        if (isCafeOrder) {
          allChefItemsReady = updatedItems
            .filter(it => it.categorySlug === 'cafe')
            .every(it => it.cooked === true);
        } else {
          allChefItemsReady = updatedItems
            .filter(it => it.categorySlug === 'restaurant' || it.categorySlug === 'north-indian' || it.categorySlug === 'biryani-rice')
            .every(it => it.cooked === true);
        }

        return { ...o, items: updatedItems };
      }
      return o;
    });

    if (allChefItemsReady) {
      if (isOnline) {
        const ok = await updateOrderStatus(orderId, 'PACKED');
        if (!ok) return;
      } else {
        setOrders(updatedOrders.map(o => o.id === orderId ? { ...o, status: 'PACKED' } : o));
      }
      setTodayPrepared(prev => prev + 1);
      triggerAudioSuccess();
      const isCafeOrder = updatedOrders.find(o => o.id === orderId)?.items.some(it => it.categorySlug === 'cafe');
      const emoji = isCafeOrder ? '☕' : '🍳';
      const typeLabel = isCafeOrder ? 'Cafe' : 'Restaurant';
      setTimeout(() => {
        toast.success(`${emoji} ${typeLabel} Kitchen order for ${targetOrderUser} prepared! Sent to Rider.`);
      }, 300);
    } else {
      setOrders(updatedOrders);
      triggerAudioBeep();
    }
  };


  // Lists filtering by tab roles
  const pickerPendingOrders = useMemo(() => orders.filter(o => o.status === 'PENDING'), [orders]);
  const riderQueueOrders = useMemo(() => orders.filter(o => o.status === 'PACKED'), [orders]);
  const riderActiveDeliveries = useMemo(() => orders.filter(o => o.status === 'SHIPPED'), [orders]);
  const { theme: activeTheme, toggleTheme } = useTheme();
  const isDarkMode = activeTheme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const styles = StyleSheet.create({
    absolute: {
        "position": "absolute"
    },
    flex1: {
        "flex": 1
    },
    flexRow: {
        "flexDirection": "row"
    },
    flexWrap: {
        "flexWrap": "wrap"
    },
    fontblack: {
        "fontWeight": "900"
    },
    fontbold: {
        "fontWeight": "700"
    },
    fontextrabold: {
        "fontWeight": "800"
    },
    fontmedium: {
        "fontWeight": "500"
    },
    fontmono: {
        "fontWeight": "mono"
    },
    fontsemibold: {
        "fontWeight": "600"
    },
    gap1: {
        "gap": 4
    },
    gap1.5: {
        "gap": "1.5"
    },
    gap2: {
        "gap": 8
    },
    gap2.5: {
        "gap": "2.5"
    },
    gap3: {
        "gap": 12
    },
    gap3.5: {
        "gap": "3.5"
    },
    gap4: {
        "gap": 16
    },
    gap5: {
        "gap": 20
    },
    gap6: {
        "gap": 24
    },
    gapx4: {
        "gap": "x-4"
    },
    gapy2: {
        "gap": "y-2"
    },
    h1.5: {
        "height": "1.5"
    },
    h10: {
        "height": 10
    },
    h11: {
        "height": 11
    },
    h12: {
        "height": 12
    },
    h14: {
        "height": 14
    },
    h16: {
        "height": 16
    },
    h2: {
        "height": 2
    },
    h2.5: {
        "height": "2.5"
    },
    h20: {
        "height": 20
    },
    h24: {
        "height": 24
    },
    h3: {
        "height": 3
    },
    h36: {
        "height": 36
    },
    h48: {
        "height": 48
    },
    h6: {
        "height": 6
    },
    h8: {
        "height": 8
    },
    h9: {
        "height": 9
    },
    hfull: {
        "height": "100%"
    },
    hpx: {
        "height": "px"
    },
    italic: {
        "fontStyle": "italic"
    },
    itemsCenter: {
        "alignItems": "center"
    },
    itemsEnd: {
        "alignItems": "flex-end"
    },
    itemsStart: {
        "alignItems": "flex-start"
    },
    justifyBetween: {
        "justifyContent": "space-between"
    },
    justifyCenter: {
        "justifyContent": "center"
    },
    justifyEnd: {
        "justifyContent": "flex-end"
    },
    leading4: {
        "lineHeight": 16
    },
    leading5: {
        "lineHeight": 20
    },
    leadingnormal: {
        "lineHeight": "normal"
    },
    leadingtight: {
        "lineHeight": "tight"
    },
    lineThrough: {
        "textDecorationLine": "line-through"
    },
    maxh60: {
        "maxHeight": "-60"
    },
    maxh[80%]: {
        "maxHeight": "-[80%]"
    },
    maxh[90%]: {
        "maxHeight": "-[90%]"
    },
    maxw5xl: {
        "maxWidth": "-5xl"
    },
    maxw[120px]: {
        "maxWidth": "-[120px]"
    },
    maxw[140px]: {
        "maxWidth": "-[140px]"
    },
    maxw[240px]: {
        "maxWidth": "-[240px]"
    },
    maxw[288px]: {
        "maxWidth": "-[288px]"
    },
    maxwsm: {
        "maxWidth": "-sm"
    },
    mb1: {
        "marginBottom": 4
    },
    mb1.5: {
        "marginBottom": "1.5"
    },
    mb10: {
        "marginBottom": 10
    },
    mb2: {
        "marginBottom": 8
    },
    mb2.5: {
        "marginBottom": "2.5"
    },
    mb3: {
        "marginBottom": 12
    },
    mb4: {
        "marginBottom": 16
    },
    mb5: {
        "marginBottom": 20
    },
    mb6: {
        "marginBottom": 24
    },
    mb8: {
        "marginBottom": 32
    },
    minh[60px]: {
        "minHeight": "-[60px]"
    },
    minh[80px]: {
        "minHeight": "-[80px]"
    },
    minw0: {
        "minWidth": "-0"
    },
    minw[140px]: {
        "minWidth": "-[140px]"
    },
    minw[160px]: {
        "minWidth": "-[160px]"
    },
    minw[280px]: {
        "minWidth": "-[280px]"
    },
    minw[45%]: {
        "minWidth": "-[45%]"
    },
    ml1: {
        "marginLeft": 4
    },
    ml1.5: {
        "marginLeft": "1.5"
    },
    ml2: {
        "marginLeft": 8
    },
    ml2.5: {
        "marginLeft": "2.5"
    },
    ml3: {
        "marginLeft": 12
    },
    mr1: {
        "marginRight": 4
    },
    mr2: {
        "marginRight": 8
    },
    mr2.5: {
        "marginRight": "2.5"
    },
    mr3: {
        "marginRight": 12
    },
    mt0.5: {
        "marginTop": "0.5"
    },
    mt1: {
        "marginTop": 4
    },
    mt1.5: {
        "marginTop": "1.5"
    },
    mt2: {
        "marginTop": 8
    },
    mt3: {
        "marginTop": 12
    },
    mt3.5: {
        "marginTop": "3.5"
    },
    mt4: {
        "marginTop": 16
    },
    mt5: {
        "marginTop": 20
    },
    mt6: {
        "marginTop": 24
    },
    mt8: {
        "marginTop": 32
    },
    mx2: {
        "marginHorizontal": 8
    },
    mx4: {
        "marginHorizontal": 16
    },
    mxauto: {
        "marginHorizontal": "auto"
    },
    my6: {
        "marginVertical": 24
    },
    opacity75: {
        "opacity": 0.75
    },
    opacity80: {
        "opacity": 0.8
    },
    overflowHidden: {
        "overflow": "hidden"
    },
    p0: {
        "padding": 0
    },
    p1: {
        "padding": 4
    },
    p1.5: {
        "padding": "1.5"
    },
    p2: {
        "padding": 8
    },
    p2.5: {
        "padding": "2.5"
    },
    p3: {
        "padding": 12
    },
    p3.5: {
        "padding": "3.5"
    },
    p4: {
        "padding": 16
    },
    p5: {
        "padding": 20
    },
    p6: {
        "padding": 24
    },
    p8: {
        "padding": 32
    },
    pb2: {
        "paddingBottom": 8
    },
    pb2.5: {
        "paddingBottom": "2.5"
    },
    pb3: {
        "paddingBottom": 12
    },
    pb4: {
        "paddingBottom": 16
    },
    pl3: {
        "paddingLeft": 12
    },
    pr2: {
        "paddingRight": 8
    },
    pr3: {
        "paddingRight": 12
    },
    pr4: {
        "paddingRight": 16
    },
    pt2: {
        "paddingTop": 8
    },
    pt2.5: {
        "paddingTop": "2.5"
    },
    pt3: {
        "paddingTop": 12
    },
    pt4: {
        "paddingTop": 16
    },
    pt5: {
        "paddingTop": 20
    },
    pt8: {
        "paddingTop": 32
    },
    px1.5: {
        "paddingHorizontal": "1.5"
    },
    px2: {
        "paddingHorizontal": 8
    },
    px2.5: {
        "paddingHorizontal": "2.5"
    },
    px3: {
        "paddingHorizontal": 12
    },
    px3.5: {
        "paddingHorizontal": "3.5"
    },
    px4: {
        "paddingHorizontal": 16
    },
    px8: {
        "paddingHorizontal": 32
    },
    py0.5: {
        "paddingVertical": "0.5"
    },
    py1: {
        "paddingVertical": 4
    },
    py1.5: {
        "paddingVertical": "1.5"
    },
    py10: {
        "paddingVertical": 10
    },
    py12: {
        "paddingVertical": 12
    },
    py16: {
        "paddingVertical": 16
    },
    py2: {
        "paddingVertical": 8
    },
    py2.5: {
        "paddingVertical": "2.5"
    },
    py20: {
        "paddingVertical": 20
    },
    py3: {
        "paddingVertical": 12
    },
    py3.5: {
        "paddingVertical": "3.5"
    },
    py4: {
        "paddingVertical": 16
    },
    py6: {
        "paddingVertical": 24
    },
    py8: {
        "paddingVertical": 32
    },
    relative: {
        "position": "relative"
    },
    rounded2Xl: {
        "borderRadius": 28
    },
    rounded3Xl: {
        "borderRadius": 32
    },
    roundedFull: {
        "borderRadius": 9999
    },
    roundedTlG: {
        "borderRadius": "t-lg"
    },
    roundedXl: {
        "borderRadius": 24
    },
    roundedlg: {
        "borderRadius": 20
    },
    roundedmd: {
        "borderRadius": 14
    },
    roundedt3xl: {
        "borderRadius": "t-3xl"
    },
    selfCenter: {
        "alignSelf": "center"
    },
    selfStart: {
        "alignSelf": "flex-start"
    },
    shadow2xl: {
        "boxShadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    },
    shadowLg: {
        "boxShadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    },
    shadowMd: {
        "boxShadow": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    },
    shadowSm: {
        "boxShadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    },
    shadowxs: {
        "boxShadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    },
    textCenter: {
        "textAlign": "center"
    },
    textCustom10: {
        "fontSize": 10
    },
    textCustom11: {
        "fontSize": 11
    },
    textCustom7: {
        "fontSize": 7
    },
    textCustom8: {
        "fontSize": 8
    },
    textCustom9: {
        "fontSize": 9
    },
    textLeft: {
        "textAlign": "left"
    },
    trackingwide: {
        "letterSpacing": 0.25
    },
    trackingwider: {
        "letterSpacing": 0.5
    },
    trackingwidest: {
        "letterSpacing": 1
    },
    truncate: {
        "overflow": "hidden",
        "whiteSpace": "nowrap"
    },
    uppercase: {
        "textTransform": "uppercase"
    },
    w1.5: {
        "width": "1.5"
    },
    w10: {
        "width": 10
    },
    w11: {
        "width": 11
    },
    w12: {
        "width": 12
    },
    w14: {
        "width": 14
    },
    w16: {
        "width": 16
    },
    w2: {
        "width": 2
    },
    w2.5: {
        "width": "2.5"
    },
    w20: {
        "width": 20
    },
    w28: {
        "width": 28
    },
    w4: {
        "width": 4
    },
    w48: {
        "width": 48
    },
    w6: {
        "width": 6
    },
    w8: {
        "width": 8
    },
    w9: {
        "width": 9
    },
    wfull: {
        "width": "100%"
    },
    wpx: {
        "width": "px"
    },
  });
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const isWeb = Platform.OS === 'web';
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = isWeb && windowWidth >= 1024;

  const hubCategories = [
    {
      id: 'BI',
      title: 'Business Insights & AI',
      description: 'Analytics, forecasting, and financial reports',
      icon: TrendingUp,
      defaultTab: 'ANALYTICS',
      color: 'from-blue-500/10 to-cyan-500/10',
      activeBorder: 'border-blue-500/60 ring-2 ring-blue-500/20',
      iconColor: '#3b82f6',
      nativeGradient: [''#3B82F61E'', ''#06B6D414''] as [string, string],
      nativeBorder: ''#3B82F666'',
      tabs: [
        { id: 'ANALYTICS', label: 'Analytics', emoji: '📊' },
        { id: 'FORECAST', label: 'AI Forecasting', emoji: '📈' },
        { id: 'REPORTS', label: 'Reports', emoji: '📋' }
      ]
    },
    {
      id: 'OPS',
      title: 'Ops & Fulfillment',
      description: 'Live tracker, orders, customers, and reviews',
      icon: Zap,
      defaultTab: 'LIVEOPS',
      color: 'from-amber-500/10 to-orange-500/10',
      activeBorder: 'border-amber-500/60 ring-2 ring-amber-500/20',
      iconColor: '#f59e0b',
      nativeGradient: [''#F59E0B1E'', ''#F9731614''] as [string, string],
      nativeBorder: ''#F59E0B66'',
      tabs: [
        { id: 'LIVEOPS', label: 'LiveOps', emoji: '🚨' },
        { id: 'ORDERS', label: 'Store Orders', emoji: '📋' },
        { id: 'CHEF_RESTAURANT', label: 'Kitchen Console', emoji: '🍳' },
        { id: 'USERS', label: 'Customers', emoji: '👥' },
        { id: 'REVIEWS', label: 'Reviews', emoji: '⭐' }
      ]
    }
  ] as const;

  const activeHubDetails = hubCategories.find(h => h.id === activeHub) || hubCategories[0];

  const handleLogoutPress = () => {
    console.log('[Logout] Button clicked. platform:', Platform.OS);
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out?');
      if (confirmLogout) {
        console.log('[Logout] Confirmed, executing store logout');
        logout();
        try {
          router.replace('/(auth)/login');
        } catch (err) {
          console.error('[Logout] router.replace failed:', err);
          window.location.replace('/login');
        }
      }
    } else {
      setLogoutModalVisible(true);
    }
  };

  const totalRevenue = (analyticsStats.groceryRevenue || 0) + (analyticsStats.restaurantRevenue || 0) + (analyticsStats.cafeRevenue || 0);
  const totalOrders = (analyticsStats.groceryTotalOrders || 0) + (analyticsStats.restaurantTotalOrders || 0) + (analyticsStats.cafeTotalOrders || 0);
  const activeOrders = (analyticsStats.groceryActiveOrders || 0) + (analyticsStats.restaurantActiveOrders || 0) + (analyticsStats.cafeActiveOrders || 0);
  const deliveredOrders = (analyticsStats.groceryDeliveredOrders || 0) + (analyticsStats.restaurantDeliveredOrders || 0) + (analyticsStats.cafeDeliveredOrders || 0);

  const statsList = [
    { 
      label: 'TODAY REVENUE', 
      value: formatPrice(analyticsStats.todayRevenue || 0), 
      icon: IndianRupee, 
      color: '#10b981', 
      bg: ''#10B98114'', 
      subtext: "Today's Earnings" 
    },
    { 
      label: 'TODAY ORDERS', 
      value: String(analyticsStats.todayTotalOrders || 0), 
      icon: ShoppingBag, 
      color: '#e11d48', 
      bg: ''#E11D4814'', 
      subtext: "Total Orders Placed Today" 
    },
    { 
      label: 'ACTIVE ORDERS', 
      value: String(activeOrders), 
      icon: RotateCcw, 
      color: '#f97316', 
      bg: ''#F9731614'', 
      subtext: "New Placed & Live Queue" 
    }
  ];

  const renderActiveTitle = () => {
    return (
      <>
        {activeTab === 'PICKER' && 'Picker Console 📦'}
        {activeTab === 'RIDER' && 'Rider Console 🛵'}
        {activeTab === 'CHEF' && 'Cafe Kitchen Console ☕'}
        {activeTab === 'CHEF_RESTAURANT' && 'Restaurant Kitchen Console 🍳'}
        {activeTab === 'ANALYTICS' && 'Store Analytics 📊'}
        {activeTab === 'ORDERS' && 'Store Orders 📋'}
        {activeTab === 'SETTINGS' && 'Store Settings ⚙️'}
        {activeTab === 'INVENTORY' && 'Products 📦'}
        {activeTab === 'BANNERS' && 'Promo Banners 🖼️'}
        {activeTab === 'NOTIFICATIONS' && 'Push Notifications 📣'}
        {activeTab === 'COUPONS' && 'Offers 🎟️'}
        {activeTab === 'USERS' && 'Customers 👥'}
        {activeTab === 'REVIEWS' && 'Reviews ⭐'}
        {activeTab === 'HIGHLIGHTS' && 'Store Highlights ⚡'}
        {activeTab === 'LIVEOPS' && 'LiveOps 🚨'}
        {activeTab === 'CATEGORIES' && 'Categories 📁'}
        {activeTab === 'ALERTS' && 'Inventory Alerts ⚠️'}
        {activeTab === 'INWARD' && 'GRN Inwarding 📥'}
        {activeTab === 'BULK_UPDATE' && 'Bulk Update ⚡'}
        {activeTab === 'REPORTS' && 'Sales Reports 📈'}
        {activeTab === 'FORECAST' && 'AI Forecasting 📊'}
      </>
    );
  };

  const renderActiveDescription = () => {
    return (
      <>
        {activeTab === 'PICKER' && 'FastKirana Darkstore Packhouse'}
        {activeTab === 'RIDER' && 'FastKirana Logistics Delivery Fleet'}
        {activeTab === 'CHEF' && 'FastKirana Cafe Food Prep Station'}
        {activeTab === 'CHEF_RESTAURANT' && 'FastKirana Restaurant Food Prep Station'}
        {activeTab === 'ANALYTICS' && 'Real-time sales & store operations overview'}
        {activeTab === 'ORDERS' && 'Manage and confirm customer sales orders'}
        {activeTab === 'SETTINGS' && 'Configure store open/close & parameters'}
        {activeTab === 'INVENTORY' && 'Monitor and edit price, stock & availability'}
        {activeTab === 'BANNERS' && 'Manage promotional banners and carousels'}
        {activeTab === 'NOTIFICATIONS' && 'Send instant push alerts to customer devices'}
        {activeTab === 'COUPONS' && 'Manage discount codes & promo campaigns'}
        {activeTab === 'USERS' && 'Promote user roles and manage worker logins'}
        {activeTab === 'REVIEWS' && 'Moderate and delete product ratings & comments'}
        {activeTab === 'HIGHLIGHTS' && 'Curate storefront features, flash deals, top picks & best sellers'}
        {activeTab === 'LIVEOPS' && 'Real-time dispatch speed & SLA delays stream'}
        {activeTab === 'CATEGORIES' && 'Manage store product groupings & ordering weights'}
        {activeTab === 'ALERTS' && 'Monitor out of stock, low stock, and expiring items'}
        {activeTab === 'INWARD' && 'Inward shipments and register new inventory batches'}
        {activeTab === 'BULK_UPDATE' && 'Update catalog prices and inventory levels in batches'}
        {activeTab === 'REPORTS' && 'View store sales trend charts and export CSV reports'}
        {activeTab === 'FORECAST' && 'AI demand velocity and stock depletion estimates'}
      </>
    );
  };

  return (
    <SafeAreaView 
      style={styles.flex1}
      style={{ backgroundColor: isDarkMode ? 'THEME.COLORS.dark.background' : 'THEME.COLORS.light.background' }}
    >
      {isLargeScreen ? (
        /* ------------------- WEB VIEW DASHBOARD ------------------- */
        <ScrollView style={styles.flex1} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Header Bar */}
          <View style={styles.bgwhite, styles.dark:bgzinc900, styles.borderb, styles.borderslate200, styles.dark:borderzinc800, styles.px4, styles.md:px8, styles.py3, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.flexWrap, styles.gap4, styles.shadowxs}>
            <View style={styles.flexRow, styles.itemsCenter, styles.gap4, styles.md:gap6, styles.flexWrap, styles.flex1, styles.minw[280px]}>
              {/* App Logo & Geolocation selector (same as Home page design) */}
              <View style={styles.flexRow, styles.itemsCenter, styles.gap3}>
                <Pressable 
                  onPress={() => {
                    triggerHaptic('light');
                    router.replace('/(tabs)');
                  }} 
                >
                  <Logo size={32} />
                </Pressable>
                
                <Pressable 
                  onPress={() => {
                    triggerHaptic('light');
                    router.push('/location-picker');
                  }} 
                  style={styles.flexRow, styles.itemsCenter, styles.gap2}
                >
                  <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                    <MapPin size={14} color="#e20a22" />
                  </View>
                  <View style={styles.flexcolumn, styles.itemsStart}>
                    <Text style={styles.textslate800, styles.dark:textzinc100, styles.fontextrabold, styles.textxs}>
                      Fast Delivery
                    </Text>
                    <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                      <Text style={styles.textslate400, styles.dark:textzinc400, styles.textCustom10, styles.fontbold, styles.maxw[140px]} numberOfLines={1}>
                        {formatHeaderAddress(selectedLocation)}
                      </Text>
                      <ChevronDown size={8} color="#94a3b8" />
                    </View>
                  </View>
                </Pressable>
              </View>
 
              {/* Search Bar / Tab Launcher Trigger */}
              <Pressable 
                onPress={() => {
                  setLauncherSearchQuery('');
                  setIsLauncherVisible(true);
                  triggerHaptic('light');
                }}
                style={styles.flex1, styles.maxw[288px], styles.minw[160px], styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedFull, styles.px4, styles.py1.5, styles.flexRow, styles.itemsCenter, styles.gap2, styles.active:opacity80}
              >
                <Search size={14} color="#94a3b8" />
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.fontsemibold} numberOfLines={1}>
                  Search admin tabs...
                </Text>
              </Pressable>
            </View>

            <View style={styles.flexRow, styles.itemsCenter, styles.gap4}>
              {/* Theme selector toggle (toggles theme dynamically) */}
              <Pressable 
                onPress={() => {
                  toggleTheme();
                  triggerHaptic('light');
                }}
                style={styles.w8, styles.h8, styles.roundedFull, styles.bgslate100, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate200, styles.dark:borderzinc700, styles.active:scale95}
              >
                {isDarkMode ? (
                  <Sun size={14} color="#fbbf24" />
                ) : (
                  <Moon size={14} color="#3b82f6" />
                )}
              </Pressable>

              {/* User details */}
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2.5}>
                <View style={styles.w8, styles.h8, styles.roundedFull, styles.bgslate200, styles.dark:bgzinc850, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate300, styles.dark:borderzinc700}>
                  <Text style={styles.textslate700, styles.dark:textzinc300, styles.fontbold, styles.textCustom10}>
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.textslate700, styles.dark:textzinc200, styles.fontextrabold, styles.textxs}>{user?.name || 'Administrator'}</Text>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider}>{user?.role || 'Admin'}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogoutPress}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: 'THEME.COLORS.brand.primary',
                  backgroundColor: 'transparent',
                  zIndex: 9999
                }}
              >
                <Text style={{ color: 'THEME.COLORS.brand.primary', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Centered Container */}
          <View style={styles.maxw5xl, styles.wfull, styles.mxauto, styles.px8, styles.pt8}>
            {/* Page Title & Store Switches */}
            <View style={styles.mb6, styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.flexWrap, styles.gap4}>
              <View style={{ flex: 1, minWidth: 280 }}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.text2xl}>Admin Console</Text>
                <Text style={styles.textslate500, styles.dark:textzinc400, styles.textxs, styles.fontsemibold, styles.mt1}>Welcome, Admin. Manage store status, pricing, inventory and customers.</Text>
              </View>
              {/* Toggle Switches */}
              <View style={styles.flexRow, styles.itemsCenter, styles.gap4, styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.p2, styles.px4, styles.rounded2Xl}>
                <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                  <Text style={styles.textxs, styles.fontextrabold, styles.textslate700, styles.dark:textzinc300}>🛒 Grocery Mart</Text>
                  <Switch
                    value={groceryOpenState}
                    onValueChange={(val) => handleToggleStoreStatus('grocery', val)}
                    thumbColor={groceryOpenState ? '#10b981' : '#94a3b8'}
                    trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                  />
                </View>
                {/* Vertical Divider */}
                <View style={styles.w[1.2px], styles.h6, styles.bgslate200, styles.dark:bgzinc800} />
                <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                  <Text style={styles.textxs, styles.fontextrabold, styles.textslate700, styles.dark:textzinc300}>☕ Cafe Open</Text>
                  <Switch
                    value={cafeOpenState}
                    onValueChange={(val) => handleToggleStoreStatus('cafe', val)}
                    thumbColor={cafeOpenState ? '#10b981' : '#94a3b8'}
                    trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                  />
                </View>
              </View>
            </View>

            {/* 3 Stats Cards Grid */}
            <View style={styles.flexRow, styles.flexWrap, styles.gap4, styles.mb8}>
              {statsList.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <View 
                    key={idx} 
                    style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.rounded2Xl, styles.p5, styles.flexRow, styles.itemsCenter, styles.gap4, styles.shadowxs}
                    style={{ width: isWeb ? 'calc(33.333% - 11px)' : '31.5%', minWidth: isWeb ? 160 : 'none' } as any}
                  >
                    <View 
                      style={styles.w12, styles.h12, styles.rounded2Xl, styles.itemsCenter, styles.justifyCenter}
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Icon size={18} color={stat.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.textslate500, styles.dark:textslate400, styles.dark:textzinc500, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider}>{stat.label}</Text>
                      <Text style={styles.textslate800, styles.dark:textwhite, styles.fontblack, styles.textxl, styles.mt1}>{stat.value}</Text>
                      {stat.subtext && (
                        <Text style={styles.textslate450, styles.dark:textzinc500, styles.fontbold, styles.text[8.2px], styles.mt1} numberOfLines={1}>{stat.subtext}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 4 Category Hub Grid */}
            <View style={styles.flexRow, styles.flexWrap, styles.gap4, styles.mb6}>
              {hubCategories.map((hub) => {
                const isSelected = activeHub === hub.id;
                const Icon = hub.icon;
                return (
                  <Pressable
                    key={hub.id}
                    onPress={() => {
                      setActiveHub(hub.id);
                      setActiveTab(hub.defaultTab as any);
                      triggerHaptic('light');
                    }}
                    style={[
                    styles.p5,
                    styles.rounded2Xl,
                    styles.border,
                    styles.flexRow,
                    styles.itemsCenter,
                    styles.gap4,
                    isSelected
                      ? [
                          { backgroundColor: hub.color },
                          { borderColor: hub.activeBorder },
                          styles.shadowMd,
                        ]
                      : [styles.bgwhite, styles.dark:bgzinc900, styles.shadowSm],
                  ]}