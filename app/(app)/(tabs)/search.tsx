import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShopStore } from "../../../store/shopStore";
import ProductCard from "../../../components/ProductCard";

// Enable smooth native layout animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SearchScreen() {
  const {
    searchResults,
    searchProducts,
    clearSearch,
    isSearchLoading,
    isFetchingMoreSearch,
    searchHasMore,
    searchCurrentPage,
  } = useShopStore();

  const [query, setQuery] = useState("");
  // Track if the user has actually hit the search button yet
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  
  // Animation value for the layered stretch/shrink background
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Determine if it's the initial page load for a query
  const isMainLoading = isSearchLoading && !isFetchingMoreSearch;

  // Automatically clear results ONLY if the user deletes all text.
  useEffect(() => {
    if (query.trim().length === 0) {
      clearSearch();
      setHasSubmittedSearch(false);
    }
  }, [query]);

  // Handle the pulse animation for the layered background
  useEffect(() => {
    if (isMainLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
      pulseAnim.stopAnimation();
    }
  }, [isMainLoading]);

  // Handle when user is typing
  const handleTextChange = (text) => {
    setQuery(text);
    // Reset submitted state so we don't accidentally show "0 results" 
    // for a new word while they are still typing it
    if (hasSubmittedSearch) {
      setHasSubmittedSearch(false);
    }
  };

  // Triggered ONLY when the user hits "Search" on their device keyboard
  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    const cleanQuery = query.trim();
    
    if (cleanQuery.length > 0) {
      setHasSubmittedSearch(true);
      searchProducts(cleanQuery, null, 1, 20);
    } else {
      clearSearch();
      setHasSubmittedSearch(false);
    }
  };

  const handleClear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuery("");
    clearSearch();
    setHasSubmittedSearch(false);
    Keyboard.dismiss();
  };

  const handleLoadMore = () => {
    if (searchHasMore && !isFetchingMoreSearch && !isSearchLoading) {
      searchProducts(query.trim(), null, searchCurrentPage + 1, 20, true);
    }
  };

  // Interpolations for stretching and shrinking the under-layer
  const animatedScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.8], // Shrinks to 0.85, Stretches up to 1.8
  });
  
  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0], // Fades out nicely as it expands
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      
      {/* ── Fixed Header Area ── */}
            <Image
        source={require("../../../assets/images/icon.png")}
        className="w-26 h-26"
        
      />
      <View className="bg-white pb-4 border-b border-slate-100 z-20 px-5 ">
    <View className=" ">

    </View>        
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3.5 border border-slate-200">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 text-[16px] font-medium h-full"
            placeholder="Kërko produkte..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={handleTextChange} // Updates typing, clears submitted state
            onSubmitEditing={handleSearchSubmit} // Submits API on keyboard enter
            autoCapitalize="none"
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} className="ml-2 p-1">
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Main Content Area Wrapper ── */}
      <View style={styles.container}>
        
        {query.trim().length === 0 ? (
          /* 1. Initial Empty State (Before typing anything) */
          <View className="flex-1 items-center justify-center px-10 pb-20 opacity-60">
             <Ionicons name="search-outline" size={60} color="#cbd5e1" />
             <Text className="mt-4 font-medium text-slate-400 text-center text-base">
                Shkruani për të gjetur produktin e dëshiruar...
             </Text>
          </View>
        ) : (
          /* 2. Active Typing / Results View */
          <>
            <View style={[styles.container, isMainLoading && styles.dimmedContent]}>
              
              {!isSearchLoading && searchResults.length === 0 ? (
                
                hasSubmittedSearch ? (
                  // A) User HIT search, but nothing was found in the database
                  <View className="flex-1 items-center justify-center px-10 pb-20">
                    <Ionicons name="alert-circle-outline" size={60} color="#cbd5e1" />
                    <Text className="font-black text-slate-800 text-xl text-center mt-4">
                      Nuk u gjet asnjë produkt 
                    </Text>
                    <Text className="text-slate-500 text-center mt-2 font-medium">
                      Ju lutem provoni me terma të tjerë
                    </Text>
         
                    <TouchableOpacity onPress={handleClear} className="mt-8 bg-[#f68048] px-8 py-3.5 rounded-full shadow-sm">
                      <Text className="text-white font-bold text-[15px]">Pastro Kërkimin</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // B) User is currently TYPING but hasn't pressed the "Search" button yet
                  <View className="flex-1 items-center justify-center px-10 pb-20 opacity-60">
              
                  </View>
                )

              ) : (
                // C) We have valid results, show them!
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  numColumns={2}
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  columnWrapperStyle={styles.columnGap}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListHeaderComponent={
                    searchResults.length > 0 ? (
                      <View className="flex-row items-center justify-between mb-4 mt-2 px-1">
                        <Text className="text-slate-800 font-black text-lg">
                          Rezultatet
                        </Text>
                      </View>
                    ) : null
                  }
                  ListFooterComponent={
                    <View className="py-6 items-center justify-center h-20">
                      {isFetchingMoreSearch && <ActivityIndicator color="#f68048" size="small" />}
                    </View>
                  }
                  renderItem={({ item }) => <ProductCard product={item} />}
                />
              )}
            </View>

            {/* ── Strict Absolute Layered Loader ── */}
            {isMainLoading && (
              <View style={styles.absoluteLoaderWrapper}>
                {/* Stretching / Shrinking Layered Background under the spinner */}
                <Animated.View style={[
                  styles.animatedLayerBg,
                  {
                    transform: [{ scale: animatedScale }],
                    opacity: animatedOpacity
                  }
                ]} />
                {/* Main Activity Indicator placed directly over the animation */}
                <ActivityIndicator color="#ffffff" size="large" style={styles.spinnerIconAbsolute} />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, backgroundColor: "#" },
  listContent: { padding: 16, paddingBottom: 60, flexGrow: 1 },
  columnGap: { gap: 16 },
  dimmedContent: { opacity: 0.4 },
  
  absoluteLoaderWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -35,
    marginLeft: -35,
    width: 70,
    height: 70,
    zIndex: 9999,
    elevation: 10,
  },
  
  animatedLayerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    borderRadius: 35,
    backgroundColor: '#f68048', 
  },
  
  spinnerIconAbsolute: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18, 
  }
});