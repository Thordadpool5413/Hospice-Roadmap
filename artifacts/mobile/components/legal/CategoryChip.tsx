import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LegalDocumentCategory } from "@/content/legal/types";

const CATEGORY_CONFIG: Partial<Record<LegalDocumentCategory, { label: string; color: string }>> = {
  medical_order:              { label: "Medical Order",      color: "#F09A7A" },
  advance_directive:          { label: "Planning Document",  color: "#67B7FF" },
  healthcare_proxy:           { label: "Decision Maker",     color: "#B97DFF" },
  medical_power_of_attorney:  { label: "Decision Maker",     color: "#B97DFF" },
  decision_maker:             { label: "Decision Maker",     color: "#B97DFF" },
  living_will:                { label: "Planning Document",  color: "#67B7FF" },
  dnr:                        { label: "Medical Order",      color: "#F09A7A" },
  dni:                        { label: "Medical Order",      color: "#F09A7A" },
  polst_family:               { label: "Medical Order",      color: "#F09A7A" },
  guardianship:               { label: "Court Process",      color: "#59D0D5" },
  conservatorship:            { label: "Court Process",      color: "#59D0D5" },
  registry:                   { label: "Registry",           color: "#8A8DFF" },
  other:                      { label: "Other",              color: "#8F9AB8" },
};

interface CategoryChipProps {
  category: LegalDocumentCategory;
  size?: "sm" | "md";
}

export function CategoryChip({ category, size = "md" }: CategoryChipProps) {
  const cfg = CATEGORY_CONFIG[category] ?? { label: "Document", color: "#8F9AB8" };
  const isSmall = size === "sm";
  return (
    <View style={[s.chip, { borderColor: cfg.color + "50", backgroundColor: cfg.color + "18" }, isSmall && s.chipSm]}>
      <Text style={[s.label, { color: cfg.color }, isSmall && s.labelSm]}>{cfg.label}</Text>
    </View>
  );
}

export function categoryDisplayLabel(category: LegalDocumentCategory): string {
  return CATEGORY_CONFIG[category]?.label ?? "Document";
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    alignSelf: "flex-start",
  },
  chipSm: { paddingHorizontal: 7, paddingVertical: 3 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  labelSm: { fontSize: 10 },
});
