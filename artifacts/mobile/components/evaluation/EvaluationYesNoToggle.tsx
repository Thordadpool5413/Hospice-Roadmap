import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationYesNoToggleProps {
  value: boolean | null;
  onChange: (v: boolean) => void;
}

export function EvaluationYesNoToggle({ value, onChange }: EvaluationYesNoToggleProps) {
  return (
    <View style={styles.yesNoRow}>
      {[
        { label: "Yes", val: true },
        { label: "No", val: false },
      ].map(({ label, val }) => (
        <Pressable
          key={label}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(val);
          }}
          style={({ pressed }) => [
            styles.yesNoBtn,
            value === val && styles.yesNoBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.yesNoBtnText, value === val && styles.yesNoBtnTextActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  yesNoRow: {
    flexDirection: "row",
    gap: 10,
  },
  yesNoBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  yesNoBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  yesNoBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  yesNoBtnTextActive: {
    color: Colors.primaryDark,
  },
});
