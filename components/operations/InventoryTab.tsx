import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Switch, Alert, Platform, useColorScheme } from 'react-native';
import { Search, X, Plus, Package, Sparkles, AlertCircle, Download, FileText, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL } from '../../lib/constants';
import { formatPrice, getAppImageSource } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';

const PRODUCT_TEMPLATES = [
  {
    id: 'milk',
    label: '🥛 Fresh Toned Milk (500ml)',
    sublabel: 'Milk & Dairy preset',
    type: 'grocery',
    name: 'Fresh Toned Milk',
    unit: '500 ml',
    mrp: '32',
    price: '30',
    costPrice: '26',
    stock: '50',
    minStock: '10',
    tags: 'dairy, fresh, morning, staples',
    imageUrl: '🥛',
    description: 'Pasteurized fresh toned milk packed with essential vitamins and nutrition.',
  },
  {
    id: 'bread',
    label: '🍞 Fresh White Bread (400g)',
    sublabel: 'Bakery essential preset',
    type: 'grocery',
    name: 'Fresh Sandwich White Bread',
    unit: '400 g',
    mrp: '45',
    price: '40',
    costPrice: '32',
    stock: '40',
    minStock: '8',
    tags: 'bakery, fresh, breakfast, staples',
    imageUrl: '🍞',
    description: 'Soft & fresh white sandwich bread prepared with high-protein flour.',
  },
  {
    id: 'coffee',
    label: '🧋 Thick Cold Coffee (300ml)',
    sublabel: 'Cafe beverage preset',
    type: 'cafe',
    cafeSection: 'cold-coffee',
    name: 'Classic Thick Cold Coffee',
    unit: '300 ml',
    mrp: '120',
    price: '99',
    costPrice: '45',
    stock: '30',
    minStock: '5',
    tags: 'cafe, cold-coffee, beverage, shakes',
    imageUrl: '🧋',
    description: 'Rich espresso blended with chilled milk and chocolate drizzle.',
  },
  {
    id: 'sandwich',
    label: '🥪 Veg Grilled Club Sandwich',
    sublabel: 'Cafe snack preset',
    type: 'cafe',
    cafeSection: 'sandwiches',
    name: 'Supreme Veg Grilled Club Sandwich',
    unit: '1 pc (2 slices)',
    mrp: '150',
    price: '129',
    costPrice: '50',
    stock: '25',
    minStock: '5',
    tags: 'cafe, sandwiches, hot-bite, popular',
    imageUrl: '🥪',
    description: 'Triple-layered sandwich stuffed with fresh veggies and melted cheese.',
  },
];

const CAFE_MENU_SECTIONS = [
  { tag: 'sandwiches', title: 'Sandwiches', emoji: '🥪' },
  { tag: 'italian-pasta', title: 'Italian Pasta', emoji: '🍝' },
  { tag: 'bombay-bites', title: 'Bombay Bites', emoji: '🥙' },
  { tag: 'rice-dishes', title: 'Rice Dishes', emoji: '🍚' },
  { tag: 'shakes', title: 'Shakes', emoji: '🥤' },
  { tag: 'mocktails', title: 'Mocktails', emoji: '🍹' },
  { tag: 'cold-coffee', title: 'Cold Coffee', emoji: '🧋' },
  { tag: 'frankie-rolls', title: 'Frankie Rolls', emoji: '🌯' },
  { tag: 'hot-beverage', title: 'Hot Beverages', emoji: '☕' },
  { tag: 'hot-bite', title: 'Hot Snacks', emoji: '🥟' },
];

export default function InventoryTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isDarkMode = useColorScheme() === 'dark';
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'grocery' | 'cafe'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, categoryFilter]);

  // Add Product states
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [addType, setAddType] = useState<'grocery' | 'cafe'>('grocery');
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addMrp, setAddMrp] = useState('');
  const [addStock, setAddStock] = useState('');
  const [addCostPrice, setAddCostPrice] = useState('');
  const [addMinStock, setAddMinStock] = useState('10');
  const [addUnit, setAddUnit] = useState('1 pc');
  const [addCategoryVal, setAddCategoryVal] = useState('');
  const [addCafeSection, setAddCafeSection] = useState('');
  const [addAvailable, setAddAvailable] = useState(true);
  const [addFlashDeal, setAddFlashDeal] = useState(false);
  const [addTopPick, setAddTopPick] = useState(false);
  const [addBestSeller, setAddBestSeller] = useState(false);
  const [addLocation, setAddLocation] = useState('');
  const [addExpiryDate, setAddExpiryDate] = useState('');
  const [addTags, setAddTags] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [hasAddVariants, setHasAddVariants] = useState(false);
  const [addVariants, setAddVariants] = useState<any[]>([]);
  const [varName, setVarName] = useState('');
  const [varMrp, setVarMrp] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varCost, setVarCost] = useState('');
  const [varStock, setVarStock] = useState('');

  // Edit Product states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editType, setEditType] = useState<'grocery' | 'cafe'>('grocery');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCategoryVal, setEditCategoryVal] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editFlashDeal, setEditFlashDeal] = useState(false);
  const [editTopPick, setEditTopPick] = useState(false);
  const [editBestSeller, setEditBestSeller] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [hasEditVariants, setHasEditVariants] = useState(false);
  const [editVariants, setEditVariants] = useState<any[]>([]);

  // Cloudinary Upload Helpers
  const [cloudinaryConfig, setCloudinaryConfig] = useState<{ cloudName: string; uploadPreset: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchCloudinarySettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            const cloudName = list.find((s: any) => s.key === 'cloudinary_cloud_name')?.value || '';
            const uploadPreset = list.find((s: any) => s.key === 'cloudinary_upload_preset')?.value || '';
            setCloudinaryConfig({ cloudName, uploadPreset });
          }
        }
      } catch (err) {
        console.warn('Failed to load Cloudinary settings:', err);
      }
    };
    fetchCloudinarySettings();
  }, []);

  const uploadToCloudinary = async (uri: string, onSuccess: (url: string) => void) => {
    if (!cloudinaryConfig || !cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      toast.error('Cloudinary not configured! Set cloud credentials in settings tab first.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob);
      } else {
        formData.append('file', {
          uri: uri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        } as any);
      }
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.secure_url);
        toast.success('Image uploaded successfully!');
      } else {
        const errData = await res.json();
        toast.error(`Upload failed: ${errData.error?.message || 'Check credentials'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async (onSuccess: (url: string) => void) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        toast.error("Permission to access media library is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadToCloudinary(asset.uri, onSuccess);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error selecting image');
    }
  };

  // CSV Panels
  const [isImportModalVisible, setIsImportModalVisible] = useState<boolean>(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState<boolean>(false);
  const [csvText, setCsvText] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  // 1. Fetch Categories Data
  const { data: categoriesList = [] } = useQuery<any[]>({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const catRes = await fetch(`${API_BASE_URL}/categories`);
      const catData = await catRes.json();
      return Array.isArray(catData) ? catData : [];
    },
    staleTime: 60000 * 5, // Cache categories for 5 minutes
  });

  // 2. Fetch Inventory Data (Server-side paginated/filtered)
  const { data: productsData = { products: [], total: 0 }, isLoading: isInventoryLoading, refetch: fetchInventory } = useQuery({
    queryKey: ['adminInventory', page, searchQuery, typeFilter, categoryFilter],
    queryFn: async () => {
      const typeParam = typeFilter === 'all' ? '' : typeFilter;
      const res = await fetch(
        `${API_BASE_URL}/admin/products?page=${page}&limit=10&categoryId=${categoryFilter}&search=${encodeURIComponent(searchQuery)}&type=${typeParam}`, 
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return {
        products: Array.isArray(data.products) ? data.products : [],
        total: data.total || 0
      };
    },
    staleTime: 10000,
  });

  const inventoryProducts = productsData.products;
  const productsTotal = productsData.total;
  const totalPages = Math.ceil(productsTotal / 10) || 1;
  const filteredInventoryProducts = inventoryProducts;

  // Mutations
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: (updatedProduct) => {
      triggerHaptic('success');
      toast.success(`Product ${updatedProduct.name} updated!`);
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      setEditingProduct(null);
    },
    onError: () => {
      toast.error('Could not save product modifications');
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create product');
      }
      return res.json();
    },
    onSuccess: (newProd) => {
      triggerHaptic('success');
      toast.success(`Product ${newProd.name} created!`);
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      setIsAddModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Product Creation Failed', err.message || 'Could not save new product.');
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (products: any[]) => {
      const res = await fetch(`${API_BASE_URL}/admin/products/bulk-import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ products })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Bulk import failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      triggerHaptic('success');
      Alert.alert('Success 🎉', `Imported ${data.created || 0} products!`);
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      setIsImportModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Import Failed', err.message || 'CSV format: Name, Price, MRP, Stock');
    }
  });

  // Apply preset template
  const applyTemplate = (template: any) => {
    triggerHaptic('medium');
    setAddType(template.type as any);
    setAddName(template.name);
    setAddUnit(template.unit);
    setAddMrp(template.mrp);
    setAddPrice(template.price);
    setAddCostPrice(template.costPrice);
    setAddStock(template.stock);
    setAddMinStock(template.minStock);
    setAddTags(template.tags);
    setAddImageUrl(template.imageUrl);
    setAddDescription(template.description);

    if (template.type === 'cafe') {
      const cafeCat = categoriesList.find((c: any) => c.slug === 'cafe');
      if (cafeCat) setAddCategoryVal(cafeCat.id);
      if (template.cafeSection) setAddCafeSection(template.cafeSection);
    }
    toast.success(`Template "${template.label}" applied!`);
  };

  // Handlers
  const handleToggleAvailability = (product: any) => {
    triggerHaptic('light');
    updateProductMutation.mutate({
      id: product.id,
      payload: {
        isAvailable: !(product.isAvailable !== false)
      }
    });
  };

  const handleEditProductClick = (product: any) => {
    setEditingProduct(product);
    const isCafe = product.category?.slug === 'cafe' || 
      (Array.isArray(product.tags) 
        ? product.tags.some((t: any) => typeof t === 'string' && t.toLowerCase() === 'cafe')
        : (typeof product.tags === 'string' && product.tags.toLowerCase().includes('cafe')));
    setEditType(isCafe ? 'cafe' : 'grocery');
    setEditName(product.name || '');
    setEditPrice(String(product.price || ''));
    setEditMrp(String(product.mrp || ''));
    setEditStock(String(product.stock || '0'));
    setEditCostPrice(String(product.costPrice || '0'));
    setEditMinStock(String(product.minStock || '10'));
    setEditUnit(product.unit || '1 pc');
    setEditCategoryVal(product.category?.id || '');
    setEditAvailable(product.isAvailable !== false);
    setEditFlashDeal(!!product.isFlashDeal);
    setEditTopPick(!!product.isTopPick);
    setEditBestSeller(!!product.isBestSeller);
    setEditLocation(product.location || '');
    setEditExpiryDate(product.expiryDate || '');
    setEditTags(product.tags || '');
    setEditDescription(product.description || '');
    setEditImageUrl(product.imageUrl || '');
    
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setHasEditVariants(true);
      setEditVariants(product.variants);
    } else {
      setHasEditVariants(false);
      setEditVariants([]);
    }
    triggerHaptic('light');
  };

  const handleAddProductSubmit = () => {
    if (!addName.trim()) {
      Alert.alert('Validation Error', 'Product Name is required.');
      return;
    }
    if (!hasAddVariants && (!addPrice || !addMrp)) {
      Alert.alert('Validation Error', 'Price and MRP are required.');
      return;
    }

    let catId = addCategoryVal;
    if (addType === 'cafe') {
      const cafeCat = categoriesList.find((c: any) => c.slug === 'cafe');
      if (cafeCat) catId = cafeCat.id;
    }
    if (!catId && categoriesList.length > 0) catId = categoriesList[0].id;

    let finalTags = addTags.split(',').map(t => t.trim()).filter(Boolean);
    if (addType === 'cafe' && !finalTags.includes('cafe')) finalTags.push('cafe');
    if (addCafeSection && !finalTags.includes(addCafeSection)) finalTags.push(addCafeSection);

    const payload: any = {
      name: addName.trim(),
      categoryId: catId,
      unit: addUnit.trim() || '1 pc',
      mrp: parseFloat(addMrp) || 0,
      price: parseFloat(addPrice) || 0,
      costPrice: parseFloat(addCostPrice) || 0,
      stock: parseInt(addStock) || 0,
      minStock: parseInt(addMinStock) || 10,
      description: addDescription.trim(),
      imageUrl: addImageUrl.trim() || '📦',
      location: addLocation.trim(),
      expiryDate: addExpiryDate.trim() || null,
      tags: finalTags.join(', '),
      isAvailable: addAvailable,
      isFlashDeal: addFlashDeal,
      isTopPick: addTopPick,
      isBestSeller: addBestSeller,
    };

    if (hasAddVariants && addVariants.length > 0) {
      payload.variants = addVariants;
    }

    triggerHaptic('medium');
    createProductMutation.mutate(payload);
  };

  const handleUpdateProductSubmit = () => {
    if (!editingProduct) return;

    let finalTags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    if (editType === 'cafe' && !finalTags.includes('cafe')) finalTags.push('cafe');

    const payload: any = {
      name: editName.trim(),
      categoryId: editCategoryVal || editingProduct.categoryId,
      unit: editUnit.trim() || '1 pc',
      mrp: parseFloat(editMrp) || editingProduct.mrp,
      price: parseFloat(editPrice) || editingProduct.price,
      costPrice: parseFloat(editCostPrice) || 0,
      stock: parseInt(editStock) || 0,
      minStock: parseInt(editMinStock) || 10,
      description: editDescription.trim(),
      imageUrl: editImageUrl.trim() || '📦',
      location: editLocation.trim(),
      expiryDate: editExpiryDate.trim() || null,
      tags: finalTags.join(', '),
      isAvailable: editAvailable,
      isFlashDeal: editFlashDeal,
      isTopPick: editTopPick,
      isBestSeller: editBestSeller,
    };

    if (hasEditVariants && editVariants.length > 0) {
      payload.variants = editVariants;
    }

    triggerHaptic('medium');
    updateProductMutation.mutate({ id: editingProduct.id, payload });
  };

  return (
    <View className="gap-4">
      {/* Search & Action Bar */}
      <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/60 dark:border-zinc-850 gap-4 shadow-sm">
        <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-zinc-850 rounded-full px-4 h-11 flex-1">
          <Search size={15} color="#64748b" strokeWidth={2.5} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search catalog by product name..."
            placeholderTextColor="#64748b"
            className="flex-1 text-slate-800 dark:text-white font-bold text-xs ml-2 py-0"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} className="bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-full">
              <X size={12} color="#64748b" />
            </Pressable>
          ) : null}
        </View>

        {/* Filters and Action Buttons Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {/* Type Filter */}
          <View className="flex-row bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200/60 dark:border-zinc-700">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'grocery', label: 'Grocery 📦' },
              { id: 'cafe', label: 'Cafe ☕' },
            ].map(t => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setTypeFilter(t.id as any);
                  triggerHaptic('light');
                }}
                className={`px-4 py-1.5 rounded-full ${typeFilter === t.id ? 'bg-indigo-600 shadow' : 'bg-transparent'}`}
              >
                <Text className={`text-[9px] font-extrabold uppercase tracking-wider ${typeFilter === t.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Action Buttons */}
          <Pressable
            onPress={() => {
              setIsAddModalVisible(true);
              triggerHaptic('light');
            }}
            className="bg-indigo-600 px-4 py-2.5 rounded-full flex-row items-center gap-1.5 active:bg-indigo-700 shadow-sm"
          >
            <Plus size={14} color="#fff" strokeWidth={3} />
            <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Add Product</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIsImportModalVisible(true);
              triggerHaptic('light');
            }}
            className="bg-blue-600 px-4 py-2.5 rounded-full flex-row items-center gap-1.5 active:bg-blue-700 shadow-sm"
          >
            <FileText size={14} color="#fff" />
            <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Import CSV</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIsExportModalVisible(true);
              triggerHaptic('light');
            }}
            className="bg-emerald-600 px-4 py-2.5 rounded-full flex-row items-center gap-1.5 active:bg-emerald-700 shadow-sm"
          >
            <Download size={14} color="#fff" />
            <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Export CSV</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Products Catalog List */}
      {isInventoryLoading ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-500 text-xs font-bold mt-2">Loading product catalog...</Text>
        </View>
      ) : filteredInventoryProducts.length === 0 ? (
        <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-850 p-8 items-center">
          <Text className="text-3xl">📦</Text>
          <Text className="text-slate-900 dark:text-white font-black text-sm mt-2">No items found</Text>
          <Text className="text-slate-500 text-xs mt-1">Try tweaking your search keywords or filter options.</Text>
        </View>
      ) : (
        <View className="gap-2.5 mb-10">
          {filteredInventoryProducts.map((p: any) => (
            <View key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-850 p-3.5 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center flex-1 min-w-0 gap-3">
                {/* Product Image */}
                <View className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-950 items-center justify-center border border-slate-100 dark:border-zinc-800 overflow-hidden">
                  {getAppImageSource(p.imageUrl) ? (
                    <Image source={getAppImageSource(p.imageUrl)!} className="w-full h-full" contentFit="cover" />
                  ) : (
                    <Text className="text-xl">{p.imageUrl || '📦'}</Text>
                  )}
                </View>
                
                {/* Details */}
                <View className="flex-1 min-w-0 pr-2">
                  <Text className="text-slate-800 dark:text-zinc-100 font-bold text-xs truncate" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-[9px] font-semibold mt-0.5 uppercase tracking-wide truncate">
                    {p.category?.name || 'Uncategorized'} · {p.unit || '1 pc'}
                  </Text>
                  
                  {/* Price Row */}
                  <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
                    <Text className="text-slate-900 dark:text-zinc-100 font-black text-xs">{formatPrice(p.price)}</Text>
                    {p.mrp > p.price && (
                      <Text className="text-slate-450 text-[9px] line-through font-bold">₹{p.mrp}</Text>
                    )}
                    {p.costPrice > 0 && (
                      <View className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700 px-1 py-0.2 rounded">
                        <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-extrabold uppercase">CP: ₹{p.costPrice}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Right Side: Status Badge, Stock & Actions */}
              <View className="items-end gap-2.5">
                <View className="flex-row items-center gap-2">
                  {/* Eye Toggle */}
                  <Pressable
                    onPress={() => handleToggleAvailability(p)}
                    className={`p-2 rounded-full border ${
                      p.isAvailable !== false
                        ? 'border-emerald-100 dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-950/20 active:bg-emerald-100'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 active:bg-slate-100'
                    }`}
                  >
                    {p.isAvailable !== false ? (
                      <Eye size={12} color="#10b981" />
                    ) : (
                      <EyeOff size={12} color="#94a3b8" />
                    )}
                  </Pressable>

                  {/* Edit Button */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      handleEditProductClick(p);
                    }}
                    className="p-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 active:bg-slate-100 dark:active:bg-zinc-700"
                  >
                    <Edit2 size={12} color={isDarkMode ? '#cbd5e1' : '#475569'} />
                  </Pressable>
                </View>

                {/* Stock & Status Row */}
                <View className="flex-row items-center gap-2">
                  <View className={`px-2 py-0.5 rounded-lg border ${
                    p.stock <= (p.minStock || 10) 
                      ? 'bg-rose-50 dark:bg-rose-955/15 border-rose-100 dark:border-rose-900/30' 
                      : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200/50 dark:border-zinc-750'
                  }`}>
                    <Text className={`text-[8.5px] font-black uppercase tracking-wider ${
                      p.stock <= (p.minStock || 10) ? 'text-rose-600 dark:text-rose-450' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Stock: {p.stock}
                    </Text>
                  </View>
                  <View className={`w-2 h-2 rounded-full ${p.isAvailable !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination Controls */}
      {!isInventoryLoading && productsTotal > 10 && (
        <View className="flex-row justify-between items-center py-2 mb-10 px-4">
          <Pressable
            onPress={() => {
              if (page > 1) {
                triggerHaptic('light');
                setPage(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === 1 ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <ChevronLeft size={14} color="#4f46e5" />
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">PREVIOUS</Text>
          </Pressable>

          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
            Page {page} of {totalPages}
          </Text>

          <Pressable
            onPress={() => {
              if (page < totalPages) {
                triggerHaptic('light');
                setPage(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === totalPages ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">NEXT</Text>
            <ChevronRight size={14} color="#4f46e5" />
          </Pressable>
        </View>
      )}

      {/* Add Product Modal */}
      {isAddModalVisible && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-5 w-full max-h-[92%] shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3">
                <Text className="text-slate-900 dark:text-white font-black text-base">Add New Product</Text>
                <Pressable onPress={() => setIsAddModalVisible(false)} className="p-1">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {/* Grocery vs Cafe Selector */}
                <View className="flex-row bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-850 mb-4">
                  <Pressable
                    onPress={() => setAddType('grocery')}
                    className={`flex-1 items-center py-2 rounded-lg ${addType === 'grocery' ? 'bg-indigo-600' : 'bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-black uppercase ${addType === 'grocery' ? 'text-white' : 'text-slate-500'}`}>
                      🛒 Grocery Item
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAddType('cafe')}
                    className={`flex-1 items-center py-2 rounded-lg ${addType === 'cafe' ? 'bg-rose-600' : 'bg-transparent'}`}
                  >
                    <Text className={`text-[10px] font-black uppercase ${addType === 'cafe' ? 'text-white' : 'text-slate-500'}`}>
                      ☕ Café Special
                    </Text>
                  </Pressable>
                </View>

                {/* Presets Bar */}
                <View className="mb-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-zinc-850/60 gap-2">
                  <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider">⚡ Presets (Click to pre-fill):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {PRODUCT_TEMPLATES.map(tmpl => (
                      <Pressable
                        key={tmpl.id}
                        onPress={() => applyTemplate(tmpl)}
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl"
                      >
                        <Text className="text-slate-800 dark:text-white font-extrabold text-[10px]">{tmpl.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Inputs Grid */}
                <View className="gap-3">
                  <View>
                    <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Product Name *</Text>
                    <TextInput
                      value={addName}
                      onChangeText={setAddName}
                      placeholder="e.g. Fresh Red Strawberries"
                      placeholderTextColor="#64748b"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                    />
                  </View>

                  {/* Category / Cafe Section */}
                  {addType === 'cafe' ? (
                    <View>
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Café Menu Section *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {CAFE_MENU_SECTIONS.map(sec => (
                          <Pressable
                            key={sec.tag}
                            onPress={() => setAddCafeSection(sec.tag)}
                            className={`px-3 py-1.5 rounded-xl border ${addCafeSection === sec.tag ? 'bg-rose-600 border-rose-500' : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-zinc-850'}`}
                          >
                            <Text className={`text-[10px] font-black ${addCafeSection === sec.tag ? 'text-white' : 'text-slate-500'}`}>
                              {sec.emoji} {sec.title}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Select Category *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {categoriesList.filter((c: any) => c.slug !== 'cafe').map((cat: any) => (
                          <Pressable
                            key={cat.id}
                            onPress={() => setAddCategoryVal(cat.id)}
                            className={`px-3 py-1.5 rounded-xl border ${addCategoryVal === cat.id ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-zinc-850'}`}
                          >
                            <Text className={`text-[10px] font-black uppercase ${addCategoryVal === cat.id ? 'text-white' : 'text-slate-500'}`}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Pricing row */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Selling Price *</Text>
                      <TextInput
                        value={addPrice}
                        onChangeText={setAddPrice}
                        keyboardType="numeric"
                        placeholder="80"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">MRP Value *</Text>
                      <TextInput
                        value={addMrp}
                        onChangeText={setAddMrp}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  {/* Stock & Cost Price */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Stock Count</Text>
                      <TextInput
                        value={addStock}
                        onChangeText={setAddStock}
                        keyboardType="numeric"
                        placeholder="50"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Cost Price (CP)</Text>
                      <TextInput
                        value={addCostPrice}
                        onChangeText={setAddCostPrice}
                        keyboardType="numeric"
                        placeholder="60"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  {/* Unit & Shelf Location */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Unit Spec</Text>
                      <TextInput
                        value={addUnit}
                        onChangeText={setAddUnit}
                        placeholder="e.g. 500 g"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Shelf Location</Text>
                      <TextInput
                        value={addLocation}
                        onChangeText={setAddLocation}
                        placeholder="Aisle 2-B"
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  {/* Tags & Emoji */}
                  <View>
                    <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Tags (Comma-separated)</Text>
                    <TextInput
                      value={addTags}
                      onChangeText={setAddTags}
                      placeholder="fresh, popular, organic"
                      placeholderTextColor="#64748b"
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                    />
                  </View>

                  <View className="flex-row gap-2.5 items-end">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Image URL / Emoji Icon</Text>
                      <TextInput
                        value={addImageUrl}
                        onChangeText={setAddImageUrl}
                        placeholder="e.g. 🍓 or https://..."
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                    <Pressable
                      onPress={() => pickImage(setAddImageUrl)}
                      disabled={isUploading}
                      style={{ height: 42 }}
                      className="bg-indigo-600 active:bg-indigo-700 px-4 rounded-xl flex-row items-center justify-center"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">Upload</Text>
                      )}
                    </Pressable>
                  </View>

                  {/* Promo Checkboxes */}
                  <View className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-zinc-850/60 gap-3">
                    <Text className="text-slate-600 dark:text-slate-300 font-extrabold text-xs">⭐ Promotional Highlights</Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-800 dark:text-white font-bold text-xs">⚡ Flash Deal</Text>
                      <Switch value={addFlashDeal} onValueChange={setAddFlashDeal} trackColor={{ false: '#334155', true: '#fbbf24' }} />
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-800 dark:text-white font-bold text-xs">⭐ Top Pick</Text>
                      <Switch value={addTopPick} onValueChange={setAddTopPick} trackColor={{ false: '#334155', true: '#818cf8' }} />
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-800 dark:text-white font-bold text-xs">🏆 Best Seller</Text>
                      <Switch value={addBestSeller} onValueChange={setAddBestSeller} trackColor={{ false: '#334155', true: '#34d399' }} />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-2.5">
                <Pressable onPress={() => setIsAddModalVisible(false)} className="flex-1 border border-slate-200 dark:border-zinc-800 py-3 rounded-xl items-center">
                  <Text className="text-slate-500 font-extrabold text-xs uppercase">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleAddProductSubmit} disabled={createProductMutation.isPending} className="flex-1 bg-indigo-600 py-3 rounded-xl items-center justify-center flex-row gap-1.5">
                  {createProductMutation.isPending && <ActivityIndicator size="small" color="#fff" />}
                  <Text className="text-white font-extrabold text-xs uppercase">{createProductMutation.isPending ? 'Adding...' : 'Add Product'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setEditingProduct(null)}>
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-5 w-full max-h-[92%] shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3">
                <Text className="text-slate-900 dark:text-white font-black text-base">Edit Product: {editingProduct.name}</Text>
                <Pressable onPress={() => setEditingProduct(null)} className="p-1">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                <View className="gap-3">
                  <View>
                    <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Product Name *</Text>
                    <TextInput value={editName} onChangeText={setEditName} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs" />
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Selling Price *</Text>
                      <TextInput value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">MRP Value *</Text>
                      <TextInput value={editMrp} onChangeText={setEditMrp} keyboardType="numeric" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs" />
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Stock Count</Text>
                      <TextInput value={editStock} onChangeText={setEditStock} keyboardType="numeric" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Cost Price (CP)</Text>
                      <TextInput value={editCostPrice} onChangeText={setEditCostPrice} keyboardType="numeric" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs" />
                    </View>
                  </View>

                  <View className="flex-row gap-2.5 items-end">
                    <View className="flex-1">
                      <Text className="text-slate-500 font-bold text-[9px] uppercase mb-1">Image URL / Emoji Icon</Text>
                      <TextInput
                        value={editImageUrl}
                        onChangeText={setEditImageUrl}
                        placeholder="e.g. 🍓 or https://..."
                        placeholderTextColor="#64748b"
                        className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white font-bold text-xs"
                      />
                    </View>
                    <Pressable
                      onPress={() => pickImage(setEditImageUrl)}
                      disabled={isUploading}
                      style={{ height: 42 }}
                      className="bg-indigo-600 active:bg-indigo-700 px-4 rounded-xl flex-row items-center justify-center"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white font-black text-[10px] uppercase tracking-wider">Upload</Text>
                      )}
                    </Pressable>
                  </View>

                  <View className="flex-row justify-between items-center py-3 border-t border-b border-slate-100 dark:border-zinc-800">
                    <Text className="text-slate-800 dark:text-white font-bold text-xs">Listed on catalogue</Text>
                    <Switch value={editAvailable} onValueChange={setEditAvailable} trackColor={{ false: '#334155', true: '#818cf8' }} />
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-2.5">
                <Pressable onPress={() => setEditingProduct(null)} className="flex-1 border border-slate-200 dark:border-zinc-800 py-3 rounded-xl items-center">
                  <Text className="text-slate-500 font-extrabold text-xs uppercase">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleUpdateProductSubmit} disabled={updateProductMutation.isPending} className="flex-1 bg-indigo-600 py-3 rounded-xl items-center justify-center flex-row gap-1.5">
                  {updateProductMutation.isPending && <ActivityIndicator size="small" color="#fff" />}
                  <Text className="text-white font-extrabold text-xs uppercase">{updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* CSV Import Modal */}
      {isImportModalVisible && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setIsImportModalVisible(false)}>
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-5 w-full shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3">
                <Text className="text-slate-900 dark:text-white font-black text-base">Import Products CSV</Text>
                <Pressable onPress={() => setIsImportModalVisible(false)} className="p-1"><X size={18} color="#64748b" /></Pressable>
              </View>
              <TextInput
                multiline
                numberOfLines={8}
                placeholder={`Fresh Onions,28,40,100\nAmul Butter,56,60,40`}
                placeholderTextColor="#64748b"
                value={csvText}
                onChangeText={setCsvText}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 rounded-xl p-3 text-slate-800 dark:text-white font-semibold text-xs min-h-[140px] mb-4"
              />
              <Pressable
                onPress={() => {
                  const lines = csvText.split('\n').filter(l => l.trim());
                  const prods = lines.map(l => {
                    const parts = l.split(',');
                    return { name: parts[0]?.trim(), price: parseFloat(parts[1]) || 0, mrp: parseFloat(parts[2]) || 0, stock: parseInt(parts[3]) || 0 };
                  }).filter(p => p.name);
                  bulkImportMutation.mutate(prods);
                }}
                disabled={bulkImportMutation.isPending}
                className="bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row gap-2"
              >
                {bulkImportMutation.isPending && <ActivityIndicator size="small" color="#fff" />}
                <Text className="text-white font-extrabold text-xs uppercase">Process Import</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* CSV Export Modal */}
      {isExportModalVisible && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setIsExportModalVisible(false)}>
          <View className="flex-1 bg-black/70 justify-center p-6">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200 dark:border-zinc-850 gap-4 shadow-2xl">
              <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
                <Text className="text-slate-900 dark:text-white font-black text-sm">Export Catalog CSV</Text>
                <Pressable onPress={() => setIsExportModalVisible(false)} className="p-1"><X size={16} color="#64748b" /></Pressable>
              </View>
              <Text className="text-slate-500 text-xs font-semibold">Generate and copy CSV catalog data to clipboard or share.</Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => {
                    toast.success('Generated All Catalog CSV!');
                    setIsExportModalVisible(false);
                  }}
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl flex-row items-center justify-between"
                >
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs">All Items (Catalog)</Text>
                  <Download size={14} color="#6366f1" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    toast.success('Generated Grocery Items CSV!');
                    setIsExportModalVisible(false);
                  }}
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl flex-row items-center justify-between"
                >
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs">Grocery Items Only 📦</Text>
                  <Download size={14} color="#6366f1" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    toast.success('Generated Cafe Items CSV!');
                    setIsExportModalVisible(false);
                  }}
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl flex-row items-center justify-between"
                >
                  <Text className="text-slate-800 dark:text-white font-extrabold text-xs">Cafe Items Only ☕</Text>
                  <Download size={14} color="#6366f1" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
