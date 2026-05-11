import { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShopStore, cartTotalSelector } from "../../../store/shopStore";

type FormKeys = "customer_name" | "customer_email" | "phone_number" | "address" | "city";

export default function CartScreen() {
  const cart = useShopStore((state) => state.cart);
  const removeFromCart = useShopStore((state) => state.removeFromCart);
  const updateCartQuantity = useShopStore((state) => state.updateCartQuantity);
  const placeOrder = useShopStore((state) => state.placeOrder);
  const isLoading = useShopStore((state) => state.isLoading);
  const total = useShopStore(cartTotalSelector);

  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", phone_number: "",
    address: "", city: "", payment_type: "ON_DELIVERY" as "ON_DELIVERY" | "CARD",
  });

  const handleOrder = async () => {
    if (!form.customer_name || !form.customer_email || !form.phone_number || !form.address || !form.city) {
      return Alert.alert("Mungojnë të dhënat", "Ju lutem plotësoni të gjitha të dhënat e dërgesës.");
    }
    
    const res = await placeOrder({
      ...form,
      items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    });

    if (res) {
      Alert.alert("Sukses 🎉", `Porosia #${res.order_id} u krye me sukses!`);
      setShowCheckout(false);
    } else {
      const errorMessage = useShopStore.getState().error;
      Alert.alert("Kujdes!", errorMessage || "Nuk arritëm të lidhemi me serverin. Provo përsëri.");
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={44} color="#f68048" />
          </View>
          <Text className="text-xl font-black  mb-2 " style={{ color: "#f68048" }}>Shporta është bosh</Text>

        </View>
      </SafeAreaView>
    );
  }

  const fields: { key: FormKeys; placeholder: string; icon: any }[] = [
    { key: "customer_name", placeholder: "Emri i Plotë", icon: "person-outline" },
    { key: "customer_email", placeholder: "Adresa e Email-it", icon: "mail-outline" },
    { key: "phone_number", placeholder: "Numri i Telefonit", icon: "call-outline" },
    { key: "address", placeholder: "Adresa e Rrugës", icon: "location-outline" },
    { key: "city", placeholder: "Qyteti", icon: "business-outline" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Pjesa e Sipërme */}
        <View className="bg-white px-5 py-4 border-b border-slate-100">
          <Text className="text-2xl font-black text-slate-900">
            {showCheckout ? "Arka" : "Shporta Ime 🛒"}
          </Text>
          {!showCheckout && (
            <Text className="text-slate-400 text-sm font-semibold mt-0.5">
              {cart.length} {cart.length === 1 ? "produkt" : "produkte"}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {!showCheckout ? (
              /* ── Produktet e Shportës ── */
              cart.map((item, index) => {
                const prod = item?.product;
                if (!prod) return null;

                return (
                  <View
                    key={prod.id?.toString() || index.toString()}
                    className="bg-white rounded-2xl mb-3 overflow-hidden border border-slate-100"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                  >
                    <View className="p-4 flex-row items-center">
                      <View className="w-16 h-16 bg-slate-50 rounded-xl mr-3 overflow-hidden border border-slate-100 items-center justify-center">
                        {prod.image_url ? (
                          <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Ionicons name="medical-outline" size={24} color="#cbd5e1" />
                        )}
                      </View>

                      <View className="flex-1 pr-2">
                        <Text className="font-bold text-slate-800 text-sm leading-snug" numberOfLines={2}>
                          {prod.name || "Produkt i panjohur"}
                        </Text>
                        <Text style={{ color: "#f68048" }} className="font-black text-base mt-1">
                          €{(parseFloat(prod.price || "0") * item.quantity).toFixed(2)}
                        </Text>
                        {item.quantity > 1 && (
                          <Text className="text-slate-400 text-xs mt-0.5">
                            €{parseFloat(prod.price || "0").toFixed(2)} secila
                          </Text>
                        )}
                      </View>
                      
                      <View className="flex-row items-center">
                        <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                          <TouchableOpacity onPress={() => updateCartQuantity(prod.id, item.quantity - 1)} className="px-3 py-2">
                            <Ionicons name="remove" size={16} color="#475569" />
                          </TouchableOpacity>
                          <Text className="font-black text-slate-800 text-sm min-w-[24px] text-center">
                            {item.quantity}
                          </Text>
                          <TouchableOpacity onPress={() => updateCartQuantity(prod.id, item.quantity + 1)} className="px-3 py-2">
                            <Ionicons name="add" size={16} color="#475569" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(prod.id)} className="ml-2 p-2">
                          <Ionicons name="trash-outline" size={20} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              /* ── Formular i Porosisë (Checkout) ── */
              <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View className="p-5">
                  {fields.map((field, idx) => (
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

                  {/* ── Zgjedhja e Metodës së Pagesës ── */}
                  <View className="mt-5">
                    <Text className="font-black text-slate-600 text-xs uppercase tracking-wider mb-2">Mënyra e Pagesës</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity 
                        onPress={() => setForm({ ...form, payment_type: "ON_DELIVERY" })}
                        className="flex-1 py-3 px-2 rounded-xl border flex-row items-center justify-center gap-2"
                        style={{
                          backgroundColor: form.payment_type === 'ON_DELIVERY' ? '#fff5f0' : '#f8fafc',
                          borderColor: form.payment_type === 'ON_DELIVERY' ? '#f68048' : '#e2e8f0'
                        }}
                      >
                        <Ionicons name="cash-outline" size={18} color={form.payment_type === 'ON_DELIVERY' ? '#f68048' : '#64748b'} />
                        <Text className="font-bold text-xs" style={{ color: form.payment_type === 'ON_DELIVERY' ? '#f68048' : '#64748b' }}>
                          Cash në dorëzim
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => setForm({ ...form, payment_type: "CARD" })}
                        className="flex-1 py-3 px-2 rounded-xl border flex-row items-center justify-center gap-2"
                        style={{
                          backgroundColor: form.payment_type === 'CARD' ? '#fff5f0' : '#f8fafc',
                          borderColor: form.payment_type === 'CARD' ? '#f68048' : '#e2e8f0'
                        }}
                      >
                        <Ionicons name="card-outline" size={18} color={form.payment_type === 'CARD' ? '#f68048' : '#64748b'} />
                        <Text className="font-bold text-xs" style={{ color: form.payment_type === 'CARD' ? '#f68048' : '#64748b' }}>
                          Card
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Përmbledhja e Porosisë */}
                <View className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                  <Text className="font-black text-slate-600 text-xs uppercase tracking-wider mb-3">Përmbledhja e Porosisë</Text>
                  {cart.map((item, index) => {
                    const prod = item?.product;
                    if (!prod) return null;
                    return (
                      <View key={prod.id?.toString() || index.toString()} className="flex-row justify-between mb-1.5 items-center">
                        <Text className="text-slate-500 text-sm flex-1 pr-2" numberOfLines={1}>
                          {prod.name} ×{item.quantity}
                        </Text>
                        <Text className="text-slate-700 font-bold text-sm">
                          €{(parseFloat(prod.price || "0") * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Shiriti i Poshtëm (Bottom Bar) ── */}
        <View
          className="bg-white px-5 pt-4 pb-8 border-t border-slate-100"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-500 font-semibold text-base">Totali</Text>
            <Text style={{ color: "#f68048" }} className="text-3xl font-black">€{total ? total.toFixed(2) : "0.00"}</Text>
          </View>
          
          <TouchableOpacity
            className="py-4 rounded-2xl items-center shadow-sm"
            style={{ backgroundColor: "#f68048" }}
            onPress={showCheckout ? handleOrder : () => setShowCheckout(true)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name={showCheckout ? "checkmark-circle-outline" : "arrow-forward-outline"} size={20} color="white" />
                <Text className="text-white font-bold text-lg">
                  {showCheckout ? "Kryej Porosinë" : "Vazhdo"}
                </Text>
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