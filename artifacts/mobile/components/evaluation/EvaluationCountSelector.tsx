import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationCountSelectorProps {
  value: number | null;
  onChange: (n: number) => void;
  options?: number[];
}

export function EvaluationCountSelector({
  value,
  onChange,
  options = [0, 1, 2, 3, 4],
}: EvaluationCountSelectorProps) {
  return (
    <View style={styles.countRow}>
      {options.map((n) => (
        <Pressable
          key={n}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(n);
          }}
          style={({ pressed }) => [
            styles.countBtn,
            value === n && styles.countBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.countBtnText, value === n && styles.countBtnTextActive]}>
            {n === 4 ? "4+" : String(n)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  countRow: {
    flexDirection: "row",
    gap: 10,
  },
  countBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  countBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  countBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  countBtnTextActive: {
    color: Colors.primaryDark,
  },
});
