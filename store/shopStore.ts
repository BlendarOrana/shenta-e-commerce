import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── TYPES ────────────────────────────────────────────────────
export interface Category { id: number; name: string; }

// 🚀 Nutritional Info Type added
export interface NutritionalInfo {
  nutrients: { name: string; amount: string }[];
  serving_size?: string;
  servings_per_container?: string;
}

export interface Product {
  id: number; name: string; description: string; original_price: string; current_price: string;  
  quantity: number; image_url: string | null; category: string;
  is_discounted: boolean; discount_type: 'percentage' | 'fixed' | null;
  discount_value: string | null; discount_end: string | null;
  nutritional_info?: NutritionalInfo | null; // 🚀 Added here
}

export interface Banner {
  id: number; product_id: number; image_url: string; label: string | null; badge: string | null; product_name: string; price: string;
}

export interface CartItem { product: Product; quantity: number; }

export interface OrderPayload {
  customer_name: string; customer_email: string; phone_number: string; address: string; city: string; 
  payment_type: "ON_DELIVERY" | "CARD"; 
  items: { product_id: number; quantity: number }[];
  coupon_code?: string;
}

export interface OrderStatus {
  id: number; order_status: string; payment_status: string; total_amount: string; created_at: string; items: { product_name: string; quantity: number; price: string }[];
}

export interface CouponValidation { valid: boolean; error?: string; }

// 🚀 Type for saved user info
export interface ShippingInfo {
  customer_name: string; customer_email: string; phone_number: string; address: string; city: string;
}

// ─── HELPER FOR PRICING LOGIC ─────────────────────────────────
export const getProductPriceInfo = (product: Product) => {
  const activePrice = parseFloat(product.current_price || "0");
  const originalPrice = parseFloat(product.original_price || "0");

  let oldPrice: number | null = null;
  let discountStr: string | null = null;

  if (product.is_discounted && originalPrice > activePrice) {
    oldPrice = originalPrice;
    if (product.discount_type === 'percentage') {
      discountStr = `-${Math.round(parseFloat(product.discount_value || "0"))}%`; 
    } else if (product.discount_type === 'fixed') {
      const percentage = Math.round(((originalPrice - activePrice) / originalPrice) * 100);
      discountStr = `-${percentage}%`;
    }
  } 

  return { activePrice, oldPrice, discountStr };
};

// ─── STORE ────────────────────────────────────────────────────
interface ShopState {
  products: Product[]; categories: Category[]; banners: Banner[]; cart: CartItem[];
  selectedCategoryId: number | null;
  isLoading: boolean; isFetchingMore: boolean; currentPage: number; hasMore: boolean;
  searchResults: Product[]; isSearchLoading: boolean; isFetchingMoreSearch: boolean; searchCurrentPage: number; searchHasMore: boolean;
  relatedProducts: Product[]; isRelatedLoading: boolean;
  error: string | null;
  appliedCoupon: { code: string; amount: number } | null;
  
  // 🚀 Saved user details state
  shippingInfo: ShippingInfo;
  saveShippingInfo: (info: ShippingInfo) => void;

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
  fetchRelatedProducts: (categoryId: number, excludeProductId: number) => Promise<void>;
  validateCoupon: (code: string, customer_name: string) => Promise<CouponValidation>;
  removeCoupon: () => void;
}

// 🚀 ZUSTAND WITH ASYNC STORAGE (EXPO GO FRIENDLY & FAST)
export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      products: [], categories: [], banners: [], cart: [], selectedCategoryId: null,
      isLoading: false, isFetchingMore: false, currentPage: 1, hasMore: true,
      searchResults: [], isSearchLoading: false, isFetchingMoreSearch: false, searchCurrentPage: 1, searchHasMore: true,
      relatedProducts: [], isRelatedLoading: false, error: null, appliedCoupon: null,

      // Default empty shipping info
      shippingInfo: { customer_name: "", customer_email: "", phone_number: "", address: "", city: "" },
      
      saveShippingInfo: (info) => set({ shippingInfo: info }),

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
        if (loadMore) set({ isFetchingMore: true, error: null });
        else set({ isLoading: true, error: null, currentPage: 1, hasMore: true });
        
        try {
          const baseUrl = category_id ? `${API_URL}/api/shop/categories/${category_id}/products` : `${API_URL}/api/shop/products`;
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
        } catch (e: any) { set({ error: e.message }); } 
        finally { set({ isLoading: false, isFetchingMore: false }); }
      },

      searchProducts: async (query, category_id, page = 1, limit = 20, loadMore = false) => {
        if (loadMore) set({ isFetchingMoreSearch: true, error: null });
        else set({ isSearchLoading: true, error: null, searchCurrentPage: 1, searchHasMore: true });
        
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
        } catch (e: any) { set({ error: e.message }); } 
        finally { set({ isSearchLoading: false, isFetchingMoreSearch: false }); }
      },

      clearSearch: () => set({ searchResults: [], isSearchLoading: false, searchCurrentPage: 1, searchHasMore: true }),

      fetchOrderStatus: async (id, email) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/shop/orders/${id}?email=${encodeURIComponent(email)}`, {
            headers: { "Content-Type": "application/json", "X-Client-Type": "react-native" }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Order not found");
          return data;
        } catch (e: any) { set({ error: e.message }); return null; } 
        finally { set({ isLoading: false }); }
      },

      fetchRelatedProducts: async (categoryId, excludeProductId) => {
        set({ isRelatedLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/shop/categories/${categoryId}/related?exclude=${excludeProductId}`);
          if (!res.ok) throw new Error("Failed to fetch related products");
          const data = await res.json();
          set({ relatedProducts: data });
        } catch (e: any) { set({ error: e.message }); } 
        finally { set({ isRelatedLoading: false }); }
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
      setSelectedCategory: (id) => { set({ selectedCategoryId: id, products: [], currentPage: 1, hasMore: true }); get().fetchProducts(id, 1, false); },
      setError: (error) => set({ error }),

      validateCoupon: async (code, customer_name) => {
        set({ isLoading: true, error: null });
        try {
          const payload = { code, customer_name, cart_items: get().cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })) };
          const res = await fetch(`${API_URL}/api/shop/coupons/validate`, {
            method: "POST", headers: { "Content-Type": "application/json", "X-Client-Type": "react-native" }, body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Kuponi është i pavlefshëm.");
          
          set({ appliedCoupon: { code: data.coupon.code, amount: data.discount_amount } });
          return { valid: true };
        } catch (e: any) { 
          set({ error: e.message, appliedCoupon: null }); return { valid: false, error: e.message };
        } finally { set({ isLoading: false }); }
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      placeOrder: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/shop/orders`, {
            method: "POST", headers: { "Content-Type": "application/json", "X-Client-Type": "react-native" }, body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to place order");
          
          get().clearCart();
          get().removeCoupon();
          return data;
        } catch (e: any) { set({ error: e.message }); return null; } 
        finally { set({ isLoading: false }); }
      },
    }),
    {
      name: 'shop-storage', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage), // Back to AsyncStorage
      // 🚀 CRITICAL FOR SPEED: We ONLY persist cart and user info. 
      partialize: (state) => ({ 
        cart: state.cart, 
        shippingInfo: state.shippingInfo 
      }),
    }
  )
);

export const cartTotalSelector = (state: ShopState) => state.cart.reduce((sum, i) => sum + parseFloat(i.product.current_price) * i.quantity, 0);
export const cartCountSelector = (state: ShopState) => state.cart.reduce((sum, i) => sum + i.quantity, 0);