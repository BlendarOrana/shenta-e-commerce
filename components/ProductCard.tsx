import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image"; // 🚀 Using expo-image
import * as Haptics from "expo-haptics"; // 🚀 Added haptics
import { useShopStore, getProductPriceInfo, Product } from "../store/shopStore"; // Adjust store path if needed
import { useRouter } from "expo-router";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const router = useRouter();
  
  if (!product) return null;
  const inStock = (product.quantity || 0) > 0;
  
  const { activePrice, oldPrice, discountStr } = getProductPriceInfo(product);

  const handleAddToCart = () => {
    if (inStock) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addToCart(product);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${product.id}`)}
      className="bg-white rounded-3xl flex-1 m-2 border border-slate-100 overflow-hidden shadow-sm"
    >
      <View className="w-full aspect-square bg-slate-50 items-center justify-center relative">
        {discountStr && (
          <View 
            style={{ backgroundColor: "#f68048" }} 
            className="absolute top-2 left-2 z-10 px-2 py-1 rounded-md shadow-sm"
          >
            <Text className="text-white text-[10px] font-black tracking-wider">
              {discountStr}
            </Text>
          </View>
        )}

        {/* 🚀 Advanced caching and smooth transitions */}
        {product.image_url ? (
          <Image 
            source={{ uri: product.image_url }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk" 
          />
        ) : (
          <Ionicons name="medical-outline" size={40} color="#cbd5e1" />
        )}
        
        {!inStock && (
          <View className="absolute inset-0 bg-white/70 items-center justify-center z-20">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md overflow-hidden">
              Sold Out
            </Text>
          </View>
        )}
      </View>

      <View className="p-3 bg-white">
        <Text style={{ color: "#f68048" }} className="text-[10px] font-black uppercase tracking-wider mb-1">
          {product.category || "General"}
        </Text>
        <Text className="text-sm font-bold text-slate-800 h-10 leading-snug" numberOfLines={2}>
          {product.name}
        </Text>
        
        <View className="flex-row justify-between items-end mt-2">
          <View>
            {oldPrice && (
              <Text className="text-[11px] text-slate-400 font-bold line-through mb-0.5">
                €{oldPrice.toFixed(2)}
              </Text>
            )}
            <Text className="font-black text-slate-900 text-base">
              €{activePrice.toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={{ backgroundColor: inStock ? '#f68048' : '#f1f5f9' }}
            className="w-8 h-8 rounded-full items-center justify-center shadow-sm"
            onPress={handleAddToCart}
            disabled={!inStock}
          >
            <Ionicons name="add" size={20} color={inStock ? "white" : "#94a3b8"} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}