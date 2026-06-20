import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface StageStyle {
  label: string;
  color: string;
  bg: string;
  dot: string;
  border: string;
}

interface Props {
  greeting: string;
  stageStyle: StageStyle;
  onSettingsPress: () => void;
}

export function HomeGreeting({ greeting, stageStyle, onSettingsPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={[styles.pill, { backgroundColor: stageStyle.bg, borderColor: stageStyle.border }]}>
          <View style={[styles.dot, { backgroundColor: stageStyle.dot }]} />
          <Text style={[styles.pillText, { color: stageStyle.color }]}>{stageStyle.label}</Text>
        </View>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>
      <Pressable
        onPress={onSettingsPress}
        style={({ pressed }) => [styles.settings, pressed && { opacity: 0.55 }]}
        accessibilityLabel="Settings"
      >
        <Feather name="settings" size={19} color="rgba(150, 175, 230, 0.75)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  left: { flex: 1, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  settings: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
    marginTop: 4,
  },
});