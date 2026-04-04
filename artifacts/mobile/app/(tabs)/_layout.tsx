import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Image, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const ragnaIcon = require("@/assets/images/ragna-icon.png");

function ChatTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: focused ? 30 : 26,
        height: focused ? 30 : 26,
        borderRadius: focused ? 9 : 7,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: focused ? 1.5 : 0,
        borderColor: focused ? Colors.tabIconSelected : "transparent",
        shadowColor: focused ? Colors.tabIconSelected : "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: focused ? 0.7 : 0,
        shadowRadius: 6,
      }}>
        <Image
          source={ragnaIcon}
          style={{
            width: focused ? 28 : 24,
            height: focused ? 28 : 24,
            borderRadius: focused ? 8 : 6,
            opacity: focused ? 1 : 0.65,
          }}
          resizeMode="cover"
        />
      </View>
      <View style={{
        position: "absolute", bottom: -1, right: -1,
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: Colors.chatLiveDot,
        borderWidth: 1.5, borderColor: "#040C1C",
      }} />
    </View>
  );
}

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  const WEB_TAB_HEIGHT = 68;
  const NATIVE_TAB_HEIGHT = 60;
  const tabBarHeight = isWeb ? WEB_TAB_HEIGHT : NATIVE_TAB_HEIGHT;
  const bottomPad = isWeb ? 10 : safeAreaInsets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: "rgba(4, 10, 28, 0.97)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(60, 100, 180, 0.35)",
          elevation: 0,
          paddingBottom: bottomPad,
          height: tabBarHeight + (isWeb ? 0 : safeAreaInsets.bottom),
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: isWeb ? 6 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
            ) : (
              <View style={{
                width: 28, height: 28, alignItems: "center", justifyContent: "center",
                backgroundColor: focused ? Colors.tabIconSelected + "18" : "transparent",
                borderRadius: 8,
              }}>
                <Feather name="home" size={21} color={color} />
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: "Ask Ragna",
          tabBarIcon: ({ focused }) => <ChatTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="square.grid.2x2" tintColor={color} size={22} />
            ) : (
              <View style={{
                width: 28, height: 28, alignItems: "center", justifyContent: "center",
                backgroundColor: focused ? Colors.tabIconSelected + "18" : "transparent",
                borderRadius: 8,
              }}>
                <Feather name="grid" size={20} color={color} />
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "book.fill" : "book"} tintColor={color} size={22} />
            ) : (
              <View style={{
                width: 28, height: 28, alignItems: "center", justifyContent: "center",
                backgroundColor: focused ? Colors.tabIconSelected + "18" : "transparent",
                borderRadius: 8,
              }}>
                <Feather name="book-open" size={20} color={color} />
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="resources"
        options={{ href: null }}
      />
    </Tabs>
  );
}
