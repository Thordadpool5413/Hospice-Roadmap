import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationPainScaleProps {
  value: number | null;
  onChange: (n: number) => void;
}

export function EvaluationPainScale({ value, onChange }: EvaluationPainScaleProps) {
  return (
    <View style={styles.painRow}>
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <Pressable
          key={n}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(n);
          }}
          style={({ pressed }) => [
            styles.painBtn,
            value === n && styles.painBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.painBtnText, value === n && styles.painBtnTextActive]}>
            {n}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  painRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  painBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  painBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  painBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  painBtnTextActive: {
    color: Colors.primaryDark,
  },
});
