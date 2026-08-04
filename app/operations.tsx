import { View, Text, Pres
import { StyleSheet } from 'react-native';
import { THEME } from '../../lib/theme';
able, ScrollView, TextInput, ActivityIndicator, Dimensions, Alert, Modal, Switch, Platform, Linking, useWindowDimensions, TouchableOpacity, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
                    className={`p-5 rounded-2xl border flex-row items-center gap-4 transition-all ${
                      isSelected 
                        ? `bg-gradient-to-br ${hub.color} ${hub.activeBorder} shadow-md` 
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                    style={{ width: isWeb ? 'calc(50% - 8px)' : '48%', cursor: 'pointer' } as any}
                  >
                    <View 
                      style={w-12 h-12 rounded-2xl items-center justify-center ${
                        isSelected ? [styles.bgwhite90, styles.dark:bgzinc80080, styles.shadowxs] : [styles.bgslate100, styles.dark:bgzinc800]
                      }}
                    >
                      <Icon size={18} color={isSelected ? hub.iconColor : '#64748b'} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={font-extrabold text-sm leading-tight ${isSelected ? [styles.textslate900, styles.dark:textwhite] : [styles.textslate800, styles.dark:textwhite]}}>{hub.title}</Text>
                      <Text style={text-[10px] font-semibold mt-1 leading-normal ${isSelected ? [styles.textslate600, styles.dark:textslate300] : [styles.textslate500, styles.dark:textslate400]}} numberOfLines={2}>
                        {hub.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Sub-Tabs Row */}
            {activeHub !== null && (
              <View style={styles.bgslate150, styles.dark:bgzinc90060, styles.p1, styles.roundedFull, styles.mb6, styles.flexRow, styles.selfStart, styles.gap1, styles.flexWrap, styles.border, styles.borderslate20030, styles.dark:borderzinc80040}>
                {activeHubDetails.tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => {
                        setActiveTab(tab.id as any);
                        triggerHaptic('light');
                      }}
                      style={px-4 py-1.5 rounded-full flex-row items-center gap-1.5 transition-all ${
                        isActive 
                          ? [styles.bgindigo600, styles.dark:bgindigo550, styles.shadowSm] 
                          : [styles.bgtransparent]
                      }}
                      style={{ cursor: 'pointer' } as any}
                    >
                      {tab.emoji && <Text style={{ fontSize: 11 }}>{tab.emoji}</Text>}
                      <Text style={text-[10px] font-black uppercase tracking-wider ${
                        isActive ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                      }}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Workspace Area Box */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.rounded2Xl, styles.p6, styles.shadowSm}>
              <WorkspaceContainer style={styles.flex1} showsVerticalScrollIndicator={false}>
                {renderWorkspaceContent()}
              </WorkspaceContainer>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ------------------- MOBILE VIEW ------------------- */
        (!user || user.role === 'ADMIN') ? (
          <ScrollView 
            style={styles.flex1} 
            contentContainerStyle={{ paddingBottom: 80 }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Mobile Header Bar */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.borderb, styles.borderslate200, styles.dark:borderzinc800, styles.shadowxs}>
              {/* Row 1: Logo + Location + Actions */}
              <View style={styles.px4, styles.pt3, styles.pb2, styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
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
                    style={styles.flexRow, styles.itemsCenter, styles.gap1.5}
                  >
                    <MapPin size={14} color="#e20a22" />
                    <View>
                      <Text style={styles.textslate800, styles.dark:textzinc100, styles.fontextrabold, styles.textxs}>
                        Fast Delivery
                      </Text>
                      <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                        <Text style={styles.textslate400, styles.dark:textzinc400, styles.textCustom10, styles.fontbold, styles.maxw[120px]} numberOfLines={1}>
                          {formatHeaderAddress(selectedLocation)}
                        </Text>
                        <ChevronDown size={8} color="#94a3b8" />
                      </View>
                    </View>
                  </Pressable>
                </View>

                <View style={styles.flexRow, styles.itemsCenter, styles.gap2.5}>
                  <Pressable 
                    onPress={() => {
                      toggleTheme();
                      triggerHaptic('light');
                    }}
                    style={styles.w9, styles.h9, styles.roundedFull, styles.bgslate100, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate200, styles.dark:borderzinc700, styles.active:scale95}
                  >
                    {isDarkMode ? (
                      <Sun size={15} color="#fbbf24" />
                    ) : (
                      <Moon size={15} color="#3b82f6" />
                    )}
                  </Pressable>

                  {/* User Avatar */}
                  <View style={styles.w9, styles.h9, styles.roundedFull, styles.bgslate200, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate300, styles.dark:borderzinc700}>
                    <Text style={styles.textslate700, styles.dark:textzinc300, styles.fontblack, styles.textCustom10}>
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Full-width search bar */}
              <View style={styles.px4, styles.pb3}>
                <Pressable 
                  onPress={() => {
                    setLauncherSearchQuery('');
                    setIsLauncherVisible(true);
                    triggerHaptic('light');
                  }}
                  style={styles.wfull, styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px4, styles.py2.5, styles.flexRow, styles.itemsCenter, styles.gap2.5, styles.active:opacity80}
                >
                  <Search size={15} color="#94a3b8" />
                  <Text style={styles.textslate400, styles.dark:textzinc500, styles.textxs, styles.fontsemibold, styles.flex1} numberOfLines={1}>
                    Search tabs, settings, inventory...
                  </Text>
                  <View style={styles.bgslate200, styles.dark:bgzinc700, styles.px2, styles.py0.5, styles.rounded}>
                    <Text style={styles.textslate500, styles.dark:textzinc400, styles.textCustom8, styles.fontblack}>⌘K</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.px4, styles.pt5, styles.mb4}>
              <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.text2xl}>Admin Console</Text>
                <Pressable
                  onPress={handleLogoutPress}
                  style={styles.px3.5, styles.py1.5, styles.roundedFull, styles.border, styles.borderred50030, styles.active:bgred50010}
                >
                  <Text style={styles.textred500, styles.fontblack, styles.textCustom10, styles.uppercase, styles.trackingwider}>Log Out</Text>
                </Pressable>
              </View>
              <Text style={styles.textslate500, styles.dark:textzinc400, styles.textxs, styles.fontsemibold, styles.mt1}>Welcome, {user?.name || 'Admin'}. Manage store, inventory & customers.</Text>
            </View>

            {/* Store Switches Bar (Mobile) */}
            <View style={styles.mx4, styles.mb4, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.bgslate50, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p2.5, styles.px4, styles.rounded2Xl, styles.shadowxs}>
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flex1, styles.justifyCenter}>
                <Text style={styles.textxs, styles.fontextrabold, styles.textslate700, styles.dark:textzinc300}>🛒 Grocery Mart</Text>
                <Switch
                  value={groceryOpenState}
                  onValueChange={(val) => handleToggleStoreStatus('grocery', val)}
                  thumbColor={groceryOpenState ? '#10b981' : '#94a3b8'}
                  trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                />
              </View>
              {/* Vertical Divider */}
              <View style={styles.w[1.2px], styles.h6, styles.bgslate200, styles.dark:bgzinc805, styles.mx2} />
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flex1, styles.justifyCenter}>
                <Text style={styles.textxs, styles.fontextrabold, styles.textslate700, styles.dark:textzinc300}>☕ Cafe Open</Text>
                <Switch
                  value={cafeOpenState}
                  onValueChange={(val) => handleToggleStoreStatus('cafe', val)}
                  thumbColor={cafeOpenState ? '#10b981' : '#94a3b8'}
                  trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                />
              </View>
            </View>

            {/* 3 Stats Cards Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 24 }}>
              {statsList.map((stat, idx) => {
                const Icon = stat.icon;
                const cardWidth = windowWidth >= 768 ? (windowWidth - 52) / 3 : (windowWidth - 42) / 2;
                return (
                  <Animated.View 
                    key={idx}
                    entering={FadeInDown.delay(idx * 40).duration(200)}
                    style={{ width: (windowWidth < 768 && idx === 2) ? '100%' : cardWidth }}
                  >
                    <View 
                      style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p4, styles.flexRow, styles.itemsCenter, styles.gap3}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.03,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <View 
                        style={styles.w10, styles.h10, styles.roundedXl, styles.itemsCenter, styles.justifyCenter}
                        style={{ backgroundColor: stat.bg }}
                      >
                        <Icon size={16} color={stat.color} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.textslate400, styles.dark:textzinc500, styles.fontblack, styles.textCustom8, styles.uppercase, styles.trackingwider} numberOfLines={1}>{stat.label}</Text>
                        <Text style={styles.textslate800, styles.dark:textwhite, styles.fontblack, styles.textbase, styles.mt0.5} numberOfLines={1}>{stat.value}</Text>
                        {stat.subtext && (
                          <Text style={styles.textslate450, styles.dark:textzinc650, styles.fontbold, styles.text[7.5px], styles.mt0.5} numberOfLines={1}>{stat.subtext}</Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            {/* 4 Category Hub Stack (full-width on mobile) */}
            <View style={styles.px4, styles.mb6} style={{ gap: 10 }}>
              {hubCategories.map((hub, hIdx) => {
                const isSelected = activeHub === hub.id;
                const Icon = hub.icon;
                return (
                  <Animated.View
                    key={hub.id}
                    entering={FadeInDown.delay(hIdx * 50).duration(200)}
                  >
                    <Pressable
                      onPress={() => {
                        setActiveHub(hub.id);
                        setActiveTab(hub.defaultTab as any);
                        triggerHaptic('light');
                      }}
                      style={({ pressed }) => [{
                        borderRadius: 16,
                        overflow: 'hidden',
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? hub.nativeBorder : (isDarkMode ? ''#FFFFFF0F'' : ''#0000000F''),
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      }]}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={hub.nativeGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                      )}
                      <View
                        style={p-4 flex-row items-center gap-4 ${!isSelected ? [styles.bgwhite, styles.dark:bgzinc900] : ''}}
                      >
                        <View 
                          style={w-11 h-11 rounded-xl items-center justify-center ${
                            isSelected ? [styles.bgwhite90, styles.dark:bgzinc80080] : [styles.bgslate100, styles.dark:bgzinc800]
                          }}
                          style={isSelected ? { shadowColor: hub.iconColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 } : undefined}
                        >
                          <Icon size={16} color={isSelected ? hub.iconColor : '#64748b'} />
                        </View>
                        <View style={styles.flex1}>
                          <Text style={font-black text-sm leading-tight ${isSelected ? [styles.textslate900, styles.dark:textwhite] : [styles.textslate700, styles.dark:textzinc200]}}>{hub.title}</Text>
                          <Text style={text-[10px] font-semibold mt-1 leading-normal ${isSelected ? [styles.textslate600, styles.dark:textzinc300] : [styles.textslate400, styles.dark:textzinc500]}} numberOfLines={2}>
                            {hub.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <ChevronRight size={14} color={hub.iconColor} />
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Sub-Tabs Pill Row (Scrollable on mobile) */}
            {activeHub !== null && (
              <View style={styles.mx4, styles.mb5}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                >
                  {activeHubDetails.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => {
                          setActiveTab(tab.id as any);
                          triggerHaptic('light');
                        }}
                        style={px-4 py-2 rounded-full flex-row items-center gap-1.5 border active:scale-95 transition-all ${
                          isActive 
                            ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                            : [styles.bgslate50, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                        }}
                        style={({ pressed }) => ({
                          transform: [{ scale: pressed ? 0.96 : 1 }]
                        })}
                      >
                        {tab.emoji && <Text style={{ fontSize: 11 }}>{tab.emoji}</Text>}
                        <Text style={text-[10px] font-black uppercase tracking-wider ${
                          isActive ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                        }}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Workspace Area Box */}
            <View 
              style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.mx4, styles.mb8}
              style={{
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View style={styles.flex1}>
                {renderWorkspaceContent()}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Worker Mode (Non-Admin View) */
          <>
            {/* Simple Mobile Header */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.px4, styles.py4, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.borderb, styles.borderslate100, styles.dark:borderzinc800}>
              <View style={styles.flexRow, styles.itemsCenter, styles.gap3}>
                <View style={styles.px2.5, styles.py1, styles.rounded, styles.bgslate800, styles.border, styles.borderslate700}>
                  <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom8, styles.trackingwider, styles.uppercase}>
                    {user.role}
                  </Text>
                </View>
                <View>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>
                    {renderActiveTitle()}
                  </Text>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontbold, styles.trackingwide, styles.mt0.5}>
                    {renderActiveDescription()}
                  </Text>
                </View>
              </View>
              
              <Pressable 
                onPress={handleLogoutPress}
                style={styles.px3, styles.py1.5, styles.roundedlg, styles.bgred60015, styles.border, styles.borderred50025, styles.active:bgred60030}
              >
                <Text style={styles.textred500, styles.fontbold, styles.textxs}>Log Out</Text>
              </Pressable>
            </View>

            {/* Workspace Content for Workers (scrollable) */}
            <WorkspaceContainer style={styles.flex1, styles.p4} showsVerticalScrollIndicator={false}>
              {renderWorkspaceContent()}
            </WorkspaceContainer>
          </>
        )
      )}
    </SafeAreaView>
  );

  function renderWorkspaceContent() {
    if (isTransitioning) {
      return (
        <View style={styles.flex1, styles.justifyCenter, styles.itemsCenter, styles.py20, styles.gap3} style={{ minHeight: 350 }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.textslate500, styles.dark:textzinc400, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwidest}>
            Loading Workspace...
          </Text>
        </View>
      );
    }

    if (!activeHub) {
      return (
        <View style={styles.flex1, styles.justifyCenter, styles.itemsCenter, styles.py16, styles.px4, styles.gap4} style={{ minHeight: 350 }}>
          <View style={styles.w16, styles.h16, styles.roundedFull, styles.bgslate50, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate200, styles.dark:borderzinc700}>
            <Sliders size={28} color="#6366f1" />
          </View>
          <View style={styles.itemsCenter}>
            <Text style={styles.textslate800, styles.dark:textwhite, styles.fontblack, styles.textlg, styles.textCenter}>Welcome to Admin Console</Text>
            <Text style={styles.textslate450, styles.dark:textzinc500, styles.fontsemibold, styles.textxs, styles.mt1.5, styles.textCenter, styles.leadingnormal, styles.maxwsm}>
              Please select one of the hub categories above to load real-time analytics, manage live orders, and monitor staff consoles.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <>
        {activeTab === 'ANALYTICS' && (
              <>
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb1}>
                <View>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Sales & Performance</Text>
                  {pushToken ? (
                  <Text style={styles.textindigo400, styles.fontbold, styles.textCustom8, styles.uppercase, styles.trackingwidest, styles.mt1}>
                    Push Notifications: Active ({pushToken.slice(0, 25)}...)
                  </Text>
                ) : (
                  <Text style={styles.textslate500, styles.fontbold, styles.textCustom8, styles.uppercase, styles.trackingwidest, styles.mt1}>
                    Push Notifications: Not Registered
                  </Text>
                )}
              </View>
              <Pressable 
                onPress={() => fetchAnalyticsData()}
                disabled={isAnalyticsLoading}
                style={styles.p2.5, styles.roundedXl, styles.bgindigo60010, styles.border, styles.borderindigo50020, styles.active:bgindigo60020, styles.flexRow, styles.itemsCenter, styles.gap1.5}
              >
                {isAnalyticsLoading ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <RefreshCw size={12} color="#6366f1" />
                )}
                <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Refresh</Text>
              </Pressable>
            </View>

            {/* AI Stock Depletion & Replenishment Warnings */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p5, styles.shadowSm}>
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.mb3}>
                <Sparkles size={14} color="#6366f1" />
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>AI Stock Replenishment Forecast</Text>
              </View>
              {isAnalyticsLoading ? (
                <ActivityIndicator size="small" color="#6366f1" style={styles.my6} />
              ) : stockForecast.filter(f => !f.isCafe && (f.isUrgent || f.stock === 0)).length === 0 ? (
                <View style={styles.py4, styles.itemsCenter}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.fontsemibold}>🌱 All inventory levels healthy. No predicted stockouts.</Text>
                </View>
              ) : (
                <View style={styles.gap3, styles.mt1}>
                  {stockForecast.filter(f => !f.isCafe && (f.isUrgent || f.stock === 0)).slice(0, 4).map((product) => {
                    const runoutStr = product.stock === 0 ? 'Out of Stock' : product.daysToDepletion !== null ? `${product.daysToDepletion.toFixed(1)} days to stockout` : 'Stable';
                    const runoutColor = product.stock === 0 ? 'border-red-500/25 bg-red-500/10' : 'border-amber-500/25 bg-amber-500/10';
                    const runoutTextColor = product.stock === 0 ? 'text-red-400' : 'text-amber-400';

                    return (
                      <View key={product.id} style={styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.bgslate50, styles.dark:bgzinc95040, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p3, styles.rounded2Xl}>
                        <View style={styles.flex1, styles.pr2}>
                          <Text style={styles.textslate800, styles.dark:textslate700, styles.dark:textslate200, styles.fontbold, styles.textxs}>{product.name}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>
                            Stock: <Text className={product.stock === 0 ? 'text-red-500 font-black' : 'text-slate-800 dark:text-slate-700 dark:text-slate-200'}>{product.stock}</Text> • Velocity: {product.velocity.toFixed(2)}/day
                          </Text>
                          <View style={styles.flexRow, styles.gap2, styles.mt2}>
                            <View style={px-2 py-0.5 rounded-full border ${runoutColor}}>
                              <Text style={font-extrabold text-[8px] uppercase tracking-wider ${runoutTextColor}}>{runoutStr}</Text>
                            </View>
                            <View style={styles.px2, styles.py0.5, styles.roundedFull, styles.bgindigo50010, styles.border, styles.borderindigo50020}>
                              <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom8, styles.uppercase, styles.trackingwider}>Suggests: +{product.suggestedRestock}</Text>
                            </View>
                          </View>
                        </View>

                        {product.suggestedRestock > 0 && (
                          <Pressable
                            disabled={isInwardingForecast === product.id}
                            onPress={() => handleAppRestock(product)}
                            style={styles.bgindigo655, styles.bgindigo600, styles.px3, styles.py2, styles.roundedXl, styles.active:bgindigo700, styles.disabled:bgslate800}
                          >
                            {isInwardingForecast === product.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Restock</Text>
                            )}
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Sales Revenue Weekly Bar Chart */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p5, styles.shadowSm}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Weekly Sales Revenue (Mon - Sun)</Text>
              <View style={styles.flexRow, styles.itemsEnd, styles.justifyBetween, styles.h36, styles.px2, styles.mt4}>
                {weeklySalesData.map((item, idx) => {
                  const maxVal = Math.max(...weeklySalesData.map(d => d.value), 1000) || 1000;
                  const pct = Math.round((item.value / maxVal) * 100);
                  return (
                    <View key={idx} style={styles.itemsCenter, styles.flex1}>
                      <View style={styles.w4, styles.bgslate100, styles.dark:bgslate950, styles.roundedTlG, styles.h24, styles.justifyEnd}>
                        <View style={{ height: `${pct}%` }} style={styles.wfull, styles.bgindigo600, styles.roundedTlG} />
                      </View>
                      <Text style={styles.textslate500, styles.fontbold, styles.textCustom8, styles.mt2}>{item.day}</Text>
                      <Text style={styles.textslate700, styles.dark:textslate200, styles.fontblack, styles.textCustom7, styles.mt0.5}>₹{(item.value/1000).toFixed(1)}k</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Category Distribution stacked bar */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p5, styles.shadowSm, styles.mt1}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb4}>Category Order Share</Text>
              <View style={styles.h6, styles.wfull, styles.roundedFull, styles.bgslate100, styles.dark:bgslate950, styles.flexRow, styles.overflowHidden}>
                {categoryShareData.map((item, idx) => (
                  <View key={idx} style={{ width: `${item.pct}%` }} style={${item.color} h-full} />
                ))}
              </View>
              {/* Legend */}
              <View style={styles.flexRow, styles.flexWrap, styles.gapx4, styles.gapy2, styles.mt4}>
                {categoryShareData.map((leg, idx) => (
                  <View key={idx} style={styles.flexRow, styles.itemsCenter, styles.gap1.5}>
                    <View style={w-2 h-2 rounded-full ${leg.color}} />
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.fontsemibold, styles.textCustom10}>{leg.label} ({Math.round(leg.pct)}%)</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.flexRow, styles.flexWrap, styles.justifyBetween, styles.gap3}>
              {[
                { label: 'Grocery Revenue', value: formatPrice(analyticsStats.groceryRevenue), subtext: `Rest: ${formatPrice(analyticsStats.restaurantRevenue)} | Cafe: ${formatPrice(analyticsStats.cafeRevenue)}`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: IndianRupee },
                { label: 'Grocery Orders', value: String(analyticsStats.groceryTotalOrders), subtext: `Rest: ${analyticsStats.restaurantTotalOrders} | Cafe: ${analyticsStats.cafeTotalOrders}`, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Package },
                { label: 'Registered Users', value: String(analyticsStats.userCount), color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Users },
                { label: 'Low Stock Items', value: String(analyticsStats.lowStockCount), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Barcode },
                { label: 'Active Coupons', value: String(analyticsStats.couponCount), color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Ticket }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <View key={idx} style={{ width: '47%' }} style={p-4 rounded-2xl border ${stat.color} shadow-xs}>
                    <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb1.5}>
                      <Text style={styles.textslate500, styles.fontextrabold, styles.textCustom8, styles.uppercase, styles.trackingwider}>{stat.label}</Text>
                      <Icon size={12} style={styles.opacity80} />
                    </View>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.min[375px]:textbase}>{stat.value}</Text>
                    {stat.subtext && (
                      <Text style={styles.textslate450, styles.dark:textslate400, styles.fontbold, styles.text[7.5px], styles.mt1} numberOfLines={1}>{stat.subtext}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Recent Orders List */}
            <View style={styles.mt2}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mb3}>Recent Sales Orders</Text>
              {isAnalyticsLoading ? (
                <View style={styles.py10, styles.itemsCenter}>
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              ) : recentOrders.length === 0 ? (
                <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p6, styles.itemsCenter}>
                  <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textxs, styles.textCenter}>No orders recorded on server yet.</Text>
                </View>
              ) : (
                <View style={styles.gap3}>
                  {recentOrders.map((ord) => (
                    <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p4, styles.shadowxs}>
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb2, styles.mb2}>
                        <View>
                          <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.uppercase}>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {ord.paymentMethod || 'UPI'}
                          </Text>
                        </View>
                        <View style={px-2 py-0.5 rounded-full border ${
                          ord.status === [styles.DELIVERED] ? [styles.bgemerald50010, styles.borderemerald50020] :
                          ord.status === [styles.CANCELLED] ? [styles.bgred50010, styles.borderred50020] :
                          [styles.bgamber50010, styles.borderamber50020]
                        }}>
                          <Text style={font-extrabold text-[8px] uppercase tracking-wider text-center ${
                            ord.status === [styles.DELIVERED] ? [styles.textemerald400] :
                            ord.status === [styles.CANCELLED] ? [styles.textred400] :
                            [styles.textamber400]
                          }}>
                            {ord.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mt1}>
                        <View style={styles.flex1, styles.pr2}>
                          <Text style={styles.textslate800, styles.dark:textslate650, styles.dark:textslate300, styles.textxs, styles.fontsemibold}>Customer: {ord.user?.name || ord.userName || 'Anonymous'}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt0.5, styles.truncate} numberOfLines={1}>
                            Address: {ord.address?.houseNo ? `${ord.address.houseNo}, ${ord.address.street}` : 'Pickup'}
                          </Text>
                        </View>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>{formatPrice(ord.total)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ------------------- ORDERS TAB WORKSPACE ------------------- */}
        {activeTab === 'ORDERS' && <OrdersTab />}

        {/* ------------------- BANNERS TAB WORKSPACE ------------------- */}
        {activeTab === 'BANNERS' && (
          <View style={styles.gap5}>
            {/* Header */}
            <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
              <View style={styles.flex1, styles.mr3}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Banner Campaigns</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt0.5}>Manage carousel hero banners on customer home screens.</Text>
              </View>
              <View style={styles.flexRow, styles.gap2}>
                <Pressable
                  onPress={() => { triggerHaptic('light'); fetchBannersData(); }}
                  style={styles.bgslate100, styles.dark:bgzinc800, styles.p2.5, styles.roundedXl, styles.active:bgslate200, styles.dark:active:bgzinc700, styles.border, styles.borderslate200, styles.dark:borderzinc700}
                >
                  <RefreshCw size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    resetBannerForm();
                    setIsBannerModalVisible(true);
                    triggerHaptic('light');
                  }}
                  style={styles.bgindigo600, styles.p2.5, styles.roundedXl, styles.active:bgindigo700, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.shadowxs}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Add Banner</Text>
                </Pressable>
              </View>
            </View>

            {/* Festival Templates */}
            <Pressable
              onPress={() => { setBannerTemplateExpanded(!bannerTemplateExpanded); triggerHaptic('light'); }}
              style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.p4, styles.shadowxs}
            >
              <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                  <Sparkles size={16} color="#f59e0b" />
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Festival Templates</Text>
                  <View style={styles.bgamber50010, styles.px2, styles.py0.5, styles.roundedFull}>
                    <Text style={styles.textamber600, styles.dark:textamber400, styles.textCustom8, styles.fontblack}>{BANNER_FESTIVAL_TEMPLATES.length} PRESETS</Text>
                  </View>
                </View>
                <ChevronDown size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} style={{ transform: [{ rotate: bannerTemplateExpanded ? '180deg' : '0deg' }] }} />
              </View>
              {bannerTemplateExpanded && (
                <View style={styles.mt3, styles.gap2}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium}>Tap a template to auto-fill the banner form.</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mt1}>
                    <View style={styles.flexRow, styles.gap2}>
                      {BANNER_FESTIVAL_TEMPLATES.map((tpl, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            handleBannerApplyTemplate(tpl);
                            setIsBannerModalVisible(true);
                          }}
                          style={styles.bgslate50, styles.dark:bgzinc800, styles.border, styles.borderslate200, styles.dark:borderzinc700, styles.roundedXl, styles.px3, styles.py2.5, styles.active:bgslate100, styles.dark:active:bgzinc700, styles.minw[140px]}
                        >
                          <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textCustom10}>{tpl.name}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontmedium, styles.mt0.5} numberOfLines={2}>{tpl.description}</Text>
                          {tpl.code ? <Text style={styles.textindigo600, styles.dark:textindigo400, styles.textCustom8, styles.fontblack, styles.mt1}>CODE: {tpl.code}</Text> : null}
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </Pressable>

            {/* Loading State */}
            {isBannersLoading && (
              <View style={styles.py10, styles.itemsCenter}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mt2}>Loading banners...</Text>
              </View>
            )}

            {/* Empty State */}
            {!isBannersLoading && banners.length === 0 && (
              <View style={styles.py12, styles.itemsCenter, styles.gap2}>
                <Text style={styles.text3xl}>🎨</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.fontbold}>No promo banners yet.</Text>
                <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom9, styles.fontmedium}>Create one using the button above or a festival template.</Text>
              </View>
            )}

            {/* Banners List */}
            {!isBannersLoading && banners.length > 0 && (
              <View style={styles.gap3, styles.mb10}>
                {banners.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((b: any, idx: number) => (
                  <View key={b.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.overflowHidden, styles.shadowxs}>
                    {/* Banner preview header with gradient */}
                    <View style={h-16 bg-gradient-to-r ${b.gradient || [styles.fromindigo500, styles.topurple500]} justify-center px-4}>
                      <Text style={styles.textwhite, styles.fontblack, styles.textxs} numberOfLines={1}>{b.title}</Text>
                      {b.description ? <Text style={styles.textwhite80, styles.textCustom9, styles.fontsemibold} numberOfLines={1}>{b.description}</Text> : null}
                      {b.code ? (
                        <View style={styles.bgwhite20, styles.selfStart, styles.px2, styles.py0.5, styles.roundedFull, styles.mt1}>
                          <Text style={styles.textwhite, styles.textCustom8, styles.fontblack}>{b.code}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Banner info + actions */}
                    <View style={styles.p3.5}>
                      <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flex1, styles.mr2}>
                          <View style={px-2 py-0.5 rounded-full ${b.isActive ? [styles.bgemerald50010] : [styles.bgslate200, styles.dark:bgzinc800]}}>
                            <Text style={text-[8px] font-black ${b.isActive ? [styles.textemerald600, styles.dark:textemerald400] : [styles.textslate500, styles.dark:textslate400]}}>{b.isActive ? 'ACTIVE' : 'DISABLED'}</Text>
                          </View>
                          <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom8, styles.fontbold}>Sort: {b.sortOrder || 0}</Text>
                          {b.type ? <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom8, styles.fontbold, styles.uppercase}>{b.type}</Text> : null}
                        </View>

                        <View style={styles.flexRow, styles.itemsCenter, styles.gap1.5}>
                          {/* Reorder */}
                          <Pressable
                            onPress={() => handleBannerReorder(b, 'up')}
                            style={styles.p1.5, styles.roundedlg, styles.bgslate100, styles.dark:bgzinc800, styles.border, styles.borderslate200, styles.dark:borderzinc700, styles.active:bgslate200}
                          >
                            <ArrowUp size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleBannerReorder(b, 'down')}
                            style={styles.p1.5, styles.roundedlg, styles.bgslate100, styles.dark:bgzinc800, styles.border, styles.borderslate200, styles.dark:borderzinc700, styles.active:bgslate200}
                          >
                            <ArrowDown size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                          </Pressable>

                          {/* Toggle active */}
                          <Switch
                            value={b.isActive}
                            onValueChange={() => handleBannerToggleActive(b)}
                            trackColor={{ false: '#475569', true: '#818cf8' }}
                            thumbColor={b.isActive ? '#4f46e5' : '#cbd5e1'}
                          />

                          {/* Edit */}
                          <Pressable
                            onPress={() => handleBannerEdit(b)}
                            style={styles.p1.5, styles.roundedlg, styles.bgindigo50010, styles.border, styles.borderindigo50020, styles.active:bgindigo50020}
                          >
                            <Settings size={11} color="#6366f1" />
                          </Pressable>

                          {/* Delete */}
                          <Pressable
                            onPress={() => handleBannerDelete(b.id)}
                            style={styles.p1.5, styles.roundedlg, styles.bgrose50010, styles.border, styles.borderrose50020, styles.active:bgrose50020}
                          >
                            <X size={11} color="#f43f5e" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ------------------- SETTINGS TAB WORKSPACE ------------------- */}
        {activeTab === 'SETTINGS' && (
          <View style={styles.gap6}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.shadowSm}>
              <View style={styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb4, styles.mb4}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Store Settings</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mt1}>Configure live operational parameters, cosmetics, and financials.</Text>
              </View>

              {/* Settings Sub-Tab Switcher (Horizontal Slider) */}
              <View style={styles.mb5}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                >
                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('ops');
                      triggerHaptic('light');
                    }}
                    style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === [styles.ops] 
                        ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                        : [styles.bgslate55, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === [styles.ops] ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                    }}>
                      🚚 Operations
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('pricing');
                      triggerHaptic('light');
                    }}
                    style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === [styles.pricing] 
                        ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                        : [styles.bgslate55, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === [styles.pricing] ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                    }}>
                      💸 Pricing & Charges
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('cosmetics');
                      triggerHaptic('light');
                    }}
                    style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === [styles.cosmetics] 
                        ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                        : [styles.bgslate55, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === [styles.cosmetics] ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                    }}>
                      🎨 Branding
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('greetings');
                      triggerHaptic('light');
                    }}
                    style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === [styles.greetings] 
                        ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                        : [styles.bgslate55, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === [styles.greetings] ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                    }}>
                      👋 Greetings
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('finance');
                      triggerHaptic('light');
                    }}
                    style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === [styles.finance] 
                        ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                        : [styles.bgslate55, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === [styles.finance] ? [styles.textwhite] : [styles.textslate500, styles.dark:textzinc400]
                    }}>
                      🔑 Financials
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {isSettingsLoading ? (
                <View style={styles.py20, styles.itemsCenter, styles.justifyCenter}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.fontsemibold, styles.mt3}>Loading store parameters...</Text>
                </View>
              ) : (
                <View style={styles.gap5}>
                  {/* SUB-TAB 1: OPERATIONS */}
                  {settingsSubTab === 'ops' && (
                    <View style={styles.gap4}>
                      {/* Switches Row */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                        {/* Grocery Status */}
                        <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                          <View style={styles.flex1, styles.pr4}>
                            <Text style={styles.textslate700, styles.dark:textslate200, styles.fontextrabold, styles.textxs}>Grocery Store Status</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium, styles.mt0.5}>Toggle grocery catalog visibility & ordering.</Text>
                          </View>
                          <Switch
                            value={groceryOpenState}
                            onValueChange={setGroceryOpenState}
                            trackColor={{ false: '#334155', true: '#818cf8' }}
                            thumbColor={groceryOpenState ? '#4f46e5' : '#94a3b8'}
                          />
                        </View>
                        
                        <View style={styles.hpx, styles.bgslate80050} />

                        {/* Cafe Status */}
                        <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                          <View style={styles.flex1, styles.pr4}>
                            <Text style={styles.textslate700, styles.dark:textslate200, styles.fontextrabold, styles.textxs}>Cafe Kitchen Status</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium, styles.mt0.5}>Toggle cafe catalog visibility & ordering.</Text>
                          </View>
                          <Switch
                            value={cafeOpenState}
                            onValueChange={setCafeOpenState}
                            trackColor={{ false: '#334155', true: '#f43f5e' }}
                            thumbColor={cafeOpenState ? '#e11d48' : '#94a3b8'}
                          />
                        </View>

                        <View style={styles.hpx, styles.bgslate80050} />

                        {/* Only COD Status */}
                        <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                          <View style={styles.flex1, styles.pr4}>
                            <Text style={styles.textslate700, styles.dark:textslate200, styles.fontextrabold, styles.textxs}>Only Cash on Delivery</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium, styles.mt0.5}>Force all orders to use Cash on Delivery only.</Text>
                          </View>
                          <Switch
                            value={onlyCod}
                            onValueChange={setOnlyCod}
                            trackColor={{ false: '#334155', true: '#10b981' }}
                            thumbColor={onlyCod ? '#059669' : '#94a3b8'}
                          />
                        </View>
                      </View>

                      {/* Text inputs */}
                      <View style={styles.gap4}>
                        {/* Delivery Radius */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Delivery Service Radius (KM) *</Text>
                          <TextInput
                            value={radiusState}
                            onChangeText={setRadiusState}
                            keyboardType="numeric"
                            placeholder="5.0"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        {/* Latitude & Longitude */}
                        <View style={styles.flexRow, styles.gap3}>
                          <View style={styles.flex1}>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Store Latitude (GPS) *</Text>
                            <TextInput
                              value={storeLat}
                              onChangeText={setStoreLat}
                              placeholder="26.1534185"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View style={styles.flex1}>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Store Longitude (GPS) *</Text>
                            <TextInput
                              value={storeLng}
                              onChangeText={setStoreLng}
                              placeholder="80.1714024"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                        </View>

                        {/* Contact details */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Contact Phone *</Text>
                          <TextInput
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            placeholder="+91 70544 70303"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Contact Email *</Text>
                          <TextInput
                            value={contactEmail}
                            onChangeText={setContactEmail}
                            placeholder="help@fastkirana.com"
                            placeholderTextColor="#475569"
                            keyboardType="email-address"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Contact Timings *</Text>
                          <TextInput
                            value={contactTimings}
                            onChangeText={setContactTimings}
                            placeholder="6 AM - 12 AM"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Contact Address *</Text>
                          <TextInput
                            value={contactAddress}
                            onChangeText={setContactAddress}
                            placeholder="NH34, Ghatampur, Kanpur Nagar"
                            placeholderTextColor="#475569"
                            multiline
                            numberOfLines={2}
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textwhite, styles.fontsemibold, styles.textxs}
                          />
                        </View>
                      </View>

                      {/* Operational Limits & Surges */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4, styles.mt2}>
                        <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontblack, styles.textCustom10, styles.uppercase, styles.trackingwider}>🏪 Operational Limits & Surges</Text>
                        
                        {/* Minimum Order Value */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Minimum Order Value (₹) *</Text>
                          <TextInput
                            value={minOrderValueState}
                            onChangeText={setMinOrderValueState}
                            keyboardType="numeric"
                            placeholder="99"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View style={styles.hpx, styles.bgslate20010} />

                        {/* Operating Hours */}
                        <View style={styles.flexRow, styles.gap3}>
                          <View style={styles.flex1}>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Store Open Hour (24h) *</Text>
                            <TextInput
                              value={storeOpenHourState}
                              onChangeText={setStoreOpenHourState}
                              keyboardType="numeric"
                              placeholder="7"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View style={styles.flex1}>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Store Close Hour (24h) *</Text>
                            <TextInput
                              value={storeCloseHourState}
                              onChangeText={setStoreCloseHourState}
                              keyboardType="numeric"
                              placeholder="23"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                        </View>

                        <View style={styles.hpx, styles.bgslate20010} />

                        {/* Holiday Calendar */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Holiday Dates (comma-separated YYYY-MM-DD)</Text>
                          <TextInput
                            value={holidaysState}
                            onChangeText={setHolidaysState}
                            placeholder="e.g. 2026-01-26, 2026-08-15"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View style={styles.hpx, styles.bgslate20010} />

                        {/* Surge Multiplier */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Surge Price Multiplier (e.g. 1.2 for 20% extra) *</Text>
                          <TextInput
                            value={surgeMultiplierState}
                            onChangeText={setSurgeMultiplierState}
                            keyboardType="numeric"
                            placeholder="1.0"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>
                      </View>

                      {/* Category status configuration */}
                      {categories.length > 0 && (
                        <View style={styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.pt4, styles.mt2}>
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.mb3}>🏪 Category-Wise Status (Open/Closed)</Text>
                          <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                            {categories.map((cat) => (
                              <View key={cat.id} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                                <View style={styles.flex1, styles.pr4}>
                                  <Text style={styles.textslate700, styles.dark:textslate200, styles.fontbold, styles.textxs}>{cat.name}</Text>
                                  <Text style={styles.textslate500, styles.textCustom8, styles.fontsemibold, styles.mt0.5}>slug: {cat.slug}</Text>
                                </View>
                                <Switch
                                  value={categoryStatuses[cat.slug] !== false}
                                  onValueChange={(isOpen) => {
                                    setCategoryStatuses((prev) => ({
                                      ...prev,
                                      [cat.slug]: isOpen,
                                    }));
                                  }}
                                  trackColor={{ false: '#334155', true: '#818cf8' }}
                                  thumbColor={categoryStatuses[cat.slug] !== false ? '#4f46e5' : '#94a3b8'}
                                />
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* SUB-TAB: PRICING & CHARGES CONTROL */}
                  {settingsSubTab === 'pricing' && (
                    <View style={styles.gap5}>
                      {/* Delivery Fee & Free Delivery Thresholds Card */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                        <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>🚚 Delivery Charges & Free Delivery Thresholds</Text>
                        
                        {/* Base Delivery Fee */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Standard Delivery Fee (₹) *</Text>
                          <TextInput
                            value={deliveryFeeState}
                            onChangeText={setDeliveryFeeState}
                            keyboardType="numeric"
                            placeholder="25"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                          <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom9, styles.mt1, styles.fontmedium}>Standard delivery fee charged to customer when order is below free delivery threshold.</Text>
                        </View>

                        <View style={styles.hpx, styles.bgslate20010} />

                        {/* Grocery Free Delivery Threshold */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Grocery Free Delivery Minimum (₹) *</Text>
                          <TextInput
                            value={groceryThresholdState}
                            onChangeText={setGroceryThresholdState}
                            keyboardType="numeric"
                            placeholder="199"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                          <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom9, styles.mt1, styles.fontmedium}>Minimum Grocery cart subtotal required for customer to get FREE delivery.</Text>
                        </View>

                        <View style={styles.hpx, styles.bgslate20010} />

                        {/* Cafe Free Delivery Threshold */}
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Cafe / Restaurant Free Delivery Minimum (₹) *</Text>
                          <TextInput
                            value={cafeThresholdState}
                            onChangeText={setCafeThresholdState}
                            keyboardType="numeric"
                            placeholder="199"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                          <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom9, styles.mt1, styles.fontmedium}>Minimum Cafe cart subtotal required for customer to get FREE delivery.</Text>
                        </View>
                      </View>

                      {/* Estimated Delivery Time Card */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                        <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>⏱️ Delivery Time & Speed Display</Text>
                        
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Average Delivery Time String *</Text>
                          <TextInput
                            value={avgDeliveryTime}
                            onChangeText={setAvgDeliveryTime}
                            placeholder="e.g. 8 min or 10-15 mins"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                          <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom9, styles.mt1, styles.fontmedium}>Prominently displayed in customer app header, live ticker, cart footer, and checkout.</Text>
                        </View>
                      </View>

                      {/* Handling Charges & Taxes Card */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                        <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>💳 Handling Charges & Taxes</Text>
                        
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Handling / Packaging Charge (₹) *</Text>
                          <TextInput
                            value={miscFee}
                            onChangeText={setMiscFee}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Handling Fee Display Label *</Text>
                          <TextInput
                            value={miscFeeLabel}
                            onChangeText={setMiscFeeLabel}
                            placeholder="Packaging Charge"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>GST / Tax Rate (%) *</Text>
                          <TextInput
                            value={taxRate}
                            onChangeText={setTaxRate}
                            keyboardType="numeric"
                            placeholder="5"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>
                      </View>

                      {/* Dynamic Order Limits & Surges Card */}
                      <View style={styles.bgslate50, styles.dark:bgslate95040, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc85060, styles.gap4}>
                        <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>⚡ Dynamic Order Limits & Surge Pricing</Text>
                        
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Minimum Order Value (₹) *</Text>
                          <TextInput
                            value={minOrderValueState}
                            onChangeText={setMinOrderValueState}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Surge Price Multiplier (e.g. 1.2 for 20% extra) *</Text>
                          <TextInput
                            value={surgeMultiplierState}
                            onChangeText={setSurgeMultiplierState}
                            keyboardType="numeric"
                            placeholder="1.0"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* SUB-TAB 2: BRANDING */}
                  {settingsSubTab === 'cosmetics' && (
                    <View style={styles.gap4}>
                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Deliveries Counter *</Text>
                        <TextInput
                          value={deliveriesCount}
                          onChangeText={setDeliveriesCount}
                          placeholder="e.g. 10,000+"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Store Rating *</Text>
                        <TextInput
                          value={ratingValue}
                          onChangeText={setRatingValue}
                          placeholder="e.g. 4.8"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Happy Families Counter *</Text>
                        <TextInput
                          value={happyFamilies}
                          onChangeText={setHappyFamilies}
                          placeholder="e.g. 5,000+"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Social Proof Strip Text *</Text>
                        <TextInput
                          value={trustedText}
                          onChangeText={setTrustedText}
                          placeholder="e.g. ✨ Trusted by 5,000+ families in your town"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textwhite, styles.fontsemibold, styles.textxs}
                        />
                      </View>

                      {/* Live Ticker Settings */}
                      <View style={styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.pt4, styles.mt2, styles.gap4}>
                        <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.mb1}>⚡ Live Speed Ticker Strip Settings</Text>
                        
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Average Delivery Time *</Text>
                          <TextInput
                            value={avgDeliveryTime}
                            onChangeText={setAvgDeliveryTime}
                            placeholder="e.g. 8 min"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Delivered Today Counter *</Text>
                          <TextInput
                            value={deliveredToday}
                            onChangeText={setDeliveredToday}
                            placeholder="e.g. 1,231+"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Fresh Stock Loaded Indicator *</Text>
                          <TextInput
                            value={freshStockLoaded}
                            onChangeText={setFreshStockLoaded}
                            placeholder="e.g. 2 hrs ago"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>
                      </View>

                      {/* Live Preview section */}
                      <View style={styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.pt4, styles.mt2, styles.gap3}>
                        <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs}>👀 Live Preview (Home Banners)</Text>
                        
                        {/* Stats Bar Preview */}
                        <View style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.itemsCenter}>
                          <Text style={styles.textslate500, styles.fontbold, styles.textCustom8, styles.uppercase, styles.trackingwidest, styles.mb2.5}>Home page Stats Bar</Text>
                          <View style={styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap4, styles.py2.5, styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.roundedXl, styles.px3, styles.wfull}>
                            <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                              <Package size={12} color="#6366f1" />
                              <Text style={styles.textwhite, styles.fontblack, styles.textCustom10}>{deliveriesCount}</Text>
                              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium}>Deliveries</Text>
                            </View>
                            <View style={styles.h3, styles.wpx, styles.bgslate800} />
                            <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                              <Star size={12} color="#fbbf24" fill="#fbbf24" />
                              <Text style={styles.textwhite, styles.fontblack, styles.textCustom10}>{ratingValue}★</Text>
                              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium}>Rating</Text>
                            </View>
                            <View style={styles.h3, styles.wpx, styles.bgslate800} />
                            <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                              <Heart size={12} color="#ec4899" fill="#ec4899" />
                              <Text style={styles.textwhite, styles.fontblack, styles.textCustom10}>{happyFamilies}</Text>
                              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontmedium}>Families</Text>
                            </View>
                          </View>
                        </View>

                        {/* Social Proof Strip Preview */}
                        <View style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.itemsCenter}>
                          <Text style={styles.textslate500, styles.fontbold, styles.textCustom8, styles.uppercase, styles.trackingwidest, styles.mb2.5}>Footer Social Proof Bar</Text>
                          <View style={styles.bgwhite, styles.py2, styles.roundedXl, styles.wfull, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
                            <Text style={styles.textCustom10, styles.fontblack, styles.textrose600, styles.px4, styles.textCenter}>
                              {trustedText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* SUB-TAB: GREETINGS */}
                  {settingsSubTab === 'greetings' && (
                    <View style={styles.gap4}>
                      {/* Greetings Time Sub-Tab Switcher (Horizontal Slider) */}
                      <View style={styles.mb2}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false} 
                          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                        >
                          {[
                            { id: 'closed', label: 'Closed 💤' },
                            { id: 'morning', label: 'Morning 🌅' },
                            { id: 'afternoon', label: 'Afternoon ☀️' },
                            { id: 'evening', label: 'Evening 🌇' },
                            { id: 'night', label: 'Night 🌙' }
                          ].map((timeTab) => {
                            const isActive = greetingsSubTab === timeTab.id;
                            return (
                              <Pressable
                                key={timeTab.id}
                                onPress={() => {
                                  setGreetingsSubTab(timeTab.id as any);
                                  triggerHaptic('light');
                                }}
                                style={px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                                  isActive 
                                    ? [styles.bgindigo600, styles.borderindigo500, styles.dark:bgindigo500, styles.dark:borderindigo400, styles.shadowSm] 
                                    : [styles.bgslate50, styles.borderslate20050, styles.dark:bgzinc80080, styles.dark:borderzinc70080]
                                }}
                              >
                                <Text style={text-[10px] font-black uppercase tracking-wider ${
                                  isActive ? [styles.textwhite] : [styles.textslate600, styles.dark:textzinc400]
                                }}>
                                  {timeTab.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Closed Greeting Settings */}
                      {greetingsSubTab === 'closed' && (
                        <View style={styles.gap4}>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Closed Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingClosed}
                              onChangeText={setHeroGreetingClosed}
                              placeholder="We're resting right now 💤"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Closed Greeting Subtitle *</Text>
                            <TextInput
                              value={heroSubtitleClosed}
                              onChangeText={setHeroSubtitleClosed}
                              multiline
                              numberOfLines={3}
                              placeholder="FastKirana Cafe & Mart are resting..."
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[80px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Morning Greeting Settings */}
                      {greetingsSubTab === 'morning' && (
                        <View style={styles.gap4}>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Morning Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingMorning}
                              onChangeText={setHeroGreetingMorning}
                              placeholder="Good morning, let's get breakfast! 🌅"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleMorningMartClosed}
                              onChangeText={setHeroSubtitleMorningMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleMorningCafeClosed}
                              onChangeText={setHeroSubtitleMorningCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleMorningBothOpen}
                              onChangeText={setHeroSubtitleMorningBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Afternoon Greeting Settings */}
                      {greetingsSubTab === 'afternoon' && (
                        <View style={styles.gap4}>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Afternoon Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingAfternoon}
                              onChangeText={setHeroGreetingAfternoon}
                              placeholder="Good afternoon! Ready for lunch? 🍛"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonMartClosed}
                              onChangeText={setHeroSubtitleAfternoonMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonCafeClosed}
                              onChangeText={setHeroSubtitleAfternoonCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonBothOpen}
                              onChangeText={setHeroSubtitleAfternoonBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Evening Greeting Settings */}
                      {greetingsSubTab === 'evening' && (
                        <View style={styles.gap4}>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Evening Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingEvening}
                              onChangeText={setHeroGreetingEvening}
                              placeholder="It's snack o'clock! Tea & snacks are ready ☕"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleEveningMartClosed}
                              onChangeText={setHeroSubtitleEveningMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleEveningCafeClosed}
                              onChangeText={setHeroSubtitleEveningCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleEveningBothOpen}
                              onChangeText={setHeroSubtitleEveningBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Night Greeting Settings */}
                      {greetingsSubTab === 'night' && (
                        <View style={styles.gap4}>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Night Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingNight}
                              onChangeText={setHeroGreetingNight}
                              placeholder="Late night cravings? We got you! 🌙"
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleNightMartClosed}
                              onChangeText={setHeroSubtitleNightMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleNightCafeClosed}
                              onChangeText={setHeroSubtitleNightCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleNightBothOpen}
                              onChangeText={setHeroSubtitleNightBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs, styles.minh[60px]}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* SUB-TAB 3: FINANCIALS */}
                  {settingsSubTab === 'finance' && (
                    <View style={styles.gap4}>
                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>GST/Tax Rate (%) *</Text>
                        <TextInput
                          value={taxRate}
                          onChangeText={setTaxRate}
                          keyboardType="numeric"
                          placeholder="e.g. 5"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Miscellaneous Fee (₹) *</Text>
                        <TextInput
                          value={miscFee}
                          onChangeText={setMiscFee}
                          keyboardType="numeric"
                          placeholder="e.g. 0"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      <View>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Miscellaneous Fee Label *</Text>
                        <TextInput
                          value={miscFeeLabel}
                          onChangeText={setMiscFeeLabel}
                          placeholder="e.g. Packaging Charge"
                          placeholderTextColor="#475569"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>

                      {/* Cloudinary configs */}
                      <View style={styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.pt4, styles.mt2, styles.gap4}>
                        <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.mb1}>☁️ Cloudinary Configurations (Image Uploads)</Text>
                        
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Cloudinary Cloud Name</Text>
                          <TextInput
                            value={cloudinaryCloudName}
                            onChangeText={setCloudinaryCloudName}
                            placeholder="your_cloud_name"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>

                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Cloudinary Upload Preset (Unsigned)</Text>
                          <TextInput
                            value={cloudinaryUploadPreset}
                            onChangeText={setCloudinaryUploadPreset}
                            placeholder="unsigned_preset"
                            placeholderTextColor="#475569"
                            style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py3, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Save Settings Trigger Button */}
                  <Pressable
                    onPress={handleSaveSettings}
                    disabled={isSavingSettings}
                    style={styles.bgindigo600, styles.roundedXl, styles.py3.5, styles.itemsCenter, styles.mt4, styles.active:bgindigo700, styles.flexRow, styles.justifyCenter, styles.gap2}
                  >
                    {isSavingSettings ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    )}
                    <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>
                      {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ------------------- INVENTORY TAB ------------------- */}
        {activeTab === 'INVENTORY' && <InventoryTab />}

        {/* ------------------- NOTIFICATIONS TAB WORKSPACE ------------------- */}
        {activeTab === 'NOTIFICATIONS' && (
          <View style={styles.gap6}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.shadowSm}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase, styles.mb1}>New Push Broadcast</Text>
              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mb5}>Compose and broadcast instant alert campaigns to customer mobile apps.</Text>

              {/* Segment Targeting Selector */}
              <View style={styles.mb4}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Target Customer Segment</Text>
                <View style={styles.flexRow, styles.gap2}>
                  {[
                    { id: 'ALL', label: '👥 All Users' },
                    { id: 'NEW', label: '🆕 New' },
                    { id: 'INACTIVE', label: '💤 Inactive' },
                  ].map((seg) => {
                    const isSelected = pushSegment === seg.id;
                    return (
                      <Pressable
                        key={seg.id}
                        onPress={() => {
                          setPushSegment(seg.id as any);
                          triggerHaptic('light');
                        }}
                        style={flex-1 py-2 rounded-xl border items-center justify-center ${
                          isSelected 
                            ? [styles.bgrose50010, styles.borderrose500] 
                            : [styles.bgslate100, styles.dark:bgslate950, styles.borderslate200, styles.dark:borderzinc850]
                        }}
                      >
                        <Text style={text-[10px] font-extrabold ${isSelected ? [styles.textrose600, styles.dark:textrose450] : [styles.textslate500, styles.dark:textslate400]}}>
                          {seg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Title input */}
              <View style={styles.mb4}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Broadcast Title</Text>
                <TextInput
                  value={pushTitle}
                  onChangeText={setPushTitle}
                  placeholder="e.g. ⚡ Flash Deal Alert!"
                  placeholderTextColor="#475569"
                  style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py2.5, styles.textwhite, styles.fontsemibold, styles.textxs}
                />
              </View>

              {/* Body message input */}
              <View style={styles.mb4}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Message Description</Text>
                <TextInput
                  value={pushBody}
                  onChangeText={setPushBody}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g. Get 20% discount on fresh mangoes for the next 1 hour. Apply code FRUIT20 at checkout."
                  placeholderTextColor="#475569"
                  style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py2.5, styles.textwhite, styles.fontsemibold, styles.textxs, styles.minh[80px], styles.textLeft}
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Scheduled Broadcast Time */}
              <View style={styles.mb5}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Scheduled Time (Optional YYYY-MM-DD HH:MM)</Text>
                <TextInput
                  value={pushScheduledTime}
                  onChangeText={setPushScheduledTime}
                  placeholder="e.g. 2026-07-06 18:30 (leave blank for instant)"
                  placeholderTextColor="#475569"
                  style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px4, styles.py2.5, styles.textwhite, styles.fontsemibold, styles.textxs}
                />
              </View>

              {/* Send button */}
              <Pressable
                onPress={handleSendBroadcast}
                disabled={isBroadcasting}
                style={styles.bgrose600, styles.roundedXl, styles.py3.5, styles.itemsCenter, styles.active:bgrose700, styles.flexRow, styles.justifyCenter, styles.gap2}
              >
                {isBroadcasting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Sparkles size={13} color="#fff" />
                )}
                <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>
                  {isBroadcasting ? 'Broadcasting Alert...' : 'Broadcast Push Notification'}
                </Text>
              </Pressable>
            </View>

            {/* Broadcast Log */}
            <View>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mb3}>Broadcast History Logs</Text>
              {pastNotifications.length === 0 ? (
                <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p6, styles.itemsCenter}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.textCenter}>No notifications sent through this portal yet.</Text>
                </View>
              ) : (
                <View style={styles.gap3, styles.mb10}>
                  {pastNotifications.map((noti, idx) => (
                    <View key={idx} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.shadowxs}>
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb1.5}>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>{noti.title}</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold}>
                          {noti.sentAt ? new Date(noti.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </Text>
                      </View>
                      <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.leading4}>{noti.body}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ------------------- COUPONS TAB WORKSPACE ------------------- */}
        {activeTab === 'COUPONS' && (
          <View style={styles.gap4}>
            <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb1}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Discount Codes</Text>
              <Pressable
                onPress={() => {
                  setNewCouponCode('');
                  setNewCouponValue('');
                  setNewCouponMinOrder('');
                  setNewCouponMaxUses('');
                  setIsCouponModalVisible(true);
                  triggerHaptic('light');
                }}
                style={styles.bgindigo650, styles.px4, styles.py2.5, styles.roundedXl, styles.flexRow, styles.itemsCenter, styles.gap1.5, styles.active:bgindigo750}
              >
                <Ticket size={13} color="#fff" />
                <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>New Coupon</Text>
              </Pressable>
            </View>

            {isCouponsLoading ? (
              <View style={styles.py20, styles.itemsCenter}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : coupons.length === 0 ? (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p6, styles.itemsCenter}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.textCenter}>No coupon codes registered in database.</Text>
              </View>
            ) : (
              <View style={styles.gap3, styles.mb10}>
                {coupons.map((c) => (
                  <View key={c.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.shadowxs, styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.gap3}>
                    <View style={styles.flex1, styles.pr2}>
                      <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                        <View style={styles.bgpurple95030, styles.border, styles.borderpurple90040, styles.px2, styles.py0.5, styles.roundedlg}>
                          <Text style={styles.textpurple400, styles.fontblack, styles.textxs, styles.trackingwider}>{c.code}</Text>
                        </View>
                        <Text style={styles.textslate700, styles.dark:textslate200, styles.fontextrabold, styles.textxs}>
                          {c.discountType === 'PERCENT' ? `${c.value}% OFF` : `Flat ${formatPrice(c.value)} OFF`}
                        </Text>
                      </View>
                      
                      <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt2, styles.uppercase, styles.trackingwide}>
                        Min Order: {formatPrice(c.minOrder)} • Limit: {c.usedCount}/{c.maxUses} uses
                      </Text>
                    </View>

                    <Switch
                      value={c.isActive}
                      onValueChange={() => handleToggleCoupon(c)}
                      trackColor={{ false: '#475569', true: '#818cf8' }}
                      thumbColor={c.isActive ? '#4f46e5' : '#cbd5e1'}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ------------------- PICKER TAB WORKSPACE ------------------- */}
        {activeTab === 'PICKER' && (
          <View>
            {/* Today Picker Stats */}
            <View style={styles.flexRow, styles.justifyBetween, styles.gap3, styles.mb6, styles.bgslate50, styles.dark:bgzinc950, styles.p4, styles.rounded2Xl, styles.shadowSm, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{pickerPendingOrders.length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Pending Jobs</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{activePickingOrder ? 1 : 0}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Active Picking</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter}>
                <Text style={styles.textindigo400, styles.fontblack, styles.textlg}>{todayPacked}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Packed Today</Text>
              </View>
            </View>
            {activePickingOrder ? (
              // Active picking checklist overlay layout (Slate-Dark Redesign)
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.shadowLg, styles.mb10}>
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc80080, styles.pb4, styles.mb4}>
                  <View>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Picking Order #{activePickingOrder.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>Customer: {activePickingOrder.user.name}</Text>
                  </View>
                  <Pressable 
                    onPress={cancelActivePicking}
                    style={styles.px3.5, styles.py2, styles.roundedXl, styles.bgslate800, styles.border, styles.borderslate70060, styles.active:bgslate70060}
                  >
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Cancel</Text>
                  </Pressable>
                </View>

                {/* Scan Barcode Simulation Box (Dark-Slate) */}
                <View style={styles.flexRow, styles.gap2.5, styles.bgslate50, styles.dark:bgslate95040, styles.p3, styles.roundedXl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.itemsCenter, styles.mb5}>
                  <Barcode size={16} color="#6366f1" />
                  <TextInput
                    placeholder="Scan product barcode (simulate by typing)..."
                    placeholderTextColor="#64748b"
                    value={barcodeQuery}
                    onChangeText={setBarcodeQuery}
                    onSubmitEditing={scanBarcodeProduct}
                    style={styles.flex1, styles.textslate800, styles.dark:textwhite, styles.textxs, styles.fontsemibold, styles.p0}
                  />
                  <Pressable 
                    onPress={scanBarcodeProduct}
                    style={styles.bgindigo600, styles.px3.5, styles.py1.5, styles.roundedlg, styles.active:bgindigo700}
                  >
                    <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom9, styles.uppercase}>Scan</Text>
                  </Pressable>
                </View>

                {/* Products Checklist (Aisle-Optimized Sorting & Slate-Dark Style) */}
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textCustom10, styles.uppercase, styles.trackingwider, styles.mb3}>Checklist by Location</Text>
                <View style={styles.gap2.5}>
                  {[...activePickingOrder.items]
                    .sort((a, b) => getItemAisle(a).localeCompare(getItemAisle(b)))
                    .map((item) => {
                      const picked = pickedQuantities[item.id] || 0;
                      const max = item.quantity;
                      const aisle = getItemAisle(item);
                      const isDone = picked === max;

                      return (
                        <View key={item.id} style={p-3.5 rounded-xl border flex-row justify-between items-center gap-3 ${
                          isDone 
                            ? [styles.bgslate50, styles.dark:bgslate95030, styles.borderslate100, styles.dark:borderzinc80080, styles.opacity70] 
                            : [styles.bgslate50, styles.dark:bgslate95060, styles.borderslate100, styles.dark:borderzinc800]
                        }}>
                          <View style={styles.flex1, styles.pr2}>
                            <Text style={text-xs font-bold leading-tight ${isDone ? [styles.textslate500, styles.lineThrough] : [styles.textwhite]}}>
                              {item.name}
                            </Text>
                            <Text style={styles.textindigo400, styles.textCustom9, styles.fontblack, styles.mt1, styles.uppercase, styles.trackingwider}>{aisle}</Text>
                          </View>
                          
                          <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                            {isDone ? (
                              <View style={styles.bgemerald50010, styles.border, styles.borderemerald50020, styles.px2.5, styles.py1.5, styles.roundedlg, styles.flexRow, styles.itemsCenter, styles.gap1}>
                                <CheckCircle size={10} color="#10b981" />
                                <Text style={styles.textemerald400, styles.fontblack, styles.textCustom9, styles.uppercase}>{max}/{max}</Text>
                              </View>
                            ) : (
                              <View style={styles.flexRow, styles.itemsCenter, styles.bgslate900, styles.roundedlg, styles.p1, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
                                <Pressable 
                                  onPress={() => resetItemPicker(item.id)}
                                  style={styles.px2}
                                >
                                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textxs}>↺</Text>
                                </Pressable>
                                <Text style={styles.px1.5, styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>{picked}/{max}</Text>
                                <Pressable 
                                  onPress={() => manualPickOne(item.id, max)}
                                  style={styles.bgslate800, styles.px3, styles.py1.5, styles.roundedmd, styles.border, styles.borderslate70080, styles.active:bgslate700, styles.ml1.5}
                                >
                                  <Text style={styles.textwhite, styles.fontblack, styles.textCustom10, styles.uppercase}>+1</Text>
                                </Pressable>
                                <Pressable 
                                  onPress={() => manualPickAll(item.id, max)}
                                  style={styles.bgindigo600, styles.px3, styles.py1.5, styles.roundedmd, styles.active:bgindigo750, styles.ml1.5}
                                >
                                  <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase}>All</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                </View>

                {/* Finalize Pack */}
                <Pressable
                  onPress={() => packActiveOrder(activePickingOrder.id)}
                  style={styles.bgindigo600, styles.py3.5, styles.rounded2Xl, styles.itemsCenter, styles.mt6, styles.active:bgindigo700, styles.shadowMd}
                >
                  <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Pack & Complete Order</Text>
                </Pressable>
              </View>
            ) : (
              // Order queue list (Slate-Dark Redesign)
              <View>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Picker Pending Jobs</Text>
                {pickerPendingOrders.length === 0 ? (
                  <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p8, styles.itemsCenter}>
                    <Text style={styles.text4xl}>📭</Text>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mt3}>No orders waiting for pickers</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.mt1, styles.textCenter, styles.maxw[240px]}>New orders placed by customers will chime here automatically.</Text>
                  </View>
                ) : (
                  <View style={styles.gap3}>
                    {pickerPendingOrders.map((ord) => (
                      <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.shadowSm}>
                        <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc80080, styles.pb3, styles.mb3}>
                          <View>
                            <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1}>Order Items: {ord.items.length} Items • {ord.deliveryMethod}</Text>
                          </View>
                          <View style={styles.bgamber50010, styles.border, styles.borderamber50020, styles.px2.5, styles.py0.5, styles.roundedFull}>
                            <Text style={styles.textamber400, styles.fontextrabold, styles.textCustom8, styles.uppercase, styles.trackingwider}>{ord.status}</Text>
                          </View>
                        </View>

                        {/* Customer & Items preview */}
                        <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.fontsemibold}>User: {ord.user.name}</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mt1.5, styles.truncate} numberOfLines={1}>
                          Items: {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                        </Text>

                        {/* Pick order action */}
                        <Pressable
                          onPress={() => startPicking(ord)}
                          style={styles.bgindigo600, styles.mt4, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap2, styles.active:bgindigo700, styles.shadowSm}
                        >
                          <Play size={10} color="#fff" fill="#fff" />
                          <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Start Picking Checklist</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
          {activeTab === 'RIDER' && (
          <View>
            {/* Today Rider Stats */}
            <View style={styles.flexRow, styles.justifyBetween, styles.gap3, styles.mb6, styles.bgslate900, styles.p4, styles.rounded2Xl, styles.shadowSm, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{todayDeliveries}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Delivered</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{riderActiveDeliveries.length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Active Run</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter}>
                <Text style={styles.textemerald400, styles.fontblack, styles.textlg}>{formatPrice(codCollected)}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>COD Cash</Text>
              </View>
            </View>

            {/* Active Shipments Route (Slate-Dark Redesign) */}
            {riderActiveDeliveries.length > 0 && (
              <View style={styles.mb6}>
                <Text style={styles.textslate450, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Rider Active Run ({riderActiveDeliveries.length})</Text>
                <View style={styles.gap3}>
                  {riderActiveDeliveries.map((ord) => (
                    <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.shadowSm}>
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc80080, styles.pb3, styles.mb3}>
                        <View>
                          <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Shipment #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1}>Payment: {ord.paymentMethod} • {formatPrice(ord.total)}</Text>
                        </View>
                        <View style={styles.bgindigo50010, styles.border, styles.borderindigo50020, styles.px2.5, styles.py0.5, styles.roundedFull}>
                          <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom8, styles.uppercase, styles.trackingwider}>Active</Text>
                        </View>
                      </View>

                      {/* Customer Address Details (Map coordinate Navigation deep-linking) */}
                      <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.gap3, styles.mb3, styles.bgslate50, styles.dark:bgslate95040, styles.p3, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flex1}>
                          <MapPin size={12} color="#ef4444" />
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.fontsemibold, styles.flex1, styles.leading4}>
                            {ord.address.houseNo}, {ord.address.street}, {ord.address.area}, {ord.address.city}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            triggerHaptic('light');
                            const query = ord.address.lat && ord.address.lng 
                              ? `${ord.address.lat},${ord.address.lng}`
                              : encodeURIComponent(`${ord.address.houseNo} ${ord.address.street} ${ord.address.area} ${ord.address.city}`);
                            const url = Platform.OS === 'ios'
                              ? `maps://0,0?q=${query}`
                              : `geo:0,0?q=${query}`;
                            Linking.openURL(url).catch(() => {
                              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                            });
                          }}
                          style={styles.bgindigo60020, styles.border, styles.borderindigo50040, styles.px2.5, styles.py1.5, styles.roundedlg, styles.active:bgindigo60040}
                        >
                          <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom9, styles.uppercase}>Navigate</Text>
                        </Pressable>
                      </View>

                      <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.mb4}>
                        <Phone size={12} color="#94a3b8" />
                        <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.fontbold}>{ord.user.name} ({ord.user.phone})</Text>
                      </View>

                      {activeGpsSimulations[ord.id] && (
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.mb4, styles.bgemerald50010, styles.border, styles.borderemerald50030, styles.p2.5, styles.roundedXl}>
                          <ActivityIndicator size="small" color="#10b981" />
                          <View style={styles.flex1}>
                            <Text style={styles.textemerald400, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>
                              GPS Simulating route
                            </Text>
                            <Text style={styles.textslate650, styles.dark:textslate300, styles.textCustom8, styles.fontsemibold, styles.mt0.5}>
                              Step {activeGpsSimulations[ord.id].step}/{activeGpsSimulations[ord.id].totalSteps} • ({activeGpsSimulations[ord.id].lat.toFixed(4)}, {activeGpsSimulations[ord.id].lng.toFixed(4)})
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Deliver proof confirmation swipe action look-alike slider */}
                      <View style={styles.relative, styles.bgemerald50010, styles.border, styles.borderemerald50030, styles.p1.5, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.pl3}>
                          <Check size={14} color="#10b981" />
                          <Text style={styles.textemerald400, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Ready to complete drop?</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            triggerHaptic('success');
                            initiateConfirmDelivery(ord);
                          }}
                          style={styles.bgemerald600, styles.px4, styles.py2.5, styles.roundedXl, styles.active:bgemerald700}
                        >
                          <Text style={styles.textwhite, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider}>Confirm Drop</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pickup queue from Picker Packing (Slate-Dark Redesign) */}
            <Text style={styles.textslate455, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Rider Pickup Queue ({riderQueueOrders.length})</Text>
            {riderQueueOrders.length === 0 ? (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p8, styles.itemsCenter}>
                <Text style={styles.text4xl}>📦</Text>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mt3}>No shipments ready for pickup</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.mt1, styles.textCenter, styles.maxw[240px]}>Riders wait here. Pickers auto-pack orders to dispatch them here.</Text>
              </View>
            ) : (
              <View style={styles.gap3}>
                {riderQueueOrders.map((ord) => (
                  <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.shadowSm}>
                    <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc80080, styles.pb3, styles.mb3}>
                      <View>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1}>{ord.address.area} • {formatPrice(ord.total)}</Text>
                      </View>
                      <View style={styles.bgemerald50010, styles.border, styles.borderemerald50020, styles.px2.5, styles.py0.5, styles.roundedFull}>
                        <Text style={styles.textemerald400, styles.fontextrabold, styles.textCustom8, styles.uppercase, styles.trackingwider}>Ready</Text>
                      </View>
                    </View>

                    {/* Customer & Address Details */}
                    <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.fontsemibold}>User: {ord.user.name}</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.mt1.5}>To: {ord.address.houseNo}, {ord.address.street}, {ord.address.area}</Text>

                    {/* Accept pickup dispatch action */}
                    <Pressable
                      onPress={() => acceptShipment(ord)}
                      style={styles.bgindigo600, styles.mt4, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.active:bgindigo700, styles.shadowSm}
                    >
                      <Truck size={12} color="#fff" />
                      <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Accept Rider Pickup</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
                 {activeTab === 'CHEF' && (
          <View>
            {/* Today Chef Stats */}
            <View style={styles.flexRow, styles.justifyBetween, styles.gap3, styles.mb6, styles.bgslate50, styles.dark:bgzinc950, styles.p4, styles.rounded2Xl, styles.shadowSm, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{pendingCafeOrders.filter(o => o.status === 'PENDING').length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Queue Jobs</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{pendingCafeOrders.filter(o => o.status === 'CONFIRMED').length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Cooking</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter}>
                <Text style={styles.textrose400, styles.fontblack, styles.textlg}>{todayPrepared}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Prepared Today</Text>
              </View>
            </View>
            <Text style={styles.textslate450, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Cafe Kitchen Cooking Queue</Text>
            
            {/* Bulk Prepare Aggregated List (Dark-Slate) */}
            {aggregatedPrepItems.length > 0 && (
              <View style={styles.mb4, styles.bgorange50010, styles.border, styles.borderorange50020, styles.rounded2Xl, styles.p3.5, styles.shadowSm}>
                <Text style={styles.textorange400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2.5}>🧑‍🍳 Kitchen Prep Summary (Bulk Prepare)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flexRow, styles.gap2, styles.py0.5}>
                  {aggregatedPrepItems.map((item, idx) => (
                    <View key={idx} style={styles.bgslate50, styles.dark:bgslate95040, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.flexRow, styles.itemsCenter, styles.gap2, styles.shadowxs}>
                      <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textCustom10}>{item.name}</Text>
                      <View style={styles.bgorange50020, styles.px2, styles.py0.5, styles.roundedlg}>
                        <Text style={styles.textorange400, styles.fontblack, styles.textCustom9}>x{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {pendingCafeOrders.length === 0 ? (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p8, styles.itemsCenter}>
                <Text style={styles.text4xl}>🍳</Text>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mt3}>No cafe items pending cooking</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.mt1, styles.textCenter, styles.maxw[240px]}>Cafe orders placed on the customer app sync instantly to the chef console.</Text>
              </View>
            ) : (
              <View style={styles.gap3.5, styles.mb10}>
                {pendingCafeOrders.map((ord) => {
                  const cafeItems = ord.items.filter(it => it.categorySlug === 'cafe');
                  const isPending = ord.status === 'PENDING';
                  
                  // Compute dynamic SLA countdown timer values
                  const orderAgeMs = Date.now() - new Date(ord.createdAt).getTime();
                  const orderAgeMins = Math.max(0, Math.floor(orderAgeMs / 60000));
                  
                  // SLA Color styles
                  const slaBgStyle = orderAgeMins < 4 
                    ? "bg-emerald-500/10 border border-emerald-500/25" 
                    : orderAgeMins < 7 
                      ? "bg-orange-500/10 border border-orange-500/25" 
                      : "bg-rose-500/15 border border-rose-500/30";
                  
                  const slaTextStyle = orderAgeMins < 4 
                    ? "text-emerald-400" 
                    : orderAgeMins < 7 
                      ? "text-orange-400" 
                      : "text-rose-400";

                  return (
                    // Kitchen Job card with paper ticket simulation design details
                    <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded3Xl, styles.gap3}>
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderdashed, styles.borderslate100, styles.dark:borderzinc800, styles.pb3, styles.mb1}>
                        <View>
                          <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1}>Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        
                        {/* SLA Cooking Timer indicator */}
                        <View style={${slaBgStyle} px-2.5 py-1 rounded-lg flex-row items-center gap-1}>
                          <Text style={${slaTextStyle} font-black text-[9px] uppercase tracking-wider}>
                            {isPending ? 'Queue' : 'Cooking'} • {orderAgeMins}m
                          </Text>
                        </View>
                      </View>

                      {isPending ? (
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Items Preview</Text>
                          <View style={styles.gap2, styles.opacity75, styles.mb4}>
                            {cafeItems.map((item) => (
                              <View key={item.id} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.p3, styles.roundedXl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.bgslate50, styles.dark:bgslate95040}>
                                <View style={styles.flex1, styles.pr2}>
                                  <Text style={styles.textxs, styles.fontbold, styles.textslate700, styles.dark:textslate200}>{item.name}</Text>
                                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>Quantity: x{item.quantity}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                          <View style={styles.flexRow, styles.gap3}>
                            <Pressable
                              onPress={() => handleEditOrder(ord)}
                              style={styles.flex1, styles.bgslate850, styles.dark:bgzinc800, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.active:opacity85, styles.shadowSm, styles.border, styles.borderslate700, styles.dark:borderzinc700}
                            >
                              <Edit2 size={12} color="#fff" />
                              <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Edit Order</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => startPreparingChef(ord)}
                              style={styles.flex[1.5], styles.bgrose600, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.active:bgrose700, styles.shadowSm}
                            >
                              <ChefHat size={13} color="#fff" />
                              <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Start Cooking</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View>
                          {/* Cooking Items checklist */}
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Items to Cook</Text>
                          <View style={styles.gap2}>
                            {cafeItems.map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={() => markChefItemReady(ord.id, item.id)}
                                style={flex-row justify-between items-center p-3 rounded-xl border ${
                                  item.cooked 
                                    ? [styles.bgemerald50010, styles.borderemerald50025] 
                                    : [styles.bgslate50, styles.dark:bgslate95040, styles.borderslate100, styles.dark:borderzinc800]
                                }}
                              >
                                <View style={styles.flex1, styles.pr2}>
                                  <Text style={text-xs font-bold ${item.cooked ? [styles.textslate500, styles.lineThrough] : [styles.textslate700, styles.dark:textslate200]}}>
                                    {item.name}
                                  </Text>
                                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>Quantity: x{item.quantity}</Text>
                                </View>

                                <View style={w-6 h-6 rounded-full items-center justify-center ${
                                  item.cooked ? [styles.bgemerald600] : [styles.bgslate800]
                                }}>
                                  {item.cooked ? (
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                  ) : (
                                    <Text style={styles.textCustom10, styles.fontblack, styles.textslate500, styles.dark:textslate400}>+</Text>
                                  )}
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'CHEF_RESTAURANT' && (
          <View>
            {/* Today Restaurant Chef Stats */}
            <View style={styles.flexRow, styles.justifyBetween, styles.gap3, styles.mb6, styles.bgslate50, styles.dark:bgzinc950, styles.p4, styles.rounded2Xl, styles.shadowSm, styles.border, styles.borderslate200, styles.dark:borderzinc850}>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{pendingRestaurantOrders.filter(o => o.status === 'PENDING').length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Queue Jobs</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter, styles.borderr, styles.borderslate100, styles.dark:borderzinc800}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textlg}>{pendingRestaurantOrders.filter(o => o.status === 'CONFIRMED').length}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Cooking</Text>
              </View>
              <View style={styles.flex1, styles.itemsCenter}>
                <Text style={styles.textrose400, styles.fontblack, styles.textlg}>{todayPrepared}</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt0.5}>Prepared Today</Text>
              </View>
            </View>
            <Text style={styles.textslate450, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider, styles.mb3}>Restaurant Kitchen Cooking Queue</Text>
            
            {/* Bulk Prepare Aggregated List (Dark-Slate) */}
            {aggregatedRestaurantPrepItems.length > 0 && (
              <View style={styles.mb4, styles.bgorange50010, styles.border, styles.borderorange50020, styles.rounded2Xl, styles.p3.5, styles.shadowSm}>
                <Text style={styles.textorange400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2.5}>🧑‍🍳 Restaurant Prep Summary (Bulk Prepare)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flexRow, styles.gap2, styles.py0.5}>
                  {aggregatedRestaurantPrepItems.map((item, idx) => (
                    <View key={idx} style={styles.bgslate50, styles.dark:bgslate95040, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.flexRow, styles.itemsCenter, styles.gap2, styles.shadowxs}>
                      <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textCustom10}>{item.name}</Text>
                      <View style={styles.bgorange50020, styles.px2, styles.py0.5, styles.roundedlg}>
                        <Text style={styles.textorange400, styles.fontblack, styles.textCustom9}>x{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {pendingRestaurantOrders.length === 0 ? (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p8, styles.itemsCenter}>
                <Text style={styles.text4xl}>🍳</Text>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.mt3}>No restaurant items pending cooking</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textxs, styles.mt1, styles.textCenter, styles.maxw[240px]}>Restaurant orders placed on the customer app sync instantly to the chef console.</Text>
              </View>
            ) : (
              <View style={styles.gap3.5, styles.mb10}>
                {pendingRestaurantOrders.map((ord) => {
                  const restaurantItems = ord.items.filter(it => it.categorySlug === 'restaurant' || it.categorySlug === 'north-indian' || it.categorySlug === 'biryani-rice');
                  const isPending = ord.status === 'PENDING';
                  
                  // Compute dynamic SLA countdown timer values
                  const orderAgeMs = Date.now() - new Date(ord.createdAt).getTime();
                  const orderAgeMins = Math.max(0, Math.floor(orderAgeMs / 60000));
                  
                  // SLA Color styles
                  const slaBgStyle = orderAgeMins < 4 
                    ? "bg-emerald-500/10 border border-emerald-500/25" 
                    : orderAgeMins < 7 
                      ? "bg-orange-500/10 border border-orange-500/25" 
                      : "bg-rose-500/15 border border-rose-500/30";
                  
                  const slaTextStyle = orderAgeMins < 4 
                    ? "text-emerald-400" 
                    : orderAgeMins < 7 
                      ? "text-orange-400" 
                      : "text-rose-400";

                  return (
                    // Kitchen Job card with paper ticket simulation design details
                    <View key={ord.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded3Xl, styles.gap3}>
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderdashed, styles.borderslate100, styles.dark:borderzinc800, styles.pb3, styles.mb1}>
                        <View>
                          <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm, styles.uppercase}>Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1}>Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        
                        {/* SLA Cooking Timer indicator */}
                        <View style={${slaBgStyle} px-2.5 py-1 rounded-lg flex-row items-center gap-1}>
                          <Text style={${slaTextStyle} font-black text-[9px] uppercase tracking-wider}>
                            {isPending ? 'Queue' : 'Cooking'} • {orderAgeMins}m
                          </Text>
                        </View>
                      </View>

                      {isPending ? (
                        <View>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Items Preview</Text>
                          <View style={styles.gap2, styles.opacity75, styles.mb4}>
                            {restaurantItems.map((item) => (
                              <View key={item.id} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.p3, styles.roundedXl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.bgslate50, styles.dark:bgslate95040}>
                                <View style={styles.flex1, styles.pr2}>
                                  <Text style={styles.textxs, styles.fontbold, styles.textslate700, styles.dark:textslate200}>{item.name}</Text>
                                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>Quantity: x{item.quantity}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                          <View style={styles.flexRow, styles.gap3}>
                            <Pressable
                              onPress={() => handleEditOrder(ord)}
                              style={styles.flex1, styles.bgslate850, styles.dark:bgzinc800, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.active:opacity85, styles.shadowSm, styles.border, styles.borderslate700, styles.dark:borderzinc700}
                            >
                              <Edit2 size={12} color="#fff" />
                              <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Edit Order</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => startPreparingChef(ord)}
                              style={styles.flex[1.5], styles.bgrose600, styles.py3, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap1.5, styles.active:bgrose700, styles.shadowSm}
                            >
                              <ChefHat size={13} color="#fff" />
                              <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Start Cooking</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View>
                          {/* Cooking Items checklist */}
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Items to Cook</Text>
                          <View style={styles.gap2}>
                            {restaurantItems.map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={() => markChefItemReady(ord.id, item.id)}
                                style={flex-row justify-between items-center p-3 rounded-xl border ${
                                  item.cooked 
                                    ? [styles.bgemerald50010, styles.borderemerald50025] 
                                    : [styles.bgslate50, styles.dark:bgslate95040, styles.borderslate100, styles.dark:borderzinc800]
                                }}
                              >
                                <View style={styles.flex1, styles.pr2}>
                                  <Text style={text-xs font-bold ${item.cooked ? [styles.textslate500, styles.lineThrough] : [styles.textslate700, styles.dark:textslate200]}}>
                                    {item.name}
                                  </Text>
                                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt1}>Quantity: x{item.quantity}</Text>
                                </View>

                                <View style={w-6 h-6 rounded-full items-center justify-center ${
                                  item.cooked ? [styles.bgemerald600] : [styles.bgslate800]
                                }}>
                                  {item.cooked ? (
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                  ) : (
                                    <Text style={styles.textCustom10, styles.fontblack, styles.textslate500, styles.dark:textslate400}>+</Text>
                                  )}
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ------------------- USERS TAB WORKSPACE ------------------- */}
        {activeTab === 'USERS' && <UsersTab />}

        {/* ------------------- REVIEWS TAB WORKSPACE ------------------- */}
        {activeTab === 'REVIEWS' && (
          <View style={styles.px4, styles.py4}>
            {/* Reviews list */}
            {isReviewsLoading ? (
              <View style={styles.py20, styles.itemsCenter, styles.justifyCenter}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textxs, styles.mt3}>Loading product reviews...</Text>
              </View>
            ) : reviewsList.length === 0 ? (
              <View style={styles.py20, styles.itemsCenter, styles.justifyCenter, styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p6}>
                <Text style={styles.text4xl, styles.mb3}>⭐</Text>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>No Reviews Yet</Text>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.textCenter, styles.mt1}>
                  Customers have not left any feedback ratings on products yet.
                </Text>
              </View>
            ) : (
              <View style={styles.gap3, styles.mb10}>
                {reviewsList.map((item) => {
                  const ratingStars = '⭐'.repeat(item.rating);
                  return (
                    <View
                      key={item.id}
                      style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}
                    >
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsStart}>
                        <View style={styles.flex1, styles.pr2}>
                          {/* Rating and product */}
                          <Text style={styles.textamber400, styles.fontblack, styles.textxs, styles.trackingwider}>{ratingStars}</Text>
                          <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.mt1}>
                            Product: {item.product?.name || 'Unknown Item'}
                          </Text>
                        </View>
                        
                        {/* Delete Review button */}
                        <Pressable
                          onPress={() => handleDeleteReview(item.id)}
                          style={styles.bgred65015, styles.border, styles.borderred50030, styles.px2, styles.py1, styles.roundedlg, styles.active:bgred60030}
                        >
                          <Text style={styles.textred500, styles.fontblack, styles.textCustom9, styles.uppercase}>Delete</Text>
                        </Pressable>
                      </View>

                      {/* Comment text */}
                      {item.comment ? (
                        <View style={styles.bgslate80080, styles.p2.5, styles.roundedlg, styles.border, styles.borderslate70060}>
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.textxs, styles.italic, styles.leading4}>"{item.comment}"</Text>
                        </View>
                      ) : (
                        <Text style={styles.textslate500, styles.textCustom11, styles.italic}>No comment left</Text>
                      )}

                      {/* Customer details */}
                      <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.pt2}>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontbold}>
                          By: {item.user?.name || 'Anonymous'}
                        </Text>
                        <Text style={styles.textslate500, styles.textCustom9}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ------------------- HIGHLIGHTS TAB WORKSPACE ------------------- */}
        {activeTab === 'HIGHLIGHTS' && (
          <View style={styles.px4, styles.py4}>
            {/* Mode Toggle Header */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.p4, styles.rounded3Xl, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.mb4, styles.gap3.5, styles.shadowSm}>
              <View style={styles.flexRow, styles.bgslate50, styles.dark:bgzinc955, styles.p1, styles.roundedFull, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.gap1}>
                <Pressable
                  onPress={() => {
                    setHighlightMode('PINNED');
                    triggerHaptic('light');
                  }}
                  style={flex-1 items-center py-2.5 rounded-full ${
                    highlightMode === [styles.PINNED]
                      ? [styles.bgindigo650, styles.shadowxs]
                      : [styles.bgtransparent]
                  }}
                >
                  <Text style={text-[10px] font-black uppercase tracking-wider ${highlightMode === [styles.PINNED] ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]}}>
                    Pinned Highlights
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setHighlightMode('SEARCH');
                    triggerHaptic('light');
                  }}
                  style={flex-1 items-center py-2.5 rounded-full ${
                    highlightMode === [styles.SEARCH]
                      ? [styles.bgindigo650, styles.shadowxs]
                      : [styles.bgtransparent]
                  }}
                >
                  <Text style={text-[10px] font-black uppercase tracking-wider ${highlightMode === [styles.SEARCH] ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]}}>
                    Search & Pin Items
                  </Text>
                </Pressable>
              </View>

              {/* Sub-tabs for Pinned Highlights */}
              {highlightMode === 'PINNED' && (
                <View style={styles.flexRow, styles.py1, styles.flexWrap, styles.gap2}>
                  {[
                    { key: 'flash', label: 'Flash Deals', count: flashDealsList.length },
                    { key: 'toppicks', label: 'Top Picks', count: topPicksList.length },
                    { key: 'bestsellers', label: 'Best Sellers', count: bestSellersList.length }
                  ].map((typeObj) => (
                    <Pressable
                      key={typeObj.key}
                      onPress={() => {
                        setHighlightType(typeObj.key as any);
                        triggerHaptic('light');
                      }}
                      style={px-4 py-2 rounded-full border flex-row items-center gap-1.5 ${
                        highlightType === typeObj.key
                          ? [styles.bgindigo600, styles.borderindigo500, styles.shadowxs]
                          : [styles.bgwhite, styles.dark:bgzinc800, styles.borderslate200, styles.dark:borderzinc700]
                      }}
                    >
                      <Text style={text-[9.5px] font-black uppercase tracking-wider ${highlightType === typeObj.key ? [styles.textwhite] : [styles.textslate550, styles.dark:textzinc450]}}>
                        {typeObj.label} ({typeObj.count})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Search Box when SEARCH mode is active */}
              {highlightMode === 'SEARCH' && (
                <View style={styles.flexRow, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.roundedFull, styles.px4, styles.h11}>
                  <Search size={15} color="#94a3b8" strokeWidth={2.5} />
                  <TextInput
                    placeholder="Search products to pin..."
                    placeholderTextColor="#64748b"
                    value={highlightSearchQuery}
                    onChangeText={setHighlightSearchQuery}
                    onSubmitEditing={handleHighlightsSearch}
                    returnKeyType="search"
                    style={styles.flex1, styles.textslate800, styles.dark:textwhite, styles.textxs, styles.ml2.5, styles.hfull, styles.p0, styles.fontbold}
                  />
                  {highlightSearchQuery.length > 0 && (
                    <Pressable onPress={() => setHighlightSearchQuery('')} style={styles.bgslate20060, styles.dark:bgzinc800, styles.p1, styles.roundedFull}>
                      <X size={12} color="#94a3b8" />
                    </Pressable>
                  )}
                  <Pressable 
                    onPress={handleHighlightsSearch}
                    style={styles.bgindigo600, styles.px4, styles.py1.5, styles.roundedFull, styles.ml3, styles.active:bgindigo750}
                  >
                    <Text style={styles.textwhite, styles.fontextrabold, styles.text[9.5px], styles.uppercase, styles.trackingwider}>Search</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Content Loader */}
            {isHighlightsLoading ? (
              <View style={styles.py20, styles.itemsCenter, styles.justifyCenter}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textxs, styles.mt3}>Loading highlights database...</Text>
              </View>
            ) : (
              <View style={styles.gap3.5, styles.mb10}>
                {/* Mode Pinned List */}
                {highlightMode === 'PINNED' && (() => {
                  const activeList = highlightType === 'flash' 
                    ? flashDealsList 
                    : highlightType === 'toppicks' 
                      ? topPicksList 
                      : bestSellersList;
                      
                  if (activeList.length === 0) {
                    return (
                      <View style={styles.py20, styles.itemsCenter, styles.justifyCenter, styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate20060, styles.dark:borderzinc800, styles.rounded3Xl, styles.p8, styles.shadowSm}>
                        <Text style={styles.text4xl, styles.mb3}>⚡</Text>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>No Pinned Items</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.textCenter, styles.mt1}>
                          No items pinned to this highlight category yet.
                        </Text>
                      </View>
                    );
                  }
                  
                  return activeList.map((item) => (
                    <View
                      key={item.id}
                      style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate150, styles.dark:borderzinc850, styles.p4, styles.rounded3Xl, styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.shadowSm}
                    >
                      <View style={styles.flexRow, styles.itemsCenter, styles.flex1, styles.pr3}>
                        <View style={styles.w12, styles.h12, styles.roundedXl, styles.bgslate50, styles.dark:bgzinc950, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.mr3, styles.overflowHidden, styles.shadowxs}>
                          {getAppImageSource(item.imageUrl) ? (
                            <Image 
                              source={getAppImageSource(item.imageUrl)!} 
                              style={styles.wfull, styles.hfull}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={styles.textxl}>{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1, styles.uppercase, styles.trackingwide}>
                            ₹{item.price}  •  Stock: {item.stock}
                          </Text>
                        </View>
                      </View>
                      
                      <Pressable
                        onPress={() => toggleProductHighlight(item, highlightType)}
                        disabled={togglingHighlightId === `${item.id}-${highlightType}`}
                        style={styles.bgrose50, styles.dark:bgrose95515, styles.border, styles.borderrose100, styles.dark:borderrose90030, styles.px3, styles.py1.5, styles.roundedFull, styles.active:bgrose10050}
                      >
                        {togglingHighlightId === `${item.id}-${highlightType}` ? (
                          <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                          <Text style={styles.textrose600, styles.dark:textrose400, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>Remove</Text>
                        )}
                      </Pressable>
                    </View>
                  ));
                })()}

                {/* Mode Search List */}
                {highlightMode === 'SEARCH' && (() => {
                  if (highlightSearchProducts.length === 0) {
                    return (
                      <View style={styles.py20, styles.itemsCenter, styles.justifyCenter, styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate20060, styles.dark:borderzinc800, styles.rounded3Xl, styles.p8, styles.shadowSm}>
                        <Text style={styles.text4xl, styles.mb3}>🔍</Text>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Find Items to Pin</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.textCenter, styles.mt1}>
                          Search above to toggle storefront highlight promotions for any item.
                        </Text>
                      </View>
                    );
                  }
                  
                  return highlightSearchProducts.map((item) => (
                    <View
                      key={item.id}
                      style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate150, styles.dark:borderzinc850, styles.p4, styles.rounded3Xl, styles.gap3.5, styles.shadowSm}
                    >
                      <View style={styles.flexRow, styles.itemsCenter}>
                        <View style={styles.w12, styles.h12, styles.roundedXl, styles.bgslate50, styles.dark:bgzinc950, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.mr3, styles.overflowHidden, styles.shadowxs}>
                          {getAppImageSource(item.imageUrl) ? (
                            <Image 
                              source={getAppImageSource(item.imageUrl)!} 
                              style={styles.wfull, styles.hfull}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={styles.textxl}>{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt1, styles.uppercase, styles.trackingwide}>
                            ₹{item.price}  •  Stock: {item.stock}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Grid of Toggle Badges */}
                      <View style={styles.flexRow, styles.gap2, styles.pt2, styles.bordert, styles.borderslate100, styles.dark:borderzinc80080}>
                        {/* Flash Deals Button */}
                        <Pressable
                          onPress={() => toggleProductHighlight(item, 'flash')}
                          disabled={togglingHighlightId === `${item.id}-flash`}
                          style={flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isFlashDeal 
                              ? [styles.bgrose50, styles.dark:bgrose95515, styles.borderrose200, styles.dark:borderrose90030] 
                              : [styles.bgslate50, styles.dark:bgzinc80040, styles.borderslate200, styles.dark:borderzinc800]
                          }}
                        >
                          <Text style={text-[8.5px] font-black uppercase tracking-wider ${item.isFlashDeal ? [styles.textrose600, styles.dark:textrose400] : [styles.textslate500, styles.dark:textslate400]}}>
                            ⚡ Flash Deal
                          </Text>
                          {togglingHighlightId === `${item.id}-flash` && (
                            <ActivityIndicator size="small" color="#f43f5e" style={{ marginLeft: 3, transform: [{ scale: 0.7 }] }} />
                          )}
                        </Pressable>

                        {/* Top Picks Button */}
                        <Pressable
                          onPress={() => toggleProductHighlight(item, 'toppicks')}
                          disabled={togglingHighlightId === `${item.id}-toppicks`}
                          style={flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isTopPick 
                              ? [styles.bgamber50, styles.dark:bgamber95515, styles.borderamber200, styles.dark:borderamber90030] 
                              : [styles.bgslate50, styles.dark:bgzinc80040, styles.borderslate200, styles.dark:borderzinc800]
                          }}
                        >
                          <Text style={text-[8.5px] font-black uppercase tracking-wider ${item.isTopPick ? [styles.textamber600, styles.dark:textamber400] : [styles.textslate500, styles.dark:textslate400]}}>
                            ⭐ Top Pick
                          </Text>
                          {togglingHighlightId === `${item.id}-toppicks` && (
                            <ActivityIndicator size="small" color="#d97706" style={{ marginLeft: 3, transform: [{ scale: 0.7 }] }} />
                          )}
                        </Pressable>

                        {/* Best Sellers Button */}
                        <Pressable
                          onPress={() => toggleProductHighlight(item, 'bestsellers')}
                          disabled={togglingHighlightId === `${item.id}-bestsellers`}
                          style={flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isBestSeller 
                              ? [styles.bgemerald50, styles.dark:bgemerald95515, styles.borderemerald200, styles.dark:borderemerald90030] 
                              : [styles.bgslate50, styles.dark:bgzinc80040, styles.borderslate200, styles.dark:borderzinc800]
                          }}
                        >
                          <Text style={text-[8.5px] font-black uppercase tracking-wider ${item.isBestSeller ? [styles.textemerald600, styles.dark:textemerald400] : [styles.textslate500, styles.dark:textslate400]}}>
                            🏆 Best Seller
                          </Text>
                          {togglingHighlightId === `${item.id}-bestsellers` && (
                            <ActivityIndicator size="small" color="#10b981" style={{ marginLeft: 3, transform: [{ scale: 0.7 }] }} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ));
                })()}
              </View>
            )}
          </View>
        )}

        {/* ------------------- LIVEOPS TAB WORKSPACE ------------------- */}
        {activeTab === 'LIVEOPS' && (() => {
          const pickTimeOrders = liveopsOrders.filter(o => o.confirmedAt && o.packedAt && o.shopName !== 'FastKirana Cafe Kitchen');
          const prepTimeOrders = liveopsOrders.filter(o => o.confirmedAt && o.packedAt && o.shopName === 'FastKirana Cafe Kitchen');
          const deliveryTimeOrders = liveopsOrders.filter(o => o.shippedAt && o.deliveredAt);

          const avgPickTime = pickTimeOrders.length > 0 
            ? Math.round(pickTimeOrders.reduce((sum, o) => sum + (new Date(o.packedAt).getTime() - new Date(o.confirmedAt).getTime()), 0) / pickTimeOrders.length / 60000)
            : 0;
          const avgPrepTime = prepTimeOrders.length > 0 
            ? Math.round(prepTimeOrders.reduce((sum, o) => sum + (new Date(o.packedAt).getTime() - new Date(o.confirmedAt).getTime()), 0) / prepTimeOrders.length / 60000)
            : 0;
          const avgDeliveryTime = deliveryTimeOrders.length > 0 
            ? Math.round(deliveryTimeOrders.reduce((sum, o) => sum + (new Date(o.deliveredAt).getTime() - new Date(o.shippedAt).getTime()), 0) / deliveryTimeOrders.length / 60000)
            : 0;

          const pendingCount = liveopsOrders.filter(o => o.status === 'PENDING').length;
          const confirmedCount = liveopsOrders.filter(o => o.status === 'CONFIRMED').length;
          const packedCount = liveopsOrders.filter(o => o.status === 'PACKED').length;
          const shippedCount = liveopsOrders.filter(o => o.status === 'SHIPPED').length;
          const deliveredCount = liveopsOrders.filter(o => o.status === 'DELIVERED').length;

          // Compute delayed orders (e.g. Grocery > 10m, Cafe > 30m)
          const delayedOrders = liveopsOrders.filter(order => {
            if (order.status === 'DELIVERED' || order.status === 'CANCELLED') return false;
            const isCafe = order.shopName === 'FastKirana Cafe Kitchen';
            const limit = isCafe ? 30 : 10;
            const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            return elapsed > limit;
          });

          return (
            <View style={styles.px4, styles.py4, styles.gap6}>
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb1}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Real-time Operations</Text>
                <Pressable 
                  onPress={() => fetchLiveopsData()} 
                  disabled={isLiveopsLoading}
                  style={styles.p2.5, styles.roundedXl, styles.bgindigo60010, styles.border, styles.borderindigo50020, styles.active:bgindigo60020}
                >
                  {isLiveopsLoading ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <RefreshCw size={14} color="#6366f1" />
                  )}
                </Pressable>
              </View>

              {/* Counts Grid */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {[
                  { label: 'Placed', count: pendingCount, color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
                  { label: 'Picking/Prep', count: confirmedCount, color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
                  { label: 'Packed', count: packedCount, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                  { label: 'Out', count: shippedCount, color: 'border-purple-500/30 text-purple-400 bg-purple-500/5' },
                  { label: 'Delivered', count: deliveredCount, color: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/5' },
                ].map((stat, i) => (
                  <View key={i} style={border rounded-2xl p-4 w-28 items-center ${stat.color} bg-white dark:bg-zinc-900}>
                    <Text style={styles.textCustom8, styles.fontextrabold, styles.uppercase, styles.trackingwider, styles.opacity80}>{stat.label}</Text>
                    <Text style={styles.textlg, styles.fontblack, styles.mt1, styles.textslate800, styles.dark:textwhite}>{stat.count}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Speed meters */}
              <View style={styles.gap3}>
                {[
                  { label: 'Avg Picking Speed', value: avgPickTime, desc: 'Grocery confirm to pack duration', icon: ShoppingBag, color: 'text-blue-400' },
                  { label: 'Avg Cafe Prep Speed', value: avgPrepTime, desc: 'Cafe preparation time duration', icon: Utensils, color: 'text-orange-400' },
                  { label: 'Avg Rider Dispatch Time', value: avgDeliveryTime, desc: 'Transit duration store to door', icon: Clock, color: 'text-rose-400' },
                ].map((meter, i) => {
                  const Icon = meter.icon;
                  return (
                    <View key={i} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p4, styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                      <View style={styles.flexRow, styles.itemsCenter, styles.gap3}>
                        <View style={styles.w9, styles.h9, styles.roundedXl, styles.bgslate100, styles.dark:bgslate800, styles.itemsCenter, styles.justifyCenter}>
                          <Icon size={16} className={meter.color} />
                        </View>
                        <View>
                          <Text style={styles.textslate800, styles.dark:textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs}>{meter.label}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>{meter.desc}</Text>
                        </View>
                      </View>
                      <View style={styles.itemsEnd}>
                        <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>{meter.value || '—'}</Text>
                        <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.uppercase, styles.trackingwider}>mins</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* SLA Alerts */}
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p4, styles.gap3}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>SLA Alert Stream</Text>
                {delayedOrders.length === 0 ? (
                  <Text style={styles.textCustom10, styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCenter, styles.py6}>All orders are running well within their SLA (10m Grocery / 30m Cafe).</Text>
                ) : (
                  <View style={styles.gap2}>
                    {delayedOrders.map((order, i) => {
                      const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                      return (
                        <View key={i} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.p3, styles.roundedXl, styles.border, styles.borderrose50010, styles.bgrose5005}>
                          <View>
                            <Text style={styles.textxs, styles.fontbold, styles.textrose400}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt0.5, styles.uppercase}>
                              {order.status} • {order.userName || order.userEmail || 'Customer'}
                            </Text>
                          </View>
                          <View style={styles.roundedFull, styles.bgrose50015, styles.border, styles.borderrose50035, styles.px2.5, styles.py1}>
                            <Text style={styles.textCustom9, styles.fontblack, styles.textrose500, styles.uppercase}>{elapsed}m delay</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Active Shopping Carts Tracker */}
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p4, styles.gap3}>
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.pb2, styles.borderb, styles.borderslate100, styles.dark:borderzinc80050}>
                  <View>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.flexRow, styles.itemsCenter}>
                      Active Shopping Carts{" "}
                      <View style={styles.w1.5, styles.h1.5, styles.roundedFull, styles.bgemerald500, styles.ml1.5} />
                    </Text>
                    <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>
                      Real-time view of customer shopping carts
                    </Text>
                  </View>
                  <Text style={styles.textCustom10, styles.fontblack, styles.textindigo400, styles.bgindigo50010, styles.px2.5, styles.py0.5, styles.roundedFull}>
                    {activeCartsCount} Active
                  </Text>
                </View>

                {activeCarts.length === 0 ? (
                  <Text style={styles.textCustom10, styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCenter, styles.py6}>
                    No active customer shopping carts in the last 12 hours.
                  </Text>
                ) : (
                  <View style={styles.gap3}>
                    {activeCarts.map((cart, idx) => {
                      const timeAgoMin = Math.floor((new Date().getTime() - new Date(cart.updatedAt).getTime()) / 60000);
                      let timeString = `${timeAgoMin}m ago`;
                      if (timeAgoMin === 0) timeString = 'Just now';
                      else if (timeAgoMin >= 60) {
                        const hours = Math.floor(timeAgoMin / 60);
                        timeString = `${hours}h ago`;
                      }

                      return (
                        <View key={cart.id || idx} style={styles.bgslate50, styles.dark:bgzinc95040, styles.border, styles.borderslate100, styles.dark:borderzinc80080, styles.roundedXl, styles.p3, styles.gap2}>
                          {/* Customer Info & Time */}
                          <View style={styles.flexRow, styles.justifyBetween, styles.itemsStart}>
                            <View style={styles.flex1, styles.pr2}>
                              <Text style={styles.textslate800, styles.dark:textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs}>{cart.userName}</Text>
                              <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontsemibold, styles.mt0.5}>
                                {cart.userPhone} • {cart.userEmail}
                              </Text>
                              {cart.address && (
                                <View style={styles.flexRow, styles.itemsCenter, styles.gap1, styles.mt1}>
                                  <MapPin size={10} color="#f43f5e" />
                                  <Text style={styles.textrose500, styles.dark:textrose400, styles.textCustom8, styles.fontbold, styles.flex1} numberOfLines={1}>
                                    {cart.address}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.textslate500, styles.dark:textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold}>{timeString}</Text>
                          </View>

                          {/* Items List */}
                          <View style={styles.flexRow, styles.flexWrap, styles.gap1.5, styles.py1}>
                            {cart.items.map((item: any, i: number) => (
                              <View key={i} style={styles.flexRow, styles.itemsCenter, styles.bgwhite, styles.dark:bgslate900, styles.border, styles.borderslate200, styles.dark:borderzinc80050, styles.roundedlg, styles.px2, styles.py0.5}>
                                <Text style={styles.textslate800, styles.dark:textwhite, styles.textCustom9, styles.fontbold}>
                                  {item.productName}
                                  {item.selectedVariant ? ` (${item.selectedVariant})` : ''}
                                </Text>
                                <Text style={styles.textrose500, styles.textCustom9, styles.fontblack, styles.ml1.5}>
                                  x{item.quantity}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Price & Action */}
                          <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.pt2, styles.bordert, styles.borderslate100, styles.dark:borderzinc8005060}>
                            <View style={styles.flexRow, styles.itemsCenter, styles.gap1}>
                              <Text style={styles.textslate450, styles.textCustom8, styles.fontbold, styles.uppercase}>Total:</Text>
                              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>{formatPrice(cart.subtotal)}</Text>
                            </View>

                            <Pressable
                              onPress={() => handleOpenAlertModal(cart)}
                              disabled={isLoadingCarts}
                              style={styles.bgamber500, styles.active:bgamber600, styles.px3, styles.py1.5, styles.roundedlg, styles.flexRow, styles.itemsCenter, styles.gap1}
                            >
                              <Text style={styles.textwhite, styles.textCustom9, styles.fontblack}>🔔 Send Alert</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })()}

        {/* ------------------- CATEGORIES TAB WORKSPACE ------------------- */}
        {activeTab === 'CATEGORIES' && (
          <View style={styles.px4, styles.py4, styles.gap4}>
            {/* Sub-view Toggle Header */}
            <View style={styles.flexRow, styles.bgslate100, styles.dark:bgzinc900, styles.p1, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc805, styles.gap1, styles.mb2}>
              <Pressable
                onPress={() => {
                  setCategorySubView('grocery');
                  triggerHaptic('light');
                }}
                style={flex-1 items-center py-2.5 rounded-xl ${
                  categorySubView === [styles.grocery] ? [styles.bgindigo600, styles.shadow] : [styles.bgtransparent]
                }}
              >
                <Text style={text-[10px] font-extrabold uppercase tracking-wider ${categorySubView === [styles.grocery] ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]}}>
                  📦 Grocery Categories
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCategorySubView('cafe');
                  triggerHaptic('light');
                }}
                style={flex-1 items-center py-2.5 rounded-xl ${
                  categorySubView === [styles.cafe] ? [styles.bgindigo600, styles.shadow] : [styles.bgtransparent]
                }}
              >
                <Text style={text-[10px] font-extrabold uppercase tracking-wider ${categorySubView === [styles.cafe] ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]}}>
                  ☕ Café Menu Sections
                </Text>
              </Pressable>
            </View>

            {categorySubView === 'grocery' ? (
              // Existing Categories View
              <View style={styles.gap4}>
                {/* Clean, Simple Header Banner */}
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc90050, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate20080, styles.dark:borderzinc800}>
                  <View style={styles.flex1, styles.pr2}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontextrabold, styles.textsm}>Store Categories</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mt0.5}>Control category grouping and weights.</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setShowAddCategory(!showAddCategory);
                      triggerHaptic('light');
                    }}
                    style={styles.flexRow, styles.itemsCenter, styles.gap1.5, styles.px3, styles.py2, styles.bgindigo600, styles.roundedXl, styles.shadowSm}
                  >
                    <PlusCircle size={14} color="#fff" />
                    <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Add New</Text>
                  </Pressable>
                </View>

                {/* Add Category Form */}
                {showAddCategory && (
                  <View style={styles.bgwhite, styles.dark:bgzinc900, styles.p4, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.rounded2Xl, styles.gap3, styles.animateslideup}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Add Category Details</Text>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Category Name *</Text>
                      <TextInput
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="e.g. Gourmet Sweets"
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Image / Emoji Icon</Text>
                      <TextInput
                        value={newCategoryImageUrl}
                        onChangeText={setNewCategoryImageUrl}
                        placeholder="e.g. 🍫 or https://cloudinary.com/..."
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Sort Order Weight</Text>
                      <TextInput
                        value={newCategorySortOrder}
                        onChangeText={setNewCategorySortOrder}
                        keyboardType="numeric"
                        placeholder="e.g. 9"
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.flexRow, styles.gap2, styles.mt2}>
                      <Pressable
                        onPress={() => setShowAddCategory(false)}
                        style={styles.flex1, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.py2.5, styles.roundedXl, styles.itemsCenter}
                      >
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreateCategory}
                        disabled={isCreatingCategory}
                        style={styles.flex1, styles.bgindigo600, styles.py2.5, styles.roundedXl, styles.itemsCenter, styles.justifyCenter, styles.flexRow}
                      >
                        {isCreatingCategory && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                        <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Create</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Categories List */}
                {isCategoriesLoading ? (
                  <ActivityIndicator size="large" color="#6366f1" style={styles.py10} />
                ) : (
                  <View style={styles.gap2.5}>
                    {categories.map((c) => (
                      <View key={c.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.p3.5, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.shadowSm}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap3.5, styles.flex1, styles.minw0}>
                          {/* Soft circular icon container */}
                          <View style={styles.w11, styles.h11, styles.rounded2Xl, styles.bgslate100, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate20060, styles.dark:borderzinc700, styles.overflowHidden}>
                            {getAppImageSource(c.imageUrl) ? (
                              <Image source={getAppImageSource(c.imageUrl)!} style={styles.wfull, styles.hfull} contentFit="cover" />
                            ) : (
                              <Text style={styles.textlg}>{c.imageUrl || '📦'}</Text>
                            )}
                          </View>
                          <View style={styles.flex1, styles.minw0, styles.pr2}>
                            {/* Corrected Text Visibility & Styling */}
                            <Text style={styles.textslate900, styles.dark:textwhite, styles.fontbold, styles.textsm, styles.truncate}>{c.name}</Text>
                            <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom10, styles.fontsemibold, styles.mt0.5, styles.uppercase, styles.trackingwide, styles.truncate}>
                              {c.slug} · weight: {c.sortOrder}
                            </Text>
                          </View>
                        </View>

                        {/* Modern Action Buttons */}
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                          <Pressable
                            onPress={() => {
                              setEditingCategory(c);
                              triggerHaptic('light');
                            }}
                            style={styles.p2.5, styles.roundedFull, styles.bgslate50, styles.dark:bgzinc800, styles.border, styles.borderslate20060, styles.dark:borderzinc750, styles.active:bgslate100, styles.dark:active:bgzinc700}
                          >
                            <Edit2 size={13} color={isDarkMode ? '#cbd5e1' : '#475569'} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteCategory(c.id)}
                            disabled={deletingCategoryId === c.id}
                            style={styles.p2.5, styles.roundedFull, styles.bgred50, styles.dark:bgred95020, styles.border, styles.borderred100, styles.dark:borderred90030, styles.active:bgred100, styles.dark:active:bgred95040}
                          >
                            {deletingCategoryId === c.id ? (
                              <ActivityIndicator size="small" color="#f43f5e" />
                            ) : (
                              <Trash2 size={13} color="#f43f5e" />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              // Café Menu Sections View
              <View style={styles.gap4}>
                {/* Clean, Simple Header Banner */}
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc90050, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc800}>
                  <View style={styles.flex1, styles.pr2}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontextrabold, styles.textsm}>Café Menu Sections</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontsemibold, styles.mt0.5}>Configure and reorder sections on Cafe storefront.</Text>
                  </View>
                  {!(isAddingNewCafeSec || editingCafeSecIndex !== null) && (
                    <Pressable
                      onPress={() => {
                        setIsAddingNewCafeSec(true);
                        setEditingCafeSecIndex(null);
                        setSecTag('');
                        setSecTitle('');
                        setSecEmoji('');
                        setSecDescription('');
                        setSecMatchTags('');
                        triggerHaptic('light');
                      }}
                      style={styles.flexRow, styles.itemsCenter, styles.gap1.5, styles.px3, styles.py2, styles.bgindigo600, styles.roundedXl, styles.shadowSm}
                    >
                      <PlusCircle size={14} color="#fff" />
                      <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase, styles.trackingwider}>Add Section</Text>
                    </Pressable>
                  )}
                </View>

                {/* Add / Edit Café Section Form */}
                {(isAddingNewCafeSec || editingCafeSecIndex !== null) && (
                  <View style={styles.bgwhite, styles.dark:bgzinc900, styles.p4, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.rounded2Xl, styles.gap3}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>
                      {isAddingNewCafeSec ? '✨ Add New Café Section' : '📝 Edit Café Section'}
                    </Text>
                    
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Section Title *</Text>
                      <TextInput
                        value={secTitle}
                        onChangeText={setSecTitle}
                        placeholder="e.g. Gourmet Sandwiches"
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate805, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>

                    <View style={styles.flexRow, styles.gap3}>
                      <View style={styles.flex1, styles.gap2}>
                        <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Tag Slug (Unique) *</Text>
                        <TextInput
                          value={secTag}
                          onChangeText={setSecTag}
                          placeholder="e.g. sandwiches"
                          placeholderTextColor="#64748b"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                        />
                      </View>
                      <View style={styles.flex1, styles.gap2}>
                        <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Emoji Icon *</Text>
                        <TextInput
                          value={secEmoji}
                          onChangeText={setSecEmoji}
                          placeholder="e.g. 🥪"
                          placeholderTextColor="#64748b"
                          style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate805, styles.dark:textwhite, styles.fontbold, styles.textxs, styles.textCenter}
                        />
                      </View>
                    </View>

                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Description / Subtitle</Text>
                      <TextInput
                        value={secDescription}
                        onChangeText={setSecDescription}
                        placeholder="e.g. Freshly grilled loaded sandwiches"
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>

                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Match Product Tags (Comma-separated)</Text>
                      <TextInput
                        value={secMatchTags}
                        onChangeText={setSecMatchTags}
                        placeholder="e.g. sandwich, sandwiches"
                        placeholderTextColor="#64748b"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>

                    <View style={styles.flexRow, styles.gap2, styles.mt2}>
                      <Pressable
                        onPress={() => {
                          setIsAddingNewCafeSec(false);
                          setEditingCafeSecIndex(null);
                        }}
                        style={styles.flex1, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.py2.5, styles.roundedXl, styles.itemsCenter}
                      >
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (!secTag.trim() || !secTitle.trim() || !secEmoji.trim()) {
                            toast.error('Tag, Title and Emoji are required');
                            return;
                          }
                          const cleanTag = secTag.trim().toLowerCase().replace(/\s+/g, '-');
                          const cleanMatchTags = secMatchTags.trim() 
                            ? secMatchTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
                            : [cleanTag];
                          
                          let updatedList = [...cafeMenuSections];
                          const isExistingDisabled = editingCafeSecIndex !== null ? !!updatedList[editingCafeSecIndex].disabled : false;

                          const newSec = {
                            tag: cleanTag,
                            title: secTitle.trim(),
                            emoji: secEmoji.trim(),
                            description: secDescription.trim(),
                            matchTags: cleanMatchTags,
                            disabled: isExistingDisabled
                          };

                          if (isAddingNewCafeSec) {
                            if (updatedList.some(s => s.tag === cleanTag)) {
                              toast.error('A section with this tag slug already exists');
                              return;
                            }
                            updatedList.push(newSec);
                          } else if (editingCafeSecIndex !== null) {
                            updatedList[editingCafeSecIndex] = newSec;
                          }

                          handleSaveCafeSections(updatedList);
                          setIsAddingNewCafeSec(false);
                          setEditingCafeSecIndex(null);
                        }}
                        style={styles.flex1, styles.bgindigo600, styles.py2.5, styles.roundedXl, styles.itemsCenter}
                      >
                        <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Apply</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Café Sections List */}
                {isCafeSectionsLoading ? (
                  <ActivityIndicator size="large" color="#6366f1" style={styles.py10} />
                ) : (
                  <View style={styles.gap2.5}>
                    {cafeMenuSections.map((sec, idx) => (
                      <View key={sec.tag} style={{ opacity: sec.disabled ? 0.6 : 1 }} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.p3.5, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.shadowSm}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap3.5, styles.flex1, styles.minw0}>
                          {/* Soft rounded icon container */}
                          <View style={styles.w11, styles.h11, styles.rounded2Xl, styles.bgslate100, styles.dark:bgzinc800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate20060, styles.dark:borderzinc700, styles.overflowHidden}>
                            <Text style={styles.textlg}>{sec.emoji || '☕'}</Text>
                          </View>
                          <View style={styles.flex1, styles.minw0, styles.pr2}>
                            <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flexWrap}>
                              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontbold, styles.textsm, styles.truncate}>{sec.title}</Text>
                              <View style={styles.bgindigo50, styles.dark:bgindigo95040, styles.border, styles.borderindigo100, styles.dark:borderindigo90050, styles.px1.5, styles.py0.5, styles.roundedmd}>
                                <Text style={styles.textindigo600, styles.dark:textindigo400, styles.textCustom8, styles.fontextrabold, styles.uppercase, styles.trackingwider}>#{sec.tag}</Text>
                              </View>
                              {sec.disabled && (
                                <View style={styles.bgrose50, styles.dark:bgrose95040, styles.border, styles.borderrose100, styles.dark:borderrose90050, styles.px1.5, styles.py0.5, styles.roundedmd}>
                                  <Text style={styles.textrose600, styles.dark:textrose450, styles.textCustom8, styles.fontextrabold, styles.uppercase, styles.trackingwider}>OFF</Text>
                                </View>
                              )}
                            </View>
                            {sec.description ? (
                              <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom10, styles.fontsemibold, styles.mt1, styles.truncate}>{sec.description}</Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                          {/* Reordering controls */}
                          <View style={styles.flexRow, styles.gap1, styles.borderr, styles.borderslate100, styles.dark:borderzinc805, styles.pr2, styles.mr1}>
                            <Pressable
                              disabled={idx === 0}
                              onPress={() => {
                                let copy = [...cafeMenuSections];
                                const [moved] = copy.splice(idx, 1);
                                copy.splice(idx - 1, 0, moved);
                                handleSaveCafeSections(copy);
                              }}
                              style={p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 ${idx === 0 ? [styles.opacity30] : [styles.active:bgslate100, styles.dark:active:bgzinc800]}}
                            >
                              <ArrowUp size={11} color="#94a3b8" />
                            </Pressable>
                            <Pressable
                              disabled={idx === cafeMenuSections.length - 1}
                              onPress={() => {
                                let copy = [...cafeMenuSections];
                                const [moved] = copy.splice(idx, 1);
                                copy.splice(idx + 1, 0, moved);
                                handleSaveCafeSections(copy);
                              }}
                              style={p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 ${idx === cafeMenuSections.length - 1 ? [styles.opacity30] : [styles.active:bgslate100, styles.dark:active:bgzinc800]}}
                            >
                              <ArrowDown size={11} color="#94a3b8" />
                            </Pressable>
                          </View>

                          {/* ON/OFF Switch */}
                          <Pressable
                            onPress={() => {
                              let copy = [...cafeMenuSections];
                              copy[idx] = {
                                ...copy[idx],
                                disabled: !copy[idx].disabled
                              };
                              handleSaveCafeSections(copy);
                              triggerHaptic('success');
                              Alert.alert(
                                'Section Status Updated',
                                `"${sec.title}" is now turned ${copy[idx].disabled ? 'OFF' : 'ON'}.`
                              );
                            }}
                            style={px-2.5 py-1.5 border rounded-lg active:scale-95 ${
                              sec.disabled 
                                ? [styles.borderrose50025, styles.bgrose50010] 
                                : [styles.borderemerald50025, styles.bgemerald50010]
                            }}
                          >
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: sec.disabled ? 'THEME.COLORS.brand.accent' : 'THEME.COLORS.brand.success' }}>
                              {sec.disabled ? 'OFF' : 'ON'}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setEditingCafeSecIndex(idx);
                              setIsAddingNewCafeSec(false);
                              setSecTag(sec.tag);
                              setSecTitle(sec.title);
                              setSecEmoji(sec.emoji || '☕');
                              setSecDescription(sec.description || '');
                              setSecMatchTags(sec.matchTags ? sec.matchTags.join(', ') : sec.tag);
                              triggerHaptic('light');
                            }}
                            style={styles.p2.5, styles.roundedFull, styles.bgslate50, styles.dark:bgzinc800, styles.border, styles.borderslate20060, styles.dark:borderslate750, styles.active:bgslate100, styles.dark:active:bgzinc700}
                          >
                            <Edit2 size={13} color={isDarkMode ? '#cbd5e1' : '#475569'} />
                          </Pressable>
                          
                          <Pressable
                            onPress={() => {
                              Alert.alert(
                                'Delete Section',
                                'Are you sure you want to delete this menu section? Products in this section will fall back to "More Specials".',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { 
                                    text: 'Delete', 
                                    style: 'destructive',
                                    onPress: () => {
                                      let copy = [...cafeMenuSections];
                                      copy.splice(idx, 1);
                                      handleSaveCafeSections(copy);
                                    }
                                  }
                                ]
                              );
                            }}
                            disabled={isSavingCafeSections}
                            style={styles.p1.5, styles.roundedlg, styles.bgred60010, styles.border, styles.borderred50025, styles.active:bgred60030}
                          >
                            <XCircle size={14} color="#f43f5e" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
              <Modal visible={true} transparent={true} animationType="fade">
                <View style={styles.flex1, styles.bgblack60, styles.justifyCenter, styles.p6}>
                  <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.rounded3Xl, styles.p6, styles.gap3}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Edit Category: {editingCategory.name}</Text>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Category Name</Text>
                      <TextInput
                        value={editingCategory.name}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, name: t })}
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Image / Icon</Text>
                      <TextInput
                        value={editingCategory.imageUrl}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, imageUrl: t })}
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.gap2}>
                      <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Sort Order Weight</Text>
                      <TextInput
                        value={String(editingCategory.sortOrder)}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, sortOrder: t })}
                        keyboardType="numeric"
                        style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                      />
                    </View>
                    <View style={styles.flexRow, styles.gap2, styles.mt2}>
                      <Pressable
                        onPress={() => setEditingCategory(null)}
                        style={styles.flex1, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.py2.5, styles.roundedXl, styles.itemsCenter}
                      >
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleUpdateCategory}
                        style={styles.flex1, styles.bgindigo600, styles.py2.5, styles.roundedXl, styles.itemsCenter}
                      >
                        <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}

        {/* ------------------- ALERTS TAB WORKSPACE ------------------- */}
        {activeTab === 'ALERTS' && (
          <View style={styles.px4, styles.py4, styles.gap4}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.p4, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.gap3}>
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                <View>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>System Alerts</Text>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold, styles.mt0.5}>Critical inventory shortages and processing delays.</Text>
                </View>
                <Pressable
                  onPress={handleRecalculateAlerts}
                  disabled={isAlertsRefreshing}
                  style={styles.p2, styles.bgindigo60010, styles.border, styles.borderindigo50020, styles.roundedXl, styles.active:bgindigo60020}
                >
                  {isAlertsRefreshing ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <RefreshCw size={14} color="#6366f1" />
                  )}
                </Pressable>
              </View>

              {/* Sub-tabs horizontal selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { key: 'ALL', label: 'All', count: alertsCounts.total },
                  { key: 'OUT_OF_STOCK', label: 'Out of Stock', count: alertsCounts.outOfStock },
                  { key: 'LOW_STOCK', label: 'Low Stock', count: alertsCounts.lowStock },
                  { key: 'EXPIRING_SOON', label: 'Expiring', count: alertsCounts.expiringSoon },
                  { key: 'EXPIRED', label: 'Expired', count: alertsCounts.expired },
                  { key: 'PACKING_DELAY', label: 'Packing Delay', count: alertsCounts.packingDelay }
                ].map((tabObj) => (
                  <Pressable
                    key={tabObj.key}
                    onPress={() => {
                      setActiveAlertSubTab(tabObj.key as any);
                      triggerHaptic('light');
                    }}
                    style={px-3 py-1.5 rounded-lg border mr-1 flex-row items-center gap-1 ${
                      activeAlertSubTab === tabObj.key
                        ? [styles.bgindigo600, styles.borderindigo500]
                        : [styles.bgslate80060, styles.borderslate70040]
                    }}
                  >
                    <Text style={styles.textCustom9, styles.fontblack, styles.textwhite, styles.uppercase}>
                      {tabObj.label} ({tabObj.count || 0})
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {isAlertsLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.py10} />
            ) : (
              <View style={styles.gap3}>
                {alerts.filter(a => activeAlertSubTab === 'ALL' || a.alertType === activeAlertSubTab).map((item) => {
                  const isSnoozedKey = `${item.id}:${item.alertType}`;
                  return (
                    <View key={isSnoozedKey} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}>
                      <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.flex1, styles.mr2}>
                          <View style={styles.w10, styles.h10, styles.roundedXl, styles.bgslate800, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate700, styles.mr2.5, styles.overflowHidden}>
                            {getAppImageSource(item.imageUrl) ? (
                              <Image source={getAppImageSource(item.imageUrl)!} style={styles.wfull, styles.hfull} contentFit="cover" />
                            ) : (
                              <Text style={styles.textlg}>{item.imageUrl || '📦'}</Text>
                            )}
                          </View>
                          <View style={styles.flex1}>
                            <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5, styles.uppercase}>
                              Stock: {item.stock} / Min: {item.minStock}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.itemsEnd}>
                          <View style={rounded-full px-2 py-0.5 ${
                            item.alertType === [styles.OUT_OF_STOCK] || item.alertType === [styles.EXPIRED] ? [styles.bgred50010, styles.border, styles.borderred50020] : [styles.bgamber50010, styles.border, styles.borderamber50020]
                          }}>
                            <Text style={text-[8px] font-black uppercase ${
                              item.alertType === [styles.OUT_OF_STOCK] || item.alertType === [styles.EXPIRED] ? [styles.textred500] : [styles.textamber500]
                            }}>
                              {item.alertType.replace(/_/g, ' ')}
                            </Text>
                          </View>
                          {item.expiryDate && (
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom7, styles.fontbold, styles.mt1, styles.uppercase}>
                              {item.alertType === 'PACKING_DELAY' 
                                ? `Placed ${Math.floor((Date.now() - new Date(item.expiryDate).getTime()) / 60000)}m ago` 
                                : `Expiry: ${new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                              }
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Alert Action Panel */}
                      <View style={styles.flexRow, styles.gap2, styles.pt2, styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.itemsCenter, styles.justifyBetween}>
                        {/* Quick Restock Input & Button */}
                        {(item.alertType === 'OUT_OF_STOCK' || item.alertType === 'LOW_STOCK') ? (
                          <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.flex1, styles.mr3}>
                            <TextInput
                              keyboardType="numeric"
                              placeholder="Qty"
                              placeholderTextColor="#64748b"
                              value={alertRestockAmount[item.id] || ''}
                              onChangeText={(t) => setAlertRestockAmount(prev => ({ ...prev, [item.id]: t }))}
                              style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedlg, styles.px2, styles.py1, styles.textwhite, styles.fontblack, styles.textCustom10, styles.w12, styles.textCenter}
                            />
                            <Pressable
                              onPress={() => handleRestockAlert(item.id, item.stock)}
                              disabled={submittingRestockId === item.id}
                              style={styles.bgindigo60010, styles.border, styles.borderindigo50025, styles.px3, styles.py1.5, styles.roundedlg, styles.flexRow, styles.itemsCenter, styles.justifyCenter}
                            >
                              {submittingRestockId === item.id ? (
                                <ActivityIndicator size="small" color="#6366f1" style={{ scaleX: 0.8, scaleY: 0.8 }} />
                              ) : (
                                <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom9, styles.uppercase}>Restock</Text>
                              )}
                            </Pressable>
                          </View>
                        ) : <View style={styles.flex1} />}

                        {/* Snooze Button */}
                        <Pressable
                          onPress={() => handleSnoozeAlert(item.id, item.alertType)}
                          disabled={submittingAlertAction === isSnoozedKey}
                          style={styles.px3, styles.py1.5, styles.roundedlg, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.bgslate950, styles.active:bgslate900}
                        >
                          {submittingAlertAction === isSnoozedKey ? (
                            <ActivityIndicator size="small" color="#94a3b8" />
                          ) : (
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase}>Snooze 30m</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ------------------- INWARD TAB WORKSPACE ------------------- */}
        {activeTab === 'INWARD' && (
          <View style={styles.px4, styles.py4, styles.gap4}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded2Xl, styles.gap3}>
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                <Building2 size={18} color="#6366f1" />
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Goods Receipt Note (GRN)</Text>
              </View>
              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold}>Register trackable expiry-date batches to restock inventory.</Text>

              {/* Product Lookup Search */}
              <View style={styles.flexRow, styles.itemsCenter, styles.bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.h11, styles.mt1}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  placeholder="Lookup products by name..."
                  placeholderTextColor="#64748b"
                  value={inwardSearchQuery}
                  onChangeText={handleInwardProductSearch}
                  style={styles.flex1, styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.ml2}
                />
              </View>

              {/* Search Dropdown options */}
              {inwardProductsList.length > 0 && (
                <View style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.overflowHidden, styles.mt1, styles.dividey, styles.divideslate900}>
                  {inwardProductsList.map((prod) => (
                    <Pressable
                      key={prod.id}
                      onPress={() => handleSelectInwardProduct(prod)}
                      style={styles.p3, styles.active:bgslate900, styles.flexRow, styles.itemsCenter}
                    >
                      <Text style={styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs, styles.flex1}>{prod.name}</Text>
                      <Text style={styles.textindigo400, styles.fontblack, styles.textCustom9, styles.uppercase, styles.ml2}>₹{prod.price} • Stock: {prod.stock}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Selected Product Form */}
            {selectedInwardProduct && (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded2Xl, styles.gap4}>
                <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb2.5}>
                  <View style={styles.flex1, styles.mr2}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>{selectedInwardProduct.name}</Text>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5, styles.uppercase}>Current Stock: {selectedInwardProduct.stock}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedInwardProduct(null)} style={styles.p1}>
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Form fields */}
                <View style={styles.gap3}>
                  <View style={styles.gap1.5}>
                    <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Inward Quantity</Text>
                    <TextInput
                      value={inwardQuantity}
                      onChangeText={setInwardQuantity}
                      keyboardType="numeric"
                      style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textwhite, styles.fontsemibold, styles.textxs}
                    />
                  </View>

                  <View style={styles.gap1.5}>
                    <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Batch Cost Price (₹)</Text>
                    <TextInput
                      value={inwardCostPrice}
                      onChangeText={setInwardCostPrice}
                      keyboardType="numeric"
                      style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textwhite, styles.fontsemibold, styles.textxs}
                    />
                  </View>

                  <View style={styles.gap1.5}>
                    <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Batch Code Identifier</Text>
                    <TextInput
                      value={inwardBatchCode}
                      onChangeText={setInwardBatchCode}
                      style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textwhite, styles.fontsemibold, styles.textxs}
                    />
                  </View>

                  <View style={styles.gap1.5}>
                    <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Expiry Date (YYYY-MM-DD)</Text>
                    <TextInput
                      value={inwardExpiryDate}
                      onChangeText={setInwardExpiryDate}
                      placeholder="e.g. 2026-12-31"
                      placeholderTextColor="#475569"
                      style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2, styles.textwhite, styles.fontsemibold, styles.textxs}
                    />
                    {/* Expiry Presets */}
                    <View style={styles.flexRow, styles.gap1.5, styles.mt1.5}>
                      {[
                        { label: '+3M', m: 3 },
                        { label: '+6M', m: 6 },
                        { label: '+1Y', m: 12 },
                      ].map((preset, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() + preset.m);
                            setInwardExpiryDate(d.toISOString().split('T')[0]);
                          }}
                          style={styles.bgslate80080, styles.border, styles.borderslate70060, styles.px2.5, styles.py1, styles.roundedlg, styles.active:bgslate700}
                        >
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.fontbold, styles.textCustom8}>{preset.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Submit button */}
                <Pressable
                  onPress={handleSubmitInward}
                  disabled={isInwardSubmitting}
                  style={styles.bgindigo600, styles.py3, styles.roundedXl, styles.itemsCenter, styles.justifyCenter, styles.flexRow, styles.mt2}
                >
                  {isInwardSubmitting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                  <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Confirm Inward Receipt</Text>
                </Pressable>
              </View>
            )}

            {/* Recent Session Logs */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded2Xl, styles.gap3}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Recent GRN Entries</Text>
              {recentInwardLogs.length === 0 ? (
                <Text style={styles.textCustom10, styles.textslate500, styles.dark:textslate400, styles.textCenter, styles.py6}>No inventory shipments inwarded in this session.</Text>
              ) : (
                <View style={styles.gap2.5}>
                  {recentInwardLogs.map((log) => (
                    <View key={log.id} style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p3, styles.roundedXl, styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                      <View>
<Text style={styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}>{log.productName}</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontmono, styles.mt0.5, styles.uppercase}>
                          Batch: {log.batchCode} • Exp: {log.expiryDate}
                        </Text>
                      </View>
                      <View style={styles.itemsEnd}>
                        <Text style={styles.textemerald400, styles.fontblack, styles.textxs}>+{log.quantity} units</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>{log.timestamp}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ------------------- BULK UPDATE TAB WORKSPACE ------------------- */}
        {activeTab === 'BULK_UPDATE' && (
          <View style={styles.px4, styles.py4, styles.gap4}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate20060, styles.dark:borderzinc850, styles.p5, styles.rounded3Xl, styles.gap5, styles.shadowSm}>
              <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.mb1}>
                <Zap size={18} color="#e11d48" />
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Bulk Inventory Update</Text>
              </View>

              {/* Category Dropdown Selection */}
              <View style={styles.gap2}>
                <Text style={styles.textslate700, styles.dark:textslate300, styles.fontbold, styles.textxs}>Filter Category Scope</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Pressable
                    onPress={() => setBulkCategoryId('ALL')}
                    style={px-4 py-2 rounded-full border ${
                      bulkCategoryId === [styles.ALL] ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate100, styles.dark:bgzinc800, styles.borderslate20060, styles.dark:borderzinc700]
                    }}
                  >
                    <Text style={font-extrabold text-[10px] uppercase tracking-wide ${bulkCategoryId === [styles.ALL] ? [styles.textwhite] : [styles.textslate600, styles.dark:textslate400]}}>All Products</Text>
                  </Pressable>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setBulkCategoryId(cat.id)}
                      style={px-4 py-2 rounded-full border ${
                        bulkCategoryId === cat.id ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate100, styles.dark:bgzinc800, styles.borderslate20060, styles.dark:borderzinc700]
                      }}
                    >
                      <Text style={font-extrabold text-[10px] uppercase tracking-wide ${bulkCategoryId === cat.id ? [styles.textwhite] : [styles.textslate600, styles.dark:textslate400]}}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Update Type - Fixed layout to prevent text clipping */}
              <View style={styles.gap2}>
                <Text style={styles.textslate700, styles.dark:textslate300, styles.fontbold, styles.textxs}>Update Target Field</Text>
                <View style={styles.flexRow, styles.flexWrap, styles.gap2}>
                  {[
                    { key: 'PRICE', label: 'Price' },
                    { key: 'STOCK', label: 'Stock' },
                    { key: 'MIN_STOCK', label: 'Min Stock' },
                    { key: 'AVAILABILITY', label: 'Availability' }
                  ].map((field) => (
                    <Pressable
                      key={field.key}
                      onPress={() => {
                        setBulkUpdateType(field.key as any);
                        if (field.key === 'AVAILABILITY') {
                          setBulkMode('SET_VALUE');
                          setBulkValue('1');
                        }
                        triggerHaptic('light');
                      }}
                      style={{ width: '48.5%' }}
                      style={py-2.5 rounded-xl border items-center justify-center ${
                        bulkUpdateType === field.key ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate50, styles.dark:bgzinc955, styles.borderslate200, styles.dark:borderzinc800]
                      }}
                    >
                      <Text style={font-bold text-xs ${bulkUpdateType === field.key ? [styles.textwhite] : [styles.textslate600, styles.dark:textzinc400]}}>{field.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Mode Selection */}
              {bulkUpdateType !== 'AVAILABILITY' && (
                <View style={styles.gap2}>
                  <Text style={styles.textslate700, styles.dark:textslate300, styles.fontbold, styles.textxs}>Update Mode</Text>
                  <View style={styles.flexRow, styles.gap2, styles.flexWrap}>
                    {[
                      { key: 'FLAT_INCREASE', label: 'Flat +' },
                      { key: 'FLAT_DECREASE', label: 'Flat -' },
                      { key: 'PERCENT_INCREASE', label: 'Percent +' },
                      { key: 'PERCENT_DECREASE', label: 'Percent -' },
                      { key: 'SET_VALUE', label: 'Set To' }
                    ].map((m) => (
                      <Pressable
                        key={m.key}
                        onPress={() => {
                          setBulkMode(m.key as any);
                          triggerHaptic('light');
                        }}
                        style={px-4 py-2 rounded-full border ${
                          bulkMode === m.key ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate100, styles.dark:bgzinc800, styles.borderslate20060, styles.dark:borderzinc700]
                        }}
                      >
                        <Text style={font-bold text-[9px] uppercase ${bulkMode === m.key ? [styles.textwhite] : [styles.textslate600, styles.dark:textslate400]}}>{m.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Value Input */}
              <View style={styles.gap2}>
                <Text style={styles.textslate700, styles.dark:textslate300, styles.fontbold, styles.textxs}>
                  {bulkUpdateType === 'AVAILABILITY' ? 'Enable / Disable Toggle' : 'Modification Value'}
                </Text>
                {bulkUpdateType === 'AVAILABILITY' ? (
                  <View style={styles.flexRow, styles.gap2}>
                    <Pressable
                      onPress={() => setBulkValue('1')}
                      style={flex-1 py-2.5 rounded-xl border items-center ${
                        bulkValue === [styles.1] ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate50, styles.dark:bgzinc955, styles.borderslate200, styles.dark:borderzinc800]
                      }}
                    >
                      <Text style={font-bold text-xs ${bulkValue === [styles.1] ? [styles.textwhite] : [styles.textslate655, styles.dark:textzinc400]}}>Available</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setBulkValue('0')}
                      style={flex-1 py-2.5 rounded-xl border items-center ${
                        bulkValue === [styles.0] ? [styles.bgindigo600, styles.borderindigo500, styles.shadowSm] : [styles.bgslate50, styles.dark:bgzinc955, styles.borderslate200, styles.dark:borderzinc800]
                      }}
                    >
                      <Text style={font-bold text-xs ${bulkValue === [styles.0] ? [styles.textwhite] : [styles.textslate655, styles.dark:textzinc400]}}>Unavailable</Text>
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    keyboardType="numeric"
                    value={bulkValue}
                    onChangeText={setBulkValue}
                    placeholder="e.g. 10"
                    placeholderTextColor="#94a3b8"
                    style={styles.bgslate50, styles.dark:bgzinc955, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontsemibold, styles.textxs}
                  />
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.flexRow, styles.gap3, styles.mt2}>
                <Pressable
                  onPress={handleBulkPreview}
                  disabled={isBulkPreviewing}
                  style={styles.flex1, styles.border, styles.borderindigo200, styles.dark:borderindigo900, styles.bgindigo5050, styles.dark:bgindigo95010, styles.py3, styles.rounded2Xl, styles.itemsCenter, styles.justifyCenter, styles.flexRow, styles.active:bgindigo100}
                >
                  {isBulkPreviewing && <ActivityIndicator size="small" color="#4f46e5" style={{ marginRight: 6 }} />}
                  <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontextrabold, styles.textCustom10, styles.uppercase}>Calculate Preview</Text>
                </Pressable>
                <Pressable
                  onPress={handleBulkApply}
                  disabled={isBulkApplying || bulkPreviews.length === 0}
                  style={flex-1 py-3 rounded-2xl items-center justify-center flex-row ${
                    bulkPreviews.length > 0 ? [styles.bgindigo600, styles.active:bgindigo700, styles.shadowMd] : [styles.bgslate100, styles.dark:bgzinc800]
                  }}
                >
                  {isBulkApplying && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                  <Text style={font-extrabold text-[10px] uppercase ${bulkPreviews.length > 0 ? [styles.textwhite] : [styles.textslate400, styles.dark:textslate600]}}>
                    Apply Batch
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Previews List */}
            {bulkPreviews.length > 0 && (
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded3Xl, styles.gap3, styles.shadowSm}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Previewing Changes ({bulkPreviews.length} products)</Text>
                <View style={styles.gap2, styles.maxh60, styles.overflowyauto}>
                  {bulkPreviews.slice(0, 10).map((p, i) => (
                    <View key={i} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc950, styles.p2.5, styles.roundedXl, styles.border, styles.borderslate100, styles.dark:borderzinc800}>
                      <Text style={styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textCustom10, styles.flex1, styles.mr2} numberOfLines={1}>{p.name}</Text>
                      <View style={styles.flexRow, styles.itemsCenter, styles.gap1.5}>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.lineThrough}>{String(p.oldValue)}</Text>
                        <ArrowRight size={10} color="#94a3b8" />
                        <Text style={styles.textemerald500, styles.dark:textemerald400, styles.fontblack, styles.textCustom10}>{String(p.newValue)}</Text>
                      </View>
                    </View>
                  ))}
                  {bulkPreviews.length > 10 && (
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.textCenter, styles.mt1}>
                      + {bulkPreviews.length - 10} more products matching category scope
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Batch Update History */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded3Xl, styles.gap3, styles.shadowSm}>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Modification Batch History</Text>
              {isBulkHistoryLoading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : bulkHistory.length === 0 ? (
                <Text style={styles.textCustom10, styles.textslate500, styles.dark:textslate400, styles.textCenter, styles.py6}>No historical bulk actions registered.</Text>
              ) : (
                <View style={styles.gap2.5}>
                  {bulkHistory.map((batch) => (
                    <View key={batch.batchId} style={styles.bgslate50, styles.dark:bgzinc955, styles.p3, styles.rounded2Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                      <View style={styles.flex1, styles.mr2}>
                        <Text style={styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}>{batch.changeType} Batch</Text>
                        <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>
                          {batch.count} products • {new Date(batch.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleBulkUndo(batch.batchId)}
                        disabled={undoingBatchId === batch.batchId}
                        style={styles.px3, styles.py2, styles.bgrose50, styles.border, styles.borderrose200, styles.dark:bgrose95520, styles.dark:borderrose90050, styles.roundedXl}
                      >
                        {undoingBatchId === batch.batchId ? (
                          <ActivityIndicator size="small" color="#f43f5e" />
                        ) : (
                          <Text style={styles.textrose500, styles.fontextrabold, styles.textCustom9, styles.uppercase}>Revert</Text>
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ------------------- REPORTS TAB WORKSPACE ------------------- */}
        {activeTab === 'REPORTS' && (() => {
          // Calculate chart dimensions
          const chartWidth = windowWidth - 64;
          const chartHeight = 160;

          // Segment filters helper logic
          const isCafeCategory = (catName: string) => {
            const name = catName.toLowerCase();
            return name.includes('cafe') || name.includes('sandwich') || name.includes('pasta') || name.includes('roll') || name.includes('bite') || name.includes('sip') || name.includes('shake') || name.includes('mocktail') || name.includes('soda') || name.includes('beverage') || name.includes('ice cream') || name.includes('dessert') || name.includes('chilled');
          };
          
          const isRestaurantCategory = (catName: string) => {
            const name = catName.toLowerCase();
            return name.includes('restaurant') || name.includes('indian') || name.includes('biryani') || name.includes('rice') || name.includes('meal') || name.includes('combo') || name.includes('thali') || name.includes('roti') || name.includes('paneer') || name.includes('curry');
          };

          const isGroceryCategory = (catName: string) => {
            return !isCafeCategory(catName) && !isRestaurantCategory(catName);
          };

          const filteredCategorySales = (() => {
            if (reportSegment === 'all') return reportCategorySales;
            if (reportSegment === 'grocery') return reportCategorySales.filter(c => isGroceryCategory(c.categoryName));
            if (reportSegment === 'cafe') return reportCategorySales.filter(c => isCafeCategory(c.categoryName));
            return reportCategorySales.filter(c => isRestaurantCategory(c.categoryName));
          })();

          const filteredTopProducts = (() => {
            if (reportSegment === 'all') return reportTopProducts;
            if (reportSegment === 'grocery') return reportTopProducts.filter(p => isGroceryCategory(p.categoryName || ''));
            if (reportSegment === 'cafe') return reportTopProducts.filter(p => isCafeCategory(p.categoryName || ''));
            return reportTopProducts.filter(p => isRestaurantCategory(p.categoryName || ''));
          })();

          const filteredSummary = (() => {
            if (reportSegment === 'all') return reportSummary;
            const sales = filteredTopProducts.reduce((sum, p) => sum + (p.sales || 0), 0);
            const profit = filteredTopProducts.reduce((sum, p) => sum + (p.profit || 0), 0);
            const cost = sales - profit;
            const totalOrders = reportSegment === 'grocery' 
              ? reportSummary.totalOrders 
              : Math.round(sales / (reportSummary.averageOrderValue || 50));
            const averageOrderValue = totalOrders > 0 ? sales / totalOrders : 0;
            const profitMargin = sales > 0 ? (profit / sales) * 100 : 0;
            return {
              totalSales: Math.round(sales * 100) / 100,
              totalProfit: Math.round(profit * 100) / 100,
              totalCost: Math.round(cost * 100) / 100,
              totalOrders: totalOrders || 0,
              averageOrderValue: Math.round(averageOrderValue * 100) / 100,
              profitMargin: Math.round(profitMargin * 10) / 10
            };
          })();

          const filteredDailySales = (() => {
            if (reportSegment === 'all') return reportDailySales;
            // Approximate daily sales contribution from category sales ratio
            const allSales = reportCategorySales.reduce((sum, c) => sum + (c.sales || 0), 0) || 1;
            const filteredSales = filteredCategorySales.reduce((sum, c) => sum + (c.sales || 0), 0);
            const ratio = filteredSales / allSales;
            return reportDailySales.map(d => ({
              ...d,
              sales: Math.round(d.sales * ratio * 100) / 100,
              profit: Math.round(d.profit * ratio * 100) / 100
            }));
          })();

          // Chart scaling coordinates
          const chartPoints = (() => {
            if (filteredDailySales.length < 2) return [];
            const paddingX = 10;
            const paddingY = 15;
            const drawW = chartWidth - paddingX * 2;
            const drawH = chartHeight - paddingY * 2;
            const maxVal = Math.max(...filteredDailySales.map(d => Math.max(d.sales, d.profit)), 100) * 1.1;

            return filteredDailySales.map((d, index) => {
              const x = paddingX + (index / (filteredDailySales.length - 1)) * drawW;
              const ySales = paddingY + drawH - (d.sales / maxVal) * drawH;
              const yProfit = paddingY + drawH - (d.profit / maxVal) * drawH;
              return { x, ySales, yProfit };
            });
          })();

          // Create SVG lines path strings
          const salesPathStr = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySales}`).join(' ');
          const profitPathStr = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProfit}`).join(' ');

          return (
            <View style={styles.px4, styles.py4, styles.gap4}>
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.flexRow, styles.justifyBetween, styles.itemsCenter}>
                <View>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Financial Analytics</Text>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>Configure ranges and check revenue yield sheets.</Text>
                </View>
                <Pressable
                  onPress={handleReportsCSVShare}
                  style={styles.px3, styles.py2, styles.bgindigo600, styles.roundedXl, styles.flexRow, styles.itemsCenter, styles.gap1}
                >
                  <Download size={12} color="#fff" />
                  <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom9, styles.uppercase, styles.trackingwider}>CSV</Text>
                </Pressable>
              </View>

              {/* Segment filter pills (separated Cafe vs Restaurant vs Grocery) */}
              <View style={styles.flexRow, styles.gap2, styles.bgslate50, styles.dark:bgzinc950, styles.p1, styles.rounded2Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800}>
                {[
                  { key: 'all', label: 'All Sales' },
                  { key: 'grocery', label: 'Grocery 📦' },
                  { key: 'cafe', label: 'Cafe ☕' },
                  { key: 'restaurant', label: 'Restaurant 🍳' }
                ].map((seg) => (
                  <Pressable
                    key={seg.key}
                    onPress={() => {
                      setReportSegment(seg.key as any);
                      triggerHaptic('light');
                    }}
                    style={flex-1 items-center py-2 rounded-xl ${
                      reportSegment === seg.key ? [styles.bgindigo600] : [styles.bgtransparent]
                    }}
                  >
                    <Text style={text-[9px] font-black uppercase ${
                      reportSegment === seg.key ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]
                    }}>
                      {seg.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Date Presets Selector */}
              <View style={styles.flexRow, styles.gap2, styles.bgslate50, styles.dark:bgzinc950, styles.p1, styles.rounded2Xl, styles.border, styles.borderslate100, styles.dark:borderzinc800}>
                {[
                  { key: 'today', label: 'Today' },
                  { key: '7days', label: '7 Days' },
                  { key: '30days', label: '30 Days' }
                ].map((range) => (
                  <Pressable
                    key={range.key}
                    onPress={() => {
                      setReportDateRange(range.key as any);
                      triggerHaptic('light');
                    }}
                    style={flex-1 items-center py-2 rounded-xl ${
                      reportDateRange === range.key ? [styles.bgindigo600] : [styles.bgtransparent]
                    }}
                  >
                    <Text style={text-[10px] font-black uppercase ${
                      reportDateRange === range.key ? [styles.textwhite] : [styles.textslate500, styles.dark:textslate400]
                    }}>
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom Date Picker inputs */}
              <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.flexRow, styles.gap3}>
                <View style={styles.flex1, styles.gap1}>
                  <Text style={styles.textCustom8, styles.fontextrabold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Start Date</Text>
                  <TextInput
                    value={reportStartDate}
                    onChangeText={setReportStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    style={styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedlg, styles.px2.5, styles.py1.5, styles.textslate800, styles.dark:textzinc100, styles.fontsemibold, styles.textCustom10}
                  />
                </View>
                <View style={styles.flex1, styles.gap1}>
                  <Text style={styles.textCustom8, styles.fontextrabold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>End Date</Text>
                  <TextInput
                    value={reportEndDate}
                    onChangeText={setReportEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    style={styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedlg, styles.px2.5, styles.py1.5, styles.textslate800, styles.dark:textzinc100, styles.fontsemibold, styles.textCustom10}
                  />
                </View>
                <Pressable
                  onPress={() => {
                    setReportDateRange('custom');
                    fetchReportsData();
                  }}
                  style={styles.bgindigo50, styles.border, styles.borderindigo200, styles.dark:bgindigo95020, styles.dark:borderindigo90050, styles.justifyCenter, styles.px4, styles.roundedlg, styles.mt3.5}
                >
                  <Text style={styles.textindigo600, styles.dark:textindigo400, styles.fontextrabold, styles.textCustom9, styles.uppercase}>Get</Text>
                </Pressable>
              </View>

              {isReportLoading ? (
                <ActivityIndicator size="large" color="#6366f1" style={styles.py10} />
              ) : (
                <View style={styles.gap4}>
                  {/* KPI Metrics summaries */}
                  <View style={styles.flexRow, styles.gap2, styles.flexWrap}>
                    {[
                      { label: 'Total Sales', val: `₹${filteredSummary.totalSales}`, color: 'text-indigo-500 dark:text-indigo-400' },
                      { label: 'Total profit', val: `₹${filteredSummary.totalProfit}`, color: 'text-emerald-500 dark:text-emerald-400' },
                      { label: 'Margin %', val: `${filteredSummary.profitMargin}%`, color: 'text-amber-500 dark:text-amber-400' },
                      { label: 'AOV Revenue', val: `₹${Math.round(filteredSummary.averageOrderValue || 0)}`, color: 'text-blue-500 dark:text-blue-400' }
                    ].map((kpi, i) => (
                      <View key={i} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.flex1, styles.minw[45%]}>
                        <Text style={styles.textCustom8, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase, styles.trackingwider}>{kpi.label}</Text>
                        <Text style={text-base font-black mt-1 ${kpi.color}}>{kpi.val}</Text>
                      </View>
                    ))}
                  </View>

                  {/* SVG Sales Trend Chart */}
                  {filteredDailySales.length > 1 && (
                    <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}>
                      <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Revenue & profit Trend</Text>
                      <View style={styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc950, styles.roundedXl, styles.p1, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.overflowHidden}>
                        <Svg width={chartWidth} height={chartHeight}>
                          {/* Sales line */}
                          {salesPathStr ? (
                            <Path
                              d={salesPathStr}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="2.5"
                            />
                          ) : null}
                          {/* Profit line */}
                          {profitPathStr ? (
                            <Path
                              d={profitPathStr}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                            />
                          ) : null}
                        </Svg>
                      </View>
                      <View style={styles.flexRow, styles.justifyCenter, styles.gap4, styles.mt1}>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap1.5}>
                          <View style={styles.w2.5, styles.h2.5, styles.roundedFull, styles.bgindigo500} />
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.fontbold, styles.textCustom8, styles.uppercase}>Revenue</Text>
                        </View>
                        <View style={styles.flexRow, styles.itemsCenter, styles.gap1.5}>
                          <View style={styles.w2.5, styles.h2.5, styles.roundedFull, styles.bgemerald500} />
                          <Text style={styles.textslate650, styles.dark:textslate300, styles.fontbold, styles.textCustom8, styles.uppercase}>Net Profit</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Top selling products list */}
                  <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs}>Top Selling Products</Text>
                    <View style={styles.gap2.5}>
                      {filteredTopProducts.map((p, i) => (
                        <View key={p.productId || i} style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p2.5, styles.roundedXl}>
                          <View style={styles.flex1, styles.mr2}>
                            <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textCustom11} numberOfLines={1}>{p.name}</Text>
                            <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5}>{p.quantity} units sold</Text>
                          </View>
                          <View style={styles.itemsEnd}>
                            <Text style={styles.textindigo500, styles.dark:textindigo400, styles.fontblack, styles.textCustom11}>₹{p.sales}</Text>
                            <Text style={styles.textemerald500, styles.dark:textemerald400, styles.fontbold, styles.textCustom8, styles.mt0.5}>+₹{p.profit} profit</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* ------------------- FORECAST TAB WORKSPACE ------------------- */}
        {activeTab === 'FORECAST' && (
          <View style={styles.px4, styles.py4, styles.gap4}>
            {/* Summary KPI header */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p5, styles.rounded2Xl, styles.gap3}>
              <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween}>
                <View style={styles.flexRow, styles.itemsCenter, styles.gap2}>
                  <BrainCircuit size={18} color="#6366f1" />
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Demand Forecasting</Text>
                </View>
                <Pressable
                  onPress={() => fetchForecastData(true)}
                  disabled={isForecastLoading}
                  style={styles.p2, styles.bgindigo50, styles.border, styles.borderindigo200, styles.dark:bgzinc950, styles.dark:borderzinc800, styles.roundedXl}
                >
                  {isForecastLoading ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <RefreshCw size={14} color="#6366f1" />
                  )}
                </Pressable>
              </View>
              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontbold}>AI estimated velocity and stock depletion warning boards.</Text>
              
              <View style={styles.flexRow, styles.gap2.5, styles.mt2}>
                <View style={styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p3, styles.roundedXl, styles.flex1}>
                  <Text style={styles.textCustom7, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Items At Risk</Text>
                  <Text style={styles.textsm, styles.fontblack, styles.textrose500, styles.mt0.5}>{forecastMetrics.itemsAtRisk || 0}</Text>
                </View>
                <View style={styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p3, styles.roundedXl, styles.flex1}>
                  <Text style={styles.textCustom7, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Revenue At Risk</Text>
                  <Text style={styles.textsm, styles.fontblack, styles.textamber500, styles.mt0.5}>₹{forecastMetrics.totalRevenueAtRisk || 0}</Text>
                </View>
                <View style={styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.p3, styles.roundedXl, styles.flex1}>
                  <Text style={styles.textCustom7, styles.fontbold, styles.textslate500, styles.dark:textslate400, styles.uppercase}>Avg Velocity</Text>
                  <Text style={styles.textsm, styles.fontblack, styles.textindigo500, styles.mt0.5}>{forecastMetrics.averageVelocity?.toFixed(1) || '0.0'}/day</Text>
                </View>
              </View>

              {/* Auto Replenish All Button */}
              <Pressable
                onPress={handleAutoReplenish}
                disabled={isForecastRestocking}
                style={styles.bgindigo600, styles.py3, styles.roundedXl, styles.itemsCenter, styles.justifyCenter, styles.flexRow, styles.mt2}
              >
                {isForecastRestocking && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                <Text style={styles.textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Auto-Replenish All Stockouts</Text>
              </Pressable>
            </View>

            {/* Filter Search */}
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}>
              <View style={styles.flexRow, styles.itemsCenter, styles.bgslate50, styles.dark:bgzinc950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3, styles.h10}>
                <Search size={14} color="#94a3b8" />
                <TextInput
                  placeholder="Filter forecast catalog..."
                  placeholderTextColor="#94a3b8"
                  value={forecastSearchQuery}
                  onChangeText={setForecastSearchQuery}
                  style={styles.flex1, styles.textwhite, styles.fontextrabold, styles.textCustom11, styles.ml2}
                />
              </View>

              {/* Category selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <Pressable
                  onPress={() => setForecastCategoryFilter('ALL')}
                  style={px-3 py-1.5 rounded-lg border ${
                    forecastCategoryFilter === [styles.ALL] ? [styles.bgindigo600, styles.borderindigo500] : [styles.bgslate950, styles.borderslate100, styles.dark:borderzinc80050]
                  }}
                >
                  <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom8, styles.uppercase}>All</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setForecastCategoryFilter(c.id)}
                    style={px-3 py-1.5 rounded-lg border ${
                      forecastCategoryFilter === c.id ? [styles.bgindigo600, styles.borderindigo500] : [styles.bgslate950, styles.borderslate100, styles.dark:borderzinc80050]
                    }}
                  >
                    <Text style={styles.textwhite, styles.fontextrabold, styles.textCustom8, styles.uppercase}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Forecast Listings */}
            {isForecastLoading ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.py10} />
            ) : (
              <View style={styles.gap3}>
                {forecastList.filter(f => {
                  const s = f.name.toLowerCase().includes(forecastSearchQuery.toLowerCase());
                  const c = forecastCategoryFilter === 'ALL' || f.category?.id === forecastCategoryFilter;
                  return s && c;
                }).map((item) => (
                  <View key={item.id} style={styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.p4, styles.rounded2Xl, styles.gap3}>
                    <View style={styles.flexRow, styles.justifyBetween, styles.itemsStart}>
                      <View style={styles.flexRow, styles.itemsCenter, styles.flex1, styles.mr2}>
                        <View style={styles.w10, styles.h10, styles.roundedXl, styles.bgslate50, styles.dark:bgzinc950, styles.itemsCenter, styles.justifyCenter, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.mr2.5, styles.overflowHidden}>
                          {getAppImageSource(item.imageUrl) ? (
                            <Image source={getAppImageSource(item.imageUrl)!} style={styles.wfull, styles.hfull} contentFit="cover" />
                          ) : (
                            <Text style={styles.textlg, styles.textslate800, styles.dark:textzinc200}>{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.mt0.5, styles.uppercase}>
                            Stock: {item.stock} • Velocity: {item.salesVelocity?.toFixed(1) || '0.0'}/day
                          </Text>
                        </View>
                      </View>
                      <View style={styles.itemsEnd}>
                        <View style={rounded-full px-2 py-0.5 border ${
                          item.isAtRisk ? [styles.bgrose50010, styles.borderrose50020] : [styles.bgindigo50010, styles.borderindigo50020]
                        }}>
                          <Text style={text-[8px] font-black uppercase ${item.isAtRisk ? [styles.textrose500] : [styles.textindigo400]}}>
                            {item.daysRemaining <= 0 ? 'Out of Stock' : `${item.daysRemaining.toFixed(1)} days left`}
                          </Text>
                        </View>
                        {item.isAtRisk && (
                          <Text style={styles.textrose40090, styles.textCustom7, styles.fontblack, styles.mt1, styles.uppercase, styles.trackingwider}>
                            ₹{item.revenueAtRisk} Revenue At Risk
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Action Bar */}
                    <View style={styles.flexRow, styles.gap2, styles.pt2.5, styles.bordert, styles.borderslate100, styles.dark:borderzinc80080, styles.itemsCenter, styles.justifyBetween}>
                      <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom8, styles.fontbold, styles.flex1, styles.mr2, styles.uppercase} numberOfLines={1}>
                        AI Rec: Inward {item.recommendedReorder} units
                      </Text>
                      {item.recommendedReorder > 0 ? (
                        <Pressable
                          onPress={() => handleIndividualRestock(item.id, item.recommendedReorder, item.costPrice)}
                          style={styles.bgindigo60015, styles.border, styles.borderindigo50030, styles.px3, styles.py1.5, styles.roundedlg, styles.active:bgindigo60030}
                        >
                          <Text style={styles.textindigo400, styles.fontextrabold, styles.textCustom8, styles.uppercase}>AI Restock</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.px3, styles.py1.5, styles.bgslate950, styles.border, styles.borderslate100, styles.dark:borderzinc80050, styles.roundedlg}>
                          <Text style={styles.textslate500, styles.fontbold, styles.textCustom8, styles.uppercase}>Stock Adequate</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.h24} />


      {/* ------------------- Rider Simulation Modals ------------------- */}
      
      {/* 1. UPI QR Code Selector Modal */}
      {isUpiQrVisible && upiTargetOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsUpiQrVisible(false)}
        >
          <View style={styles.flex1, styles.bgblack60, styles.justifyCenter, styles.itemsCenter, styles.p6}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.p6, styles.wfull, styles.maxwsm, styles.itemsCenter, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.shadow2xl}>
              <QrCode size={40} color="#6366f1" />
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase, styles.mt3}>Scan UPI QR Code</Text>
              <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom10, styles.fontbold, styles.textCenter, styles.mt1, styles.uppercase, styles.trackingwider}>Amount: {formatPrice(upiTargetOrder.total)}</Text>
              
              {/* Dummy QR Box */}
              <View style={styles.w48, styles.h48, styles.bgslate950, styles.rounded2Xl, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.mt5, styles.itemsCenter, styles.justifyCenter, styles.p4}>
                <Text style={styles.text6xl, styles.textslate700, styles.dark:textslate200}>🏁</Text>
                <Text style={styles.textCustom9, styles.fontblack, styles.textslate500, styles.dark:textslate400, styles.mt4, styles.trackingwidest, styles.uppercase}>UPI ID: fastkirana@upi</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.flexRow, styles.wfull, styles.gap2.5, styles.mt6, styles.bordert, styles.borderslate100, styles.dark:borderzinc800, styles.pt5}>
                <Pressable
                  onPress={() => handleCashCollected(upiTargetOrder)}
                  style={styles.flex1, styles.border, styles.borderslate700, styles.py3, styles.roundedXl, styles.itemsCenter, styles.active:bgslate800}
                >
                  <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Paid Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleUpiQrPaid(upiTargetOrder)}
                  style={styles.flex1, styles.bgindigo600, styles.py3, styles.roundedXl, styles.itemsCenter, styles.active:bgindigo700}
                >
                  <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Confirm Paid</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. Photo Proof Capture Simulation Overlay */}
      {isPhotoCapturing && photoTargetOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsPhotoCapturing(false)}
        >
          <View style={styles.flex1, styles.bgblack, styles.justifyBetween, styles.p6}>
            <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mt8}>
              <Pressable 
                onPress={() => setIsPhotoCapturing(false)}
                style={styles.w10, styles.h10, styles.roundedFull, styles.bgslate800, styles.itemsCenter, styles.justifyCenter}
              >
                <X size={20} color="#fff" />
              </Pressable>
              <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwidest}>Capture Delivery Proof</Text>
              <View style={styles.w10} />
            </View>

            {/* Simulating Viewfinder */}
            <View style={styles.wfull, styles.aspect[43], styles.bgslate900, styles.border2, styles.borderwhite20, styles.rounded3Xl, styles.itemsCenter, styles.justifyCenter, styles.relative, styles.overflowHidden, styles.selfCenter, styles.my6}>
              <Text style={styles.text5xl}>📷</Text>
              <Text style={styles.textwhite60, styles.textCustom10, styles.fontblack, styles.uppercase, styles.trackingwider, styles.mt4}>Place package at door & snap</Text>
              <View style={styles.absolute, styles.bottom4, styles.left4, styles.right4, styles.bgblack60, styles.p2, styles.roundedXl, styles.border, styles.borderwhite5}>
                <Text style={styles.textwhite, styles.textCustom9, styles.fontblack, styles.uppercase, styles.textCenter}>Proof for: {photoTargetOrder.user.name}</Text>
              </View>
            </View>

            {/* Trigger Button */}
            <Pressable 
              onPress={finalizeDelivery}
              style={styles.w20, styles.h20, styles.roundedFull, styles.border4, styles.borderwhite, styles.itemsCenter, styles.justifyCenter, styles.selfCenter, styles.mb8, styles.active:scale95, styles.transitionall}
            >
              <View style={styles.w14, styles.h14, styles.roundedFull, styles.bgwhite} />
            </Pressable>
          </View>
        </Modal>
      )}

      {/* 4. Create Coupon Modal */}
      {isCouponModalVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsCouponModalVisible(false)}
        >
          <View style={styles.flex1, styles.bgblack60, styles.justifyCenter, styles.itemsCenter, styles.p6}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.p6, styles.wfull, styles.maxwsm, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.shadow2xl}>
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb3, styles.mb4}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Create Coupon Code</Text>
                <Pressable onPress={() => setIsCouponModalVisible(false)} style={styles.p1}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {/* Code */}
              <View style={styles.mb3}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Coupon Code</Text>
                <TextInput
                  value={newCouponCode}
                  onChangeText={setNewCouponCode}
                  placeholder="e.g. WELCOME50"
                  placeholderTextColor="#475569"
                  autoCapitalize="characters"
                  style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                />
              </View>

              {/* Type selector Flat vs Percent */}
              <View style={styles.mb3}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1.5}>Discount Type</Text>
                <View style={styles.flexRow, styles.gap2}>
                  {['FLAT', 'PERCENT'].map((t) => {
                    const isActive = newCouponType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setNewCouponType(t as any)}
                        style={flex-1 py-2 rounded-lg items-center border ${
                          isActive ? [styles.bgindigo95030, styles.borderindigo90040] : [styles.bgslate950, styles.border, styles.borderslate100, styles.dark:borderzinc80050]
                        }}
                      >
                        <Text style={text-[10px] font-black uppercase ${
                          isActive ? [styles.textindigo400] : [styles.textslate500, styles.dark:textslate400]
                        }}>
                          {t} Discount
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Value / Min Order */}
              <View style={styles.flexRow, styles.gap3, styles.mb3}>
                <View style={styles.flex1}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Discount Value</Text>
                  <TextInput
                    value={newCouponValue}
                    onChangeText={setNewCouponValue}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor="#475569"
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Min Order Total</Text>
                  <TextInput
                    value={newCouponMinOrder}
                    onChangeText={setNewCouponMinOrder}
                    keyboardType="numeric"
                    placeholder="199"
                    placeholderTextColor="#475569"
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>
              </View>

              {/* Max Uses */}
              <View style={styles.mb5}>
                <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Max Usage Limit</Text>
                <TextInput
                  value={newCouponMaxUses}
                  onChangeText={setNewCouponMaxUses}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#475569"
                  style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc850, styles.roundedXl, styles.px3, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                />
              </View>

              {/* Actions */}
              <View style={styles.flexRow, styles.gap2.5}>
                <Pressable
                  onPress={() => setIsCouponModalVisible(false)}
                  style={styles.flex1, styles.border, styles.borderslate700, styles.py3, styles.roundedXl, styles.itemsCenter, styles.active:bgslate800}
                >
                  <Text style={styles.textslate650, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateCoupon}
                  disabled={isCreatingCoupon}
                  style={styles.flex1, styles.bgindigo600, styles.py3, styles.roundedXl, styles.itemsCenter, styles.active:bgindigo750, styles.flexRow, styles.justifyCenter, styles.gap1.5}
                >
                  {isCreatingCoupon && <ActivityIndicator size="small" color="#fff" />}
                  <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>
                    {isCreatingCoupon ? 'Creating...' : 'Create'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}


      {/* Banner Create/Edit Modal */}
      {isBannerModalVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => { setIsBannerModalVisible(false); resetBannerForm(); }}
        >
          <View style={styles.flex1, styles.bgblack60, styles.justifyEnd}>
            <View style={styles.bgwhite, styles.dark:bgzinc900, styles.roundedt3xl, styles.p6, styles.wfull, styles.maxh[90%], styles.bordert, styles.borderx, styles.borderslate100, styles.dark:borderzinc800, styles.shadow2xl}>
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb3, styles.mb4}>
                <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>{editingBannerId ? 'Edit Banner' : 'Create Promo Banner'}</Text>
                <Pressable onPress={() => { setIsBannerModalVisible(false); resetBannerForm(); }} style={styles.p1}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.mb4}>
                {/* Title */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Banner Title *</Text>
                  <TextInput
                    placeholder="e.g. Farm Fresh Vegetables & Fruits"
                    placeholderTextColor="#475569"
                    value={bannerTitle}
                    onChangeText={setBannerTitle}
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>

                {/* Description */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Description *</Text>
                  <TextInput
                    placeholder="e.g. Directly sourced from local farms"
                    placeholderTextColor="#475569"
                    value={bannerDescription}
                    onChangeText={setBannerDescription}
                    multiline
                    numberOfLines={2}
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>

                {/* Coupon Code */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Coupon Code (Optional)</Text>
                  <TextInput
                    placeholder="e.g. SAVE20"
                    placeholderTextColor="#475569"
                    value={bannerCode}
                    onChangeText={setBannerCode}
                    autoCapitalize="characters"
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>

                {/* Gradient Preset Picker */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Gradient Color</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.flexRow, styles.gap2}>
                      {BANNER_GRADIENT_PRESETS.map((g, i) => (
                        <Pressable
                          key={i}
                          onPress={() => { setBannerGradient(g.value); triggerHaptic('light'); }}
                          style={rounded-xl overflow-hidden border-2 ${bannerGradient === g.value ? [styles.borderindigo500] : [styles.bordertransparent]}}
                        >
                          <View style={bg-gradient-to-r ${g.value} h-10 w-20 rounded-xl items-center justify-center}>
                            <Text style={styles.textwhite, styles.textCustom7, styles.fontblack}>{g.name}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Banner Type */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Banner Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.flexRow, styles.gap2}>
                      {['grocery', 'cafe', 'festival', 'fresh', 'express-delivery', 'first-order', 'seasonal', 'custom'].map(t => (
                        <Pressable
                          key={t}
                          onPress={() => { setBannerType(t); triggerHaptic('light'); }}
                          style={px-3 py-1.5 rounded-lg border ${bannerType === t ? [styles.bgindigo600, styles.borderindigo500] : [styles.bgslate100, styles.dark:bgzinc800, styles.borderslate200, styles.dark:borderzinc700]}}
                        >
                          <Text style={text-[9px] font-black uppercase ${bannerType === t ? [styles.textwhite] : [styles.textslate600, styles.dark:textslate300]}}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Image URL */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Image URL (Optional)</Text>
                  <TextInput
                    placeholder="https://res.cloudinary.com/..."
                    placeholderTextColor="#475569"
                    value={bannerImageUrl}
                    onChangeText={setBannerImageUrl}
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>

                {/* Link URL */}
                <View style={styles.mb4}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Link URL (Optional)</Text>
                  <TextInput
                    placeholder="e.g. /category/fruits-vegetables"
                    placeholderTextColor="#475569"
                    value={bannerLinkUrl}
                    onChangeText={setBannerLinkUrl}
                    style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                  />
                </View>

                {/* Sort Order + Active Toggle */}
                <View style={styles.flexRow, styles.gap4, styles.mb4}>
                  <View style={styles.flex1}>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Sort Order</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#475569"
                      value={bannerSortOrder}
                      onChangeText={setBannerSortOrder}
                      keyboardType="number-pad"
                      style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.roundedXl, styles.px3.5, styles.py2.5, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb1}>Active</Text>
                    <View style={styles.flexRow, styles.itemsCenter, styles.gap2, styles.mt1}>
                      <Switch
                        value={bannerIsActive}
                        onValueChange={setBannerIsActive}
                        trackColor={{ false: '#475569', true: '#818cf8' }}
                        thumbColor={bannerIsActive ? '#4f46e5' : '#cbd5e1'}
                      />
                      <Text style={text-[10px] font-black ${bannerIsActive ? [styles.textemerald600] : [styles.textslate500]}}>{bannerIsActive ? 'ACTIVE' : 'DISABLED'}</Text>
                    </View>
                  </View>
                </View>

                {/* Live Preview */}
                <View style={styles.mb2}>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.fontbold, styles.textCustom9, styles.uppercase, styles.trackingwider, styles.mb2}>Live Preview</Text>
                  <View style={bg-gradient-to-r ${bannerGradient} rounded-2xl p-4 h-20 justify-center}>
                    <Text style={styles.textwhite, styles.fontblack, styles.textsm} numberOfLines={1}>{bannerTitle || 'Banner Title'}</Text>
                    <Text style={styles.textwhite80, styles.textCustom10, styles.fontsemibold} numberOfLines={1}>{bannerDescription || 'Banner description goes here'}</Text>
                    {bannerCode ? (
                      <View style={styles.bgwhite20, styles.selfStart, styles.px2, styles.py0.5, styles.roundedFull, styles.mt1}>
                        <Text style={styles.textwhite, styles.textCustom8, styles.fontblack}>{bannerCode}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.flexRow, styles.gap3}>
                <Pressable
                  onPress={() => { setIsBannerModalVisible(false); resetBannerForm(); }}
                  style={styles.flex1, styles.border, styles.borderslate300, styles.dark:borderzinc700, styles.py3.5, styles.roundedXl, styles.itemsCenter, styles.active:bgslate100, styles.dark:active:bgzinc800}
                >
                  <Text style={styles.textslate600, styles.dark:textslate300, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleBannerSubmit}
                  disabled={bannerSubmitting}
                  style={flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${bannerSubmitting ? [styles.bgindigo400] : [styles.bgindigo600, styles.active:bgindigo700]}}
                >
                  {bannerSubmitting && <ActivityIndicator size="small" color="#fff" />}
                  <Text style={styles.textwhite, styles.fontextrabold, styles.textxs, styles.uppercase, styles.trackingwider}>{editingBannerId ? 'Update Banner' : 'Create Banner'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Action Button (FAB) for Quick Tab Launcher (only for Admin role) */}
      {(!user || user.role === 'ADMIN') && (
        <Pressable
          onPress={() => {
            setLauncherSearchQuery('');
            setIsLauncherVisible(true);
            triggerHaptic('light');
          }}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#e20a22', // FastKirana primary red color
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
            zIndex: 9999
          }}
        >
          <Search size={20} color="#fff" />
        </Pressable>
      )}

      {/* Quick Tab Launcher Modal */}
      {isLauncherVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsLauncherVisible(false)}
        >
          <Pressable 
            onPress={() => setIsLauncherVisible(false)} 
            style={styles.flex1, styles.bgblack60, styles.justifyCenter, styles.p5}
          >
            <Pressable 
              onPress={(e) => e.stopPropagation()} // prevent close on inner click
              style={styles.bgwhite, styles.dark:bgzinc900, styles.rounded3Xl, styles.p5, styles.wfull, styles.maxh[80%], styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.shadow2xl}
            >
              {/* Header */}
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.borderb, styles.borderslate100, styles.dark:borderzinc800, styles.pb3, styles.mb4}>
                <View>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textbase}>Quick Tab Launcher</Text>
                  <Text style={styles.textslate500, styles.dark:textslate400, styles.textCustom9, styles.fontsemibold, styles.mt0.5}>Jump directly to any of the 20 admin consoles</Text>
                </View>
                <Pressable onPress={() => setIsLauncherVisible(false)} style={styles.p1}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {/* Search Input */}
              <View style={styles.bgslate100, styles.dark:bgslate950, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.rounded2Xl, styles.px4, styles.py3, styles.flexRow, styles.itemsCenter, styles.gap2, styles.mb4}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  placeholder="Type to search console tabs (e.g. orders, coupon)..."
                  placeholderTextColor="#94a3b8"
                  value={launcherSearchQuery}
                  onChangeText={setLauncherSearchQuery}
                  autoFocus
                  style={styles.flex1, styles.textslate800, styles.dark:textwhite, styles.fontbold, styles.textxs, styles.p0}
                />
                {launcherSearchQuery.length > 0 && (
                  <Pressable onPress={() => setLauncherSearchQuery('')} style={styles.p1}>
                    <X size={14} color="#94a3b8" />
                  </Pressable>
                )}
              </View>

              {/* Scrollable list of matched tabs */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.flex1}>
                {(() => {
                  const ALL_TABS_FOR_LAUNCHER = [
                    { id: 'ANALYTICS', label: 'Analytics', hub: 'BI', hubTitle: 'Business Insights', emoji: '📊', keywords: 'sales, performance, revenue, stats' },
                    { id: 'FORECAST', label: 'AI Forecasting', hub: 'BI', hubTitle: 'Business Insights', emoji: '📈', keywords: 'stock, prediction, depletion, machine learning' },
                    { id: 'REPORTS', label: 'Reports', hub: 'BI', hubTitle: 'Business Insights', emoji: '📊', keywords: 'excel, csv, download, export, statements' },
                    { id: 'LIVEOPS', label: 'LiveOps Tracker', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '🚨', keywords: 'live, tracking, dispatch, carts, speed' },
                    { id: 'ORDERS', label: 'Store Orders', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '📋', keywords: 'confirm, status, pack, customer, invoice' },
                    { id: 'USERS', label: 'Customers', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '👥', keywords: 'users, role, staff, employee, password' },
                    { id: 'REVIEWS', label: 'Reviews Moderation', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '⭐', keywords: 'ratings, comments, comments delete, moderate' },
                    { id: 'PICKER', label: 'Picker Console', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '📦', keywords: 'packhouse, worker, confirm, pick list' },
                    { id: 'RIDER', label: 'Rider Console', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '🛵', keywords: 'logistics, fleet, delivery, route, map' },
                    { id: 'CHEF_RESTAURANT', label: 'Kitchen Console', hub: 'OPS', hubTitle: 'Ops & Fulfillment', emoji: '🍳', keywords: 'chef, cook, food, dinner, curry, north indian' },
                  ];

                  const q = launcherSearchQuery.toLowerCase().trim();
                  const matched = ALL_TABS_FOR_LAUNCHER.filter(t => 
                    t.label.toLowerCase().includes(q) || 
                    t.hubTitle.toLowerCase().includes(q) || 
                    t.keywords.toLowerCase().includes(q)
                  );

                  if (matched.length === 0) {
                    return (
                      <View style={styles.py8, styles.itemsCenter}>
                        <Text style={styles.textslate400, styles.textxs, styles.fontbold, styles.textCenter}>No consoles match "{launcherSearchQuery}"</Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.gap2}>
                      {matched.map((tab) => (
                        <Pressable
                          key={tab.id}
                          onPress={() => {
                            setActiveHub(tab.hub as any);
                            setActiveTab(tab.id as any);
                            setIsLauncherVisible(false);
                            triggerHaptic('success');
                          }}
                          style={styles.bgslate50, styles.dark:bgzinc80060, styles.border, styles.borderslate100, styles.dark:borderzinc800, styles.rounded2Xl, styles.p3.5, styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.active:bgslate150}
                        >
                          <View style={styles.flexRow, styles.itemsCenter, styles.gap3}>
                            <Text style={styles.textxl}>{tab.emoji}</Text>
                            <View>
                              <Text style={styles.textslate800, styles.dark:textwhite, styles.fontextrabold, styles.textxs}>{tab.label}</Text>
                              <Text style={styles.textslate400, styles.dark:textslate500, styles.textCustom8, styles.fontblack, styles.uppercase, styles.mt0.5}>{tab.hubTitle}</Text>
                            </View>
                          </View>
                          <ChevronRight size={14} color="#94a3b8" />
                        </Pressable>
                      ))}
                    </View>
                  );
                })()}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* New Order Alert Overlay */}
      <NewOrderAlertModal
        order={activeAlertOrder}
        onAccept={acceptOrder}
        onDismiss={acknowledgeAlert}
        isDarkMode={isDarkMode}
      />

      {/* ── Abandoned Cart Recovery Modal ── */}
      {selectedCartForAlert && (
        <Modal
          visible={alertModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAlertModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: ''#00000099'', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={styles.wfull, styles.maxwsm, styles.bgwhite, styles.dark:bgzinc900, styles.border, styles.borderslate205, styles.dark:borderzinc805, styles.rounded3Xl, styles.overflowHidden, styles.shadow2xl, styles.p5}>
              
              {/* Header */}
              <View style={styles.flexRow, styles.justifyBetween, styles.itemsCenter, styles.mb4}>
                <View style={styles.flexRow, styles.itemsCenter, styles.gap2.5}>
                  <View style={styles.bgamber100, styles.dark:bgamber95040, styles.p2.5, styles.rounded2Xl}>
                    <ShoppingBag size={18} color="#d97706" />
                  </View>
                  <View>
                    <Text style={styles.textslate900, styles.dark:textwhite, styles.fontblack, styles.textsm}>Cart Recovery Alert</Text>
                    <Text style={styles.textslate400, styles.dark:textzinc500, styles.textCustom9, styles.fontblack, styles.uppercase, styles.mt0.5}>{selectedCartForAlert.userName}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setAlertModalVisible(false)} style={styles.bgslate50, styles.dark:bgzinc800, styles.p2, styles.roundedFull}>
                  <X size={12} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Pressable>
              </View>

              {/* Cart Summary */}
              <View style={styles.bgslate50, styles.dark:bgzinc95040, styles.border, styles.borderslate100, styles.dark:borderzinc80080, styles.rounded2Xl, styles.p3.5, styles.mb4}>
                <Text style={styles.textslate400, styles.dark:textzinc500, styles.textCustom9, styles.fontblack, styles.uppercase, styles.mb1.5}>Cart Content</Text>
                <Text style={styles.textslate700, styles.dark:textzinc300, styles.textxs, styles.fontbold, styles.leading5}>
                  {selectedCartForAlert.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')}
                </Text>
                <View style={styles.flexRow, styles.itemsCenter, styles.justifyBetween, styles.mt2, styles.pt2, styles.bordert, styles.borderslate20050, styles.dark:borderzinc855}>
                  <Text style={styles.textslate450, styles.dark:textzinc500, styles.textCustom9, styles.fontblack, styles.uppercase}>Subtotal</Text>
                  <Text style={styles.textslate900, styles.dark:textwhite, styles.textxs, styles.fontblack}>{formatPrice(selectedCartForAlert.subtotal)}</Text>
                </View>
              </View>

              {/* Message Editor */}
              <Text style={styles.textslate400, styles.dark:textzinc500, styles.textCustom9, styles.fontblack, styles.uppercase, styles.mb1.5, styles.ml1}>Customize Message</Text>
              <View style={styles.bgslate50, styles.dark:bgzinc95040, styles.border, styles.borderslate200, styles.dark:borderzinc800, styles.rounded2Xl, styles.p3, styles.mb4}>
                <TextInput
                  value={alertMessageText}
                  onChangeText={setAlertMessageText}
                  multiline={true}
                  numberOfLines={3}
                  style={{ textAlignVertical: 'top', height: 60 }}
                  style={styles.textslate800, styles.dark:textzinc100, styles.textxs, styles.fontbold, styles.leading5, styles.p0}
                />
              </View>

              {/* Location Info (if coordinates exist) */}
              {selectedCartForAlert.address && (
                <View style={styles.bgrose5050, styles.dark:bgrose95010, styles.border, styles.borderrose10050, styles.dark:borderrose90030, styles.rounded2Xl, styles.p3.5, styles.mb4, styles.flexRow, styles.gap2.5, styles.itemsCenter}>
                  <MapPin size={18} color="#f43f5e" />
                  <View style={styles.flex1}>
                    <Text style={styles.textrose600, styles.dark:textrose455, styles.textCustom9, styles.fontblack, styles.uppercase}>WhatsApp Location Included</Text>
                    <Text style={styles.textslate500, styles.dark:textzinc400, styles.textCustom10, styles.fontbold, styles.mt0.5} numberOfLines={1}>{selectedCartForAlert.address}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.gap2.5}>
                {/* Send via Push Notification */}
                <Pressable
                  onPress={handleSendPushNotification}
                  disabled={isSendingNotification}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: isSendingNotification ? 0.6 : 1
                  })}
                  style={styles.bgindigo600, styles.dark:bgindigo500, styles.py3.5, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap2, styles.shadowSm}
                >
                  <Send size={13} color="#ffffff" strokeWidth={3} />
                  <Text style={styles.textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>
                    {isSendingNotification ? 'Sending Push...' : 'Send Push Notification'}
                  </Text>
                </Pressable>

                {/* Send via WhatsApp */}
                <Pressable
                  onPress={handleSendWhatsApp}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }]
                  })}
                  style={styles.bgemerald600, styles.dark:bgemerald500, styles.py3.5, styles.rounded2Xl, styles.flexRow, styles.itemsCenter, styles.justifyCenter, styles.gap2, styles.shadowSm}
                >
                  <MessageSquare size={13} color="#ffffff" strokeWidth={3} />
                  <Text style={styles.textwhite, styles.fontblack, styles.textxs, styles.uppercase, styles.trackingwider}>Send via WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* --- Interactive Edit Order Modal --- */}
      <Modal
        visible={!!editingOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingOrder(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: ''#00000099'', justifyContent: 'center', alignItems: 'center', padding: 16 }}
          onPress={() => setEditingOrder(null)}
        >
          <Pressable
            style={{ width: '100%', maxWidth: 440, backgroundColor: isDarkMode ? '#1c1c1e' : 'colors.surface', borderRadius: 24, padding: 20, maxHeight: '85%' }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'THEME.COLORS.dark.surfaceElevated' : 'colors.border', paddingBottom: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: isDarkMode ? 'THEME.COLORS.light.background' : 'THEME.COLORS.light.textPrimary', textTransform: 'uppercase' }}>
                  Edit Order #{editingOrder?.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 10, color: isDarkMode ? 'colors.textMuted' : 'colors.textSecondary', fontWeight: '700', marginTop: 2 }}>
                  Modify quantities, swap variants, or add products
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrder(null)} style={{ padding: 4 }}>
                <X size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Catalog Search Input */}
            <View style={{ position: 'relative', marginBottom: 12, zIndex: 50 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'THEME.COLORS.dark.surfaceElevated' : 'colors.borderLight', borderRadius: 14, paddingHorizontal: 12, height: 40 }}>
                <Search size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search catalog to add items..."
                  placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDarkMode ? 'colors.surface' : 'THEME.COLORS.light.textPrimary' }}
                />
              </View>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <View style={{ position: 'absolute', top: 44, left: 0, right: 0, maxHeight: 180, backgroundColor: isDarkMode ? '#27272a' : '#ffffff', borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', borderRadius: 14, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {searchResults.map((prod) => (
                      <TouchableOpacity
                        key={prod.id}
                        onPress={() => addCatalogItem(prod)}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: isDarkMode ? 'colors.textSecondary' : 'colors.borderLight' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? 'colors.border' : 'colors.textPrimary', flex: 1, marginRight: 8 }}>{prod.name}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: 'THEME.COLORS.brand.primary' }}>₹{prod.price}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Scrollable list of current items */}
            <ScrollView style={{ flexGrow: 0, flexShrink: 1, marginBottom: 12 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {editItems.length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 32, fontSize: 12, fontWeight: '700', color: isDarkMode ? 'colors.textMuted' : 'colors.textMuted' }}>
                  No items in order. Search above to add items.
                </Text>
              ) : (
                editItems.map((item, idx) => {
                  const prodDetails = allProducts.find(p => p.id === item.productId);
                  const variants = prodDetails?.variants as any[] | undefined;
                  const hasItemVariants = variants && Array.isArray(variants) && variants.length > 0;

                  return (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: isDarkMode ? 'THEME.COLORS.dark.surfaceElevated' : 'THEME.COLORS.light.background', borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? 'colors.textSecondary' : 'colors.border', marginBottom: 8 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? 'colors.textPrimary' : 'colors.textPrimary' }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ fontSize: 9.5, fontWeight: '900', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary', marginTop: 2 }}>₹{item.price}</Text>
                        
                        {/* Variant Swap Selector */}
                        {hasItemVariants && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Text style={{ fontSize: 8.5, fontWeight: '900', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary', textTransform: 'uppercase' }}>Variant:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 4 }}>
                              {variants.map((v) => {
                                const isSelected = item.selectedVariant === v.name;
                                return (
                                  <TouchableOpacity
                                    key={v.name}
                                    onPress={() => updateItemVariant(item.productId, item.selectedVariant, v.name, v.price)}
                                    style={{
                                      paddingHorizontal: 8,
                                      paddingVertical: 3,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: isSelected ? 'THEME.COLORS.brand.primary' : (isDarkMode ? 'colors.textSecondary' : 'colors.border'),
                                      backgroundColor: isSelected ? ''#E20A2219'' : 'transparent',
                                      marginRight: 4
                                    }}
                                  >
                                    <Text style={{ fontSize: 8.5, fontWeight: '800', color: isSelected ? 'THEME.COLORS.brand.primary' : (isDarkMode ? 'colors.border' : 'colors.textSecondary') }}>
                                      {v.name} (₹{v.price})
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1c1c1e' : 'colors.surface', borderWidth: 1, borderColor: isDarkMode ? 'colors.textSecondary' : 'colors.border', borderRadius: 10, overflow: 'hidden' }}>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, -1)}
                            style={{ padding: 6 }}
                          >
                            <Minus size={10} color={isDarkMode ? '#e2e8f0' : '#475569'} strokeWidth={3} />
                          </TouchableOpacity>
                          <Text style={{ paddingHorizontal: 8, fontSize: 11, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'THEME.COLORS.light.textPrimary', minWidth: 18, textAlign: 'center' }}>
                            {item.quantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, 1)}
                            style={{ padding: 6 }}
                          >
                            <Plus size={10} color={isDarkMode ? '#e2e8f0' : '#475569'} strokeWidth={3} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={() => markItemOutOfStock(item.productId)}
                          style={{ padding: 6, backgroundColor: ''#EF444419'', borderRadius: 10 }}
                        >
                          <AlertTriangle size={12} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Recalculated Live Bill Preview */}
            {(() => {
              const computedSubtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const computedDeliveryFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (computedSubtotal < freeDeliveryThreshold ? deliveryFeeSetting : 0);
              const computedMiscFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (editingOrder?.miscFee === 0 ? 0 : miscFeeSetting);
              const computedTaxes = parseFloat((computedSubtotal * editTaxRate).toFixed(2));
              const computedTotal = computedSubtotal + computedDeliveryFee + computedTaxes + computedMiscFee - (editingOrder?.discount || 0);

              return (
                <View style={{ backgroundColor: isDarkMode ? 'THEME.COLORS.dark.surfaceElevated' : 'THEME.COLORS.light.background', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? 'colors.textSecondary' : 'colors.border', marginBottom: 12, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Subtotal</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'colors.textPrimary' }}>₹{computedSubtotal}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Taxes ({Math.round(editTaxRate * 100)}%)</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'colors.textPrimary' }}>₹{computedTaxes}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Delivery Fee</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'colors.textPrimary' }}>₹{computedDeliveryFee}</Text>
                  </View>
                  {computedMiscFee > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Handling / Packaging Fee</Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'colors.textPrimary' }}>₹{computedMiscFee}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Discount</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'colors.textPrimary' }}>-₹{editingOrder?.discount || 0}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: isDarkMode ? 'colors.textSecondary' : 'colors.border', paddingTop: 6, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: isDarkMode ? 'colors.surface' : 'THEME.COLORS.light.textPrimary' }}>Estimated Total</Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: 'THEME.COLORS.brand.primary' }}>₹{computedTotal}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingOrder(null)}
                style={{ flex: 1, height: 40, borderWidth: 1, borderColor: isDarkMode ? 'colors.textSecondary' : 'colors.border', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isSavingEdit}
                onPress={saveEditedOrder}
                style={{ flex: 1, height: 40, backgroundColor: 'THEME.COLORS.brand.primary', borderRadius: 12, justifyContent: 'center', alignItems: 'center', opacity: isSavingEdit ? 0.6 : 1 }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'colors.surface' }}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Premium Custom Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: ''#00000099'', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setLogoutModalVisible(false)}
        >
          <Pressable 
            style={{
              width: '85%',
              maxWidth: 340,
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 15,
              elevation: 10,
              borderWidth: 1,
              borderColor: isDarkMode ? ''#FFFFFF0F'' : ''#00000005'',
            }}
          >
            {/* Logout icon with glowing circle */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isDarkMode ? ''#F43F5E1E'' : '#ffe4e6',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <LogOut size={24} color="#f43f5e" strokeWidth={2} />
            </View>

            {/* Modal Title */}
            <Text style={{
              fontSize: 18,
              fontWeight: '900',
              color: isDarkMode ? 'colors.surface' : 'THEME.COLORS.light.textPrimary',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Log Out
            </Text>

            {/* Modal Description */}
            <Text style={{
              fontSize: 13,
              color: isDarkMode ? 'colors.textSecondary' : 'colors.textSecondary',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 24,
              fontWeight: '600',
            }}>
              Are you sure you want to log out from the console?
            </Text>

            {/* Buttons Row */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setLogoutModalVisible(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? 'THEME.COLORS.dark.surfaceElevated' : 'colors.background',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? 'colors.border' : 'colors.textMuted' }}>
                  Cancel
                </Text>
              </Pressable>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic('medium');
                  setLogoutModalVisible(false);
                  logout();
                  router.replace('/(auth)/login');
                }}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={['#f43f5e', '#e11d48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: 'colors.surface' }}>
                    Log Out
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      </>
    );
  }
}
