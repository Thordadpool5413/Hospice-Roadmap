import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface OfficialLinkButtonProps {
  label: string;
  url: string | null;
  icon?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export function OfficialLinkButton({
  label,
  url,
  icon = "external-link",
  disabled,
  variant = "primary",
}: OfficialLinkButtonProps) {
  const isDisabled = disabled || !url;
  const color = isDisabled ? "#4A6090" : variant === "primary" ? "#67B7FF" : "#B97DFF";
  const bg = isDisabled ? "rgba(14,24,60,0.60)" : variant === "primary" ? "rgba(103,183,255,0.10)" : "rgba(185,125,255,0.10)";
  const border = isDisabled ? "rgba(74,96,144,0.30)" : variant === "primary" ? "rgba(103,183,255,0.35)" : "rgba(185,125,255,0.35)";

  function handlePress() {
    if (url) Linking.openURL(url);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: border },
        pressed && !isDisabled && { opacity: 0.75 },
      ]}
    >
      <Feather name={icon as any} size={13} color={color} />
      <Text style={[s.label, { color }]}>
        {isDisabled && !url ? (url === null ? label.replace(/^Official /, "") + " Not Linked Yet" : label) : label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
  },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
