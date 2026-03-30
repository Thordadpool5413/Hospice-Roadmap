import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const ragnaIcon = require("@/assets/images/ragna-icon.png");

function ChatTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={ragnaIcon}
        style={{
          width: 26, height: 26, borderRadius: 7,
          opacity: focused ? 1 : 0.7,
          borderWidth: focused ? 1.5 : 0,
          borderColor: Colors.tabIconSelected,
        }}
      />
      <View style={{
        position: "absolute", bottom: 0, right: 0,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.chatLiveDot,
        borderWidth: 1.5, borderColor: "#05080F",
      }} />
    </View>
  );
}

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: "rgba(53, 94, 159, 0.5)",
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 56 + safeAreaInsets.bottom } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => <ChatTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ellipsis" tintColor={color} size={22} />
            ) : (
              <Feather name="more-horizontal" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Resources",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="book.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="book-open" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{ href: null }}
      />
    </Tabs>
  );
}
