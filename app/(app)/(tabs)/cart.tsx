import React, { useState, useCallback, memo, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useShopStore, cartTotalSelector, getProductPriceInfo, CartItem } from "../../../store/shopStore";

// IMPORTONI KOMPONENTIN E RI
import CheckoutView from "../../../components/CheckoutView";

const MemoizedCartItem = memo(({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem; 
  onUpdateQuantity: (id: number, q: number) => void; 
  onRemove: (id: number) => void;
}) => {
  const prod = item.product;
  if (!prod) return null;
  const { activePrice, oldPrice, discountStr } = getProductPriceInfo(prod);

  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden border border-slate-100"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      <View className="p-4 flex-row items-center">
        <View className="w-16 h-16 bg-slate-50 rounded-xl mr-3 overflow-hidden border border-slate-100 items-center justify-center">
          {prod.image_url ? (
            <Image source={{ uri: prod.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
          ) : (
            <Ionicons name="medical-outline" size={24} color="#cbd5e1" />
          )}
        </View>

        <View className="flex-1 pr-2">
          <Text className="font-bold text-slate-800 text-sm leading-snug" numberOfLines={2}>{prod.name || "Produkt i panjohur"}</Text>
          <View className="flex-row items-center mt-1 flex-wrap gap-y-1">
            <Text style={{ color: "#f68048" }} className="font-black text-base mr-2">€{(activePrice * item.quantity).toFixed(2)}</Text>
            {oldPrice && (<Text className="text-slate-400 text-xs font-bold line-through mr-2">€{(oldPrice * item.quantity).toFixed(2)}</Text>)}
            {discountStr && (<View style={{ backgroundColor: '#f68048' }} className="px-1.5 py-0.5 rounded"><Text className="text-white text-[10px] font-bold">{discountStr}</Text></View>)}
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdateQuantity(prod.id, item.quantity - 1); }} className="px-3 py-2"><Ionicons name="remove" size={16} color="#475569" /></TouchableOpacity>
            <Text className="font-black text-slate-800 text-sm min-w-[24px] text-center">{item.quantity}</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdateQuantity(prod.id, item.quantity + 1); }} className="px-3 py-2"><Ionicons name="add" size={16} color="#475569" /></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onRemove(prod.id); }} className="ml-2 p-2"><Ionicons name="trash-outline" size={20} color="#f87171" /></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => prevProps.item.quantity === nextProps.item.quantity && prevProps.item.product.id === nextProps.item.product.id);

export default function CartScreen() {
  const cart = useShopStore((state) => state.cart);
  const removeFromCart = useShopStore((state) => state.removeFromCart);
  const updateCartQuantity = useShopStore((state) => state.updateCartQuantity);
  const placeOrder = useShopStore((state) => state.placeOrder);
  const isLoading = useShopStore((state) => state.isLoading);
  const totalBase = useShopStore(cartTotalSelector);
  
  const savedShippingInfo = useShopStore((state) => state.shippingInfo);
  const saveShippingInfo = useShopStore((state) => state.saveShippingInfo);

  const validateCoupon = useShopStore((state) => state.validateCoupon);
  const removeCoupon = useShopStore((state) => state.removeCoupon);
  const appliedCoupon = useShopStore((state) => state.appliedCoupon);
  
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // State për porosinë e suksesshme
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [form, setForm] = useState({
    ...savedShippingInfo,
    payment_type: "ON_DELIVERY" as "ON_DELIVERY" | "CARD",
  });

  const handleUpdateQuantity = useCallback((id: number, q: number) => { updateCartQuantity(id, q); }, [updateCartQuantity]);
  const handleRemoveFromCart = useCallback((id: number) => { removeFromCart(id); }, [removeFromCart]);

  // Nëse përdoruesi shton një produkt tjetër ndërkohë që ishte në pamjen "Sukses", hiqe pamjen e suksesit
  useEffect(() => {
    if (cart.length > 0 && orderSuccess) {
      setOrderSuccess(false);
    }
  }, [cart.length, orderSuccess]);

  const applyCouponCode = async () => {
    if (!couponInput) return;
    if (!form.customer_name) {
      return Alert.alert("Kujdes!", "Ju lutem shënoni emrin tuaj fillimisht për të aplikuar kuponin.");
    }
    
    setCouponLoading(true);
    const res = await validateCoupon(couponInput, form.customer_name);
    setCouponLoading(false);
    
    if (res.error) { 
      Alert.alert("Gabim", res.error); 
    } else { 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
      setCouponInput(""); 
    }
  };

  const handleOrder = async () => {
    if (!form.customer_name || !form.customer_email || !form.phone_number || !form.address || !form.city) {
      return Alert.alert("Mungojnë të dhënat", "Ju lutem plotësoni të gjitha të dhënat e dërgesës.");
    }
    
    saveShippingInfo({
      customer_name: form.customer_name, 
      customer_email: form.customer_email, 
      phone_number: form.phone_number, 
      address: form.address, 
      city: form.city
    });

    const res = await placeOrder({
      ...form,
      coupon_code: appliedCoupon?.code,
      items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    });

    if (res) {
      // Shfaq direkt pamjen e Suksesit profesionist pa vonesa
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrderSuccess(true);
      setShowCheckout(false);
    } else {
      Alert.alert("Kujdes!", useShopStore.getState().error || "Nuk arritëm të lidhemi me serverin. Provo përsëri.");
    }
  };

  // ── SUCCESS STATE (Porosia u krye) ──
  if (orderSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
  
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 20, justifyContent: 'center' }}>
          <View className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
            
            {/* Ikonat Lart-Majtas sipas kërkesës - Fytyrë e qeshur + Farmaci */}
            <View className="flex-row items-center mb-6">
              <Ionicons name="happy" size={48} color="#f68048" />
              <Ionicons name="medkit" size={32} color="#f68048" style={{ marginLeft: 12 }} />
            </View>
            
            <Text className="text-2xl font-black text-slate-800 mb-3">Porosia u krye</Text>
            <Text className="text-slate-500 text-base leading-relaxed">
              Faleminderit që zgjodhët farmacinë tonë. 
            </Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: "#f68048" }} 
              className="mt-8 py-4 rounded-xl items-center flex-row justify-center shadow-sm"
              onPress={() => setOrderSuccess(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="cart-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-lg">Vazhdo Blerjet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── EMPTY STATE (Kur shporta është bosh) ──
  if (cart.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
        <View className="bg-white px-5 py-4 border-b border-slate-100"><Text className="text-2xl font-black text-slate-900">Shporta Ime 🛒</Text></View>
        <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <View className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full items-center justify-center mb-4"><Ionicons name="cart-outline" size={44} color="#f68048" /></View>
          <Text className="text-xl font-black mb-2" style={{ color: "#f68048" }}>Shporta është bosh</Text>
        </View>
      </SafeAreaView>
    );
  }

  const finalTotal = Math.max(0, totalBase - (appliedCoupon?.amount || 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="bg-white px-5 py-4 border-b border-slate-100">
          <Text className="text-2xl font-black text-slate-900">{showCheckout ? "Arka" : "Shporta Ime 🛒"}</Text>
          {!showCheckout && (<Text className="text-slate-400 text-sm font-semibold mt-0.5">{cart.length} {cart.length === 1 ? "produkt" : "produkte"}</Text>)}
        </View>

        <View className="flex-1 bg-transparent">
          {!showCheckout ? (
            <FlatList
              data={cart}
              keyExtractor={(item) => item.product.id?.toString()}
              contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24, backgroundColor: '#ffffff' }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <MemoizedCartItem item={item} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveFromCart} />}
            />
          ) : (
            // KOMPONENTI I CHECKOUT
            <CheckoutView 
              form={form} 
              setForm={setForm} 
              cart={cart}
              appliedCoupon={appliedCoupon}
              couponInput={couponInput}
              setCouponInput={setCouponInput}
              applyCouponCode={applyCouponCode}
              removeCoupon={removeCoupon}
              couponLoading={couponLoading}
            />
          )}
        </View>

        <View className="bg-white px-5 pt-4 pb-8 border-t border-slate-100" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 }}>
          {appliedCoupon && (
            <View className="mb-3 space-y-1">
              <View className="flex-row justify-between mb-1"><Text className="text-slate-500 font-medium">Nëntotali</Text><Text className="text-slate-700 font-bold">€{totalBase.toFixed(2)}</Text></View>
              <View className="flex-row justify-between"><Text className="text-[#f68048] font-medium">Zbritja e Aplikuar</Text><Text className="text-[#f68048] font-bold">-€{appliedCoupon.amount.toFixed(2)}</Text></View>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-800 font-black text-lg">Totali</Text>
            <Text style={{ color: "#f68048" }} className="text-3xl font-black">€{finalTotal.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity
            className="py-4 rounded-2xl items-center shadow-sm" style={{ backgroundColor: "#f68048" }}
            onPress={showCheckout ? handleOrder : () => setShowCheckout(true)} disabled={isLoading} activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name={showCheckout ? "checkmark-circle-outline" : "arrow-forward-outline"} size={20} color="white" />
                <Text className="text-white font-bold text-lg">{showCheckout ? "Kryej Porosinë" : "Vazhdo"}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {showCheckout && (
            <TouchableOpacity onPress={() => setShowCheckout(false)} className="mt-4 items-center py-2">
              <Text className="text-slate-400 font-bold text-sm">← Kthehu te Shporta</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}