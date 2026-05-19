import React, { useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProductPriceInfo, CartItem } from "../store/shopStore"; 

type FormKeys = "customer_name" | "customer_email" | "phone_number" | "address" | "city";

const CHECKOUT_FIELDS: { key: FormKeys; placeholder: string; icon: any }[] = [
  { key: "customer_name", placeholder: "Emri i Plotë", icon: "person-outline" },
  { key: "customer_email", placeholder: "Adresa e Email-it", icon: "mail-outline" },
  { key: "phone_number", placeholder: "Numri i Telefonit", icon: "call-outline" },
  { key: "address", placeholder: "Adresa e Rrugës", icon: "location-outline" },
  { key: "city", placeholder: "Qyteti", icon: "business-outline" },
];

interface CheckoutViewProps {
  form: any;
  setForm: (form: any) => void;
  cart: CartItem[];
  appliedCoupon: any;
  couponInput: string;
  setCouponInput: (val: string) => void;
  applyCouponCode: () => void;
  removeCoupon: () => void;
  couponLoading: boolean;
}

export default function CheckoutView({
  form, setForm, cart, appliedCoupon, couponInput, 
  setCouponInput, applyCouponCode, removeCoupon, couponLoading
}: CheckoutViewProps) {
  
  // Animacioni i Kuponit
  const couponAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (appliedCoupon) {
      Animated.spring(couponAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      couponAnim.setValue(0);
    }
  }, [appliedCoupon]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24, backgroundColor: '#ffffff' }}
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={true}
    >
      <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        
        {/* ── SHIPPING DETAILS ── */}
        <View className="p-5">
          {CHECKOUT_FIELDS.map((field, idx) => (
            <View key={field.key} className={`flex-row items-center bg-slate-50 rounded-xl px-3 border border-slate-100 ${idx < 4 ? "mb-3" : ""}`}>
              <Ionicons name={field.icon} size={16} color="#94a3b8" />
              <TextInput
                placeholder={field.placeholder}
                value={form[field.key]}
                className="flex-1 py-3.5 px-3 text-slate-800 text-sm"
                placeholderTextColor="#94a3b8"
                onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                autoCapitalize={field.key === "customer_email" ? "none" : "words"}
                keyboardType={field.key === "phone_number" ? "phone-pad" : field.key === "customer_email" ? "email-address" : "default"}
              />
            </View>
          ))}

          <View className="mt-5">
            <Text className="font-black text-slate-600 text-xs uppercase tracking-wider mb-2">Mënyra e Pagesës</Text>
            <View className="flex-row gap-2">
              {[
                { type: "ON_DELIVERY", label: "Cash në dorëzim", icon: "cash-outline" },
                { type: "CARD", label: "Card", icon: "card-outline" }
              ].map((pmt) => {
                 const isActive = form.payment_type === pmt.type;
                 return (
                  <TouchableOpacity 
                    key={pmt.type}
                    onPress={() => setForm({ ...form, payment_type: pmt.type })}
                    className="flex-1 py-3 px-2 rounded-xl border flex-row items-center justify-center gap-2"
                    style={{ backgroundColor: isActive ? '#fff5f0' : '#f8fafc', borderColor: isActive ? '#f68048' : '#e2e8f0' }}
                  >
                    <Ionicons name={pmt.icon as any} size={18} color={isActive ? '#f68048' : '#64748b'} />
                    <Text className="font-bold text-xs" style={{ color: isActive ? '#f68048' : '#64748b' }}>{pmt.label}</Text>
                  </TouchableOpacity>
                 )
              })}
            </View>
          </View>
        </View>

        {/* 🚀 COUPON INPUT AREA ── */}
        <View className="border-t border-slate-100 px-5 py-4 bg-white overflow-hidden">
          <Text className="font-black text-slate-600 text-xs uppercase tracking-wider mb-2">Kodi i Zbritjes (Opsionale)</Text>
          
          {/* Animacioni i Suksesit të Kuponit */}
          {appliedCoupon && (
            <Animated.View 
              style={{
                opacity: couponAnim,
                transform: [{ translateY: couponAnim.interpolate({ inputRange: [0, 1], outputRange: [-15, 0] }) }],
                backgroundColor: '#fff5f0',
                borderColor: '#f68048',
              }}
              className="flex-row items-center justify-between border px-3 py-3 rounded-xl mb-3"
            >
              <View className="flex-row items-center">
                <Ionicons name="pricetag" size={16} color="#f68048" />
                <Text className="ml-2 font-bold" style={{ color: '#f68048' }}>Kuponi u aplikua me sukses! 😊</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon} className="p-1">
                <Ionicons name="close-circle" size={20} color="#f68048" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {!appliedCoupon && (
            <View className="flex-row items-center gap-2">
              <TextInput
                placeholder="Shkruaj kuponin këtu" value={couponInput} onChangeText={setCouponInput} autoCapitalize="characters"
                className="flex-1 bg-slate-50 border border-slate-100 py-3 px-3 rounded-xl text-slate-800 font-bold"
              />
              <TouchableOpacity onPress={applyCouponCode} disabled={couponLoading || !couponInput} className="bg-slate-800 px-4 py-3 rounded-xl justify-center">
                {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold text-sm">Apliko</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View className="border-t border-slate-100 px-5 py-4 bg-slate-50">
          <Text className="font-black text-slate-600 text-xs uppercase tracking-wider mb-3">Përmbledhja e Porosisë</Text>
          {cart.map((item, index) => {
            const prod = item?.product;
            if (!prod) return null;
            const { activePrice, oldPrice } = getProductPriceInfo(prod);
            return (
              <View key={prod.id?.toString() || index.toString()} className="flex-row justify-between mb-1.5 items-center">
                <Text className="text-slate-500 text-sm flex-1 pr-2" numberOfLines={1}>{prod.name} ×{item.quantity}</Text>
                <View className="flex-row items-center">
                  {oldPrice && (<Text className="text-slate-400 font-medium line-through text-xs mr-2">€{(oldPrice * item.quantity).toFixed(2)}</Text>)}
                  <Text className="text-slate-700 font-bold text-sm">€{(activePrice * item.quantity).toFixed(2)}</Text>
                </View>
              </View>
            )
          })}
        </View>

      </View>
    </ScrollView>
  );
}