import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export interface FilterChipOption {
  key: string;
  label: string;
}

interface LegalFilterChipsProps {
  options: FilterChipOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export function LegalFilterChips({ options, selected, onSelect }: LegalFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={({ pressed }) => [
              s.chip,
              active && s.chipActive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[s.label, active && s.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.45)",
    backgroundColor: "rgba(20,41,90,0.80)",
  },
  chipActive: {
    backgroundColor: "rgba(103,183,255,0.15)",
    borderColor: "rgba(103,183,255,0.55)",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#8F9AB8",
  },
  labelActive: { color: "#67B7FF" },
});
