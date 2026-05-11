import { create } from "zustand";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── TYPES ────────────────────────────────────────────────────
export interface Category { id: number; name: string; }

export interface Product {
  id: number; 
  name: string; 
  description: string; 
  original_price: string; // Changed from price to original_price
  current_price: string;  // Added from your new backend logic
  compare_at_price: string | null; 
  quantity: number; 
  image_url: string | null; 
  category: string;
  is_discounted: boolean;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: string | null;
  discount_end: string | null;
}

export interface Banner {
  id: number; product_id: number; image_url: string; label: string | null; badge: string | null; product_name: string; price: string;
}
export interface CartItem { product: Product; quantity: number; }
export interface OrderPayload {
  customer_name: string; customer_email: string; phone_number: string; address: string; city: string; payment_type: "ON_DELIVERY" | "CARD"; items: { product_id: number; quantity: number }[];
}
export interface OrderStatus {
  id: number; order_status: string; payment_status: string; total_amount: string; created_at: string; items: { product_name: string; quantity: number; price: string }[];
}

// ─── HELPER FOR PRICING LOGIC ─────────────────────────────────
export const getProductPriceInfo = (product: Product) => {
  const activePrice = parseFloat(product.current_price || "0");
  const originalPrice = parseFloat(product.original_price || "0");
  const comparePrice = parseFloat(product.compare_at_price || "0");

  let oldPrice: number | null = null;
  let discountStr: string | null = null;

  // 1. Check if there's an active dynamic discount from the database
  if (product.is_discounted && originalPrice > activePrice) {
    oldPrice = originalPrice;
    
    if (product.discount_type === 'percentage') {
      discountStr = `-${parseFloat(product.discount_value || "0")}%`;
    } else if (product.discount_type === 'fixed') {
      // Calculate the percentage of the fixed discount to show a consistent badge
      const percentage = Math.round(((originalPrice - activePrice) / originalPrice) * 100);
      discountStr = `-${percentage}%`;
    }
  } 
  // 2. Fallback to standard compare_at_price if it exists and is higher
  else if (comparePrice > activePrice) {
    oldPrice = comparePrice;
    const percentage = Math.round(((comparePrice - activePrice) / comparePrice) * 100);
    discountStr = `-${percentage}%`;
  }

  return { activePrice, oldPrice, discountStr };
};

// ─── STORE ────────────────────────────────────────────────────
interface ShopState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  cart: CartItem[];
  selectedCategoryId: number | null;
  
  // Home Products Pagination
  isLoading: boolean;
  isFetchingMore: boolean;
  currentPage: number;
  hasMore: boolean;
  
  // Search Products Pagination
  searchResults: Product[];
  isSearchLoading: boolean;
  isFetchingMoreSearch: boolean;
  searchCurrentPage: number;
  searchHasMore: boolean;

  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchProducts: (category_id?: number | null, page?: number, loadMore?: boolean) => Promise<void>;
  searchProducts: (query: string, category_id?: number | null, page?: number, limit?: number, loadMore?: boolean) => Promise<void>;
  clearSearch: () => void;
  fetchBanners: () => Promise<void>;
  fetchOrderStatus: (id: number, email: string) => Promise<OrderStatus | null>;
  placeOrder: (payload: OrderPayload) => Promise<{ order_id: number; total_amount: string } | null>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setSelectedCategory: (id: number | null) => void;
  setError: (error: string | null) => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  products: [],
  categories: [],
  banners: [],
  cart: [],
  selectedCategoryId: null,
  
  isLoading: false,
  isFetchingMore: false,
  currentPage: 1,
  hasMore: true,
  
  searchResults: [],
  isSearchLoading: false,
  isFetchingMoreSearch: false,
  searchCurrentPage: 1,
  searchHasMore: true,

  error: null,

  // ── API ──────────────────────────────────────────────────────
  fetchBanners: async () => {
    try {
      const res = await fetch(`${API_URL}/api/shop/banners`);
      if (!res.ok) throw new Error("Failed to fetch banners");
      set({ banners: await res.json() });
    } catch (e: any) { set({ error: e.message }); }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_URL}/api/shop/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      set({ categories: await res.json() });
    } catch (e: any) { set({ error: e.message }); }
  },

  fetchProducts: async (category_id = null, page = 1, loadMore = false) => {
    if (loadMore) {
      set({ isFetchingMore: true, error: null });
    } else {
      set({ isLoading: true, error: null, currentPage: 1, hasMore: true });
    }
    try {
      const baseUrl = category_id 
        ? `${API_URL}/api/shop/categories/${category_id}/products`
        : `${API_URL}/api/shop/products`;

      const url = new URL(baseUrl);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "20"); 

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: Product[] = await res.json();

      set((state) => ({
        products: loadMore ? [...state.products, ...data] : data,
        currentPage: page,
        hasMore: data.length === 20, 
      }));
    } catch (e: any) { 
      set({ error: e.message }); 
    } finally { 
      set({ isLoading: false, isFetchingMore: false }); 
    }
  },

  searchProducts: async (query, category_id, page = 1, limit = 20, loadMore = false) => {
    if (loadMore) {
      set({ isFetchingMoreSearch: true, error: null });
    } else {
      set({ isSearchLoading: true, error: null, searchCurrentPage: 1, searchHasMore: true });
    }
    try {
      const url = new URL(`${API_URL}/api/shop/products/search`);
      if (query) url.searchParams.set("q", query);
      if (category_id) url.searchParams.set("category_id", String(category_id));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to search products");
      const data: Product[] = await res.json();

      set((state) => ({ 
        searchResults: loadMore ? [...state.searchResults, ...data] : data,
        searchCurrentPage: page,
        searchHasMore: data.length === limit,
      }));
    } catch (e: any) { 
      set({ error: e.message }); 
    } finally { 
      set({ isSearchLoading: false, isFetchingMoreSearch: false }); 
    }
  },

  clearSearch: () => set({ 
    searchResults: [], 
    isSearchLoading: false, 
    searchCurrentPage: 1, 
    searchHasMore: true 
  }),

  fetchOrderStatus: async (id, email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/api/shop/orders/${id}?email=${encodeURIComponent(email)}`, {
        headers: { "Content-Type": "application/json", "X-Client-Type": "react-native" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      return data;
    } catch (e: any) { set({ error: e.message }); return null; } finally { set({ isLoading: false }); }
  },

  placeOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/api/shop/orders`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Client-Type": "react-native" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      get().clearCart();
      return data;
    } catch (e: any) { set({ error: e.message }); return null; } finally { set({ isLoading: false }); }
  },

  addToCart: (product, quantity = 1) => {
    if (!product) return;
    const { cart } = get();
    const existing = cart.find((i) => i.product.id === product.id);
    const max = product.quantity || 0;
    if (existing) {
      set({ cart: cart.map((i) => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, max) } : i) });
    } else {
      set({ cart: [...cart, { product, quantity }] });
    }
  },

  removeFromCart: (id) => set({ cart: get().cart.filter((i) => i.product.id !== id) }),
  updateCartQuantity: (id, q) => { if (q < 1) return get().removeFromCart(id); set({ cart: get().cart.map((i) => i.product.id === id ? { ...i, quantity: q } : i) }); },
  clearCart: () => set({ cart: [] }),

  // ── UI ───────────────────────────────────────────────────────
  setSelectedCategory: (id) => {
    set({ selectedCategoryId: id, products: [], currentPage: 1, hasMore: true });
    get().fetchProducts(id, 1, false);
  },
  setError: (error) => set({ error }),
}));

// Changed from i.product.price to i.product.current_price
export const cartTotalSelector = (state: ShopState) => state.cart.reduce((sum, i) => sum + parseFloat(i.product.current_price) * i.quantity, 0);
export const cartCountSelector = (state: ShopState) => state.cart.reduce((sum, i) => sum + i.quantity, 0);