// Centralised React Query keys for precise invalidation across the app.
// Keep keys grouped by domain. Used by lib/sync-service.ts for selective refresh.

export const queryKeys = {
  // ── Restaurants ──
  restaurants: {
    all: ['restaurants'] as const,
    list: (filters?: Record<string, unknown>) => ['restaurants', 'list', filters || {}] as const,
    listing: ['restaurants', 'listing'] as const,
    detail: (slug: string) => ['restaurants', 'detail', slug] as const,
    featured: ['restaurants', 'featured'] as const,
  },

  // ── Menu / Products ──
  menu: {
    all: ['menu'] as const,
    byRestaurant: (slug: string) => ['menu', 'restaurant', slug] as const,
  },
  products: {
    all: () => ['products'] as const,
    list: (storeId?: string) => ['products', 'list', storeId || 'default'] as const,
    category: (slug: string, storeId?: string) => ['products', 'category', slug, storeId || 'default'] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    related: (catSlug: string) => ['products', 'related', catSlug] as const,
    flashDeals: ['products', 'flash-deals'] as const,
    featured: ['products', 'featured'] as const,
  },

  // ── Categories ──
  categories: {
    all: () => ['categories', 'all'] as const,
    list: () => ['categories', 'list'] as const,
    trending: () => ['categories', 'trending'] as const,
  },

  // ── Orders ──
  orders: {
    all: ['orders'] as const,
    active: () => ['orders', 'active'] as const,
    history: () => ['orders', 'history'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },

  // ── Cart (rarely a fetch; mostly Zustand) ──
  cart: {
    all: ['cart'] as const,
    validation: (storeId: string) => ['cart', 'validation', storeId] as const,
  },

  // ── Profile / user ──
  profile: {
    all: ['profile'] as const,
    addresses: ['profile', 'addresses'] as const,
  },

  // ── Reviews ──
  reviews: {
    all: ['reviews'] as const,
    byRestaurant: (slug: string) => ['reviews', 'restaurant', slug] as const,
    byProduct: (slug: string) => ['reviews', 'product', slug] as const,
  },

  // ── Store settings ──
  settings: {
    all: ['settings'] as const,
    store: () => ['store-settings'] as const,
    banners: ['banners'] as const,
  },

  // ── Misc ──
  search: {
    results: (query: string) => ['search', query] as const,
  },
  home: {
    feed: ['home', 'feed'] as const,
  },
};