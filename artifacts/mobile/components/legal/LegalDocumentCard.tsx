import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LegalDocumentEntry } from "@/content/legal/types";
import { CategoryChip } from "./CategoryChip";
import { OfficialLinkButton } from "./OfficialLinkButton";
import { ReviewBadge } from "./ReviewBadge";
import { SavedItemButton } from "./SavedItemButton";

interface LegalDocumentCardProps {
  doc: LegalDocumentEntry;
  saved: boolean;
  onLearnMore: () => void;
  onToggleSave: () => void;
}

export function LegalDocumentCard({ doc, saved, onLearnMore, onToggleSave }: LegalDocumentCardProps) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>{doc.title}</Text>
          {doc.commonNames.length > 0 && (
            <Text style={s.commonNames} numberOfLines={1}>
              {doc.commonNames.slice(0, 3).join(" · ")}
            </Text>
          )}
          <View style={s.chipsRow}>
            <CategoryChip category={doc.category} size="sm" />
            <ReviewBadge status={doc.review.reviewStatus} size="sm" />
          </View>
        </View>
        <SavedItemButton saved={saved} onToggle={onToggleSave} />
      </View>

      <Text style={s.summary} numberOfLines={3}>{doc.summary}</Text>

      <View style={s.actions}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLearnMore(); }}
          style={({ pressed }) => [s.learnBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={s.learnLabel}>Learn More</Text>
          <Feather name="arrow-right" size={13} color="#67B7FF" />
        </Pressable>
        <OfficialLinkButton label="Official Form" url={doc.officialFormUrl} icon="file-text" />
        <OfficialLinkButton label="State Page" url={doc.officialInfoUrl} icon="globe" variant="secondary" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(20,40,88,0.78)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.40)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, gap: 5 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#F3F6FF" },
  commonNames: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8F9AB8" },
  chipsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  summary: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  learnBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(103,183,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(103,183,255,0.40)",
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 10,
  },
  learnLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#67B7FF" },
});
