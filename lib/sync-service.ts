/**
 * lib/sync-service.ts
 *
 * Central sync orchestration for the app.
 *
 * Responsibilities:
 * 1. Pull-to-refresh hydration for every screen
 * 2. Background polling of critical data (restaurants, orders, settings)
 * 3. Smart cache invalidation after user actions (add-to-cart, checkout, etc.)
 * 4. App-foreground refresh
 *
 * Usage:
 *   import { usePullToRefresh, useAutoSync, useAppForegroundRefresh, syncAll } from '@/lib/sync-service';
 */

import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { toast } from './toast';
import { queryKeys } from './query-keys';
import { useUIStore } from '../stores/ui-store';

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

export type ScreenKey =
  | 'home'
  | 'restaurants'
  | 'menu'
  | 'orders'
  | 'profile'
  | 'cart'
  | 'checkout'
  | 'cafe'
  | 'grocery'
  | 'reviews';

export interface SyncOptions {
  /** Pull-to-refresh function (triggered by user) */
  onRefresh?: () => Promise<void>;
  /** Which screens to invalidate after this action */
  invalidateAfter?: ScreenKey[];
  /** Whether to show a success toast */
  showToast?: boolean;
  /** Custom toast message */
  toastMessage?: string;
}

// ─────────────────────────────────────────────
//  CORE SYNC FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Invalidate all key data groups. Call for full refresh.
 * Used by pull-to-refresh and foreground switch.
 */
export async function syncAll(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all(), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.home.feed, refetchType: 'active' }),
  ]);
}

/**
 * Targeted refresh after adding something to cart.
 * Invalidates menu stock + cart totals only (lighter than full sync).
 */
export async function syncAfterCartAction(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), refetchType: 'active' }),
  ]);
}

/**
 * Targeted refresh after placing order.
 */
export async function syncAfterOrderPlacement(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), refetchType: 'active' }),
  ]);
}

/**
 * Refresh restaurant + menu after admin updates a restaurant.
 */
export async function syncAfterRestaurantUpdate(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.home.feed }),
  ]);
}

/**
 * Refresh after admin updates product pricing or stock.
 */
export async function syncAfterProductUpdate(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all(), refetchType: 'active' }),
  ]);
}

/**
 * Refresh store settings (open/closed, delivery fee, etc.)
 */
export async function syncAfterSettingsChange(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: queryKeys.settings.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
  ]);
}

// ─────────────────────────────────────────────
//  HOOK: usePullToRefresh
//  Drop-in hook for RefreshControl on any screen
// ─────────────────────────────────────────────

export function usePullToRefresh(
  screen: ScreenKey,
  options?: SyncOptions
) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { toastMessage = 'Refreshed', showToast = true } = options || {};

  const refresh = async () => {
    setRefreshing(true);
    try {
      await syncAll(queryClient);
      if (showToast) toast.success(toastMessage);
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = useRef(() => refresh());

  return {
    refreshing,
    onRefresh: handleRefresh.current,
    refresh,
  };
}

// ─────────────────────────────────────────────
//  HOOK: useAutoSync
//  Background polling — refetches critical queries on interval
// ─────────────────────────────────────────────

export interface UseAutoSyncOptions {
  /** Poll interval in ms. Default 30 seconds */
  interval?: number;
  /** Whether to run when app is in background. Default false */
  runInBackground?: boolean;
  /** Stop condition */
  enabled?: boolean;
}

export function useAutoSync(options: UseAutoSyncOptions = {}) {
  const { interval = 30_000, runInBackground = false, enabled = true } = options;
  const queryClient = useQueryClient();
  const isLocationConfirmed = useUIStore((s) => s.isLocationConfirmed);

  useEffect(() => {
    if (!enabled || !isLocationConfirmed) return;

    const timer = setInterval(() => {
      const isBackground =
        typeof document !== 'undefined' && document.hidden === true;
      if (isBackground && !runInBackground) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.restaurants.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.banners,
        refetchType: 'active',
      });
    }, interval);

    return () => clearInterval(timer);
  }, [queryClient, interval, runInBackground, enabled, isLocationConfirmed]);
}

// ─────────────────────────────────────────────
//  HOOK: usePostActionSync
//  After placing order, adding to cart, reviewing, etc.
// ─────────────────────────────────────────────

interface UsePostActionSyncOptions {
  /** Called after successful action */
  onAction: () => Promise<void>;
  /** Which sync to run */
  syncFn?: 'cart' | 'order' | 'restaurant' | 'product' | 'settings' | 'all';
  /** Whether to auto-refresh */
  enabled?: boolean;
}

const syncFns: Record<string, (qc: QueryClient) => Promise<void>> = {
  cart: syncAfterCartAction,
  order: syncAfterOrderPlacement,
  restaurant: syncAfterRestaurantUpdate,
  product: syncAfterProductUpdate,
  settings: syncAfterSettingsChange,
  all: syncAll,
};

export function usePostActionSync(opts: UsePostActionSyncOptions) {
  const { onAction, syncFn = 'cart', enabled = true } = opts;
  const queryClient = useQueryClient();

  const wrappedAction = async () => {
    await onAction();
    if (enabled) {
      await syncFns[syncFn]?.(queryClient);
    }
  };

  return wrappedAction;
}

// ─────────────────────────────────────────────
//  HOOK: useAppForegroundRefresh
//  Detect when app comes to foreground and refresh data.
//  Works for web (visibilitychange) and React Native (AppState).
// ─────────────────────────────────────────────

export function useAppForegroundRefresh(
  onRefresh?: () => Promise<void>,
  options: { enabled?: boolean; intervalMs?: number } = {}
) {
  const { enabled = true, intervalMs = 10_000 } = options;
  const queryClient = useQueryClient();
  const refreshFn = onRefresh || (() => syncAll(queryClient));
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefresh.current >= intervalMs) {
          lastRefresh.current = now;
          try {
            await refreshFn();
          } catch {
            // silent
          }
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }

    // React Native — handled by AppState listener at app root level
  }, [queryClient, refreshFn, enabled, intervalMs]);
}

// ─────────────────────────────────────────────
//  RE-EXPORT
// ─────────────────────────────────────────────

const syncService = {
  syncAll,
  syncAfterCartAction,
  syncAfterOrderPlacement,
  syncAfterRestaurantUpdate,
  syncAfterProductUpdate,
  syncAfterSettingsChange,
  usePullToRefresh,
  useAutoSync,
  usePostActionSync,
  useAppForegroundRefresh,
};

export default syncService;
