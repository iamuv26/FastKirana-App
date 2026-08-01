/**
 * lib/smart-sync.ts
 *
 * Conditional background sync that only refetches when the server
 * says data actually changed. Uses If-None-Match / ETag to short-circuit
 * the request when nothing changed — zero idle traffic when menu
 * is stable, full reactivity when admin pushes an update.
 *
 * Strategy:
 *   1. Hit /sync/{type} with If-None-Match (lightweight probe)
 *   2. Server returns 304 Not Modified → skip refetch entirely
 *   3. Server returns 200 → invalidate cache so React Query refetches
 *
 * Works automatically against any backend that supports ETag / 304,
 * and silently falls back to always-refetch when the server doesn't.
 */

import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from './query-keys';
import { API_BASE_URL } from './constants';
import { toast } from './toast';
import { useUIStore } from '../stores/ui-store';

// ──────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────

export type SyncTarget =
  | 'restaurants'
  | 'menu'
  | 'products'
  | 'categories'
  | 'orders'
  | 'settings'
  | 'banners';

interface SyncEndpoint {
  endpoint: SyncTarget;
  queryKeys: readonly (readonly unknown[])[];
  queryKey?: readonly unknown[];
}

const SYNC_ENDPOINTS: SyncEndpoint[] = [
  { endpoint: 'restaurants', queryKeys: [queryKeys.restaurants.all] },
  { endpoint: 'menu',        queryKeys: [queryKeys.menu.all] },
  { endpoint: 'products',    queryKeys: [queryKeys.products.all()] },
  { endpoint: 'categories',  queryKeys: [queryKeys.categories.all(), queryKeys.categories.trending()] },
  { endpoint: 'orders',      queryKeys: [queryKeys.orders.all] },
  { endpoint: 'settings',    queryKeys: [queryKeys.settings.all] },
  { endpoint: 'banners',     queryKeys: [queryKeys.settings.banners] },
];

// ──────────────────────────────────────────────────────────────
//  ETAG CACHE
// ──────────────────────────────────────────────────────────────

const etagCache = new Map<string, string | undefined>();

function etagQueryKey(queryKey: readonly unknown[]): string[] {
  return [...queryKey, 'etag'] as string[];
}

// fetchWithTimeout — wraps fetch with a timeout that works on old RN runtimes
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 5_000
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────────────────────
//  CORE: checkOne — single endpoint probe
// ──────────────────────────────────────────────────────────────

async function checkOne(
  queryClient: QueryClient,
  { endpoint, queryKeys: keys }: SyncEndpoint
): Promise<boolean> {
  const cachedEtag = etagCache.get(endpoint);

  // ── 1. Try dedicated /sync/{type} endpoint (returns ETag only, no body) ──
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE_URL}/sync/${endpoint}`, {
      method: 'GET',
      headers: {
        'If-None-Match': cachedEtag || '',
        Accept: 'application/json',
      },
    });
  } catch {
    return false;
  }

  // ── 2. Fallback: HEAD request on the standard endpoint if /sync isn't implemented ──
  if (res.status === 404 || res.status === 405) {
    try {
      const fallbackUrl =
        endpoint === 'banners'
          ? `${API_BASE_URL}/banners`
          : `${API_BASE_URL}/${endpoint}`;
      res = await fetchWithTimeout(fallbackUrl, {
        method: 'HEAD',
        headers: { 'If-None-Match': cachedEtag || '' },
      });
    } catch {
      return false;
    }
  }

  // ── 3. 304 Not Modified → server says nothing changed. Skip refetch. ──
  if (res.status === 304) {
    return false;
  }

  if (res.ok) {
    const newEtag =
      res.headers.get('ETag') || res.headers.get('X-ETag') || undefined;

    if (newEtag) {
      etagCache.set(endpoint, newEtag);
      keys.forEach((k) => queryClient.setQueryData([...k, 'etag'], newEtag));
    } else if (!cachedEtag) {
      // Server doesn't support ETag — fall back to refetching every time.
      keys.forEach((k) =>
        queryClient.invalidateQueries({ queryKey: k, refetchType: 'active' })
      );
      return true;
    }

    // ETag was sent and the server returned 200 (changed) — invalidate + refetch
    keys.forEach((k) =>
      queryClient.invalidateQueries({ queryKey: k, refetchType: 'active' })
    );
    return true;
  }

  return false;
}

// ──────────────────────────────────────────────────────────────
//  CONDITIONAL SYNC  (the heart of the savings)
// ──────────────────────────────────────────────────────────────

/**
 * Probe every endpoint. Only refetch those whose ETag actually changed.
 * Returns the list of endpoints that did change (empty array = nothing new).
 */
export async function conditionalSync(queryClient: QueryClient): Promise<SyncTarget[]> {
  const changed: SyncTarget[] = [];

  await Promise.allSettled(
    SYNC_ENDPOINTS.map(async ({ endpoint, queryKeys: keys }) => {
      const didChange = await checkOne(queryClient, { endpoint, queryKeys: keys });
      if (didChange) changed.push(endpoint);
    })
  );

  return changed;
}

/**
 * Full unconditional sync — for pull-to-refresh and on user action.
 * Always hits the server directly, bypassing the ETag short-circuit.
 */
export async function forceSyncAll(queryClient: QueryClient) {
  await Promise.allSettled(
    SYNC_ENDPOINTS.map(({ queryKey }) =>
      queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
    )
  );
}

// ──────────────────────────────────────────────────────────────
//  HOOK: useSmartAutoSync  — every 30s probe, refetch only if changed
// ──────────────────────────────────────────────────────────────

export interface SmartAutoSyncOptions {
  /** Poll interval in ms. Default 30s. */
  interval?: number;
  /** Whether to run when app backgrounded. Default false. */
  runInBackground?: boolean;
  /** Master enable/disable. */
  enabled?: boolean;
  /** Show silent toast when data changed. Default false. */
  showToastOnChange?: boolean;
}

export function useSmartAutoSync(options: SmartAutoSyncOptions = {}) {
  const {
    interval = 30_000,
    runInBackground = false,
    enabled = true,
    showToastOnChange = false,
  } = options;
  const queryClient = useQueryClient();
  const isLocationConfirmed = useUIStore((s) => s.isLocationConfirmed);

  useEffect(() => {
    if (!enabled || !isLocationConfirmed) return;

    const timer = setInterval(async () => {
      const isBackground =
        typeof document !== 'undefined' && document.hidden === true;
      if (isBackground && !runInBackground) return;

      const changed = await conditionalSync(queryClient);

      if (changed.length > 0 && showToastOnChange) {
        toast.info('Menu updated');
      }
    }, interval);

    return () => clearInterval(timer);
  }, [queryClient, interval, runInBackground, enabled, showToastOnChange, isLocationConfirmed]);
}

// ──────────────────────────────────────────────────────────────
//  HOOK: useForegroundRefresh  — refresh only when actually returned
// ──────────────────────────────────────────────────────────────

export function useForegroundRefresh(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const lastRefresh = { current: 0 };

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') return;

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefresh.current < 10_000) return;
      lastRefresh.current = now;

      await conditionalSync(queryClient);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient, enabled]);
}

// ──────────────────────────────────────────────────────────────
//  EXPORT
// ──────────────────────────────────────────────────────────────

export const smartSync = {
  conditionalSync,
  forceSyncAll,
  useSmartAutoSync,
  useForegroundRefresh,
};
