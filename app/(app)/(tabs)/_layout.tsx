

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Platform, Animated, Easing, Image } from "react-native";
import { useShopStore, cartCountSelector } from "../../../store/shopStore";
import { useEffect, useRef } from "react";

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const cartCount = useShopStore(cartCountSelector);
  const jiggledRef = useRef(new Animated.Value(0));
  const prevCountRef = useRef(cartCount);
  const scaleAnim = useRef(new Animated.Value(1));

  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      // Reset animations to starting position before running
      scaleAnim.current.setValue(1);
      jiggledRef.current.setValue(0);

      // Run scale and wobble perfectly at the same time
      Animated.parallel([
        // 1. Smooth Scale Pop
        Animated.sequence([
          Animated.timing(scaleAnim.current, {
            toValue: 1.15, // Subtle, professional scale (not too huge)
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim.current, {
            toValue: 1,
            friction: 5, // Softer spring
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // 2. Smooth, slower wobble (like a gentle bell ring)
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

  // Interpolate rotation to be less drastic (8 degrees instead of 18)
  const rotate = jiggledRef.current.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "8deg"],
  });

  return (
    <Animated.View
      style={{
        position: "relative",
        transform: [{ rotate }, { scale: scaleAnim.current }],
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Changed size from 22 to 26 for a more standard, premium feel */}
      <Ionicons name={focused ? "cart" : "cart-outline"} size={26} color={color} />
      
      {cartCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -6,
            right: -10,
            backgroundColor: "#f68048",
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
            borderWidth: 2, // Thick border creates a nice cutout effect against the icon
            borderColor: "white",
            // Optional: adds a tiny shadow to the badge making it pop
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 1,
            elevation: 2, 
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "800", textAlign: "center" }}>
            {cartCount > 99 ? "99+" : cartCount}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
export default function TabsLayout() {
  return (
    // 1. Wrap the entire layout in a View with a white background
    <View className="flex-1 bg-white">
      
      {/* 2. Add the global absolute brand color at the bottom */}
      <View className="absolute bottom-0 w-full h-1/2 bg-[#f68048]" />

      <Tabs
        // 3. Make the scene container transparent so the background shows through
        sceneContainerStyle={{ backgroundColor: "transparent" }}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarActiveTintColor: "#f68048",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            height: Platform.OS === "ios" ? 85 : 65,
            paddingBottom: Platform.OS === "ios" ? 28 : 10,
            paddingTop: 10,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "storefront" : "storefront-outline"} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "search" : "search-outline"} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, focused }) => (
              <CartTabIcon color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}