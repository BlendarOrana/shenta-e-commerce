import React, { useMemo, useRef, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, ScrollView, Animated, 
  ActivityIndicator, Easing, InteractionManager
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image"; // 🚀 Using expo-image
import * as Haptics from "expo-haptics"; // 🚀 Added haptics
import { useShopStore, getProductPriceInfo, cartCountSelector } from "../../store/shopStore";

// --- Custom Component for the Bottom Cart Icon ---
function BottomCartIcon() {
  const cartCount = useShopStore(cartCountSelector);
  const router = useRouter();
  const jiggledRef = useRef(new Animated.Value(0));
  const prevCountRef = useRef(cartCount);
  const scaleAnim = useRef(new Animated.Value(1));

  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      scaleAnim.current.setValue(1);
      jiggledRef.current.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim.current, { toValue: 1.15, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.spring(scaleAnim.current, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(jiggledRef.current, { toValue: -1, duration: 120, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(jiggledRef.current, { toValue: 1, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(jiggledRef.current, { toValue: -0.5, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(jiggledRef.current, { toValue: 0, duration: 120, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]).start();
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  const rotate = jiggledRef.current.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "8deg"],
  });

  if (cartCount === 0) return <View style={{ width: 50, height: 50, }} />;

  return (
    <TouchableOpacity onPress={() => router.push('/cart')} activeOpacity={0.8} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ position: "relative", transform: [{ rotate }, { scale: scaleAnim.current }], justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="cart" size={32} color="#f68048" />
        <View
          style={{
            position: "absolute", top: -6, right: -10, backgroundColor: "#f68048", borderRadius: 10,
            minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
            borderWidth: 2, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15, shadowRadius: 1, elevation: 2, 
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "800", textAlign: "center" }}>
            {cartCount > 99 ? "99+" : cartCount}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, categories, addToCart, fetchRelatedProducts, relatedProducts, isRelatedLoading } = useShopStore();

  const toastSlideAnim = useRef(new Animated.Value(-100)).current;
  const toastOpacityAnim = useRef(new Animated.Value(0)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  const product = useMemo(() => products.find((p) => p.id === Number(id)), [id, products]);

  useEffect(() => {
    if (product) {
      const categoryObj = categories.find((c) => c.name === product.category);
      const task = InteractionManager.runAfterInteractions(() => {
        if (categoryObj) fetchRelatedProducts(categoryObj.id, product.id);
      });
      return () => task.cancel();
    }
  }, [product?.id, categories]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500 font-bold mb-4 text-lg">Product not found</Text>
        <TouchableOpacity onPress={() => router.navigate('/shop')} style={{ backgroundColor: "#f68048" }} className="px-8 py-3.5 rounded-full shadow-sm">
          <Text className="text-white font-bold text-base tracking-wide">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inStock = (product.quantity || 0) > 0;
  const { activePrice, oldPrice, discountStr } = getProductPriceInfo(product);

  const handleAddToCart = () => {
    if (!inStock) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 🚀 Feels super satisfying
    addToCart(product);

    Animated.sequence([
      Animated.timing(btnScaleAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScaleAnim, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();

    Animated.parallel([
      Animated.spring(toastSlideAnim, { toValue: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(toastOpacityAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastSlideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(toastOpacityAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    }, 2500);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Animated Toast Notification */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, alignItems: 'center', transform: [{ translateY: toastSlideAnim }], opacity: toastOpacityAnim }}>
        <View className="flex-row items-center bg-[#f68048] px-6 py-3.5 rounded-full shadow-md mt-2">
          <Ionicons name="cart" size={22} color="white" />
          <Text className="text-white font-bold text-[15px] ml-2 tracking-wide">Produkti u shtua në shportë!</Text>
        </View>
      </Animated.View>

      {/* Header Back Button */}
      <View className="absolute top-14 left-5 z-10">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-white/90 rounded-full w-14 h-14 items-center justify-center border border-slate-100"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
        >
          <Ionicons name="arrow-back" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        
        {/* 🚀 Main Product Image */}
        <View className="w-full aspect-square bg-white items-center justify-center border-b border-slate-100 relative">
          {product.image_url ? (
            <Image 
              source={{ uri: product.image_url }} 
              style={{ width: '100%', height: '100%' }}
              contentFit="cover" 
              cachePolicy="memory-disk"
            />
          ) : (
            <Ionicons name="medical-outline" size={80} color="#cbd5e1" />
          )}
        </View>

        {/* Main Product Details */}
        <View className="p-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: "#f68048" }} className="text-xs font-black uppercase tracking-widest">{product.category || "Uncategorized"}</Text>
            <View style={{ backgroundColor: inStock ? '#fff5f0' : '#fef2f2', borderColor: inStock ? '#f68048' : '#f87171', borderWidth: 1 }} className="px-3 py-1.5 rounded-lg">
              <Text style={{ color: inStock ? '#f68048' : '#ef4444' }} className="text-[10px] font-black uppercase tracking-widest">{inStock ? 'Në Stok' : 'Out of Stock'}</Text>
            </View>
          </View>
          
          <Text className="text-3xl font-black text-slate-900 mb-4 leading-tight">{product.name}</Text>

          <View className="flex-row items-center mb-8">
            <Text style={{ color: "#f68048" }} className="text-3xl font-black mr-3">€{activePrice.toFixed(2)}</Text>
            {oldPrice ? <Text className="text-xl text-slate-400 font-bold line-through mr-3">€{oldPrice.toFixed(2)}</Text> : null}
            {discountStr ? (
              <View style={{ backgroundColor: '#f68048' }} className="px-2 py-1 rounded-md">
                <Text className="text-white text-xs font-black tracking-wider">{discountStr}</Text>
              </View>
            ) : null}
          </View>

          {/* Description Section */}
          <Text className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Përshkrimi</Text>
          <Text className="text-base text-slate-600 leading-relaxed font-medium mb-8">
            {product.description || "Nuk ka përshkrim për këtë produkt."}
          </Text>

          {/* 🚀 NEW: Nutritional Information Section */}
          {product.nutritional_info && product.nutritional_info.nutrients && product.nutritional_info.nutrients.length > 0 && (
            <View className="mb-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <View className="bg-[#fff5f0] p-4 border-b border-[#f68048]/20 flex-row items-center justify-between">
                <Text className="text-sm font-black text-[#f68048] uppercase tracking-widest">
                  Vlerat Ushqyese
                </Text>
              </View>

              {/* Serving Size Info */}
              {(product.nutritional_info.serving_size || product.nutritional_info.servings_per_container) && (
                <View className="p-4 border-b border-slate-100 bg-slate-50 flex-row justify-between">
                  {product.nutritional_info.serving_size && (
                    <Text className="text-xs text-slate-600 font-bold">Porcioni: <Text className="font-medium">{product.nutritional_info.serving_size}</Text></Text>
                  )}
                  {product.nutritional_info.servings_per_container && (
                    <Text className="text-xs text-slate-600 font-bold">Paketimi përmban: <Text className="font-medium">{product.nutritional_info.servings_per_container}</Text></Text>
                  )}
                </View>
              )}

              {/* Nutrients List */}
              <View className="px-4">
                {product.nutritional_info.nutrients.map((nutrient, idx) => (
                  <View 
                    key={idx} 
                    className={`flex-row justify-between py-3.5 ${
                      idx !== (product.nutritional_info?.nutrients?.length || 0) - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <Text className="text-slate-700 font-bold capitalize text-sm">{nutrient.name.trim()}</Text>
                    <Text className="text-slate-900 font-black text-sm">{nutrient.amount.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* RELATED PRODUCTS SECTION */}
        <View className="pt-2 pb-6 bg-white">
          <View className="px-6 mb-5 flex-row items-center justify-between">
            <Text className="text-lg font-black text-[#f68048] tracking-wide">Rekomandime</Text>
            {isRelatedLoading && <ActivityIndicator size="small" color="#f68048" />}
          </View>
          
          {(!isRelatedLoading && relatedProducts.length === 0) ? (
            <Text className="px-6 text-sm text-slate-400 font-medium">Nuk ka produkte të ngjashme për momentin.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {relatedProducts.map((relProduct) => {
                const { activePrice: relActivePrice, oldPrice: relOldPrice, discountStr: relDiscountStr } = getProductPriceInfo(relProduct);
                const isRelInStock = (relProduct.quantity || 0) > 0;

                return (
                  <TouchableOpacity 
                    key={relProduct.id} activeOpacity={0.9} onPress={() => router.push(`/product/${relProduct.id}`)}
                    className="w-56 bg-white border border-slate-100 rounded-[28px] overflow-hidden mr-5"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }}
                  >
                    <View className="w-full h-48 bg-slate-50 relative items-center justify-center">
                      {relDiscountStr ? (
                        <View className="absolute top-3 left-3 bg-[#f68048] px-2.5 py-1 rounded-lg z-10">
                          <Text className="text-white text-[11px] font-black tracking-wider">{relDiscountStr}</Text>
                        </View>
                      ) : null}

                      {/* 🚀 Expo Image for related products */}
                      {relProduct.image_url ? (
                        <Image 
                          source={{ uri: relProduct.image_url }} 
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <Ionicons name="medical-outline" size={40} color="#cbd5e1" />
                      )}
                      
                      {!isRelInStock && (
                        <View className="absolute inset-0 bg-white/70 items-center justify-center z-20">
                          <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-md overflow-hidden">
                            Sold Out
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="p-4 pt-4">
                      <Text style={{ color: "#f68048" }} className="text-[10px] font-black uppercase tracking-wider mb-1.5">{relProduct.category || "General"}</Text>
                      <View className="h-[44px] justify-start mb-2"><Text className="text-sm font-bold text-slate-800 leading-snug" numberOfLines={2}>{relProduct.name}</Text></View>
                      <View className="flex-row items-end justify-between mt-1">
                        <View>
                          {relOldPrice ? <Text className="text-[11px] text-slate-400 font-bold line-through mb-0.5">€{relOldPrice.toFixed(2)}</Text> : null}
                          <Text className="text-lg font-black text-slate-900">€{relActivePrice.toFixed(2)}</Text>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                          <Ionicons name="chevron-forward" size={16} color="#0f172a" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View 
        className="absolute bottom-0 w-full bg-white border-t border-slate-100 p-5 pb-8 flex-row items-center justify-between"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10 }}
      >
        <BottomCartIcon />
        <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
          <TouchableOpacity 
            style={{ backgroundColor: inStock ? '#f68048' : '#f1f5f9' }}
            className="px-8 py-4 rounded-2xl flex-row items-center justify-center min-w-[180px] shadow-sm"
            onPress={handleAddToCart}
            disabled={!inStock}
            activeOpacity={0.9}
          >
            <Ionicons name={inStock ? "cart" : "close-circle"} size={20} color={inStock ? "white" : "#94a3b8"} style={{ marginRight: 8 }} />
            <Text className={`font-bold text-base ${inStock ? 'text-white' : 'text-slate-400'}`}>{inStock ? "Shto në shportë" : "Sold Out"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}