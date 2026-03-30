import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface RagnaHeaderProps {
  hasMessages: boolean;
  memoryCount: number;
  onNewConversation: () => void;
}

export function RagnaHeader({ hasMessages, memoryCount, onNewConversation }: RagnaHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.compassBadge}>
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 38, height: 38 }}
            resizeMode="cover"
          />
        </View>
        <View>
          <Text style={styles.headerTitle}>Ragna</Text>
          <View style={styles.headerSubRow}>
            <Text style={styles.headerSubtitle}>Your hospice care companion</Text>
            {memoryCount > 0 && (
              <View style={styles.memoryPill}>
                <Feather name="zap" size={9} color={Colors.accentLight} />
                <Text style={styles.memoryPillText}>Knows your story</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyMid,
    backgroundColor: Colors.navy,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.navyText,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.navySub,
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  memoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.navyMid,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + "50",
  },
  memoryPillText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentLight,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.navyMid,
    alignItems: "center",
    justifyContent: "center",
  },
});
