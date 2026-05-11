import { useEffect, useRef } from "react";
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useShopStore } from "../../../store/shopStore";
import ProductCard from "../../../components/ProductCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 5:4 Aspect Ratio Calculation (Height = Width * (4/5))
const BANNER_HEIGHT = SCREEN_WIDTH * 0.8; 

export default function ShopScreen() {
  const router = useRouter();
  const {
    products, categories, banners, 
    isLoading, isFetchingMore, hasMore, currentPage,
    selectedCategoryId, setSelectedCategory, 
    fetchProducts, fetchCategories, fetchBanners,
  } = useShopStore();

  const bannerRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Initial Fetch
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchBanners();
  }, []);

  // Auto-scroll banners smoothly
  useEffect(() => {
    if (banners.length < 2) return;
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % banners.length;
      bannerRef.current?.scrollToIndex({ index: currentIndex, animated: true });
    }, 4500); 
    return () => clearInterval(interval);
  }, [banners.length]);

  // ── Paginaton: Load next page when scrolling to bottom ──
  const handleLoadMore = () => {
    // Only fetch if we have more data, and we aren't already loading
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchProducts(selectedCategoryId, currentPage + 1, true);
    }
  };

  // Render individual banner item with Parallax effect
  const renderBannerItem = ({ item, index }: { item: any; index: number }) => {
    const translateX = scrollX.interpolate({
      inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      outputRange: [SCREEN_WIDTH * 0.25, 0, -SCREEN_WIDTH * 0.25],
      extrapolate: "clamp",
    });

    return (
      <View style={{ width: SCREEN_WIDTH, height: BANNER_HEIGHT }} className="overflow-hidden relative bg-white">
        <Animated.Image
          source={{ uri: item.image_url }}
          style={[{ width: SCREEN_WIDTH, height: BANNER_HEIGHT }, { transform: [{ translateX }] }]}
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/10" />
        <View className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["left", "right"]}>
         <View 
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '50%', 
          backgroundColor: '#f68048' // Your brand color
        }} 
      />
      
      <FlatList
        data={products}
        keyExtractor={(item, index) => `${item.id}-${index}`} // Prevents duplicate key warnings during rapid paginated loads
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 24, backgroundColor: '#ffffff', flexGrow: 1 }}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => <ProductCard product={item} />}
        
        // ── INFINITE SCROLL TRIGGERS ──
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Trigger when user scrolls 50% down the remaining list
        
        // Shows a spinner at the bottom while fetching page 2, 3, etc.
        ListFooterComponent={
          isFetchingMore ? (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator color="#f68048" size="small" />
            </View>
          ) : <View className="h-6" /> // spacer
        }

        // Shows a big spinner in the middle if it's the VERY FIRST load
        ListEmptyComponent={
          isLoading && !isFetchingMore ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator color="#f68048" size="large" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="medical-outline" size={48} color="#f68048" />
              <Text className="text-slate-400 font-bold mt-3">Nuk ka produkte</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View className="mb-4 bg-white">
            {/* ── Banner Carousel (5:4 Parallax Version) ── */}
            {banners.length > 0 && (
              <View className="mb-6 relative bg-white">
                <Animated.FlatList
                  ref={bannerRef}
                  data={banners}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false } 
                  )}
                  scrollEventThrottle={16}
                  renderItem={renderBannerItem}
                  getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                />
                {banners.length > 1 && (
                  <View className="absolute bottom-5 left-0 right-0 flex-row justify-center items-center gap-2 z-20">
                    {banners.map((_, i) => {
                      const dotWidth = scrollX.interpolate({
                        inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
                        outputRange: [6, 20, 6], extrapolate: "clamp",
                      });
                      const dotOpacity = scrollX.interpolate({
                        inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
                        outputRange: [0.4, 1, 0.4], extrapolate: "clamp",
                      });
                      return (
                        <Animated.View
                          key={i}
                          style={{
                            width: dotWidth, opacity: dotOpacity, height: 6, borderRadius: 4,
                            backgroundColor: "#f68048", shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.5, shadowRadius: 2,
                          }}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ── Category Pills ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 20 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)} // Automatically resets to page 1 in store
                style={{
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
                  backgroundColor: selectedCategoryId === null ? "#f68048" : "#ffffff",
                  borderWidth: 1, borderColor: selectedCategoryId === null ? "#f68048" : "#e2e8f0",
                  shadowColor: selectedCategoryId === null ? "#f68048" : "transparent",
                  shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
                  elevation: selectedCategoryId === null ? 4 : 0
                }}
              >
                <Text style={{ fontWeight: "800", color: selectedCategoryId === null ? "#fff" : "#475569", fontSize: 13 }}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCategory(c.id)} // Automatically hits new category endpoint in store
                  style={{
                    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
                    backgroundColor: selectedCategoryId === c.id ? "#f68048" : "#ffffff",
                    borderWidth: 1, borderColor: selectedCategoryId === c.id ? "#f68048" : "#e2e8f0",
                    shadowColor: selectedCategoryId === c.id ? "#f68048" : "transparent",
                    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
                    elevation: selectedCategoryId === c.id ? 4 : 0
                  }}
                >
                  <Text style={{ fontWeight: "800", color: selectedCategoryId === c.id ? "#fff" : "#475569", fontSize: 13 }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Section title ── */}
            <View className="flex-row items-center justify-between px-4 mt-2 mb-2 bg-white">
              <Text className="font-black text-slate-900 text-xl tracking-tight">
                {selectedCategoryId
                  ? categories.find(c => c.id === selectedCategoryId)?.name
                  : "All Products"}
              </Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}