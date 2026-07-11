import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Alert, Modal, Switch, Platform, Linking, useColorScheme, useWindowDimensions, TouchableOpacity, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, Circle, CheckCircle, Package, Truck, ChefHat, Search, Play, Phone, MapPin, IndianRupee, Camera, QrCode, Sparkles, RefreshCw, Barcode, X, Settings, Ticket, Plus, Users, ShoppingBag, Star, Zap, AlertTriangle, TrendingUp, Building2, Calendar, Activity, Layers, Hourglass, XCircle, PlusCircle, ChevronRight, Utensils, Clock, ArrowRight, BrainCircuit, RotateCcw, HelpCircle, Undo, Download, Save, Heart, Sliders, ArrowUp, ArrowDown, ChevronDown, Sun, Moon, Send, MessageSquare, Edit2, Trash2 } from 'lucide-react-native';
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

const { width } = Dimensions.get('window');

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
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  location?: string | null;
  categorySlug?: string;
  cooked: boolean;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
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
}

// ------------------- Aisle Rack mapping -------------------
const CATEGORY_AISLES: Record<string, string> = {
  'fruits-vegetables': 'Aisle 1 (Produce Rack)',
  'dairy-breakfast': 'Aisle 2 (Chilled Dairy)',
  'snacks-munchies': 'Aisle 3 (Snacks)',
  'beverages': 'Aisle 4 (Beverages)',
  'atta-rice-dal': 'Aisle 5 (Staples)',
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
      { id: 'it-3', name: 'Lay\'s Magic Masala Chips', price: 20, quantity: 5, imageUrl: null, location: 'Aisle 3 (Snacks)', categorySlug: 'snacks-munchies', cooked: false },
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
      { id: 'it-6', name: 'Aashirvaad Atta 5kg', price: 270, quantity: 2, imageUrl: null, location: 'Aisle 5 (Staples)', categorySlug: 'atta-rice-dal', cooked: false },
      { id: 'it-7', name: 'Fortune Soya Oil 1L', price: 140, quantity: 2, imageUrl: null, location: 'Aisle 5 (Staples)', categorySlug: 'atta-rice-dal', cooked: false }
    ],
    binName: 'Bin-B12'
  }
];

export default function OperationsScreen() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'PICKER' | 'RIDER' | 'CHEF' | 'ANALYTICS' | 'SETTINGS' | 'INVENTORY' | 'NOTIFICATIONS' | 'COUPONS' | 'ORDERS' | 'BANNERS' | 'USERS' | 'REVIEWS' | 'HIGHLIGHTS' | 'LIVEOPS' | 'CATEGORIES' | 'ALERTS' | 'INWARD' | 'BULK_UPDATE' | 'REPORTS' | 'FORECAST'>('ANALYTICS');
  const [activeHub, setActiveHub] = useState<'BI' | 'OPS' | 'CATALOG' | 'MARKETING'>('BI');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitioning(false);
    });
    return () => task.cancel();
  }, [activeTab]);

  useEffect(() => {
    if (['ANALYTICS', 'FORECAST', 'REPORTS'].includes(activeTab)) {
      setActiveHub('BI');
    } else if (['LIVEOPS', 'ORDERS', 'USERS', 'REVIEWS', 'PICKER', 'RIDER'].includes(activeTab)) {
      setActiveHub('OPS');
    } else if (['INVENTORY', 'CATEGORIES', 'INWARD', 'BULK_UPDATE', 'ALERTS'].includes(activeTab)) {
      setActiveHub('CATALOG');
    } else if (['BANNERS', 'HIGHLIGHTS', 'COUPONS', 'NOTIFICATIONS', 'SETTINGS', 'CHEF'].includes(activeTab)) {
      setActiveHub('MARKETING');
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
        setActiveTab('ANALYTICS'); // Default to Analytics for Admin
      }
    }
  }, [user]);

  // Admin settings tab states
  const [groceryOpenState, setGroceryOpenState] = useState<boolean>(localGroceryOpen);
  const [cafeOpenState, setCafeOpenState] = useState<boolean>(localCafeOpen);
  const [radiusState, setRadiusState] = useState<string>(String(localRadius));
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'ops' | 'cosmetics' | 'finance' | 'greetings'>('ops');

  // Extended settings state variables
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
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponType, setNewCouponType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [newCouponValue, setNewCouponValue] = useState<string>('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<string>('');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<string>('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState<boolean>(false);

  // Admin analytics states
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);
  const [analyticsStats, setAnalyticsStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    lowStockCount: 0,
    userCount: 0,
    couponCount: 0
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





  // Load initial stats & LiveOps data on mount
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAnalyticsData();
      fetchLiveopsData();
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
    enabled: user?.role === 'ADMIN',
    onEvent: (event) => {
      // Refresh data on any incoming SSE event or poll fallback tick
      fetchLiveopsData();
      fetchAnalyticsData();
    }
  });

  // --- API Integrations for Admin Workspace ---
  // --- Settings Management ---
  const fetchSettingsData = async () => {
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
        
        // Dynamic Operational Settings
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

  // --- LiveOps Data ---
  const fetchLiveopsData = async () => {
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

  const fetchAnalyticsData = async () => {
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

      if (Array.isArray(ordersList)) {
        ordersList.forEach((o) => {
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
        totalRevenue: revenue,
        totalOrders: Array.isArray(ordersList) ? ordersList.length : 0,
        activeOrders: activeCount,
        deliveredOrders: deliveredCount,
        lowStockCount: lowStock,
        userCount: fetchedUserCount,
        couponCount: couponCount || 4
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

      mockOrdersList.forEach((o) => {
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
        totalRevenue: revenue,
        totalOrders: mockOrdersList.length,
        activeOrders: mockOrdersList.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length,
        deliveredOrders: mockOrdersList.filter(o => o.status === 'DELIVERED').length,
        lowStockCount: 4,
        userCount: 52,
        couponCount: 6
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
          hero_subtitle_night_mart_closed: heroSubtitleNightMartClosed.trim(),
          hero_subtitle_night_cafe_closed: heroSubtitleNightCafeClosed.trim(),
          hero_subtitle_night_both_open: heroSubtitleNightBothOpen.trim(),
          ...categorySettingsPayload,
        })
      });

      if (res.ok) {
        // Sync local client Zustand store instantly!
        setLocalStoreStatus(
          groceryOpenState, 
          cafeOpenState, 
          radiusNum, 
          parseFloat(storeLat), 
          parseFloat(storeLng),
          parseInt(minOrderValueState),
          parseInt(storeOpenHourState),
          parseInt(storeCloseHourState),
          holidaysState.split(',').map(h => h.trim()),
          parseFloat(surgeMultiplierState)
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
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl || it.product?.imageUrl || null,
            location: it.product?.location || null,
            categorySlug: it.product?.category?.slug || (ord.shopName === 'FastKirana Cafe Kitchen' ? 'cafe' : ''),
            cooked: it.cooked || false
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

  useEffect(() => {
    fetchServerOrders(true);
    
    const intervalId = setInterval(() => {
      fetchServerOrders(false);
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
    // Simple toggle state for cafe item cooked checklist
    let allChefItemsReady = false;
    let targetOrderUser = 'Customer';
    
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        targetOrderUser = o.user.name;
        const updatedItems = o.items.map(it => 
          it.id === itemId ? { ...it, cooked: !it.cooked } : it
        );
        
        // Check if all cafe items in this order are now prepared
        allChefItemsReady = updatedItems
          .filter(it => it.categorySlug === 'cafe')
          .every(it => it.cooked === true);

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
      setTimeout(() => {
        toast.success(`☕ Kitchen order for ${targetOrderUser} prepared! Sent to Rider.`);
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
      nativeGradient: ['rgba(59,130,246,0.12)', 'rgba(6,182,212,0.08)'] as [string, string],
      nativeBorder: 'rgba(59,130,246,0.4)',
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
      nativeGradient: ['rgba(245,158,11,0.12)', 'rgba(249,115,22,0.08)'] as [string, string],
      nativeBorder: 'rgba(245,158,11,0.4)',
      tabs: [
        { id: 'LIVEOPS', label: 'LiveOps', emoji: '🚨' },
        { id: 'ORDERS', label: 'Store Orders', emoji: '📋' },
        { id: 'USERS', label: 'Customers', emoji: '👥' },
        { id: 'REVIEWS', label: 'Reviews', emoji: '⭐' },
        { id: 'PICKER', label: 'Picker Mode', emoji: '📦' },
        { id: 'RIDER', label: 'Rider Mode', emoji: '🛵' }
      ]
    },
    {
      id: 'CATALOG',
      title: 'Catalog & Inventory',
      description: 'Products, categories, GRN stock, and bulk update',
      icon: Package,
      defaultTab: 'INVENTORY',
      color: 'from-emerald-500/10 to-teal-500/10',
      activeBorder: 'border-emerald-500/60 ring-2 ring-emerald-500/20',
      iconColor: '#10b981',
      nativeGradient: ['rgba(16,185,129,0.12)', 'rgba(20,184,166,0.08)'] as [string, string],
      nativeBorder: 'rgba(16,185,129,0.4)',
      tabs: [
        { id: 'INVENTORY', label: 'Products', emoji: '🍎' },
        { id: 'CATEGORIES', label: 'Categories', emoji: '📁' },
        { id: 'INWARD', label: 'GRN Inward', emoji: '📥' },
        { id: 'BULK_UPDATE', label: 'Bulk Update', emoji: '⚡' },
        { id: 'ALERTS', label: 'Alerts', emoji: '⚠️' }
      ]
    },
    {
      id: 'MARKETING',
      title: 'Marketing & Settings',
      description: 'Banners, coupons, notifications, and settings',
      icon: Sliders,
      defaultTab: 'SETTINGS',
      color: 'from-rose-500/10 to-pink-500/10',
      activeBorder: 'border-rose-500/60 ring-2 ring-rose-500/20',
      iconColor: '#ec4899',
      nativeGradient: ['rgba(236,72,153,0.12)', 'rgba(244,63,94,0.08)'] as [string, string],
      nativeBorder: 'rgba(236,72,153,0.4)',
      tabs: [
        { id: 'BANNERS', label: 'Promo Banners', emoji: '🖼️' },
        { id: 'HIGHLIGHTS', label: 'Flash Deals', emoji: '⚡' },
        { id: 'COUPONS', label: 'Offers', emoji: '🎟️' },
        { id: 'NOTIFICATIONS', label: 'Push Notifications', emoji: '📣' },
        { id: 'SETTINGS', label: 'Store Settings', emoji: '⚙️' },
        { id: 'CHEF', label: 'Chef Kitchen', emoji: '🍳' }
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
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out from the console?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Out', 
            style: 'destructive',
            onPress: () => {
              console.log('[Logout] Confirmed on native, logging out');
              logout();
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    }
  };

  const renderActiveTitle = () => {
    return (
      <>
        {activeTab === 'PICKER' && 'Picker Console 📦'}
        {activeTab === 'RIDER' && 'Rider Console 🛵'}
        {activeTab === 'CHEF' && 'Cafe Kitchen Console 🍳'}
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
      className="flex-1"
      style={{ backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}
    >
      {isLargeScreen ? (
        /* ------------------- WEB VIEW DASHBOARD ------------------- */
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Header Bar */}
          <View className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 py-3 flex-row items-center justify-between flex-wrap gap-4 shadow-xs">
            <View className="flex-row items-center gap-4 md:gap-6 flex-wrap flex-1 min-w-[280px]">
              {/* App Logo & Geolocation selector (same as Home page design) */}
              <View className="flex-row items-center gap-3">
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
                  className="flex-row items-center gap-2"
                >
                  <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                    <MapPin size={14} color="#e20a22" />
                  </View>
                  <View className="flex-column items-start">
                    <Text className="text-slate-800 dark:text-zinc-100 font-extrabold text-xs">
                      Fast Delivery
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold max-w-[140px]" numberOfLines={1}>
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
                className="flex-1 max-w-[288px] min-w-[160px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full px-4 py-1.5 flex-row items-center gap-2 active:opacity-80"
              >
                <Search size={14} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold" numberOfLines={1}>
                  Search admin tabs...
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-4">
              {/* Theme selector toggle (toggles theme dynamically) */}
              <Pressable 
                onPress={() => {
                  toggleTheme();
                  triggerHaptic('light');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center border border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                {isDarkMode ? (
                  <Sun size={14} color="#fbbf24" />
                ) : (
                  <Moon size={14} color="#3b82f6" />
                )}
              </Pressable>

              {/* User details */}
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-850 items-center justify-center border border-slate-300 dark:border-zinc-700">
                  <Text className="text-slate-700 dark:text-zinc-300 font-bold text-[10px]">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-700 dark:text-zinc-200 font-extrabold text-xs">{user?.name || 'Administrator'}</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider">{user?.role || 'Admin'}</Text>
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
                  borderColor: '#e20a22',
                  backgroundColor: 'transparent',
                  zIndex: 9999
                }}
              >
                <Text style={{ color: '#e20a22', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Centered Container */}
          <View className="max-w-5xl w-full mx-auto px-8 pt-8">
            {/* Page Title */}
            <View className="mb-6">
              <Text className="text-slate-900 dark:text-white font-black text-2xl">Admin Console</Text>
              <Text className="text-slate-500 dark:text-zinc-400 text-xs font-semibold mt-1">Welcome, Admin. Manage store status, pricing, inventory and customers.</Text>
            </View>

            {/* 6 Stats Cards Grid */}
            <View className="flex-row flex-wrap gap-4 mb-8">
              {[
                { label: 'TOTAL REVENUE', value: formatPrice(analyticsStats.totalRevenue || 0), icon: IndianRupee, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                { label: 'TOTAL ORDERS', value: String(analyticsStats.totalOrders || 0), icon: ShoppingBag, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
                { label: 'ACTIVE ORDERS', value: String(analyticsStats.activeOrders || 0), icon: RotateCcw, color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' },
                { label: 'DELIVERED ORDERS', value: String(analyticsStats.deliveredOrders || 0), icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                { label: 'REGISTERED USERS', value: String(analyticsStats.userCount || 0), icon: Users, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
                { label: 'LOW STOCK ALERT', value: String(analyticsStats.lowStockCount || 0), icon: AlertTriangle, color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <View 
                    key={idx} 
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex-row items-center gap-4 shadow-xs"
                    style={{ width: isWeb ? 'calc(16.66% - 14px)' : '48%', minWidth: isWeb ? 140 : 'none' } as any}
                  >
                    <View 
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Icon size={18} color={stat.color} />
                    </View>
                    <View>
                      <Text className="text-slate-500 dark:text-slate-400 dark:text-zinc-500 font-black text-[9px] uppercase tracking-wider">{stat.label}</Text>
                      <Text className="text-slate-800 dark:text-white font-black text-xl mt-1">{stat.value}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 4 Category Hub Grid */}
            <View className="flex-row flex-wrap gap-4 mb-6">
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
                    style={{ width: isWeb ? 'calc(25% - 12px)' : '48%', cursor: 'pointer' } as any}
                  >
                    <View 
                      className={`w-12 h-12 rounded-2xl items-center justify-center ${
                        isSelected ? 'bg-white/90 dark:bg-zinc-800/80 shadow-xs' : 'bg-slate-100 dark:bg-zinc-800'
                      }`}
                    >
                      <Icon size={18} color={isSelected ? hub.iconColor : '#64748b'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-extrabold text-sm leading-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-white'}`}>{hub.title}</Text>
                      <Text className={`text-[10px] font-semibold mt-1 leading-normal ${isSelected ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`} numberOfLines={2}>
                        {hub.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Sub-Tabs Row */}
            <View className="bg-slate-150 dark:bg-zinc-900/60 p-1 rounded-full mb-6 flex-row self-start gap-1 flex-wrap border border-slate-200/30 dark:border-zinc-800/40">
              {activeHubDetails.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      setActiveTab(tab.id as any);
                      triggerHaptic('light');
                    }}
                    className={`px-4 py-1.5 rounded-full flex-row items-center gap-1.5 transition-all ${
                      isActive 
                        ? 'bg-indigo-600 dark:bg-indigo-550 shadow-sm' 
                        : 'bg-transparent'
                    }`}
                    style={{ cursor: 'pointer' } as any}
                  >
                    {tab.emoji && <Text style={{ fontSize: 11 }}>{tab.emoji}</Text>}
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Workspace Area Box */}
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <WorkspaceContainer className="flex-1" showsVerticalScrollIndicator={false}>
                {renderWorkspaceContent()}
              </WorkspaceContainer>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ------------------- MOBILE VIEW ------------------- */
        (!user || user.role === 'ADMIN') ? (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingBottom: 80 }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Mobile Header Bar */}
            <View className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-xs">
              {/* Row 1: Logo + Location + Actions */}
              <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
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
                    className="flex-row items-center gap-1.5"
                  >
                    <MapPin size={14} color="#e20a22" />
                    <View>
                      <Text className="text-slate-800 dark:text-zinc-100 font-extrabold text-xs">
                        Fast Delivery
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold max-w-[120px]" numberOfLines={1}>
                          {formatHeaderAddress(selectedLocation)}
                        </Text>
                        <ChevronDown size={8} color="#94a3b8" />
                      </View>
                    </View>
                  </Pressable>
                </View>

                <View className="flex-row items-center gap-2.5">
                  <Pressable 
                    onPress={() => {
                      toggleTheme();
                      triggerHaptic('light');
                    }}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center border border-slate-200 dark:border-zinc-700 active:scale-95"
                  >
                    {isDarkMode ? (
                      <Sun size={15} color="#fbbf24" />
                    ) : (
                      <Moon size={15} color="#3b82f6" />
                    )}
                  </Pressable>

                  {/* User Avatar */}
                  <View className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 items-center justify-center border border-slate-300 dark:border-zinc-700">
                    <Text className="text-slate-700 dark:text-zinc-300 font-black text-[10px]">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Full-width search bar */}
              <View className="px-4 pb-3">
                <Pressable 
                  onPress={() => {
                    setLauncherSearchQuery('');
                    setIsLauncherVisible(true);
                    triggerHaptic('light');
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 flex-row items-center gap-2.5 active:opacity-80"
                >
                  <Search size={15} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-zinc-500 text-xs font-semibold flex-1" numberOfLines={1}>
                    Search tabs, settings, inventory...
                  </Text>
                  <View className="bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                    <Text className="text-slate-500 dark:text-zinc-400 text-[8px] font-black">⌘K</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Title Section */}
            <View className="px-4 pt-5 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-900 dark:text-white font-black text-2xl">Admin Console</Text>
                <Pressable
                  onPress={handleLogoutPress}
                  className="px-3.5 py-1.5 rounded-full border border-red-500/30 active:bg-red-500/10"
                >
                  <Text className="text-red-500 font-black text-[10px] uppercase tracking-wider">Log Out</Text>
                </Pressable>
              </View>
              <Text className="text-slate-500 dark:text-zinc-400 text-xs font-semibold mt-1">Welcome, {user?.name || 'Admin'}. Manage store, inventory & customers.</Text>
            </View>

            {/* 6 Stats Cards Grid (2-column on mobile) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 24 }}>
              {[
                { label: 'TOTAL REVENUE', value: formatPrice(analyticsStats.totalRevenue || 0), icon: IndianRupee, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                { label: 'TOTAL ORDERS', value: String(analyticsStats.totalOrders || 0), icon: ShoppingBag, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
                { label: 'ACTIVE ORDERS', value: String(analyticsStats.activeOrders || 0), icon: RotateCcw, color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' },
                { label: 'DELIVERED ORDERS', value: String(analyticsStats.deliveredOrders || 0), icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                { label: 'REGISTERED USERS', value: String(analyticsStats.userCount || 0), icon: Users, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
                { label: 'LOW STOCK ALERT', value: String(analyticsStats.lowStockCount || 0), icon: AlertTriangle, color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                const cardWidth = (width - 42) / 2;
                return (
                  <Animated.View 
                    key={idx}
                    entering={FadeInDown.delay(idx * 40).duration(200)}
                    style={{ width: cardWidth }}
                  >
                    <View 
                      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex-row items-center gap-3"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.03,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <View 
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: stat.bg }}
                      >
                        <Icon size={16} color={stat.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-400 dark:text-zinc-500 font-black text-[8px] uppercase tracking-wider" numberOfLines={1}>{stat.label}</Text>
                        <Text className="text-slate-800 dark:text-white font-black text-base mt-0.5" numberOfLines={1}>{stat.value}</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            {/* 4 Category Hub Stack (full-width on mobile) */}
            <View className="px-4 mb-6" style={{ gap: 10 }}>
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
                        borderColor: isSelected ? hub.nativeBorder : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
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
                        className={`p-4 flex-row items-center gap-4 ${!isSelected ? 'bg-white dark:bg-zinc-900' : ''}`}
                      >
                        <View 
                          className={`w-11 h-11 rounded-xl items-center justify-center ${
                            isSelected ? 'bg-white/90 dark:bg-zinc-800/80' : 'bg-slate-100 dark:bg-zinc-800'
                          }`}
                          style={isSelected ? { shadowColor: hub.iconColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 } : undefined}
                        >
                          <Icon size={16} color={isSelected ? hub.iconColor : '#64748b'} />
                        </View>
                        <View className="flex-1">
                          <Text className={`font-black text-sm leading-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-200'}`}>{hub.title}</Text>
                          <Text className={`text-[10px] font-semibold mt-1 leading-normal ${isSelected ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-500'}`} numberOfLines={2}>
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
            <View className="mx-4 mb-5">
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
                      className={`px-4 py-2 rounded-full flex-row items-center gap-1.5 border active:scale-95 transition-all ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                          : 'bg-slate-50 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                      }`}
                      style={({ pressed }) => ({
                        transform: [{ scale: pressed ? 0.96 : 1 }]
                      })}
                    >
                      {tab.emoji && <Text style={{ fontSize: 11 }}>{tab.emoji}</Text>}
                      <Text className={`text-[10px] font-black uppercase tracking-wider ${
                        isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                      }`}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Workspace Area Box */}
            <View 
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl mx-4 mb-8"
              style={{
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View className="flex-1">
                {renderWorkspaceContent()}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Worker Mode (Non-Admin View) */
          <>
            {/* Simple Mobile Header */}
            <View className="bg-white dark:bg-zinc-900 px-4 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
              <View className="flex-row items-center gap-3">
                <View className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                  <Text className="text-white font-extrabold text-[8px] tracking-wider uppercase">
                    {user.role}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-black text-base">
                    {renderActiveTitle()}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wide mt-0.5">
                    {renderActiveDescription()}
                  </Text>
                </View>
              </View>
              
              <Pressable 
                onPress={handleLogoutPress}
                className="px-3 py-1.5 rounded-lg bg-red-600/15 border border-red-500/25 active:bg-red-600/30"
              >
                <Text className="text-red-500 font-bold text-xs">Log Out</Text>
              </Pressable>
            </View>

            {/* Workspace Content for Workers (scrollable) */}
            <WorkspaceContainer className="flex-1 p-4" showsVerticalScrollIndicator={false}>
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
        <View className="flex-1 justify-center items-center py-20 gap-3" style={{ minHeight: 350 }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-500 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-widest">
            Loading Workspace...
          </Text>
        </View>
      );
    }

    return (
      <>
        {activeTab === 'ANALYTICS' && (
              <>
                <View className="flex-row justify-between items-center mb-1">
                <View>
                  <Text className="text-slate-900 dark:text-white font-black text-base">Sales & Performance</Text>
                  {pushToken ? (
                  <Text className="text-indigo-400 font-bold text-[8px] uppercase tracking-widest mt-1">
                    Push Notifications: Active ({pushToken.slice(0, 25)}...)
                  </Text>
                ) : (
                  <Text className="text-slate-500 font-bold text-[8px] uppercase tracking-widest mt-1">
                    Push Notifications: Not Registered
                  </Text>
                )}
              </View>
              <Pressable 
                onPress={fetchAnalyticsData}
                disabled={isAnalyticsLoading}
                className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 active:bg-indigo-600/20 flex-row items-center gap-1.5"
              >
                {isAnalyticsLoading ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <RefreshCw size={12} color="#6366f1" />
                )}
                <Text className="text-indigo-400 font-extrabold text-[9px] uppercase tracking-wider">Refresh</Text>
              </Pressable>
            </View>

            {/* AI Stock Depletion & Replenishment Warnings */}
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-5 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <Sparkles size={14} color="#6366f1" />
                <Text className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider">AI Stock Replenishment Forecast</Text>
              </View>
              {isAnalyticsLoading ? (
                <ActivityIndicator size="small" color="#6366f1" className="my-6" />
              ) : stockForecast.filter(f => !f.isCafe && (f.isUrgent || f.stock === 0)).length === 0 ? (
                <View className="py-4 items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">🌱 All inventory levels healthy. No predicted stockouts.</Text>
                </View>
              ) : (
                <View className="gap-3 mt-1">
                  {stockForecast.filter(f => !f.isCafe && (f.isUrgent || f.stock === 0)).slice(0, 4).map((product) => {
                    const runoutStr = product.stock === 0 ? 'Out of Stock' : product.daysToDepletion !== null ? `${product.daysToDepletion.toFixed(1)} days to stockout` : 'Stable';
                    const runoutColor = product.stock === 0 ? 'border-red-500/25 bg-red-500/10' : 'border-amber-500/25 bg-amber-500/10';
                    const runoutTextColor = product.stock === 0 ? 'text-red-400' : 'text-amber-400';

                    return (
                      <View key={product.id} className="flex-row items-center justify-between bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800 p-3 rounded-2xl">
                        <View className="flex-1 pr-2">
                          <Text className="text-slate-800 dark:text-slate-700 dark:text-slate-200 font-bold text-xs">{product.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-1">
                            Stock: <Text className={product.stock === 0 ? 'text-red-500 font-black' : 'text-slate-800 dark:text-slate-700 dark:text-slate-200'}>{product.stock}</Text> • Velocity: {product.velocity.toFixed(2)}/day
                          </Text>
                          <View className="flex-row gap-2 mt-2">
                            <View className={`px-2 py-0.5 rounded-full border ${runoutColor}`}>
                              <Text className={`font-extrabold text-[8px] uppercase tracking-wider ${runoutTextColor}`}>{runoutStr}</Text>
                            </View>
                            <View className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                              <Text className="text-indigo-400 font-extrabold text-[8px] uppercase tracking-wider">Suggests: +{product.suggestedRestock}</Text>
                            </View>
                          </View>
                        </View>

                        {product.suggestedRestock > 0 && (
                          <Pressable
                            disabled={isInwardingForecast === product.id}
                            onPress={() => handleAppRestock(product)}
                            className="bg-indigo-655 bg-indigo-600 px-3 py-2 rounded-xl active:bg-indigo-700 disabled:bg-slate-800"
                          >
                            {isInwardingForecast === product.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text className="text-white font-extrabold text-[9px] uppercase tracking-wider">Restock</Text>
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
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-5 shadow-sm">
              <Text className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider mb-3">Weekly Sales Revenue (Mon - Sun)</Text>
              <View className="flex-row items-end justify-between h-36 px-2 mt-4">
                {weeklySalesData.map((item, idx) => {
                  const maxVal = Math.max(...weeklySalesData.map(d => d.value), 1000) || 1000;
                  const pct = Math.round((item.value / maxVal) * 100);
                  return (
                    <View key={idx} className="items-center flex-1">
                      <View className="w-4 bg-slate-100 dark:bg-slate-950 rounded-t-lg h-24 justify-end">
                        <View style={{ height: `${pct}%` }} className="w-full bg-indigo-600 rounded-t-lg" />
                      </View>
                      <Text className="text-slate-500 font-bold text-[8px] mt-2">{item.day}</Text>
                      <Text className="text-slate-700 dark:text-slate-200 font-black text-[7px] mt-0.5">₹{(item.value/1000).toFixed(1)}k</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Category Distribution stacked bar */}
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-5 shadow-sm mt-1">
              <Text className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider mb-4">Category Order Share</Text>
              <View className="h-6 w-full rounded-full bg-slate-100 dark:bg-slate-950 flex-row overflow-hidden">
                {categoryShareData.map((item, idx) => (
                  <View key={idx} style={{ width: `${item.pct}%` }} className={`${item.color} h-full`} />
                ))}
              </View>
              {/* Legend */}
              <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-4">
                {categoryShareData.map((leg, idx) => (
                  <View key={idx} className="flex-row items-center gap-1.5">
                    <View className={`w-2 h-2 rounded-full ${leg.color}`} />
                    <Text className="text-slate-500 dark:text-slate-400 font-semibold text-[10px]">{leg.label} ({Math.round(leg.pct)}%)</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between gap-3">
              {[
                { label: 'Total Revenue', value: formatPrice(analyticsStats.totalRevenue), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: IndianRupee },
                { label: 'Total Orders', value: String(analyticsStats.totalOrders), color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Package },
                { label: 'Registered Users', value: String(analyticsStats.userCount), color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Users },
                { label: 'Low Stock Items', value: String(analyticsStats.lowStockCount), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Barcode },
                { label: 'Active Coupons', value: String(analyticsStats.couponCount), color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Ticket }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <View key={idx} style={{ width: '47%' }} className={`p-4 rounded-2xl border ${stat.color} shadow-xs`}>
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-slate-500 font-extrabold text-[8px] uppercase tracking-wider">{stat.label}</Text>
                      <Icon size={12} className="opacity-80" />
                    </View>
                    <Text className="text-slate-900 dark:text-white font-black text-sm min-[375px]:text-base">{stat.value}</Text>
                  </View>
                );
              })}
            </View>

            {/* Recent Orders List */}
            <View className="mt-2">
              <Text className="text-slate-900 dark:text-white font-black text-sm mb-3">Recent Sales Orders</Text>
              {isAnalyticsLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              ) : recentOrders.length === 0 ? (
                <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 items-center">
                  <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs text-center">No orders recorded on server yet.</Text>
                </View>
              ) : (
                <View className="gap-3">
                  {recentOrders.map((ord) => (
                    <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 shadow-xs">
                      <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
                        <View>
                          <Text className="text-slate-900 dark:text-white font-black text-xs uppercase">Order #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {ord.paymentMethod || 'UPI'}
                          </Text>
                        </View>
                        <View className={`px-2 py-0.5 rounded-full border ${
                          ord.status === 'DELIVERED' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          ord.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-amber-500/10 border-amber-500/20'
                        }`}>
                          <Text className={`font-extrabold text-[8px] uppercase tracking-wider text-center ${
                            ord.status === 'DELIVERED' ? 'text-emerald-400' :
                            ord.status === 'CANCELLED' ? 'text-red-400' :
                            'text-amber-400'
                          }`}>
                            {ord.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center mt-1">
                        <View className="flex-1 pr-2">
                          <Text className="text-slate-800 dark:text-slate-650 dark:text-slate-300 text-xs font-semibold">Customer: {ord.user?.name || ord.userName || 'Anonymous'}</Text>
                          <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-0.5 truncate" numberOfLines={1}>
                            Address: {ord.address?.houseNo ? `${ord.address.houseNo}, ${ord.address.street}` : 'Pickup'}
                          </Text>
                        </View>
                        <Text className="text-slate-900 dark:text-white font-black text-xs">{formatPrice(ord.total)}</Text>
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
          <View className="gap-5">
            {/* Header */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-3">
                <Text className="text-slate-900 dark:text-white font-black text-base">Banner Campaigns</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-0.5">Manage carousel hero banners on customer home screens.</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => { triggerHaptic('light'); fetchBannersData(); }}
                  className="bg-slate-100 dark:bg-zinc-800 p-2.5 rounded-xl active:bg-slate-200 dark:active:bg-zinc-700 border border-slate-200 dark:border-zinc-700"
                >
                  <RefreshCw size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    resetBannerForm();
                    setIsBannerModalVisible(true);
                    triggerHaptic('light');
                  }}
                  className="bg-indigo-600 p-2.5 rounded-xl active:bg-indigo-700 flex-row items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} color="#fff" />
                  <Text className="text-white font-extrabold text-[9px] uppercase tracking-wider">Add Banner</Text>
                </Pressable>
              </View>
            </View>

            {/* Festival Templates */}
            <Pressable
              onPress={() => { setBannerTemplateExpanded(!bannerTemplateExpanded); triggerHaptic('light'); }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-xs"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={16} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-black text-xs">Festival Templates</Text>
                  <View className="bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-amber-600 dark:text-amber-400 text-[8px] font-black">{BANNER_FESTIVAL_TEMPLATES.length} PRESETS</Text>
                  </View>
                </View>
                <ChevronDown size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} style={{ transform: [{ rotate: bannerTemplateExpanded ? '180deg' : '0deg' }] }} />
              </View>
              {bannerTemplateExpanded && (
                <View className="mt-3 gap-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium">Tap a template to auto-fill the banner form.</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
                    <View className="flex-row gap-2">
                      {BANNER_FESTIVAL_TEMPLATES.map((tpl, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            handleBannerApplyTemplate(tpl);
                            setIsBannerModalVisible(true);
                          }}
                          className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 active:bg-slate-100 dark:active:bg-zinc-700 min-w-[140px]"
                        >
                          <Text className="text-slate-900 dark:text-white font-black text-[10px]">{tpl.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-medium mt-0.5" numberOfLines={2}>{tpl.description}</Text>
                          {tpl.code ? <Text className="text-indigo-600 dark:text-indigo-400 text-[8px] font-black mt-1">CODE: {tpl.code}</Text> : null}
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </Pressable>

            {/* Loading State */}
            {isBannersLoading && (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-2">Loading banners...</Text>
              </View>
            )}

            {/* Empty State */}
            {!isBannersLoading && banners.length === 0 && (
              <View className="py-12 items-center gap-2">
                <Text className="text-3xl">🎨</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">No promo banners yet.</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-[9px] font-medium">Create one using the button above or a festival template.</Text>
              </View>
            )}

            {/* Banners List */}
            {!isBannersLoading && banners.length > 0 && (
              <View className="gap-3 mb-10">
                {banners.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((b: any, idx: number) => (
                  <View key={b.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                    {/* Banner preview header with gradient */}
                    <View className={`h-16 bg-gradient-to-r ${b.gradient || 'from-indigo-500 to-purple-500'} justify-center px-4`}>
                      <Text className="text-white font-black text-xs" numberOfLines={1}>{b.title}</Text>
                      {b.description ? <Text className="text-white/80 text-[9px] font-semibold" numberOfLines={1}>{b.description}</Text> : null}
                      {b.code ? (
                        <View className="bg-white/20 self-start px-2 py-0.5 rounded-full mt-1">
                          <Text className="text-white text-[8px] font-black">{b.code}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Banner info + actions */}
                    <View className="p-3.5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 flex-1 mr-2">
                          <View className={`px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-500/10' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                            <Text className={`text-[8px] font-black ${b.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{b.isActive ? 'ACTIVE' : 'DISABLED'}</Text>
                          </View>
                          <Text className="text-slate-400 dark:text-slate-500 text-[8px] font-bold">Sort: {b.sortOrder || 0}</Text>
                          {b.type ? <Text className="text-slate-400 dark:text-slate-500 text-[8px] font-bold uppercase">{b.type}</Text> : null}
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {/* Reorder */}
                          <Pressable
                            onPress={() => handleBannerReorder(b, 'up')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 active:bg-slate-200"
                          >
                            <ArrowUp size={11} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleBannerReorder(b, 'down')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 active:bg-slate-200"
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
                            className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 active:bg-indigo-500/20"
                          >
                            <Settings size={11} color="#6366f1" />
                          </Pressable>

                          {/* Delete */}
                          <Pressable
                            onPress={() => handleBannerDelete(b.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 active:bg-rose-500/20"
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
          <View className="gap-6">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-5 shadow-sm">
              <View className="border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
                <Text className="text-slate-900 dark:text-white font-black text-base">Store Settings</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-1">Configure live operational parameters, cosmetics, and financials.</Text>
              </View>

              {/* Settings Sub-Tab Switcher (Horizontal Slider) */}
              <View className="mb-5">
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
                    className={`px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === 'ops' 
                        ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                        : 'bg-slate-55 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                    }`}
                  >
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === 'ops' ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      🚚 Operations
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('cosmetics');
                      triggerHaptic('light');
                    }}
                    className={`px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === 'cosmetics' 
                        ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                        : 'bg-slate-55 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                    }`}
                  >
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === 'cosmetics' ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      🎨 Branding
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('greetings');
                      triggerHaptic('light');
                    }}
                    className={`px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === 'greetings' 
                        ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                        : 'bg-slate-55 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                    }`}
                  >
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === 'greetings' ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      👋 Greetings
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSettingsSubTab('finance');
                      triggerHaptic('light');
                    }}
                    className={`px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                      settingsSubTab === 'finance' 
                        ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                        : 'bg-slate-55 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                    }`}
                  >
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${
                      settingsSubTab === 'finance' ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      🔑 Financials
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {isSettingsLoading ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-3">Loading store parameters...</Text>
                </View>
              ) : (
                <View className="gap-5">
                  {/* SUB-TAB 1: OPERATIONS */}
                  {settingsSubTab === 'ops' && (
                    <View className="gap-4">
                      {/* Switches Row */}
                      <View className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-850/60 gap-4">
                        {/* Grocery Status */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1 pr-4">
                            <Text className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">Grocery Store Status</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium mt-0.5">Toggle grocery catalog visibility & ordering.</Text>
                          </View>
                          <Switch
                            value={groceryOpenState}
                            onValueChange={setGroceryOpenState}
                            trackColor={{ false: '#334155', true: '#818cf8' }}
                            thumbColor={groceryOpenState ? '#4f46e5' : '#94a3b8'}
                          />
                        </View>
                        
                        <View className="h-px bg-slate-800/50" />

                        {/* Cafe Status */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1 pr-4">
                            <Text className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">Cafe Kitchen Status</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium mt-0.5">Toggle cafe catalog visibility & ordering.</Text>
                          </View>
                          <Switch
                            value={cafeOpenState}
                            onValueChange={setCafeOpenState}
                            trackColor={{ false: '#334155', true: '#f43f5e' }}
                            thumbColor={cafeOpenState ? '#e11d48' : '#94a3b8'}
                          />
                        </View>

                        <View className="h-px bg-slate-800/50" />

                        {/* Only COD Status */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1 pr-4">
                            <Text className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">Only Cash on Delivery</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium mt-0.5">Force all orders to use Cash on Delivery only.</Text>
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
                      <View className="gap-4">
                        {/* Delivery Radius */}
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Delivery Service Radius (KM) *</Text>
                          <TextInput
                            value={radiusState}
                            onChangeText={setRadiusState}
                            keyboardType="numeric"
                            placeholder="5.0"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        {/* Latitude & Longitude */}
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Store Latitude (GPS) *</Text>
                            <TextInput
                              value={storeLat}
                              onChangeText={setStoreLat}
                              placeholder="26.1534185"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Store Longitude (GPS) *</Text>
                            <TextInput
                              value={storeLng}
                              onChangeText={setStoreLng}
                              placeholder="80.1714024"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                        </View>

                        {/* Contact details */}
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Contact Phone *</Text>
                          <TextInput
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            placeholder="+91 70544 70303"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Contact Email *</Text>
                          <TextInput
                            value={contactEmail}
                            onChangeText={setContactEmail}
                            placeholder="help@fastkirana.com"
                            placeholderTextColor="#475569"
                            keyboardType="email-address"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Contact Timings *</Text>
                          <TextInput
                            value={contactTimings}
                            onChangeText={setContactTimings}
                            placeholder="6 AM - 12 AM"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Contact Address *</Text>
                          <TextInput
                            value={contactAddress}
                            onChangeText={setContactAddress}
                            placeholder="NH34, Ghatampur, Kanpur Nagar"
                            placeholderTextColor="#475569"
                            multiline
                            numberOfLines={2}
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-white font-semibold text-xs"
                          />
                        </View>
                      </View>

                      {/* Operational Limits & Surges */}
                      <View className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-850/60 gap-4 mt-2">
                        <Text className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-wider">🏪 Operational Limits & Surges</Text>
                        
                        {/* Minimum Order Value */}
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Minimum Order Value (₹) *</Text>
                          <TextInput
                            value={minOrderValueState}
                            onChangeText={setMinOrderValueState}
                            keyboardType="numeric"
                            placeholder="99"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View className="h-px bg-slate-200/10" />

                        {/* Operating Hours */}
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Store Open Hour (24h) *</Text>
                            <TextInput
                              value={storeOpenHourState}
                              onChangeText={setStoreOpenHourState}
                              keyboardType="numeric"
                              placeholder="7"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Store Close Hour (24h) *</Text>
                            <TextInput
                              value={storeCloseHourState}
                              onChangeText={setStoreCloseHourState}
                              keyboardType="numeric"
                              placeholder="23"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                        </View>

                        <View className="h-px bg-slate-200/10" />

                        {/* Holiday Calendar */}
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Holiday Dates (comma-separated YYYY-MM-DD)</Text>
                          <TextInput
                            value={holidaysState}
                            onChangeText={setHolidaysState}
                            placeholder="e.g. 2026-01-26, 2026-08-15"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View className="h-px bg-slate-200/10" />

                        {/* Surge Multiplier */}
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Surge Price Multiplier (e.g. 1.2 for 20% extra) *</Text>
                          <TextInput
                            value={surgeMultiplierState}
                            onChangeText={setSurgeMultiplierState}
                            keyboardType="numeric"
                            placeholder="1.0"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>
                      </View>

                      {/* Category status configuration */}
                      {categories.length > 0 && (
                        <View className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-2">
                          <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs mb-3">🏪 Category-Wise Status (Open/Closed)</Text>
                          <View className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-850/60 gap-4">
                            {categories.map((cat) => (
                              <View key={cat.id} className="flex-row justify-between items-center">
                                <View className="flex-1 pr-4">
                                  <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs">{cat.name}</Text>
                                  <Text className="text-slate-500 text-[8px] font-semibold mt-0.5">slug: {cat.slug}</Text>
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

                  {/* SUB-TAB 2: BRANDING */}
                  {settingsSubTab === 'cosmetics' && (
                    <View className="gap-4">
                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Deliveries Counter *</Text>
                        <TextInput
                          value={deliveriesCount}
                          onChangeText={setDeliveriesCount}
                          placeholder="e.g. 10,000+"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Store Rating *</Text>
                        <TextInput
                          value={ratingValue}
                          onChangeText={setRatingValue}
                          placeholder="e.g. 4.8"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Happy Families Counter *</Text>
                        <TextInput
                          value={happyFamilies}
                          onChangeText={setHappyFamilies}
                          placeholder="e.g. 5,000+"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Social Proof Strip Text *</Text>
                        <TextInput
                          value={trustedText}
                          onChangeText={setTrustedText}
                          placeholder="e.g. ✨ Trusted by 5,000+ families in your town"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-white font-semibold text-xs"
                        />
                      </View>

                      {/* Live Ticker Settings */}
                      <View className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-2 gap-4">
                        <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs mb-1">⚡ Live Speed Ticker Strip Settings</Text>
                        
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Average Delivery Time *</Text>
                          <TextInput
                            value={avgDeliveryTime}
                            onChangeText={setAvgDeliveryTime}
                            placeholder="e.g. 8 min"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Delivered Today Counter *</Text>
                          <TextInput
                            value={deliveredToday}
                            onChangeText={setDeliveredToday}
                            placeholder="e.g. 1,231+"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Fresh Stock Loaded Indicator *</Text>
                          <TextInput
                            value={freshStockLoaded}
                            onChangeText={setFreshStockLoaded}
                            placeholder="e.g. 2 hrs ago"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>
                      </View>

                      {/* Live Preview section */}
                      <View className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-2 gap-3">
                        <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs">👀 Live Preview (Home Banners)</Text>
                        
                        {/* Stats Bar Preview */}
                        <View className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl items-center">
                          <Text className="text-slate-500 font-bold text-[8px] uppercase tracking-widest mb-2.5">Home page Stats Bar</Text>
                          <View className="flex-row items-center justify-center gap-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl px-3 w-full">
                            <View className="flex-row items-center gap-1">
                              <Package size={12} color="#6366f1" />
                              <Text className="text-white font-black text-[10px]">{deliveriesCount}</Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium">Deliveries</Text>
                            </View>
                            <View className="h-3 w-px bg-slate-800" />
                            <View className="flex-row items-center gap-1">
                              <Star size={12} color="#fbbf24" fill="#fbbf24" />
                              <Text className="text-white font-black text-[10px]">{ratingValue}★</Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium">Rating</Text>
                            </View>
                            <View className="h-3 w-px bg-slate-800" />
                            <View className="flex-row items-center gap-1">
                              <Heart size={12} color="#ec4899" fill="#ec4899" />
                              <Text className="text-white font-black text-[10px]">{happyFamilies}</Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-medium">Families</Text>
                            </View>
                          </View>
                        </View>

                        {/* Social Proof Strip Preview */}
                        <View className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl items-center">
                          <Text className="text-slate-500 font-bold text-[8px] uppercase tracking-widest mb-2.5">Footer Social Proof Bar</Text>
                          <View className="bg-white py-2 rounded-xl w-full items-center justify-center border border-slate-200 dark:border-zinc-850">
                            <Text className="text-[10px] font-black text-rose-600 px-4 text-center">
                              {trustedText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* SUB-TAB: GREETINGS */}
                  {settingsSubTab === 'greetings' && (
                    <View className="gap-4">
                      {/* Greetings Time Sub-Tab Switcher (Horizontal Slider) */}
                      <View className="mb-2">
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
                                className={`px-4 py-2 rounded-full border active:scale-95 transition-all flex-row items-center gap-1.5 ${
                                  isActive 
                                    ? 'bg-indigo-600 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400 shadow-sm' 
                                    : 'bg-slate-50 border-slate-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/80'
                                }`}
                              >
                                <Text className={`text-[10px] font-black uppercase tracking-wider ${
                                  isActive ? 'text-white' : 'text-slate-600 dark:text-zinc-400'
                                }`}>
                                  {timeTab.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Closed Greeting Settings */}
                      {greetingsSubTab === 'closed' && (
                        <View className="gap-4">
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Closed Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingClosed}
                              onChangeText={setHeroGreetingClosed}
                              placeholder="We're resting right now 💤"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Closed Greeting Subtitle *</Text>
                            <TextInput
                              value={heroSubtitleClosed}
                              onChangeText={setHeroSubtitleClosed}
                              multiline
                              numberOfLines={3}
                              placeholder="FastKirana Cafe & Mart are resting..."
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[80px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Morning Greeting Settings */}
                      {greetingsSubTab === 'morning' && (
                        <View className="gap-4">
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Morning Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingMorning}
                              onChangeText={setHeroGreetingMorning}
                              placeholder="Good morning, let's get breakfast! 🌅"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleMorningMartClosed}
                              onChangeText={setHeroSubtitleMorningMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleMorningCafeClosed}
                              onChangeText={setHeroSubtitleMorningCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleMorningBothOpen}
                              onChangeText={setHeroSubtitleMorningBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Afternoon Greeting Settings */}
                      {greetingsSubTab === 'afternoon' && (
                        <View className="gap-4">
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Afternoon Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingAfternoon}
                              onChangeText={setHeroGreetingAfternoon}
                              placeholder="Good afternoon! Ready for lunch? 🍛"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonMartClosed}
                              onChangeText={setHeroSubtitleAfternoonMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonCafeClosed}
                              onChangeText={setHeroSubtitleAfternoonCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleAfternoonBothOpen}
                              onChangeText={setHeroSubtitleAfternoonBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Evening Greeting Settings */}
                      {greetingsSubTab === 'evening' && (
                        <View className="gap-4">
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Evening Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingEvening}
                              onChangeText={setHeroGreetingEvening}
                              placeholder="It's snack o'clock! Tea & snacks are ready ☕"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleEveningMartClosed}
                              onChangeText={setHeroSubtitleEveningMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleEveningCafeClosed}
                              onChangeText={setHeroSubtitleEveningCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleEveningBothOpen}
                              onChangeText={setHeroSubtitleEveningBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}

                      {/* Night Greeting Settings */}
                      {greetingsSubTab === 'night' && (
                        <View className="gap-4">
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Night Greeting Title *</Text>
                            <TextInput
                              value={heroGreetingNight}
                              onChangeText={setHeroGreetingNight}
                              placeholder="Late night cravings? We got you! 🌙"
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Closed, Cafe Open) *</Text>
                            <TextInput
                              value={heroSubtitleNightMartClosed}
                              onChangeText={setHeroSubtitleNightMartClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Mart Open, Cafe Closed) *</Text>
                            <TextInput
                              value={heroSubtitleNightCafeClosed}
                              onChangeText={setHeroSubtitleNightCafeClosed}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View>
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle (Both Open) *</Text>
                            <TextInput
                              value={heroSubtitleNightBothOpen}
                              onChangeText={setHeroSubtitleNightBothOpen}
                              multiline
                              numberOfLines={2}
                              placeholderTextColor="#475569"
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[60px]"
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* SUB-TAB 3: FINANCIALS */}
                  {settingsSubTab === 'finance' && (
                    <View className="gap-4">
                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">GST/Tax Rate (%) *</Text>
                        <TextInput
                          value={taxRate}
                          onChangeText={setTaxRate}
                          keyboardType="numeric"
                          placeholder="e.g. 5"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Miscellaneous Fee (₹) *</Text>
                        <TextInput
                          value={miscFee}
                          onChangeText={setMiscFee}
                          keyboardType="numeric"
                          placeholder="e.g. 0"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      <View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Miscellaneous Fee Label *</Text>
                        <TextInput
                          value={miscFeeLabel}
                          onChangeText={setMiscFeeLabel}
                          placeholder="e.g. Packaging Charge"
                          placeholderTextColor="#475569"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>

                      {/* Cloudinary configs */}
                      <View className="border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-2 gap-4">
                        <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs mb-1">☁️ Cloudinary Configurations (Image Uploads)</Text>
                        
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Cloudinary Cloud Name</Text>
                          <TextInput
                            value={cloudinaryCloudName}
                            onChangeText={setCloudinaryCloudName}
                            placeholder="your_cloud_name"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>

                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Cloudinary Upload Preset (Unsigned)</Text>
                          <TextInput
                            value={cloudinaryUploadPreset}
                            onChangeText={setCloudinaryUploadPreset}
                            placeholder="unsigned_preset"
                            placeholderTextColor="#475569"
                            className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-xs"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Save Settings Trigger Button */}
                  <Pressable
                    onPress={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-indigo-600 rounded-xl py-3.5 items-center mt-4 active:bg-indigo-700 flex-row justify-center gap-2"
                  >
                    {isSavingSettings ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    )}
                    <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">
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
          <View className="gap-6">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-5 shadow-sm">
              <Text className="text-slate-900 dark:text-white font-black text-base mb-1">New Push Broadcast</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mb-5">Compose and broadcast instant alert campaigns to customer mobile apps.</Text>

              {/* Segment Targeting Selector */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-2">Target Customer Segment</Text>
                <View className="flex-row gap-2">
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
                        className={`flex-1 py-2 rounded-xl border items-center justify-center ${
                          isSelected 
                            ? 'bg-rose-500/10 border-rose-500' 
                            : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-zinc-850'
                        }`}
                      >
                        <Text className={`text-[10px] font-extrabold ${isSelected ? 'text-rose-600 dark:text-rose-450' : 'text-slate-500 dark:text-slate-400'}`}>
                          {seg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Title input */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Broadcast Title</Text>
                <TextInput
                  value={pushTitle}
                  onChangeText={setPushTitle}
                  placeholder="e.g. ⚡ Flash Deal Alert!"
                  placeholderTextColor="#475569"
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-white font-semibold text-xs"
                />
              </View>

              {/* Body message input */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Message Description</Text>
                <TextInput
                  value={pushBody}
                  onChangeText={setPushBody}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g. Get 20% discount on fresh mangoes for the next 1 hour. Apply code FRUIT20 at checkout."
                  placeholderTextColor="#475569"
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-white font-semibold text-xs min-h-[80px] text-left"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Scheduled Broadcast Time */}
              <View className="mb-5">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Scheduled Time (Optional YYYY-MM-DD HH:MM)</Text>
                <TextInput
                  value={pushScheduledTime}
                  onChangeText={setPushScheduledTime}
                  placeholder="e.g. 2026-07-06 18:30 (leave blank for instant)"
                  placeholderTextColor="#475569"
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-white font-semibold text-xs"
                />
              </View>

              {/* Send button */}
              <Pressable
                onPress={handleSendBroadcast}
                disabled={isBroadcasting}
                className="bg-rose-600 rounded-xl py-3.5 items-center active:bg-rose-700 flex-row justify-center gap-2"
              >
                {isBroadcasting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Sparkles size={13} color="#fff" />
                )}
                <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">
                  {isBroadcasting ? 'Broadcasting Alert...' : 'Broadcast Push Notification'}
                </Text>
              </Pressable>
            </View>

            {/* Broadcast Log */}
            <View>
              <Text className="text-slate-900 dark:text-white font-black text-sm mb-3">Broadcast History Logs</Text>
              {pastNotifications.length === 0 ? (
                <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-6 items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs text-center">No notifications sent through this portal yet.</Text>
                </View>
              ) : (
                <View className="gap-3 mb-10">
                  {pastNotifications.map((noti, idx) => (
                    <View key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-4 shadow-xs">
                      <View className="flex-row justify-between items-center mb-1.5">
                        <Text className="text-slate-900 dark:text-white font-black text-xs">{noti.title}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold">
                          {noti.sentAt ? new Date(noti.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </Text>
                      </View>
                      <Text className="text-slate-650 dark:text-slate-300 text-xs leading-4">{noti.body}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ------------------- COUPONS TAB WORKSPACE ------------------- */}
        {activeTab === 'COUPONS' && (
          <View className="gap-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-slate-900 dark:text-white font-black text-base">Discount Codes</Text>
              <Pressable
                onPress={() => {
                  setNewCouponCode('');
                  setNewCouponValue('');
                  setNewCouponMinOrder('');
                  setNewCouponMaxUses('');
                  setIsCouponModalVisible(true);
                  triggerHaptic('light');
                }}
                className="bg-indigo-650 px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 active:bg-indigo-750"
              >
                <Ticket size={13} color="#fff" />
                <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">New Coupon</Text>
              </Pressable>
            </View>

            {isCouponsLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : coupons.length === 0 ? (
              <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-6 items-center">
                <Text className="text-slate-500 dark:text-slate-400 text-xs text-center">No coupon codes registered in database.</Text>
              </View>
            ) : (
              <View className="gap-3 mb-10">
                {coupons.map((c) => (
                  <View key={c.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-4 shadow-xs flex-row justify-between items-center gap-3">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2">
                        <View className="bg-purple-950/30 border border-purple-900/40 px-2 py-0.5 rounded-lg">
                          <Text className="text-purple-400 font-black text-xs tracking-wider">{c.code}</Text>
                        </View>
                        <Text className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">
                          {c.discountType === 'PERCENT' ? `${c.value}% OFF` : `Flat ${formatPrice(c.value)} OFF`}
                        </Text>
                      </View>
                      
                      <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-2 uppercase tracking-wide">
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
            <View className="flex-row justify-between gap-3 mb-6 bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-850">
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{pickerPendingOrders.length}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Pending Jobs</Text>
              </View>
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{activePickingOrder ? 1 : 0}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Active Picking</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-indigo-400 font-black text-lg">{todayPacked}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Packed Today</Text>
              </View>
            </View>
            {activePickingOrder ? (
              // Active picking checklist overlay layout (Slate-Dark Redesign)
              <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-5 shadow-lg mb-10">
                <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4">
                  <View>
                    <Text className="text-slate-900 dark:text-white font-black text-sm uppercase">Picking Order #{activePickingOrder.id.slice(-6).toUpperCase()}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-1">Customer: {activePickingOrder.user.name}</Text>
                  </View>
                  <Pressable 
                    onPress={cancelActivePicking}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700/60 active:bg-slate-700/60"
                  >
                    <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">Cancel</Text>
                  </Pressable>
                </View>

                {/* Scan Barcode Simulation Box (Dark-Slate) */}
                <View className="flex-row gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-850 items-center mb-5">
                  <Barcode size={16} color="#6366f1" />
                  <TextInput
                    placeholder="Scan product barcode (simulate by typing)..."
                    placeholderTextColor="#64748b"
                    value={barcodeQuery}
                    onChangeText={setBarcodeQuery}
                    onSubmitEditing={scanBarcodeProduct}
                    className="flex-1 text-slate-800 dark:text-white text-xs font-semibold p-0"
                  />
                  <Pressable 
                    onPress={scanBarcodeProduct}
                    className="bg-indigo-600 px-3.5 py-1.5 rounded-lg active:bg-indigo-700"
                  >
                    <Text className="text-white font-extrabold text-[9px] uppercase">Scan</Text>
                  </Pressable>
                </View>

                {/* Products Checklist (Aisle-Optimized Sorting & Slate-Dark Style) */}
                <Text className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider mb-3">Checklist by Location</Text>
                <View className="gap-2.5">
                  {[...activePickingOrder.items]
                    .sort((a, b) => getItemAisle(a).localeCompare(getItemAisle(b)))
                    .map((item) => {
                      const picked = pickedQuantities[item.id] || 0;
                      const max = item.quantity;
                      const aisle = getItemAisle(item);
                      const isDone = picked === max;

                      return (
                        <View key={item.id} className={`p-3.5 rounded-xl border flex-row justify-between items-center gap-3 ${
                          isDone 
                            ? 'bg-slate-50 dark:bg-slate-950/30 border-slate-100 dark:border-zinc-800/80 opacity-70' 
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-100 dark:border-zinc-800'
                        }`}>
                          <View className="flex-1 pr-2">
                            <Text className={`text-xs font-bold leading-tight ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
                              {item.name}
                            </Text>
                            <Text className="text-indigo-400 text-[9px] font-black mt-1 uppercase tracking-wider">{aisle}</Text>
                          </View>
                          
                          <View className="flex-row items-center gap-2">
                            {isDone ? (
                              <View className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex-row items-center gap-1">
                                <CheckCircle size={10} color="#10b981" />
                                <Text className="text-emerald-400 font-black text-[9px] uppercase">{max}/{max}</Text>
                              </View>
                            ) : (
                              <View className="flex-row items-center bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-850">
                                <Pressable 
                                  onPress={() => resetItemPicker(item.id)}
                                  className="px-2"
                                >
                                  <Text className="text-slate-500 dark:text-slate-400 font-black text-xs">↺</Text>
                                </Pressable>
                                <Text className="px-1.5 text-slate-900 dark:text-white font-black text-xs">{picked}/{max}</Text>
                                <Pressable 
                                  onPress={() => manualPickOne(item.id, max)}
                                  className="bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/80 active:bg-slate-700 ml-1.5"
                                >
                                  <Text className="text-white font-black text-[10px] uppercase">+1</Text>
                                </Pressable>
                                <Pressable 
                                  onPress={() => manualPickAll(item.id, max)}
                                  className="bg-indigo-600 px-3 py-1.5 rounded-md active:bg-indigo-750 ml-1.5"
                                >
                                  <Text className="text-white font-extrabold text-[10px] uppercase">All</Text>
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
                  className="bg-indigo-600 py-3.5 rounded-2xl items-center mt-6 active:bg-indigo-700 shadow-md"
                >
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Pack & Complete Order</Text>
                </Pressable>
              </View>
            ) : (
              // Order queue list (Slate-Dark Redesign)
              <View>
                <Text className="text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-wider mb-3">Picker Pending Jobs</Text>
                {pickerPendingOrders.length === 0 ? (
                  <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-8 items-center">
                    <Text className="text-4xl">📭</Text>
                    <Text className="text-slate-900 dark:text-white font-black text-sm mt-3">No orders waiting for pickers</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center max-w-[240px]">New orders placed by customers will chime here automatically.</Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    {pickerPendingOrders.map((ord) => (
                      <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-4 shadow-sm">
                        <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-3">
                          <View>
                            <Text className="text-slate-900 dark:text-white font-black text-sm uppercase">Order #{ord.id.slice(-6).toUpperCase()}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1">Order Items: {ord.items.length} Items • {ord.deliveryMethod}</Text>
                          </View>
                          <View className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                            <Text className="text-amber-400 font-extrabold text-[8px] uppercase tracking-wider">{ord.status}</Text>
                          </View>
                        </View>

                        {/* Customer & Items preview */}
                        <Text className="text-slate-650 dark:text-slate-300 text-xs font-semibold">User: {ord.user.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-1.5 truncate" numberOfLines={1}>
                          Items: {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                        </Text>

                        {/* Pick order action */}
                        <Pressable
                          onPress={() => startPicking(ord)}
                          className="bg-indigo-600 mt-4 py-3 rounded-2xl flex-row items-center justify-center gap-2 active:bg-indigo-700 shadow-sm"
                        >
                          <Play size={10} color="#fff" fill="#fff" />
                          <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Start Picking Checklist</Text>
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
            <View className="flex-row justify-between gap-3 mb-6 bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-850">
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{todayDeliveries}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Delivered</Text>
              </View>
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{riderActiveDeliveries.length}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Active Run</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-emerald-400 font-black text-lg">{formatPrice(codCollected)}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">COD Cash</Text>
              </View>
            </View>

            {/* Active Shipments Route (Slate-Dark Redesign) */}
            {riderActiveDeliveries.length > 0 && (
              <View className="mb-6">
                <Text className="text-slate-450 font-black text-xs uppercase tracking-wider mb-3">Rider Active Run ({riderActiveDeliveries.length})</Text>
                <View className="gap-3">
                  {riderActiveDeliveries.map((ord) => (
                    <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-4 shadow-sm">
                      <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-3">
                        <View>
                          <Text className="text-slate-900 dark:text-white font-black text-sm uppercase">Shipment #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1">Payment: {ord.paymentMethod} • {formatPrice(ord.total)}</Text>
                        </View>
                        <View className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                          <Text className="text-indigo-400 font-extrabold text-[8px] uppercase tracking-wider">Active</Text>
                        </View>
                      </View>

                      {/* Customer Address Details (Map coordinate Navigation deep-linking) */}
                      <View className="flex-row items-center justify-between gap-3 mb-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-zinc-850">
                        <View className="flex-row items-center gap-2 flex-1">
                          <MapPin size={12} color="#ef4444" />
                          <Text className="text-slate-650 dark:text-slate-300 text-xs font-semibold flex-1 leading-4">
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
                          className="bg-indigo-600/20 border border-indigo-500/40 px-2.5 py-1.5 rounded-lg active:bg-indigo-600/40"
                        >
                          <Text className="text-indigo-400 font-extrabold text-[9px] uppercase">Navigate</Text>
                        </Pressable>
                      </View>

                      <View className="flex-row items-center gap-2 mb-4">
                        <Phone size={12} color="#94a3b8" />
                        <Text className="text-slate-650 dark:text-slate-300 text-xs font-bold">{ord.user.name} ({ord.user.phone})</Text>
                      </View>

                      {activeGpsSimulations[ord.id] && (
                        <View className="flex-row items-center gap-2 mb-4 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                          <ActivityIndicator size="small" color="#10b981" />
                          <View className="flex-1">
                            <Text className="text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
                              GPS Simulating route
                            </Text>
                            <Text className="text-slate-650 dark:text-slate-300 text-[8px] font-semibold mt-0.5">
                              Step {activeGpsSimulations[ord.id].step}/{activeGpsSimulations[ord.id].totalSteps} • ({activeGpsSimulations[ord.id].lat.toFixed(4)}, {activeGpsSimulations[ord.id].lng.toFixed(4)})
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Deliver proof confirmation swipe action look-alike slider */}
                      <View className="relative bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-2xl flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 pl-3">
                          <Check size={14} color="#10b981" />
                          <Text className="text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">Ready to complete drop?</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            triggerHaptic('success');
                            initiateConfirmDelivery(ord);
                          }}
                          className="bg-emerald-600 px-4 py-2.5 rounded-xl active:bg-emerald-700"
                        >
                          <Text className="text-white font-black text-[9px] uppercase tracking-wider">Confirm Drop</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pickup queue from Picker Packing (Slate-Dark Redesign) */}
            <Text className="text-slate-455 font-black text-xs uppercase tracking-wider mb-3">Rider Pickup Queue ({riderQueueOrders.length})</Text>
            {riderQueueOrders.length === 0 ? (
              <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-8 items-center">
                <Text className="text-4xl">📦</Text>
                <Text className="text-slate-900 dark:text-white font-black text-sm mt-3">No shipments ready for pickup</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center max-w-[240px]">Riders wait here. Pickers auto-pack orders to dispatch them here.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {riderQueueOrders.map((ord) => (
                  <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-4 shadow-sm">
                    <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-3">
                      <View>
                        <Text className="text-slate-900 dark:text-white font-black text-sm uppercase">Order #{ord.id.slice(-6).toUpperCase()}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1">{ord.address.area} • {formatPrice(ord.total)}</Text>
                      </View>
                      <View className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <Text className="text-emerald-400 font-extrabold text-[8px] uppercase tracking-wider">Ready</Text>
                      </View>
                    </View>

                    {/* Customer & Address Details */}
                    <Text className="text-slate-650 dark:text-slate-300 text-xs font-semibold">User: {ord.user.name}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-1.5">To: {ord.address.houseNo}, {ord.address.street}, {ord.address.area}</Text>

                    {/* Accept pickup dispatch action */}
                    <Pressable
                      onPress={() => acceptShipment(ord)}
                      className="bg-indigo-600 mt-4 py-3 rounded-2xl flex-row items-center justify-center gap-1.5 active:bg-indigo-700 shadow-sm"
                    >
                      <Truck size={12} color="#fff" />
                      <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Accept Rider Pickup</Text>
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
            <View className="flex-row justify-between gap-3 mb-6 bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-850">
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{pendingCafeOrders.filter(o => o.status === 'PENDING').length}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Queue Jobs</Text>
              </View>
              <View className="flex-1 items-center border-r border-slate-100 dark:border-zinc-800">
                <Text className="text-slate-900 dark:text-white font-black text-lg">{pendingCafeOrders.filter(o => o.status === 'CONFIRMED').length}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Cooking</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-rose-400 font-black text-lg">{todayPrepared}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mt-0.5">Prepared Today</Text>
              </View>
            </View>
            <Text className="text-slate-450 font-black text-xs uppercase tracking-wider mb-3">Cafe Kitchen Cooking Queue</Text>
            
            {/* Bulk Prepare Aggregated List (Dark-Slate) */}
            {aggregatedPrepItems.length > 0 && (
              <View className="mb-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3.5 shadow-sm">
                <Text className="text-orange-400 font-black text-[9px] uppercase tracking-wider mb-2.5">🧑‍🍳 Kitchen Prep Summary (Bulk Prepare)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 py-0.5">
                  {aggregatedPrepItems.map((item, idx) => (
                    <View key={idx} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 flex-row items-center gap-2 shadow-xs">
                      <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-[10px]">{item.name}</Text>
                      <View className="bg-orange-500/20 px-2 py-0.5 rounded-lg">
                        <Text className="text-orange-400 font-black text-[9px]">x{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {pendingCafeOrders.length === 0 ? (
              <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-850 p-8 items-center">
                <Text className="text-4xl">🍳</Text>
                <Text className="text-slate-900 dark:text-white font-black text-sm mt-3">No cafe items pending cooking</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center max-w-[240px]">Cafe orders placed on the customer app sync instantly to the chef console.</Text>
              </View>
            ) : (
              <View className="gap-3.5 mb-10">
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
                    <View key={ord.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-3xl gap-3">
                      <View className="flex-row justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-3 mb-1">
                        <View>
                          <Text className="text-slate-900 dark:text-white font-black text-sm uppercase">Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1">Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        
                        {/* SLA Cooking Timer indicator */}
                        <View className={`${slaBgStyle} px-2.5 py-1 rounded-lg flex-row items-center gap-1`}>
                          <Text className={`${slaTextStyle} font-black text-[9px] uppercase tracking-wider`}>
                            {isPending ? 'Queue' : 'Cooking'} • {orderAgeMins}m
                          </Text>
                        </View>
                      </View>

                      {isPending ? (
                        <View>
                          <Text className="text-slate-500 dark:text-slate-400 font-black text-[9px] uppercase tracking-wider mb-2">Items Preview</Text>
                          <View className="gap-2 opacity-75 mb-4">
                            {cafeItems.map((item) => (
                              <View key={item.id} className="flex-row justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-slate-950/40">
                                <View className="flex-1 pr-2">
                                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</Text>
                                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-1">Quantity: x{item.quantity}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                          <Pressable
                            onPress={() => startPreparingChef(ord)}
                            className="bg-rose-600 py-3 rounded-2xl flex-row items-center justify-center gap-2 active:bg-rose-700 shadow-sm"
                          >
                            <ChefHat size={14} color="#fff" />
                            <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Accept & Start Cooking</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View>
                          {/* Cooking Items checklist */}
                          <Text className="text-slate-500 dark:text-slate-400 font-black text-[9px] uppercase tracking-wider mb-2">Items to Cook</Text>
                          <View className="gap-2">
                            {cafeItems.map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={() => markChefItemReady(ord.id, item.id)}
                                className={`flex-row justify-between items-center p-3 rounded-xl border ${
                                  item.cooked 
                                    ? 'bg-emerald-500/10 border-emerald-500/25' 
                                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-zinc-800'
                                }`}
                              >
                                <View className="flex-1 pr-2">
                                  <Text className={`text-xs font-bold ${item.cooked ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {item.name}
                                  </Text>
                                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-1">Quantity: x{item.quantity}</Text>
                                </View>

                                <View className={`w-6 h-6 rounded-full items-center justify-center ${
                                  item.cooked ? 'bg-emerald-600' : 'bg-slate-800'
                                }`}>
                                  {item.cooked ? (
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                  ) : (
                                    <Text className="text-[10px] font-black text-slate-500 dark:text-slate-400">+</Text>
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
          <View className="px-4 py-4">
            {/* Reviews list */}
            {isReviewsLoading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-3">Loading product reviews...</Text>
              </View>
            ) : reviewsList.length === 0 ? (
              <View className="py-20 items-center justify-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6">
                <Text className="text-4xl mb-3">⭐</Text>
                <Text className="text-slate-900 dark:text-white font-black text-sm">No Reviews Yet</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] text-center mt-1">
                  Customers have not left any feedback ratings on products yet.
                </Text>
              </View>
            ) : (
              <View className="gap-3 mb-10">
                {reviewsList.map((item) => {
                  const ratingStars = '⭐'.repeat(item.rating);
                  return (
                    <View
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3"
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-2">
                          {/* Rating and product */}
                          <Text className="text-amber-400 font-black text-xs tracking-wider">{ratingStars}</Text>
                          <Text className="text-slate-800 dark:text-white font-extrabold text-xs mt-1">
                            Product: {item.product?.name || 'Unknown Item'}
                          </Text>
                        </View>
                        
                        {/* Delete Review button */}
                        <Pressable
                          onPress={() => handleDeleteReview(item.id)}
                          className="bg-red-650/15 border border-red-500/30 px-2 py-1 rounded-lg active:bg-red-600/30"
                        >
                          <Text className="text-red-500 font-black text-[9px] uppercase">Delete</Text>
                        </Pressable>
                      </View>

                      {/* Comment text */}
                      {item.comment ? (
                        <View className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                          <Text className="text-slate-650 dark:text-slate-300 text-xs italic leading-4">"{item.comment}"</Text>
                        </View>
                      ) : (
                        <Text className="text-slate-500 text-[11px] italic">No comment left</Text>
                      )}

                      {/* Customer details */}
                      <View className="flex-row justify-between items-center border-t border-slate-100 dark:border-zinc-800/80 pt-2">
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                          By: {item.user?.name || 'Anonymous'}
                        </Text>
                        <Text className="text-slate-500 text-[9px]">
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
          <View className="px-4 py-4">
            {/* Mode Toggle Header */}
            <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/60 dark:border-zinc-850 mb-4 gap-3.5 shadow-sm">
              <View className="flex-row bg-slate-50 dark:bg-zinc-955 p-1 rounded-full border border-slate-200/60 dark:border-zinc-850 gap-1">
                <Pressable
                  onPress={() => {
                    setHighlightMode('PINNED');
                    triggerHaptic('light');
                  }}
                  className={`flex-1 items-center py-2.5 rounded-full ${
                    highlightMode === 'PINNED'
                      ? 'bg-indigo-650 shadow-xs'
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-[10px] font-black uppercase tracking-wider ${highlightMode === 'PINNED' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    Pinned Highlights
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setHighlightMode('SEARCH');
                    triggerHaptic('light');
                  }}
                  className={`flex-1 items-center py-2.5 rounded-full ${
                    highlightMode === 'SEARCH'
                      ? 'bg-indigo-650 shadow-xs'
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-[10px] font-black uppercase tracking-wider ${highlightMode === 'SEARCH' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    Search & Pin Items
                  </Text>
                </Pressable>
              </View>

              {/* Sub-tabs for Pinned Highlights */}
              {highlightMode === 'PINNED' && (
                <View className="flex-row py-1 flex-wrap gap-2">
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
                      className={`px-4 py-2 rounded-full border flex-row items-center gap-1.5 ${
                        highlightType === typeObj.key
                          ? 'bg-indigo-600 border-indigo-500 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      <Text className={`text-[9.5px] font-black uppercase tracking-wider ${highlightType === typeObj.key ? 'text-white' : 'text-slate-550 dark:text-zinc-450'}`}>
                        {typeObj.label} ({typeObj.count})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Search Box when SEARCH mode is active */}
              {highlightMode === 'SEARCH' && (
                <View className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850 rounded-full px-4 h-11">
                  <Search size={15} color="#94a3b8" strokeWidth={2.5} />
                  <TextInput
                    placeholder="Search products to pin..."
                    placeholderTextColor="#64748b"
                    value={highlightSearchQuery}
                    onChangeText={setHighlightSearchQuery}
                    onSubmitEditing={handleHighlightsSearch}
                    returnKeyType="search"
                    className="flex-1 text-slate-800 dark:text-white text-xs ml-2.5 h-full p-0 font-bold"
                  />
                  {highlightSearchQuery.length > 0 && (
                    <Pressable onPress={() => setHighlightSearchQuery('')} className="bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-full">
                      <X size={12} color="#94a3b8" />
                    </Pressable>
                  )}
                  <Pressable 
                    onPress={handleHighlightsSearch}
                    className="bg-indigo-600 px-4 py-1.5 rounded-full ml-3 active:bg-indigo-750"
                  >
                    <Text className="text-white font-extrabold text-[9.5px] uppercase tracking-wider">Search</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Content Loader */}
            {isHighlightsLoading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-3">Loading highlights database...</Text>
              </View>
            ) : (
              <View className="gap-3.5 mb-10">
                {/* Mode Pinned List */}
                {highlightMode === 'PINNED' && (() => {
                  const activeList = highlightType === 'flash' 
                    ? flashDealsList 
                    : highlightType === 'toppicks' 
                      ? topPicksList 
                      : bestSellersList;
                      
                  if (activeList.length === 0) {
                    return (
                      <View className="py-20 items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                        <Text className="text-4xl mb-3">⚡</Text>
                        <Text className="text-slate-900 dark:text-white font-black text-sm">No Pinned Items</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] text-center mt-1">
                          No items pinned to this highlight category yet.
                        </Text>
                      </View>
                    );
                  }
                  
                  return activeList.map((item) => (
                    <View
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-4 rounded-3xl flex-row justify-between items-center shadow-sm"
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-950 items-center justify-center border border-slate-100 dark:border-zinc-800 mr-3 overflow-hidden shadow-xs">
                          {getAppImageSource(item.imageUrl) ? (
                            <Image 
                              source={getAppImageSource(item.imageUrl)!} 
                              className="w-full h-full"
                              contentFit="cover"
                            />
                          ) : (
                            <Text className="text-xl">{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-800 dark:text-white font-extrabold text-xs" numberOfLines={2}>{item.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wide">
                            ₹{item.price}  •  Stock: {item.stock}
                          </Text>
                        </View>
                      </View>
                      
                      <Pressable
                        onPress={() => toggleProductHighlight(item, highlightType)}
                        disabled={togglingHighlightId === `${item.id}-${highlightType}`}
                        className="bg-rose-50 dark:bg-rose-955/15 border border-rose-100 dark:border-rose-900/30 px-3 py-1.5 rounded-full active:bg-rose-100/50"
                      >
                        {togglingHighlightId === `${item.id}-${highlightType}` ? (
                          <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                          <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-[9px] uppercase tracking-wider">Remove</Text>
                        )}
                      </Pressable>
                    </View>
                  ));
                })()}

                {/* Mode Search List */}
                {highlightMode === 'SEARCH' && (() => {
                  if (highlightSearchProducts.length === 0) {
                    return (
                      <View className="py-20 items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                        <Text className="text-4xl mb-3">🔍</Text>
                        <Text className="text-slate-900 dark:text-white font-black text-sm">Find Items to Pin</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] text-center mt-1">
                          Search above to toggle storefront highlight promotions for any item.
                        </Text>
                      </View>
                    );
                  }
                  
                  return highlightSearchProducts.map((item) => (
                    <View
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-4 rounded-3xl gap-3.5 shadow-sm"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-950 items-center justify-center border border-slate-100 dark:border-zinc-800 mr-3 overflow-hidden shadow-xs">
                          {getAppImageSource(item.imageUrl) ? (
                            <Image 
                              source={getAppImageSource(item.imageUrl)!} 
                              className="w-full h-full"
                              contentFit="cover"
                            />
                          ) : (
                            <Text className="text-xl">{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-800 dark:text-white font-extrabold text-xs" numberOfLines={2}>{item.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wide">
                            ₹{item.price}  •  Stock: {item.stock}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Grid of Toggle Badges */}
                      <View className="flex-row gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                        {/* Flash Deals Button */}
                        <Pressable
                          onPress={() => toggleProductHighlight(item, 'flash')}
                          disabled={togglingHighlightId === `${item.id}-flash`}
                          className={`flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isFlashDeal 
                              ? 'bg-rose-50 dark:bg-rose-955/15 border-rose-200 dark:border-rose-900/30' 
                              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <Text className={`text-[8.5px] font-black uppercase tracking-wider ${item.isFlashDeal ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
                          className={`flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isTopPick 
                              ? 'bg-amber-50 dark:bg-amber-955/15 border-amber-200 dark:border-amber-900/30' 
                              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <Text className={`text-[8.5px] font-black uppercase tracking-wider ${item.isTopPick ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
                          className={`flex-1 py-2 rounded-full border items-center justify-center flex-row gap-1 ${
                            item.isBestSeller 
                              ? 'bg-emerald-50 dark:bg-emerald-955/15 border-emerald-200 dark:border-emerald-900/30' 
                              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <Text className={`text-[8.5px] font-black uppercase tracking-wider ${item.isBestSeller ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
            <View className="px-4 py-4 gap-6">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-slate-900 dark:text-white font-black text-base">Real-time Operations</Text>
                <Pressable 
                  onPress={fetchLiveopsData} 
                  disabled={isLiveopsLoading}
                  className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 active:bg-indigo-600/20"
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
                  <View key={i} className={`border rounded-2xl p-4 w-28 items-center ${stat.color} bg-white dark:bg-zinc-900`}>
                    <Text className="text-[8px] font-extrabold uppercase tracking-wider opacity-80">{stat.label}</Text>
                    <Text className="text-lg font-black mt-1 text-slate-800 dark:text-white">{stat.count}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Speed meters */}
              <View className="gap-3">
                {[
                  { label: 'Avg Picking Speed', value: avgPickTime, desc: 'Grocery confirm to pack duration', icon: ShoppingBag, color: 'text-blue-400' },
                  { label: 'Avg Cafe Prep Speed', value: avgPrepTime, desc: 'Cafe preparation time duration', icon: Utensils, color: 'text-orange-400' },
                  { label: 'Avg Rider Dispatch Time', value: avgDeliveryTime, desc: 'Transit duration store to door', icon: Clock, color: 'text-rose-400' },
                ].map((meter, i) => {
                  const Icon = meter.icon;
                  return (
                    <View key={i} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex-row justify-between items-center">
                      <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center">
                          <Icon size={16} className={meter.color} />
                        </View>
                        <View>
                          <Text className="text-slate-800 dark:text-slate-800 dark:text-white font-extrabold text-xs">{meter.label}</Text>
                          <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">{meter.desc}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-900 dark:text-white font-black text-base">{meter.value || '—'}</Text>
                        <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-wider">mins</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* SLA Alerts */}
              <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 gap-3">
                <Text className="text-slate-900 dark:text-white font-black text-xs">SLA Alert Stream</Text>
                {delayedOrders.length === 0 ? (
                  <Text className="text-[10px] text-slate-500 dark:text-slate-500 dark:text-slate-400 text-center py-6">All orders are running well within their SLA (10m Grocery / 30m Cafe).</Text>
                ) : (
                  <View className="gap-2">
                    {delayedOrders.map((order, i) => {
                      const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                      return (
                        <View key={i} className="flex-row justify-between items-center p-3 rounded-xl border border-rose-500/10 bg-rose-500/5">
                          <View>
                            <Text className="text-xs font-bold text-rose-400">Order #{order.id.slice(-6).toUpperCase()}</Text>
                            <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-0.5 uppercase">
                              {order.status} • {order.userName || order.userEmail || 'Customer'}
                            </Text>
                          </View>
                          <View className="rounded-full bg-rose-500/15 border border-rose-500/35 px-2.5 py-1">
                            <Text className="text-[9px] font-black text-rose-500 uppercase">{elapsed}m delay</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Active Shopping Carts Tracker */}
              <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 gap-3">
                <View className="flex-row justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800/50">
                  <View>
                    <Text className="text-slate-900 dark:text-white font-black text-xs flex-row items-center">
                      Active Shopping Carts{" "}
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5" />
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">
                      Real-time view of customer shopping carts
                    </Text>
                  </View>
                  <Text className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                    {activeCartsCount} Active
                  </Text>
                </View>

                {activeCarts.length === 0 ? (
                  <Text className="text-[10px] text-slate-500 dark:text-slate-500 dark:text-slate-400 text-center py-6">
                    No active customer shopping carts in the last 12 hours.
                  </Text>
                ) : (
                  <View className="gap-3">
                    {activeCarts.map((cart, idx) => {
                      const timeAgoMin = Math.floor((new Date().getTime() - new Date(cart.updatedAt).getTime()) / 60000);
                      let timeString = `${timeAgoMin}m ago`;
                      if (timeAgoMin === 0) timeString = 'Just now';
                      else if (timeAgoMin >= 60) {
                        const hours = Math.floor(timeAgoMin / 60);
                        timeString = `${hours}h ago`;
                      }

                      return (
                        <View key={cart.id || idx} className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/80 rounded-xl p-3 gap-2">
                          {/* Customer Info & Time */}
                          <View className="flex-row justify-between items-start">
                            <View className="flex-1 pr-2">
                              <Text className="text-slate-800 dark:text-slate-800 dark:text-white font-extrabold text-xs">{cart.userName}</Text>
                              <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[8px] font-semibold mt-0.5">
                                {cart.userPhone} • {cart.userEmail}
                              </Text>
                              {cart.address && (
                                <View className="flex-row items-center gap-1 mt-1">
                                  <MapPin size={10} color="#f43f5e" />
                                  <Text className="text-rose-500 dark:text-rose-400 text-[8px] font-bold flex-1" numberOfLines={1}>
                                    {cart.address}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-[8px] font-bold">{timeString}</Text>
                          </View>

                          {/* Items List */}
                          <View className="flex-row flex-wrap gap-1.5 py-1">
                            {cart.items.map((item: any, i: number) => (
                              <View key={i} className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800/50 rounded-lg px-2 py-0.5">
                                <Text className="text-slate-800 dark:text-white text-[9px] font-bold">
                                  {item.productName}
                                  {item.selectedVariant ? ` (${item.selectedVariant})` : ''}
                                </Text>
                                <Text className="text-rose-500 text-[9px] font-black ml-1.5">
                                  x{item.quantity}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Price & Action */}
                          <View className="flex-row justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800/50/60">
                            <View className="flex-row items-center gap-1">
                              <Text className="text-slate-450 text-[8px] font-bold uppercase">Total:</Text>
                              <Text className="text-slate-900 dark:text-white font-black text-xs">{formatPrice(cart.subtotal)}</Text>
                            </View>

                            <Pressable
                              onPress={() => handleOpenAlertModal(cart)}
                              disabled={isLoadingCarts}
                              className="bg-amber-500 active:bg-amber-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
                            >
                              <Text className="text-white text-[9px] font-black">🔔 Send Alert</Text>
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
          <View className="px-4 py-4 gap-4">
            {/* Sub-view Toggle Header */}
            <View className="flex-row bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-200 dark:border-zinc-805 gap-1 mb-2">
              <Pressable
                onPress={() => {
                  setCategorySubView('grocery');
                  triggerHaptic('light');
                }}
                className={`flex-1 items-center py-2.5 rounded-xl ${
                  categorySubView === 'grocery' ? 'bg-indigo-600 shadow' : 'bg-transparent'
                }`}
              >
                <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${categorySubView === 'grocery' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  📦 Grocery Categories
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCategorySubView('cafe');
                  triggerHaptic('light');
                }}
                className={`flex-1 items-center py-2.5 rounded-xl ${
                  categorySubView === 'cafe' ? 'bg-indigo-600 shadow' : 'bg-transparent'
                }`}
              >
                <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${categorySubView === 'cafe' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  ☕ Café Menu Sections
                </Text>
              </Pressable>
            </View>

            {categorySubView === 'grocery' ? (
              // Existing Categories View
              <View className="gap-4">
                {/* Clean, Simple Header Banner */}
                <View className="flex-row justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                  <View className="flex-1 pr-2">
                    <Text className="text-slate-900 dark:text-white font-extrabold text-sm">Store Categories</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-0.5">Control category grouping and weights.</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setShowAddCategory(!showAddCategory);
                      triggerHaptic('light');
                    }}
                    className="flex-row items-center gap-1.5 px-3 py-2 bg-indigo-600 rounded-xl shadow-sm"
                  >
                    <PlusCircle size={14} color="#fff" />
                    <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Add New</Text>
                  </Pressable>
                </View>

                {/* Add Category Form */}
                {showAddCategory && (
                  <View className="bg-white dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-850 rounded-2xl gap-3 animate-slide-up">
                    <Text className="text-slate-900 dark:text-white font-black text-xs">Add Category Details</Text>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Category Name *</Text>
                      <TextInput
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="e.g. Gourmet Sweets"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Image / Emoji Icon</Text>
                      <TextInput
                        value={newCategoryImageUrl}
                        onChangeText={setNewCategoryImageUrl}
                        placeholder="e.g. 🍫 or https://cloudinary.com/..."
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sort Order Weight</Text>
                      <TextInput
                        value={newCategorySortOrder}
                        onChangeText={setNewCategorySortOrder}
                        keyboardType="numeric"
                        placeholder="e.g. 9"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => setShowAddCategory(false)}
                        className="flex-1 border border-slate-200 dark:border-zinc-850 py-2.5 rounded-xl items-center"
                      >
                        <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreateCategory}
                        disabled={isCreatingCategory}
                        className="flex-1 bg-indigo-600 py-2.5 rounded-xl items-center justify-center flex-row"
                      >
                        {isCreatingCategory && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                        <Text className="text-white font-extrabold text-[10px] uppercase">Create</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Categories List */}
                {isCategoriesLoading ? (
                  <ActivityIndicator size="large" color="#6366f1" className="py-10" />
                ) : (
                  <View className="gap-2.5">
                    {categories.map((c) => (
                      <View key={c.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-850 p-3.5 rounded-2xl flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
                          {/* Soft circular icon container */}
                          <View className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 items-center justify-center border border-slate-200/60 dark:border-zinc-700 overflow-hidden">
                            {getAppImageSource(c.imageUrl) ? (
                              <Image source={getAppImageSource(c.imageUrl)!} className="w-full h-full" contentFit="cover" />
                            ) : (
                              <Text className="text-lg">{c.imageUrl || '📦'}</Text>
                            )}
                          </View>
                          <View className="flex-1 min-w-0 pr-2">
                            {/* Corrected Text Visibility & Styling */}
                            <Text className="text-slate-900 dark:text-white font-bold text-sm truncate">{c.name}</Text>
                            <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-0.5 uppercase tracking-wide truncate">
                              {c.slug} · weight: {c.sortOrder}
                            </Text>
                          </View>
                        </View>

                        {/* Modern Action Buttons */}
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => {
                              setEditingCategory(c);
                              triggerHaptic('light');
                            }}
                            className="p-2.5 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-750 active:bg-slate-100 dark:active:bg-zinc-700"
                          >
                            <Edit2 size={13} color={isDarkMode ? '#cbd5e1' : '#475569'} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteCategory(c.id)}
                            disabled={deletingCategoryId === c.id}
                            className="p-2.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-950/40"
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
              <View className="gap-4">
                {/* Clean, Simple Header Banner */}
                <View className="flex-row justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <View className="flex-1 pr-2">
                    <Text className="text-slate-900 dark:text-white font-extrabold text-sm">Café Menu Sections</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-0.5">Configure and reorder sections on Cafe storefront.</Text>
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
                      className="flex-row items-center gap-1.5 px-3 py-2 bg-indigo-600 rounded-xl shadow-sm"
                    >
                      <PlusCircle size={14} color="#fff" />
                      <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Add Section</Text>
                    </Pressable>
                  )}
                </View>

                {/* Add / Edit Café Section Form */}
                {(isAddingNewCafeSec || editingCafeSecIndex !== null) && (
                  <View className="bg-white dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-850 rounded-2xl gap-3">
                    <Text className="text-slate-900 dark:text-white font-black text-xs">
                      {isAddingNewCafeSec ? '✨ Add New Café Section' : '📝 Edit Café Section'}
                    </Text>
                    
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Section Title *</Text>
                      <TextInput
                        value={secTitle}
                        onChangeText={setSecTitle}
                        placeholder="e.g. Gourmet Sandwiches"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-805 dark:text-white font-semibold text-xs"
                      />
                    </View>

                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-2">
                        <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tag Slug (Unique) *</Text>
                        <TextInput
                          value={secTag}
                          onChangeText={setSecTag}
                          placeholder="e.g. sandwiches"
                          placeholderTextColor="#64748b"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-bold text-xs"
                        />
                      </View>
                      <View className="flex-1 gap-2">
                        <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Emoji Icon *</Text>
                        <TextInput
                          value={secEmoji}
                          onChangeText={setSecEmoji}
                          placeholder="e.g. 🥪"
                          placeholderTextColor="#64748b"
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-805 dark:text-white font-bold text-xs text-center"
                        />
                      </View>
                    </View>

                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Description / Subtitle</Text>
                      <TextInput
                        value={secDescription}
                        onChangeText={setSecDescription}
                        placeholder="e.g. Freshly grilled loaded sandwiches"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>

                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Match Product Tags (Comma-separated)</Text>
                      <TextInput
                        value={secMatchTags}
                        onChangeText={setSecMatchTags}
                        placeholder="e.g. sandwich, sandwiches"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>

                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => {
                          setIsAddingNewCafeSec(false);
                          setEditingCafeSecIndex(null);
                        }}
                        className="flex-1 border border-slate-200 dark:border-zinc-850 py-2.5 rounded-xl items-center"
                      >
                        <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase">Cancel</Text>
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
                          
                          const newSec = {
                            tag: cleanTag,
                            title: secTitle.trim(),
                            emoji: secEmoji.trim(),
                            description: secDescription.trim(),
                            matchTags: cleanMatchTags,
                          };

                          let updatedList = [...cafeMenuSections];
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
                        className="flex-1 bg-indigo-600 py-2.5 rounded-xl items-center"
                      >
                        <Text className="text-white font-extrabold text-[10px] uppercase">Apply</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Café Sections List */}
                {isCafeSectionsLoading ? (
                  <ActivityIndicator size="large" color="#6366f1" className="py-10" />
                ) : (
                  <View className="gap-2.5">
                    {cafeMenuSections.map((sec, idx) => (
                      <View key={sec.tag} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-850 p-3.5 rounded-2xl flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
                          {/* Soft rounded icon container */}
                          <View className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 items-center justify-center border border-slate-200/60 dark:border-zinc-700 overflow-hidden">
                            <Text className="text-lg">{sec.emoji || '☕'}</Text>
                          </View>
                          <View className="flex-1 min-w-0 pr-2">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text className="text-slate-900 dark:text-white font-bold text-sm truncate">{sec.title}</Text>
                              <View className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-1.5 py-0.5 rounded-md">
                                <Text className="text-indigo-600 dark:text-indigo-400 text-[8px] font-extrabold uppercase tracking-wider">#{sec.tag}</Text>
                              </View>
                            </View>
                            {sec.description ? (
                              <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-1 truncate">{sec.description}</Text>
                            ) : null}
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {/* Reordering controls */}
                          <View className="flex-row gap-1 border-r border-slate-100 dark:border-zinc-805 pr-2 mr-1">
                            <Pressable
                              disabled={idx === 0}
                              onPress={() => {
                                let copy = [...cafeMenuSections];
                                const [moved] = copy.splice(idx, 1);
                                copy.splice(idx - 1, 0, moved);
                                handleSaveCafeSections(copy);
                              }}
                              className={`p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 ${idx === 0 ? 'opacity-30' : 'active:bg-slate-100 dark:active:bg-zinc-800'}`}
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
                              className={`p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 ${idx === cafeMenuSections.length - 1 ? 'opacity-30' : 'active:bg-slate-100 dark:active:bg-zinc-800'}`}
                            >
                              <ArrowDown size={11} color="#94a3b8" />
                            </Pressable>
                          </View>

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
                            className="p-2.5 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-slate-750 active:bg-slate-100 dark:active:bg-zinc-700"
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
                            className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/25 active:bg-red-600/30"
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
                <View className="flex-1 bg-black/60 justify-center p-6">
                  <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-3xl p-6 gap-3">
                    <Text className="text-slate-900 dark:text-white font-black text-sm">Edit Category: {editingCategory.name}</Text>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Category Name</Text>
                      <TextInput
                        value={editingCategory.name}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, name: t })}
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Image / Icon</Text>
                      <TextInput
                        value={editingCategory.imageUrl}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, imageUrl: t })}
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="gap-2">
                      <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sort Order Weight</Text>
                      <TextInput
                        value={String(editingCategory.sortOrder)}
                        onChangeText={(t) => setEditingCategory({ ...editingCategory, sortOrder: t })}
                        keyboardType="numeric"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-semibold text-xs"
                      />
                    </View>
                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => setEditingCategory(null)}
                        className="flex-1 border border-slate-200 dark:border-zinc-850 py-2.5 rounded-xl items-center"
                      >
                        <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleUpdateCategory}
                        className="flex-1 bg-indigo-600 py-2.5 rounded-xl items-center"
                      >
                        <Text className="text-white font-extrabold text-[10px] uppercase">Save</Text>
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
          <View className="px-4 py-4 gap-4">
            <View className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-850 gap-3">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-slate-900 dark:text-white font-black text-sm">System Alerts</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-0.5">Critical inventory shortages and processing delays.</Text>
                </View>
                <Pressable
                  onPress={handleRecalculateAlerts}
                  disabled={isAlertsRefreshing}
                  className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl active:bg-indigo-600/20"
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
                    className={`px-3 py-1.5 rounded-lg border mr-1 flex-row items-center gap-1 ${
                      activeAlertSubTab === tabObj.key
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-slate-800/60 border-slate-700/40'
                    }`}
                  >
                    <Text className="text-[9px] font-black text-white uppercase">
                      {tabObj.label} ({tabObj.count || 0})
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {isAlertsLoading ? (
              <ActivityIndicator size="large" color="#6366f1" className="py-10" />
            ) : (
              <View className="gap-3">
                {alerts.filter(a => activeAlertSubTab === 'ALL' || a.alertType === activeAlertSubTab).map((item) => {
                  const isSnoozedKey = `${item.id}:${item.alertType}`;
                  return (
                    <View key={isSnoozedKey} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center border border-slate-700 mr-2.5 overflow-hidden">
                            {getAppImageSource(item.imageUrl) ? (
                              <Image source={getAppImageSource(item.imageUrl)!} className="w-full h-full" contentFit="cover" />
                            ) : (
                              <Text className="text-lg">{item.imageUrl || '📦'}</Text>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-800 dark:text-white font-extrabold text-xs" numberOfLines={2}>{item.name}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5 uppercase">
                              Stock: {item.stock} / Min: {item.minStock}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <View className={`rounded-full px-2 py-0.5 ${
                            item.alertType === 'OUT_OF_STOCK' || item.alertType === 'EXPIRED' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            <Text className={`text-[8px] font-black uppercase ${
                              item.alertType === 'OUT_OF_STOCK' || item.alertType === 'EXPIRED' ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {item.alertType.replace(/_/g, ' ')}
                            </Text>
                          </View>
                          {item.expiryDate && (
                            <Text className="text-slate-500 dark:text-slate-400 text-[7px] font-bold mt-1 uppercase">
                              {item.alertType === 'PACKING_DELAY' 
                                ? `Placed ${Math.floor((Date.now() - new Date(item.expiryDate).getTime()) / 60000)}m ago` 
                                : `Expiry: ${new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                              }
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Alert Action Panel */}
                      <View className="flex-row gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 items-center justify-between">
                        {/* Quick Restock Input & Button */}
                        {(item.alertType === 'OUT_OF_STOCK' || item.alertType === 'LOW_STOCK') ? (
                          <View className="flex-row items-center gap-2 flex-1 mr-3">
                            <TextInput
                              keyboardType="numeric"
                              placeholder="Qty"
                              placeholderTextColor="#64748b"
                              value={alertRestockAmount[item.id] || ''}
                              onChangeText={(t) => setAlertRestockAmount(prev => ({ ...prev, [item.id]: t }))}
                              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-2 py-1 text-white font-black text-[10px] w-12 text-center"
                            />
                            <Pressable
                              onPress={() => handleRestockAlert(item.id, item.stock)}
                              disabled={submittingRestockId === item.id}
                              className="bg-indigo-600/10 border border-indigo-500/25 px-3 py-1.5 rounded-lg flex-row items-center justify-center"
                            >
                              {submittingRestockId === item.id ? (
                                <ActivityIndicator size="small" color="#6366f1" style={{ scaleX: 0.8, scaleY: 0.8 }} />
                              ) : (
                                <Text className="text-indigo-400 font-extrabold text-[9px] uppercase">Restock</Text>
                              )}
                            </Pressable>
                          </View>
                        ) : <View className="flex-1" />}

                        {/* Snooze Button */}
                        <Pressable
                          onPress={() => handleSnoozeAlert(item.id, item.alertType)}
                          disabled={submittingAlertAction === isSnoozedKey}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-850 bg-slate-950 active:bg-slate-900"
                        >
                          {submittingAlertAction === isSnoozedKey ? (
                            <ActivityIndicator size="small" color="#94a3b8" />
                          ) : (
                            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase">Snooze 30m</Text>
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
          <View className="px-4 py-4 gap-4">
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl gap-3">
              <View className="flex-row items-center gap-2">
                <Building2 size={18} color="#6366f1" />
                <Text className="text-slate-900 dark:text-white font-black text-sm">Goods Receipt Note (GRN)</Text>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold">Register trackable expiry-date batches to restock inventory.</Text>

              {/* Product Lookup Search */}
              <View className="flex-row items-center bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 h-11 mt-1">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  placeholder="Lookup products by name..."
                  placeholderTextColor="#64748b"
                  value={inwardSearchQuery}
                  onChangeText={handleInwardProductSearch}
                  className="flex-1 text-slate-800 dark:text-white font-extrabold text-xs ml-2"
                />
              </View>

              {/* Search Dropdown options */}
              {inwardProductsList.length > 0 && (
                <View className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl overflow-hidden mt-1 divide-y divide-slate-900">
                  {inwardProductsList.map((prod) => (
                    <Pressable
                      key={prod.id}
                      onPress={() => handleSelectInwardProduct(prod)}
                      className="p-3 active:bg-slate-900 flex-row items-center"
                    >
                      <Text className="text-slate-800 dark:text-white font-bold text-xs flex-1">{prod.name}</Text>
                      <Text className="text-indigo-400 font-black text-[9px] uppercase ml-2">₹{prod.price} • Stock: {prod.stock}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Selected Product Form */}
            {selectedInwardProduct && (
              <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl gap-4">
                <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                  <View className="flex-1 mr-2">
                    <Text className="text-slate-900 dark:text-white font-black text-xs">{selectedInwardProduct.name}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5 uppercase">Current Stock: {selectedInwardProduct.stock}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedInwardProduct(null)} className="p-1">
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Form fields */}
                <View className="gap-3">
                  <View className="gap-1.5">
                    <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Inward Quantity</Text>
                    <TextInput
                      value={inwardQuantity}
                      onChangeText={setInwardQuantity}
                      keyboardType="numeric"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-white font-semibold text-xs"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Batch Cost Price (₹)</Text>
                    <TextInput
                      value={inwardCostPrice}
                      onChangeText={setInwardCostPrice}
                      keyboardType="numeric"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-white font-semibold text-xs"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Batch Code Identifier</Text>
                    <TextInput
                      value={inwardBatchCode}
                      onChangeText={setInwardBatchCode}
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-white font-semibold text-xs"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Expiry Date (YYYY-MM-DD)</Text>
                    <TextInput
                      value={inwardExpiryDate}
                      onChangeText={setInwardExpiryDate}
                      placeholder="e.g. 2026-12-31"
                      placeholderTextColor="#475569"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-white font-semibold text-xs"
                    />
                    {/* Expiry Presets */}
                    <View className="flex-row gap-1.5 mt-1.5">
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
                          className="bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg active:bg-slate-700"
                        >
                          <Text className="text-slate-650 dark:text-slate-300 font-bold text-[8px]">{preset.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Submit button */}
                <Pressable
                  onPress={handleSubmitInward}
                  disabled={isInwardSubmitting}
                  className="bg-indigo-600 py-3 rounded-xl items-center justify-center flex-row mt-2"
                >
                  {isInwardSubmitting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Confirm Inward Receipt</Text>
                </Pressable>
              </View>
            )}

            {/* Recent Session Logs */}
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl gap-3">
              <Text className="text-slate-900 dark:text-white font-black text-xs">Recent GRN Entries</Text>
              {recentInwardLogs.length === 0 ? (
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 text-center py-6">No inventory shipments inwarded in this session.</Text>
              ) : (
                <View className="gap-2.5">
                  {recentInwardLogs.map((log) => (
                    <View key={log.id} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl flex-row justify-between items-center">
                      <View>
<Text className="text-slate-800 dark:text-white font-bold text-xs">{log.productName}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-mono mt-0.5 uppercase">
                          Batch: {log.batchCode} • Exp: {log.expiryDate}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-emerald-400 font-black text-xs">+{log.quantity} units</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">{log.timestamp}</Text>
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
          <View className="px-4 py-4 gap-4">
            <View className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-850 p-5 rounded-3xl gap-5 shadow-sm">
              <View className="flex-row items-center gap-2 mb-1">
                <Zap size={18} color="#e11d48" />
                <Text className="text-slate-900 dark:text-white font-black text-sm">Bulk Inventory Update</Text>
              </View>

              {/* Category Dropdown Selection */}
              <View className="gap-2">
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">Filter Category Scope</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Pressable
                    onPress={() => setBulkCategoryId('ALL')}
                    className={`px-4 py-2 rounded-full border ${
                      bulkCategoryId === 'ALL' ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700'
                    }`}
                  >
                    <Text className={`font-extrabold text-[10px] uppercase tracking-wide ${bulkCategoryId === 'ALL' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>All Products</Text>
                  </Pressable>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setBulkCategoryId(cat.id)}
                      className={`px-4 py-2 rounded-full border ${
                        bulkCategoryId === cat.id ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700'
                      }`}
                    >
                      <Text className={`font-extrabold text-[10px] uppercase tracking-wide ${bulkCategoryId === cat.id ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Update Type - Fixed layout to prevent text clipping */}
              <View className="gap-2">
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">Update Target Field</Text>
                <View className="flex-row flex-wrap gap-2">
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
                      className={`py-2.5 rounded-xl border items-center justify-center ${
                        bulkUpdateType === field.key ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-50 dark:bg-zinc-955 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Text className={`font-bold text-xs ${bulkUpdateType === field.key ? 'text-white' : 'text-slate-600 dark:text-zinc-400'}`}>{field.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Mode Selection */}
              {bulkUpdateType !== 'AVAILABILITY' && (
                <View className="gap-2">
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">Update Mode</Text>
                  <View className="flex-row gap-2 flex-wrap">
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
                        className={`px-4 py-2 rounded-full border ${
                          bulkMode === m.key ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700'
                        }`}
                      >
                        <Text className={`font-bold text-[9px] uppercase ${bulkMode === m.key ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{m.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Value Input */}
              <View className="gap-2">
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                  {bulkUpdateType === 'AVAILABILITY' ? 'Enable / Disable Toggle' : 'Modification Value'}
                </Text>
                {bulkUpdateType === 'AVAILABILITY' ? (
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setBulkValue('1')}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        bulkValue === '1' ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-50 dark:bg-zinc-955 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Text className={`font-bold text-xs ${bulkValue === '1' ? 'text-white' : 'text-slate-655 dark:text-zinc-400'}`}>Available</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setBulkValue('0')}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        bulkValue === '0' ? 'bg-indigo-600 border-indigo-500 shadow-sm' : 'bg-slate-50 dark:bg-zinc-955 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Text className={`font-bold text-xs ${bulkValue === '0' ? 'text-white' : 'text-slate-655 dark:text-zinc-400'}`}>Unavailable</Text>
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    keyboardType="numeric"
                    value={bulkValue}
                    onChangeText={setBulkValue}
                    placeholder="e.g. 10"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-semibold text-xs"
                  />
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-2">
                <Pressable
                  onPress={handleBulkPreview}
                  disabled={isBulkPreviewing}
                  className="flex-1 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/10 py-3 rounded-2xl items-center justify-center flex-row active:bg-indigo-100"
                >
                  {isBulkPreviewing && <ActivityIndicator size="small" color="#4f46e5" style={{ marginRight: 6 }} />}
                  <Text className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase">Calculate Preview</Text>
                </Pressable>
                <Pressable
                  onPress={handleBulkApply}
                  disabled={isBulkApplying || bulkPreviews.length === 0}
                  className={`flex-1 py-3 rounded-2xl items-center justify-center flex-row ${
                    bulkPreviews.length > 0 ? 'bg-indigo-600 active:bg-indigo-700 shadow-md' : 'bg-slate-100 dark:bg-zinc-800'
                  }`}
                >
                  {isBulkApplying && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                  <Text className={`font-extrabold text-[10px] uppercase ${bulkPreviews.length > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                    Apply Batch
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Previews List */}
            {bulkPreviews.length > 0 && (
              <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-3xl gap-3 shadow-sm">
                <Text className="text-slate-900 dark:text-white font-black text-xs">Previewing Changes ({bulkPreviews.length} products)</Text>
                <View className="gap-2 max-h-60 overflow-y-auto">
                  {bulkPreviews.slice(0, 10).map((p, i) => (
                    <View key={i} className="flex-row justify-between items-center bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <Text className="text-slate-800 dark:text-white font-bold text-[10px] flex-1 mr-2" numberOfLines={1}>{p.name}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] line-through">{String(p.oldValue)}</Text>
                        <ArrowRight size={10} color="#94a3b8" />
                        <Text className="text-emerald-500 dark:text-emerald-400 font-black text-[10px]">{String(p.newValue)}</Text>
                      </View>
                    </View>
                  ))}
                  {bulkPreviews.length > 10 && (
                    <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold text-center mt-1">
                      + {bulkPreviews.length - 10} more products matching category scope
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Batch Update History */}
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-3xl gap-3 shadow-sm">
              <Text className="text-slate-900 dark:text-white font-black text-xs">Modification Batch History</Text>
              {isBulkHistoryLoading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : bulkHistory.length === 0 ? (
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 text-center py-6">No historical bulk actions registered.</Text>
              ) : (
                <View className="gap-2.5">
                  {bulkHistory.map((batch) => (
                    <View key={batch.batchId} className="bg-slate-50 dark:bg-zinc-955 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 flex-row justify-between items-center">
                      <View className="flex-1 mr-2">
                        <Text className="text-slate-800 dark:text-white font-bold text-xs">{batch.changeType} Batch</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">
                          {batch.count} products • {new Date(batch.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleBulkUndo(batch.batchId)}
                        disabled={undoingBatchId === batch.batchId}
                        className="px-3 py-2 bg-rose-50 border border-rose-200 dark:bg-rose-955/20 dark:border-rose-900/50 rounded-xl"
                      >
                        {undoingBatchId === batch.batchId ? (
                          <ActivityIndicator size="small" color="#f43f5e" />
                        ) : (
                          <Text className="text-rose-500 font-extrabold text-[9px] uppercase">Revert</Text>
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
          const chartWidth = Dimensions.get('window').width - 64;
          const chartHeight = 160;

          // Chart scaling coordinates
          const chartPoints = (() => {
            if (reportDailySales.length < 2) return [];
            const paddingX = 10;
            const paddingY = 15;
            const drawW = chartWidth - paddingX * 2;
            const drawH = chartHeight - paddingY * 2;
            const maxVal = Math.max(...reportDailySales.map(d => Math.max(d.sales, d.profit)), 100) * 1.1;

            return reportDailySales.map((d, index) => {
              const x = paddingX + (index / (reportDailySales.length - 1)) * drawW;
              const ySales = paddingY + drawH - (d.sales / maxVal) * drawH;
              const yProfit = paddingY + drawH - (d.profit / maxVal) * drawH;
              return { x, ySales, yProfit };
            });
          })();

          // Create SVG lines path strings
          const salesPathStr = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySales}`).join(' ');
          const profitPathStr = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProfit}`).join(' ');

          return (
            <View className="px-4 py-4 gap-4">
              <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl flex-row justify-between items-center">
                <View>
                  <Text className="text-slate-900 dark:text-white font-black text-sm">Financial Analytics</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">Configure ranges and check revenue yield sheets.</Text>
                </View>
                <Pressable
                  onPress={handleReportsCSVShare}
                  className="px-3 py-2 bg-indigo-600 rounded-xl flex-row items-center gap-1"
                >
                  <Download size={12} color="#fff" />
                  <Text className="text-white font-extrabold text-[9px] uppercase tracking-wider">CSV</Text>
                </Pressable>
              </View>

              {/* Date Presets Selector */}
              <View className="flex-row gap-2 bg-slate-50 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800">
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
                    className={`flex-1 items-center py-2 rounded-xl ${
                      reportDateRange === range.key ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                  >
                    <Text className={`text-[10px] font-black uppercase ${
                      reportDateRange === range.key ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom Date Picker inputs */}
              <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Start Date</Text>
                  <TextInput
                    value={reportStartDate}
                    onChangeText={setReportStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-semibold text-[10px]"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">End Date</Text>
                  <TextInput
                    value={reportEndDate}
                    onChangeText={setReportEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-semibold text-[10px]"
                  />
                </View>
                <Pressable
                  onPress={() => {
                    setReportDateRange('custom');
                    fetchReportsData();
                  }}
                  className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 justify-center px-4 rounded-lg mt-3.5"
                >
                  <Text className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] uppercase">Get</Text>
                </Pressable>
              </View>

              {isReportLoading ? (
                <ActivityIndicator size="large" color="#6366f1" className="py-10" />
              ) : (
                <View className="gap-4">
                  {/* KPI Metrics summaries */}
                  <View className="flex-row gap-2 flex-wrap">
                    {[
                      { label: 'Total Sales', val: `₹${reportSummary.totalSales}`, color: 'text-indigo-500 dark:text-indigo-400' },
                      { label: 'Total profit', val: `₹${reportSummary.totalProfit}`, color: 'text-emerald-500 dark:text-emerald-400' },
                      { label: 'Margin %', val: `${reportSummary.profitMargin}%`, color: 'text-amber-500 dark:text-amber-400' },
                      { label: 'AOV Revenue', val: `₹${Math.round(reportSummary.averageOrderValue || 0)}`, color: 'text-blue-500 dark:text-blue-400' }
                    ].map((kpi, i) => (
                      <View key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl flex-1 min-w-[45%]">
                        <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.label}</Text>
                        <Text className={`text-base font-black mt-1 ${kpi.color}`}>{kpi.val}</Text>
                      </View>
                    ))}
                  </View>

                  {/* SVG Sales Trend Chart */}
                  {reportDailySales.length > 1 && (
                    <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3">
                      <Text className="text-slate-900 dark:text-white font-black text-xs">Revenue & profit Trend</Text>
                      <View className="items-center bg-slate-50 dark:bg-zinc-950 rounded-xl p-1 border border-slate-100 dark:border-zinc-800 overflow-hidden">
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
                      <View className="flex-row justify-center gap-4 mt-1">
                        <View className="flex-row items-center gap-1.5">
                          <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          <Text className="text-slate-600 dark:text-slate-300 font-bold text-[8px] uppercase">Revenue</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <Text className="text-slate-600 dark:text-slate-300 font-bold text-[8px] uppercase">Net Profit</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Top selling products list */}
                  <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3">
                    <Text className="text-slate-900 dark:text-white font-black text-xs">Top Selling Products</Text>
                    <View className="gap-2.5">
                      {reportTopProducts.map((p, i) => (
                        <View key={p.productId || i} className="flex-row justify-between items-center bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-xl">
                          <View className="flex-1 mr-2">
                            <Text className="text-slate-800 dark:text-white font-extrabold text-[11px]" numberOfLines={1}>{p.name}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">{p.quantity} units sold</Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-indigo-500 dark:text-indigo-400 font-black text-[11px]">₹{p.sales}</Text>
                            <Text className="text-emerald-500 dark:text-emerald-400 font-bold text-[8px] mt-0.5">+₹{p.profit} profit</Text>
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
          <View className="px-4 py-4 gap-4">
            {/* Summary KPI header */}
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <BrainCircuit size={18} color="#6366f1" />
                  <Text className="text-slate-900 dark:text-white font-black text-sm">Demand Forecasting</Text>
                </View>
                <Pressable
                  onPress={() => fetchForecastData(true)}
                  disabled={isForecastLoading}
                  className="p-2 bg-indigo-50 border border-indigo-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl"
                >
                  {isForecastLoading ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <RefreshCw size={14} color="#6366f1" />
                  )}
                </Pressable>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold">AI estimated velocity and stock depletion warning boards.</Text>
              
              <View className="flex-row gap-2.5 mt-2">
                <View className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex-1">
                  <Text className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase">Items At Risk</Text>
                  <Text className="text-sm font-black text-rose-500 mt-0.5">{forecastMetrics.itemsAtRisk || 0}</Text>
                </View>
                <View className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex-1">
                  <Text className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase">Revenue At Risk</Text>
                  <Text className="text-sm font-black text-amber-500 mt-0.5">₹{forecastMetrics.totalRevenueAtRisk || 0}</Text>
                </View>
                <View className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex-1">
                  <Text className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase">Avg Velocity</Text>
                  <Text className="text-sm font-black text-indigo-500 mt-0.5">{forecastMetrics.averageVelocity?.toFixed(1) || '0.0'}/day</Text>
                </View>
              </View>

              {/* Auto Replenish All Button */}
              <Pressable
                onPress={handleAutoReplenish}
                disabled={isForecastRestocking}
                className="bg-indigo-600 py-3 rounded-xl items-center justify-center flex-row mt-2"
              >
                {isForecastRestocking && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
                <Text className="text-white font-extrabold text-xs uppercase tracking-wider">Auto-Replenish All Stockouts</Text>
              </Pressable>
            </View>

            {/* Filter Search */}
            <View className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3">
              <View className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 h-10">
                <Search size={14} color="#94a3b8" />
                <TextInput
                  placeholder="Filter forecast catalog..."
                  placeholderTextColor="#94a3b8"
                  value={forecastSearchQuery}
                  onChangeText={setForecastSearchQuery}
                  className="flex-1 text-white font-extrabold text-[11px] ml-2"
                />
              </View>

              {/* Category selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <Pressable
                  onPress={() => setForecastCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg border ${
                    forecastCategoryFilter === 'ALL' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-100 dark:border-zinc-800/50'
                  }`}
                >
                  <Text className="text-white font-extrabold text-[8px] uppercase">All</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setForecastCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      forecastCategoryFilter === c.id ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-100 dark:border-zinc-800/50'
                    }`}
                  >
                    <Text className="text-white font-extrabold text-[8px] uppercase">{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Forecast Listings */}
            {isForecastLoading ? (
              <ActivityIndicator size="large" color="#6366f1" className="py-10" />
            ) : (
              <View className="gap-3">
                {forecastList.filter(f => {
                  const s = f.name.toLowerCase().includes(forecastSearchQuery.toLowerCase());
                  const c = forecastCategoryFilter === 'ALL' || f.category?.id === forecastCategoryFilter;
                  return s && c;
                }).map((item) => (
                  <View key={item.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-4 rounded-2xl gap-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-950 items-center justify-center border border-slate-200 dark:border-zinc-800 mr-2.5 overflow-hidden">
                          {getAppImageSource(item.imageUrl) ? (
                            <Image source={getAppImageSource(item.imageUrl)!} className="w-full h-full" contentFit="cover" />
                          ) : (
                            <Text className="text-lg text-slate-800 dark:text-zinc-200">{item.imageUrl || '📦'}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-800 dark:text-white font-extrabold text-xs" numberOfLines={2}>{item.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5 uppercase">
                            Stock: {item.stock} • Velocity: {item.salesVelocity?.toFixed(1) || '0.0'}/day
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <View className={`rounded-full px-2 py-0.5 border ${
                          item.isAtRisk ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20'
                        }`}>
                          <Text className={`text-[8px] font-black uppercase ${item.isAtRisk ? 'text-rose-500' : 'text-indigo-400'}`}>
                            {item.daysRemaining <= 0 ? 'Out of Stock' : `${item.daysRemaining.toFixed(1)} days left`}
                          </Text>
                        </View>
                        {item.isAtRisk && (
                          <Text className="text-rose-400/90 text-[7px] font-black mt-1 uppercase tracking-wider">
                            ₹{item.revenueAtRisk} Revenue At Risk
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Action Bar */}
                    <View className="flex-row gap-2 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 items-center justify-between">
                      <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold flex-1 mr-2 uppercase" numberOfLines={1}>
                        AI Rec: Inward {item.recommendedReorder} units
                      </Text>
                      {item.recommendedReorder > 0 ? (
                        <Pressable
                          onPress={() => handleIndividualRestock(item.id, item.recommendedReorder, item.costPrice)}
                          className="bg-indigo-600/15 border border-indigo-500/30 px-3 py-1.5 rounded-lg active:bg-indigo-600/30"
                        >
                          <Text className="text-indigo-400 font-extrabold text-[8px] uppercase">AI Restock</Text>
                        </Pressable>
                      ) : (
                        <View className="px-3 py-1.5 bg-slate-950 border border-slate-100 dark:border-zinc-800/50 rounded-lg">
                          <Text className="text-slate-500 font-bold text-[8px] uppercase">Stock Adequate</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View className="h-24" />


      {/* ------------------- Rider Simulation Modals ------------------- */}
      
      {/* 1. UPI QR Code Selector Modal */}
      {isUpiQrVisible && upiTargetOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsUpiQrVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center p-6">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm items-center border border-slate-200 dark:border-zinc-850 shadow-2xl">
              <QrCode size={40} color="#6366f1" />
              <Text className="text-slate-900 dark:text-white font-black text-base mt-3">Scan UPI QR Code</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold text-center mt-1 uppercase tracking-wider">Amount: {formatPrice(upiTargetOrder.total)}</Text>
              
              {/* Dummy QR Box */}
              <View className="w-48 h-48 bg-slate-950 rounded-2xl border border-slate-200 dark:border-zinc-850 mt-5 items-center justify-center p-4">
                <Text className="text-6xl text-slate-700 dark:text-slate-200">🏁</Text>
                <Text className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-4 tracking-widest uppercase">UPI ID: fastkirana@upi</Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row w-full gap-2.5 mt-6 border-t border-slate-100 dark:border-zinc-800 pt-5">
                <Pressable
                  onPress={() => handleCashCollected(upiTargetOrder)}
                  className="flex-1 border border-slate-700 py-3 rounded-xl items-center active:bg-slate-800"
                >
                  <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider">Paid Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleUpiQrPaid(upiTargetOrder)}
                  className="flex-1 bg-indigo-600 py-3 rounded-xl items-center active:bg-indigo-700"
                >
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">Confirm Paid</Text>
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
          <View className="flex-1 bg-black justify-between p-6">
            <View className="flex-row justify-between items-center mt-8">
              <Pressable 
                onPress={() => setIsPhotoCapturing(false)}
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={20} color="#fff" />
              </Pressable>
              <Text className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Capture Delivery Proof</Text>
              <View className="w-10" />
            </View>

            {/* Simulating Viewfinder */}
            <View className="w-full aspect-[4/3] bg-slate-900 border-2 border-white/20 rounded-3xl items-center justify-center relative overflow-hidden self-center my-6">
              <Text className="text-5xl">📷</Text>
              <Text className="text-white/60 text-[10px] font-black uppercase tracking-wider mt-4">Place package at door & snap</Text>
              <View className="absolute bottom-4 left-4 right-4 bg-black/60 p-2 rounded-xl border border-white/5">
                <Text className="text-white text-[9px] font-black uppercase text-center">Proof for: {photoTargetOrder.user.name}</Text>
              </View>
            </View>

            {/* Trigger Button */}
            <Pressable 
              onPress={finalizeDelivery}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center self-center mb-8 active:scale-95 transition-all"
            >
              <View className="w-14 h-14 rounded-full bg-white" />
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
          <View className="flex-1 bg-black/60 justify-center items-center p-6">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-zinc-850 shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
                <Text className="text-slate-900 dark:text-white font-black text-base">Create Coupon Code</Text>
                <Pressable onPress={() => setIsCouponModalVisible(false)} className="p-1">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {/* Code */}
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Coupon Code</Text>
                <TextInput
                  value={newCouponCode}
                  onChangeText={setNewCouponCode}
                  placeholder="e.g. WELCOME50"
                  placeholderTextColor="#475569"
                  autoCapitalize="characters"
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                />
              </View>

              {/* Type selector Flat vs Percent */}
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Discount Type</Text>
                <View className="flex-row gap-2">
                  {['FLAT', 'PERCENT'].map((t) => {
                    const isActive = newCouponType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setNewCouponType(t as any)}
                        className={`flex-1 py-2 rounded-lg items-center border ${
                          isActive ? 'bg-indigo-950/30 border-indigo-900/40' : 'bg-slate-950 border border-slate-100 dark:border-zinc-800/50'
                        }`}
                      >
                        <Text className={`text-[10px] font-black uppercase ${
                          isActive ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {t} Discount
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Value / Min Order */}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Discount Value</Text>
                  <TextInput
                    value={newCouponValue}
                    onChangeText={setNewCouponValue}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor="#475569"
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Min Order Total</Text>
                  <TextInput
                    value={newCouponMinOrder}
                    onChangeText={setNewCouponMinOrder}
                    keyboardType="numeric"
                    placeholder="199"
                    placeholderTextColor="#475569"
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>
              </View>

              {/* Max Uses */}
              <View className="mb-5">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Max Usage Limit</Text>
                <TextInput
                  value={newCouponMaxUses}
                  onChangeText={setNewCouponMaxUses}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#475569"
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                />
              </View>

              {/* Actions */}
              <View className="flex-row gap-2.5">
                <Pressable
                  onPress={() => setIsCouponModalVisible(false)}
                  className="flex-1 border border-slate-700 py-3 rounded-xl items-center active:bg-slate-800"
                >
                  <Text className="text-slate-650 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateCoupon}
                  disabled={isCreatingCoupon}
                  className="flex-1 bg-indigo-600 py-3 rounded-xl items-center active:bg-indigo-750 flex-row justify-center gap-1.5"
                >
                  {isCreatingCoupon && <ActivityIndicator size="small" color="#fff" />}
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs uppercase tracking-wider">
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
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 w-full max-h-[90%] border-t border-x border-slate-100 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
                <Text className="text-slate-900 dark:text-white font-black text-base">{editingBannerId ? 'Edit Banner' : 'Create Promo Banner'}</Text>
                <Pressable onPress={() => { setIsBannerModalVisible(false); resetBannerForm(); }} className="p-1">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {/* Title */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Banner Title *</Text>
                  <TextInput
                    placeholder="e.g. Farm Fresh Vegetables & Fruits"
                    placeholderTextColor="#475569"
                    value={bannerTitle}
                    onChangeText={setBannerTitle}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Description *</Text>
                  <TextInput
                    placeholder="e.g. Directly sourced from local farms"
                    placeholderTextColor="#475569"
                    value={bannerDescription}
                    onChangeText={setBannerDescription}
                    multiline
                    numberOfLines={2}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>

                {/* Coupon Code */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Coupon Code (Optional)</Text>
                  <TextInput
                    placeholder="e.g. SAVE20"
                    placeholderTextColor="#475569"
                    value={bannerCode}
                    onChangeText={setBannerCode}
                    autoCapitalize="characters"
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>

                {/* Gradient Preset Picker */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-2">Gradient Color</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {BANNER_GRADIENT_PRESETS.map((g, i) => (
                        <Pressable
                          key={i}
                          onPress={() => { setBannerGradient(g.value); triggerHaptic('light'); }}
                          className={`rounded-xl overflow-hidden border-2 ${bannerGradient === g.value ? 'border-indigo-500' : 'border-transparent'}`}
                        >
                          <View className={`bg-gradient-to-r ${g.value} h-10 w-20 rounded-xl items-center justify-center`}>
                            <Text className="text-white text-[7px] font-black">{g.name}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Banner Type */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-2">Banner Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {['festival', 'fresh', 'express-delivery', 'first-order', 'seasonal', 'custom'].map(t => (
                        <Pressable
                          key={t}
                          onPress={() => { setBannerType(t); triggerHaptic('light'); }}
                          className={`px-3 py-1.5 rounded-lg border ${bannerType === t ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'}`}
                        >
                          <Text className={`text-[9px] font-black uppercase ${bannerType === t ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Image URL */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Image URL (Optional)</Text>
                  <TextInput
                    placeholder="https://res.cloudinary.com/..."
                    placeholderTextColor="#475569"
                    value={bannerImageUrl}
                    onChangeText={setBannerImageUrl}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>

                {/* Link URL */}
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Link URL (Optional)</Text>
                  <TextInput
                    placeholder="e.g. /category/fruits-vegetables"
                    placeholderTextColor="#475569"
                    value={bannerLinkUrl}
                    onChangeText={setBannerLinkUrl}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                  />
                </View>

                {/* Sort Order + Active Toggle */}
                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Sort Order</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#475569"
                      value={bannerSortOrder}
                      onChangeText={setBannerSortOrder}
                      keyboardType="number-pad"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1">Active</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Switch
                        value={bannerIsActive}
                        onValueChange={setBannerIsActive}
                        trackColor={{ false: '#475569', true: '#818cf8' }}
                        thumbColor={bannerIsActive ? '#4f46e5' : '#cbd5e1'}
                      />
                      <Text className={`text-[10px] font-black ${bannerIsActive ? 'text-emerald-600' : 'text-slate-500'}`}>{bannerIsActive ? 'ACTIVE' : 'DISABLED'}</Text>
                    </View>
                  </View>
                </View>

                {/* Live Preview */}
                <View className="mb-2">
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-2">Live Preview</Text>
                  <View className={`bg-gradient-to-r ${bannerGradient} rounded-2xl p-4 h-20 justify-center`}>
                    <Text className="text-white font-black text-sm" numberOfLines={1}>{bannerTitle || 'Banner Title'}</Text>
                    <Text className="text-white/80 text-[10px] font-semibold" numberOfLines={1}>{bannerDescription || 'Banner description goes here'}</Text>
                    {bannerCode ? (
                      <View className="bg-white/20 self-start px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-white text-[8px] font-black">{bannerCode}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => { setIsBannerModalVisible(false); resetBannerForm(); }}
                  className="flex-1 border border-slate-300 dark:border-zinc-700 py-3.5 rounded-xl items-center active:bg-slate-100 dark:active:bg-zinc-800"
                >
                  <Text className="text-slate-600 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleBannerSubmit}
                  disabled={bannerSubmitting}
                  className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${bannerSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'}`}
                >
                  {bannerSubmitting && <ActivityIndicator size="small" color="#fff" />}
                  <Text className="text-white font-extrabold text-xs uppercase tracking-wider">{editingBannerId ? 'Update Banner' : 'Create Banner'}</Text>
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
            className="flex-1 bg-black/60 justify-center p-5"
          >
            <Pressable 
              onPress={(e) => e.stopPropagation()} // prevent close on inner click
              className="bg-white dark:bg-zinc-900 rounded-3xl p-5 w-full max-h-[80%] border border-slate-100 dark:border-zinc-800 shadow-2xl"
            >
              {/* Header */}
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
                <View>
                  <Text className="text-slate-900 dark:text-white font-black text-base">Quick Tab Launcher</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-0.5">Jump directly to any of the 20 admin consoles</Text>
                </View>
                <Pressable onPress={() => setIsLauncherVisible(false)} className="p-1">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {/* Search Input */}
              <View className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-4">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  placeholder="Type to search console tabs (e.g. orders, coupon)..."
                  placeholderTextColor="#94a3b8"
                  value={launcherSearchQuery}
                  onChangeText={setLauncherSearchQuery}
                  autoFocus
                  className="flex-1 text-slate-800 dark:text-white font-bold text-xs p-0"
                />
                {launcherSearchQuery.length > 0 && (
                  <Pressable onPress={() => setLauncherSearchQuery('')} className="p-1">
                    <X size={14} color="#94a3b8" />
                  </Pressable>
                )}
              </View>

              {/* Scrollable list of matched tabs */}
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
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
                    { id: 'INVENTORY', label: 'Products Catalogue', hub: 'CATALOG', hubTitle: 'Catalog & Inventory', emoji: '📦', keywords: 'stock, price, catalog, edit, template, variants' },
                    { id: 'CATEGORIES', label: 'Categories Manager', hub: 'CATALOG', hubTitle: 'Catalog & Inventory', emoji: '📁', keywords: 'grocery, cafe sections, sorting, weights' },
                    { id: 'INWARD', label: 'GRN Inwarding', hub: 'CATALOG', hubTitle: 'Catalog & Inventory', emoji: '📥', keywords: 'goods receipt, barcode, stock inward, batch' },
                    { id: 'BULK_UPDATE', label: 'Bulk Update', hub: 'CATALOG', hubTitle: 'Catalog & Inventory', emoji: '⚡', keywords: 'bulk price, stock levels, csv upload' },
                    { id: 'ALERTS', label: 'Inventory Alerts', hub: 'CATALOG', hubTitle: 'Catalog & Inventory', emoji: '⚠️', keywords: 'out of stock, low stock, expiry date' },
                    { id: 'BANNERS', label: 'Promo Banners', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '🖼️', keywords: 'promotions, festival, templates, carousel' },
                    { id: 'HIGHLIGHTS', label: 'Flash Deals', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '⚡', keywords: 'top picks, best sellers, storefront highlights' },
                    { id: 'COUPONS', label: 'Offers & Coupons', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '🎟️', keywords: 'discount codes, promo, offers, voucher' },
                    { id: 'NOTIFICATIONS', label: 'Push Notifications', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '📣', keywords: 'alert customer, composing, alerts history' },
                    { id: 'SETTINGS', label: 'Store Settings', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '⚙️', keywords: 'opening times, minimum order, delivery charge' },
                    { id: 'CHEF', label: 'Chef Kitchen', hub: 'MARKETING', hubTitle: 'Marketing & Settings', emoji: '🍳', keywords: 'cafe prep, cooked, food items checklist' },
                  ];

                  const q = launcherSearchQuery.toLowerCase().trim();
                  const matched = ALL_TABS_FOR_LAUNCHER.filter(t => 
                    t.label.toLowerCase().includes(q) || 
                    t.hubTitle.toLowerCase().includes(q) || 
                    t.keywords.toLowerCase().includes(q)
                  );

                  if (matched.length === 0) {
                    return (
                      <View className="py-8 items-center">
                        <Text className="text-slate-400 text-xs font-bold text-center">No consoles match "{launcherSearchQuery}"</Text>
                      </View>
                    );
                  }

                  return (
                    <View className="gap-2">
                      {matched.map((tab) => (
                        <Pressable
                          key={tab.id}
                          onPress={() => {
                            setActiveHub(tab.hub as any);
                            setActiveTab(tab.id as any);
                            setIsLauncherVisible(false);
                            triggerHaptic('success');
                          }}
                          className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3.5 flex-row items-center justify-between active:bg-slate-150"
                        >
                          <View className="flex-row items-center gap-3">
                            <Text className="text-xl">{tab.emoji}</Text>
                            <View>
                              <Text className="text-slate-800 dark:text-white font-extrabold text-xs">{tab.label}</Text>
                              <Text className="text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase mt-0.5">{tab.hubTitle}</Text>
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-805 rounded-3xl overflow-hidden shadow-2xl p-5">
              
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2.5">
                  <View className="bg-amber-100 dark:bg-amber-950/40 p-2.5 rounded-2xl">
                    <ShoppingBag size={18} color="#d97706" />
                  </View>
                  <View>
                    <Text className="text-slate-900 dark:text-white font-black text-sm">Cart Recovery Alert</Text>
                    <Text className="text-slate-400 dark:text-zinc-500 text-[9px] font-black uppercase mt-0.5">{selectedCartForAlert.userName}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setAlertModalVisible(false)} className="bg-slate-50 dark:bg-zinc-800 p-2 rounded-full">
                  <X size={12} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Pressable>
              </View>

              {/* Cart Summary */}
              <View className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3.5 mb-4">
                <Text className="text-slate-400 dark:text-zinc-500 text-[9px] font-black uppercase mb-1.5">Cart Content</Text>
                <Text className="text-slate-700 dark:text-zinc-300 text-xs font-bold leading-5">
                  {selectedCartForAlert.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')}
                </Text>
                <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-zinc-855">
                  <Text className="text-slate-450 dark:text-zinc-500 text-[9px] font-black uppercase">Subtotal</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-black">{formatPrice(selectedCartForAlert.subtotal)}</Text>
                </View>
              </View>

              {/* Message Editor */}
              <Text className="text-slate-400 dark:text-zinc-500 text-[9px] font-black uppercase mb-1.5 ml-1">Customize Message</Text>
              <View className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 mb-4">
                <TextInput
                  value={alertMessageText}
                  onChangeText={setAlertMessageText}
                  multiline={true}
                  numberOfLines={3}
                  style={{ textAlignVertical: 'top', height: 60 }}
                  className="text-slate-800 dark:text-zinc-100 text-xs font-bold leading-5 p-0"
                />
              </View>

              {/* Location Info (if coordinates exist) */}
              {selectedCartForAlert.address && (
                <View className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl p-3.5 mb-4 flex-row gap-2.5 items-center">
                  <MapPin size={18} color="#f43f5e" />
                  <View className="flex-1">
                    <Text className="text-rose-600 dark:text-rose-455 text-[9px] font-black uppercase">WhatsApp Location Included</Text>
                    <Text className="text-slate-500 dark:text-zinc-400 text-[10px] font-bold mt-0.5" numberOfLines={1}>{selectedCartForAlert.address}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-2.5">
                {/* Send via Push Notification */}
                <Pressable
                  onPress={handleSendPushNotification}
                  disabled={isSendingNotification}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: isSendingNotification ? 0.6 : 1
                  })}
                  className="bg-indigo-600 dark:bg-indigo-500 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
                >
                  <Send size={13} color="#ffffff" strokeWidth={3} />
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    {isSendingNotification ? 'Sending Push...' : 'Send Push Notification'}
                  </Text>
                </Pressable>

                {/* Send via WhatsApp */}
                <Pressable
                  onPress={handleSendWhatsApp}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }]
                  })}
                  className="bg-emerald-600 dark:bg-emerald-500 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare size={13} color="#ffffff" strokeWidth={3} />
                  <Text className="text-white font-black text-xs uppercase tracking-wider">Send via WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      </>
    );
  }
}
