import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface SavedItemButtonProps {
  saved: boolean;
  onToggle: () => void;
  size?: number;
}

export function SavedItemButton({ saved, onToggle, size = 18 }: SavedItemButtonProps) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      style={({ pressed }) => [s.btn, pressed && { opacity: 0.7 }]}
    >
      <Feather
        name={saved ? "bookmark" : "bookmark"}
        size={size}
        color={saved ? "#67B7FF" : "#4A6090"}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { padding: 4 },
});
