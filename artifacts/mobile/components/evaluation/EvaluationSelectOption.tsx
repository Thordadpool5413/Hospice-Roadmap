import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationSelectOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  desc?: string;
}

export function EvaluationSelectOption({ label, selected, onPress, desc }: EvaluationSelectOptionProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
        {selected && <View style={styles.optionRadioDot} />}
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
          {label}
        </Text>
        {desc && <Text style={styles.optionDesc}>{desc}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionRadioSelected: {
    borderColor: Colors.primary,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
