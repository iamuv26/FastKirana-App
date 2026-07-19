export const queryKeys = {
  products: {
    all: () => ['products'] as const,
    list: (storeId?: string) => ['products', 'list', storeId || 'default'] as const,
    category: (slug: string, storeId?: string) => ['products', 'category', slug, storeId || 'default'] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    related: (catSlug: string) => ['products', 'related', catSlug] as const,
  },
  categories: {
    all: () => ['categories', 'all'] as const,
    list: () => ['categories', 'list'] as const,
  },
  orders: {
    active: () => ['orders', 'active'] as const,
  },
  settings: {
    store: () => ['store-settings'] as const,
  },
};
