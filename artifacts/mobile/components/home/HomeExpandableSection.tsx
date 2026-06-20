import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";

import { Colors } from "@/constants/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function HomeExpandableSection({
  title,
  subtitle,
  defaultExpanded = false,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.textMuted}
        />
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

interface LinkRowProps {
  label: string;
  sub?: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

export function HomeLinkRow({ label, sub, icon, color = Colors.primary, onPress }: LinkRowProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.82, backgroundColor: "rgba(255,255,255,0.03)" }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={17} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={2}>{sub}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 200, 0.18)",
    backgroundColor: "rgba(12, 20, 55, 0.55)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#E8F0FF",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6A80AE",
    lineHeight: 17,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: "rgba(70, 110, 200, 0.12)",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(70, 110, 200, 0.12)",
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#E8F0FF",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7A8EB8",
    lineHeight: 16,
  },
});