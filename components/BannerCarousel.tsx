import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useShopStore } from "../store/shopStore";

const { width } = Dimensions.get("window");

export default function BannerCarousel() {
  const { banners, fetchBanners } = useShopStore();
  const router = useRouter();

  useEffect(() => {
    fetchBanners();
  }, []);

  if (!banners || banners.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ width, height: 220 }} className="relative bg-slate-100">
      <Image 
        source={{ uri: item.image_url }} 
        style={{ width: "100%", height: "100%" }} 
        resizeMode="cover" 
      />
      
      {/* Dark gradient/overlay for better text visibility if needed */}
      <View className="absolute inset-0 bg-black/10" />

      {/* Transparent 'Blej' Button */}
      {item.product_id && (
        <View className="absolute bottom-6 left-0 right-0 items-center">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${item.product_id}`)}
            className="bg-white/30 border border-white/60 px-8 py-2 rounded-full overflow-hidden"
          >
            {/* The text color is white with a drop shadow to ensure it stands out */}
            <Text className="text-white font-black text-sm tracking-widest uppercase shadow-md shadow-black">
              Blej
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View className="mb-4">
      <FlatList
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}