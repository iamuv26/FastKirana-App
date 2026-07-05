import { useCartStore, CartProduct } from '../stores/cart-store';
import { useUIStore } from '../stores/ui-store';
import { toast } from '../lib/toast';
import { isCafeProduct } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { playCartPop } from '../lib/audio';
import { GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD, COMBINED_FREE_DELIVERY_THRESHOLD } from '../lib/constants';

export function useCart() {
  const store = useCartStore();

  const checkFreeDeliveryUnlock = (action: () => void) => {
    const prevItems = [...store.items];
    const getCategorySubtotal = (itemsList: typeof store.items, checkCafe: boolean) => 
      itemsList.filter((item) => isCafeProduct(item.product) === checkCafe)
               .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const prevGrocerySub = getCategorySubtotal(prevItems, false);
    const prevCafeSub = getCategorySubtotal(prevItems, true);
    const prevTotal = prevGrocerySub + prevCafeSub;

    action();

    const newItems = useCartStore.getState().items;
    const newGrocerySub = getCategorySubtotal(newItems, false);
    const newCafeSub = getCategorySubtotal(newItems, true);
    const newTotal = newGrocerySub + newCafeSub;

    const hasGrocery = newItems.some(i => !isCafeProduct(i.product));
    const hasCafe = newItems.some(i => isCafeProduct(i.product));

    if (hasGrocery && hasCafe) {
      if (prevTotal < COMBINED_FREE_DELIVERY_THRESHOLD && newTotal >= COMBINED_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Combined delivery unlocked!');
        }, 300);
      }
    } else if (hasGrocery) {
      if (prevGrocerySub < GROCERY_FREE_DELIVERY_THRESHOLD && newGrocerySub >= GROCERY_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Grocery delivery unlocked!');
        }, 300);
      }
    } else if (hasCafe) {
      if (prevCafeSub < CAFE_FREE_DELIVERY_THRESHOLD && newCafeSub >= CAFE_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Cafe delivery unlocked!');
        }, 300);
      }
    }
  };

  const addItem = (product: CartProduct) => {
    const { groceryMartOpen, cafeOpen } = useUIStore.getState();
    const isCafe = isCafeProduct(product);
    
    if (isCafe && !cafeOpen) {
      triggerHaptic('warning');
      toast.error(`FastKirana Cafe is temporarily closed. Cannot add ${product.name}.`);
      return;
    }
    if (!isCafe && !groceryMartOpen) {
      triggerHaptic('warning');
      toast.error(`Grocery Mart is temporarily closed. Cannot add ${product.name}.`);
      return;
    }
    if (product.stock <= 0) {
      triggerHaptic('warning');
      toast.error(`Sorry, ${product.name} is out of stock!`);
      return;
    }

    checkFreeDeliveryUnlock(() => {
      store.addItem(product);
    });
    playCartPop();
    triggerHaptic('light');
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, name: string, quantity: number) => {
    const currentQty = store.getItemQuantity(productId);

    if (quantity > currentQty) {
      const { groceryMartOpen, cafeOpen } = useUIStore.getState();
      const item = store.items.find((i) => i.product.id === productId);
      if (item) {
        if (quantity > item.product.stock) {
          triggerHaptic('warning');
          toast.error(`Cannot add more. Only ${item.product.stock} units available.`);
          return;
        }
        const isCafe = isCafeProduct(item.product);
        if (isCafe && !cafeOpen) {
          triggerHaptic('warning');
          toast.error(`FastKirana Cafe is temporarily closed.`);
          return;
        }
        if (!isCafe && !groceryMartOpen) {
          triggerHaptic('warning');
          toast.error(`Grocery Mart is temporarily closed.`);
          return;
        }
      }
    }

    checkFreeDeliveryUnlock(() => {
      store.updateQuantity(productId, quantity);
    });
    if (quantity > currentQty) {
      playCartPop();
    }
    triggerHaptic('light');

    if (quantity > currentQty) {
      toast.success(`Increased ${name} quantity`);
    } else if (quantity < currentQty && quantity > 0) {
      toast.success(`Decreased ${name} quantity`);
    } else if (quantity === 0) {
      toast.success(`${name} removed from cart`);
    }
  };

  const removeItem = (productId: string, name: string) => {
    checkFreeDeliveryUnlock(() => {
      store.removeItem(productId);
    });
    triggerHaptic('medium');
    toast.success(`${name} removed from cart`);
  };

  return {
    items: store.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart: store.clearCart,
    getItemQuantity: store.getItemQuantity,
    getTotalItems: store.getTotalItems,
    getSubtotal: store.getSubtotal,
    getMrpTotal: store.getMrpTotal,
    getSavings: store.getSavings,
    updateCartProduct: store.updateCartProduct,
    updateItemNotes: store.updateItemNotes,
  };
}

export function useCartActions() {
  const addItemStore = useCartStore((s) => s.addItem);
  const updateQuantityStore = useCartStore((s) => s.updateQuantity);
  const removeItemStore = useCartStore((s) => s.removeItem);

  const checkFreeDeliveryUnlock = (action: () => void) => {
    const state = useCartStore.getState();
    const prevItems = [...state.items];
    const getCategorySubtotal = (itemsList: typeof state.items, checkCafe: boolean) => 
      itemsList.filter((item) => isCafeProduct(item.product) === checkCafe)
               .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const prevGrocerySub = getCategorySubtotal(prevItems, false);
    const prevCafeSub = getCategorySubtotal(prevItems, true);
    const prevTotal = prevGrocerySub + prevCafeSub;

    action();

    const newItems = useCartStore.getState().items;
    const newGrocerySub = getCategorySubtotal(newItems, false);
    const newCafeSub = getCategorySubtotal(newItems, true);
    const newTotal = newGrocerySub + newCafeSub;

    const hasGrocery = newItems.some(i => !isCafeProduct(i.product));
    const hasCafe = newItems.some(i => isCafeProduct(i.product));

    if (hasGrocery && hasCafe) {
      if (prevTotal < COMBINED_FREE_DELIVERY_THRESHOLD && newTotal >= COMBINED_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Combined delivery unlocked!');
        }, 300);
      }
    } else if (hasGrocery) {
      if (prevGrocerySub < GROCERY_FREE_DELIVERY_THRESHOLD && newGrocerySub >= GROCERY_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Grocery delivery unlocked!');
        }, 300);
      }
    } else if (hasCafe) {
      if (prevCafeSub < CAFE_FREE_DELIVERY_THRESHOLD && newCafeSub >= CAFE_FREE_DELIVERY_THRESHOLD) {
        setTimeout(() => {
          triggerHaptic('success');
          toast.success('🎉 FREE Cafe delivery unlocked!');
        }, 300);
      }
    }
  };

  const addItem = (product: CartProduct) => {
    const { groceryMartOpen, cafeOpen } = useUIStore.getState();
    const isCafe = isCafeProduct(product);
    
    if (isCafe && !cafeOpen) {
      triggerHaptic('warning');
      toast.error(`FastKirana Cafe is temporarily closed. Cannot add ${product.name}.`);
      return;
    }
    if (!isCafe && !groceryMartOpen) {
      triggerHaptic('warning');
      toast.error(`Grocery Mart is temporarily closed. Cannot add ${product.name}.`);
      return;
    }
    if (product.stock <= 0) {
      triggerHaptic('warning');
      toast.error(`Sorry, ${product.name} is out of stock!`);
      return;
    }

    checkFreeDeliveryUnlock(() => {
      addItemStore(product);
    });
    playCartPop();
    triggerHaptic('light');
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, name: string, quantity: number) => {
    const state = useCartStore.getState();
    const currentQty = state.getItemQuantity(productId);

    if (quantity > currentQty) {
      const { groceryMartOpen, cafeOpen } = useUIStore.getState();
      const item = state.items.find((i) => i.product.id === productId);
      if (item) {
        if (quantity > item.product.stock) {
          triggerHaptic('warning');
          toast.error(`Cannot add more. Only ${item.product.stock} units available.`);
          return;
        }
        const isCafe = isCafeProduct(item.product);
        if (isCafe && !cafeOpen) {
          triggerHaptic('warning');
          toast.error(`FastKirana Cafe is temporarily closed.`);
          return;
        }
        if (!isCafe && !groceryMartOpen) {
          triggerHaptic('warning');
          toast.error(`Grocery Mart is temporarily closed.`);
          return;
        }
      }
    }

    checkFreeDeliveryUnlock(() => {
      updateQuantityStore(productId, quantity);
    });
    if (quantity > currentQty) {
      playCartPop();
    }
    triggerHaptic('light');

    if (quantity > currentQty) {
      toast.success(`Increased ${name} quantity`);
    } else if (quantity < currentQty && quantity > 0) {
      toast.success(`Decreased ${name} quantity`);
    } else if (quantity === 0) {
      toast.success(`${name} removed from cart`);
    }
  };

  const removeItem = (productId: string, name: string) => {
    checkFreeDeliveryUnlock(() => {
      removeItemStore(productId);
    });
    triggerHaptic('medium');
    toast.success(`${name} removed from cart`);
  };

  return {
    addItem,
    removeItem,
    updateQuantity,
  };
}
