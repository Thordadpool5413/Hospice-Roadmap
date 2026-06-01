import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect } from "react";
import { Image, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useSubscription } from "@/context/SubscriptionContext";
import { useCaregiverWellness } from "@/context/CaregiverWellnessContext";
import { useApp } from "@/context/AppContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const ragnaIcon = require("@/assets/images/ragna-icon.png");

function ChatTabIcon({ focused, isPremium }: { focused: boolean; isPremium: boolean }) {
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
      {isPremium ? (
        <View style={{
          position: "absolute", bottom: -1, right: -1,
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: Colors.chatLiveDot,
          borderWidth: 1.5, borderColor: "#040C1C",
        }} />
      ) : (
        <View style={{
          position: "absolute", top: -3, left: -3,
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: Colors.primary,
          borderWidth: 1.5, borderColor: "#040C1C",
          alignItems: "center", justifyContent: "center",
        }}>
          <Feather name="lock" size={7} color="#fff" />
        </View>
      )}
    </View>
  );
}

// ─── Wellness tab icon ────────────────────────────────────────────────────────

function WellnessTabIcon({
  color,
  focused,
  isIOS,
  hasPendingSync,
}: {
  color: string;
  focused: boolean;
  isIOS: boolean;
  hasPendingSync: boolean;
}) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      {isIOS ? (
        <SymbolView name={focused ? "heart.fill" : "heart"} tintColor={color} size={22} />
      ) : (
        <View style={{
          width: 28, height: 28, alignItems: "center", justifyContent: "center",
          backgroundColor: focused ? Colors.tabIconSelected + "18" : "transparent",
          borderRadius: 8,
        }}>
          <Feather name="heart" size={20} color={color} />
        </View>
      )}
      {hasPendingSync && (
        <View style={{
          position: "absolute",
          top: isIOS ? -1 : 0,
          right: isIOS ? -1 : 0,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: Colors.amber,
          borderWidth: 1.5,
          borderColor: "#040C1C",
        }} />
      )}
    </View>
  );
}

// ─── Tools tab icon ───────────────────────────────────────────────────────────

function ToolsTabIcon({
  color,
  focused,
  isIOS,
  hasPendingBookmarkSync,
}: {
  color: string;
  focused: boolean;
  isIOS: boolean;
  hasPendingBookmarkSync: boolean;
}) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      {isIOS ? (
        <SymbolView name="square.grid.2x2" tintColor={color} size={22} />
      ) : (
        <View style={{
          width: 28, height: 28, alignItems: "center", justifyContent: "center",
          backgroundColor: focused ? Colors.tabIconSelected + "18" : "transparent",
          borderRadius: 8,
        }}>
          <Feather name="grid" size={20} color={color} />
        </View>
      )}
      {hasPendingBookmarkSync && (
        <View style={{
          position: "absolute",
          top: isIOS ? -1 : 0,
          right: isIOS ? -1 : 0,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: Colors.amber,
          borderWidth: 1.5,
          borderColor: "#040C1C",
        }} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const { isSignedIn, getToken } = useAuth();
  const { isPremium } = useSubscription();
  const { hasPendingSync: wellnessPendingSync } = useCaregiverWellness();
  const { hasPendingBookmarkSync } = useApp();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

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
          tabBarIcon: ({ focused }) => <ChatTabIcon focused={focused} isPremium={isPremium} />,
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
          tabBarIcon: ({ color, focused }) => (
            <ToolsTabIcon
              color={color}
              focused={focused}
              isIOS={isIOS}
              hasPendingBookmarkSync={hasPendingBookmarkSync}
            />
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
        name="wellness"
        options={{
          title: "Wellness",
          tabBarIcon: ({ color, focused }) => (
            <WellnessTabIcon
              color={color}
              focused={focused}
              isIOS={isIOS}
              hasPendingSync={wellnessPendingSync}
            />
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
