import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface RagnaHeaderProps {
  hasMessages: boolean;
  memoryCount: number;
  onBack?: () => void;
  onNewConversation: () => void;
}

export function RagnaHeader({
  hasMessages,
  memoryCount,
  onBack,
  onNewConversation,
}: RagnaHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="arrow-left" size={18} color={Colors.navyText} />
          </Pressable>
        ) : null}
        <View style={styles.compassBadge}>
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 38, height: 38 }}
            resizeMode="cover"
          />
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>Ragna</Text>
          <View style={styles.headerSubRow}>
            <Text style={styles.headerSubtitle}>
              Hospice guidance that stays calm and human
            </Text>
            {memoryCount > 0 && (
              <View style={styles.memoryPill}>
                <Feather name="zap" size={9} color={Colors.accentLight} />
                <Text style={styles.memoryPillText}>Memory on</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.headerRight}>
        {hasMessages && (
          <Pressable
            onPress={onNewConversation}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="edit" size={18} color={Colors.navySub} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(60, 90, 160, 0.18)",
    backgroundColor: "rgba(4, 10, 24, 0.94)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.16)",
  },
  compassBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.navyText,
    letterSpacing: -0.35,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#8E9FC0",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  memoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(96, 150, 255, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(96, 150, 255, 0.22)",
  },
  memoryPillText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryLight,
    letterSpacing: 0.25,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.16)",
  },
});
