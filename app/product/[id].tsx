import React, { useMemo } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useShopStore, getProductPriceInfo } from "../../store/shopStore"; 

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, addToCart } = useShopStore();

  const product = useMemo(() => {
    return products.find((p) => p.id === Number(id));
  }, [id, products]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500 font-bold mb-4 text-lg">Product not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ backgroundColor: "#f68048" }} 
          className="px-8 py-3.5 rounded-full shadow-sm"
        >
          <Text className="text-white font-bold text-base tracking-wide">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inStock = (product.quantity || 0) > 0;
  
  // Grab pricing information dynamically using the updated helper logic
  const { activePrice, oldPrice, discountStr } = getProductPriceInfo(product);

  return (
    <View className="flex-1 bg-white">
      <View className="absolute top-14 left-5 z-10">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-white/90 rounded-full w-11 h-11 items-center justify-center border border-slate-100"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-full aspect-square bg-slate-50 items-center justify-center border-b border-slate-100 relative">
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Ionicons name="medical-outline" size={80} color="#cbd5e1" />
          )}
        </View>

        <View className="p-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: "#f68048" }} className="text-xs font-black uppercase tracking-widest">
              {product.category || "Uncategorized"}
            </Text>
            
            <View 
              style={{ 
                backgroundColor: inStock ? '#fff5f0' : '#fef2f2', 
                borderColor: inStock ? '#f68048' : '#f87171',
                borderWidth: 1 
              }} 
              className="px-3 py-1.5 rounded-lg"
            >
              <Text 
                style={{ color: inStock ? '#f68048' : '#ef4444' }} 
                className="text-[10px] font-black uppercase tracking-widest"
              >
                {inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
          
          <Text className="text-3xl font-black text-slate-900 mb-4 leading-tight">
            {product.name}
          </Text>

          {/* Pricing Row (Active Price + Strikethrough + Discount Badge) */}
          <View className="flex-row items-center mb-8">
            <Text style={{ color: "#f68048" }} className="text-3xl font-black mr-3">
              €{activePrice.toFixed(2)}
            </Text>
            
            {oldPrice && (
              <Text className="text-xl text-slate-400 font-bold line-through mr-3">
                €{oldPrice.toFixed(2)}
              </Text>
            )}
            
            {discountStr && (
              <View style={{ backgroundColor: '#f68048' }} className="px-2 py-1 rounded-md">
                <Text className="text-white text-xs font-black tracking-wider">{discountStr}</Text>
              </View>
            )}
          </View>

          <Text className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
            Pershkrimi
          </Text>
          <Text className="text-base text-slate-600 leading-relaxed font-medium">
            {product.description || "No description available for this product."}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View 
        className="absolute bottom-0 w-full bg-white border-t border-slate-100 p-5 pb-8 flex-row items-center justify-between"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10 }}
      >
        <View>
          <Text className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-0.5">
            Çmimi Total
          </Text>
          <Text className="text-2xl font-black text-slate-900">
            €{activePrice.toFixed(2)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={{ backgroundColor: inStock ? '#f68048' : '#f1f5f9' }}
          className="px-8 py-4 rounded-2xl flex-row items-center justify-center min-w-[180px] shadow-sm"
          onPress={() => inStock && addToCart(product)}
          disabled={!inStock}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={inStock ? "cart" : "close-circle"} 
            size={20} 
            color={inStock ? "white" : "#94a3b8"} 
            style={{ marginRight: 8 }} 
          />
          <Text className={`font-bold text-base ${inStock ? 'text-white' : 'text-slate-400'}`}>
            {inStock ? "Shto ne shport" : "Sold Out"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}