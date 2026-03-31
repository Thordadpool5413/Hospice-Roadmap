import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LegalReviewMeta } from "@/content/legal/types";
import { ReviewBadge } from "./ReviewBadge";

const SOURCE_LABELS: Record<string, string> = {
  official_state_source: "Official State Source",
  official_health_source: "Official Health Authority",
  official_court_source: "Official Court Source",
  official_attorney_general_source: "Attorney General",
  official_legislative_source: "Official Legislation",
  national_reference: "National Reference",
  internal_editorial: "Internal Editorial",
};

interface LegalMetadataCardProps {
  review: LegalReviewMeta;
}

export function LegalMetadataCard({ review }: LegalMetadataCardProps) {
  return (
    <View style={s.card}>
      <Text style={s.title}>Source & Review</Text>
      <View style={s.row}>
        <Text style={s.label}>Status</Text>
        <ReviewBadge status={review.reviewStatus} size="sm" />
      </View>
      <View style={s.row}>
        <Text style={s.label}>Review Owner</Text>
        <Text style={s.value}>{review.reviewOwner}</Text>
      </View>
      <View style={s.row}>
        <Text style={s.label}>Last Reviewed</Text>
        <Text style={s.value}>{review.lastLegalReviewed ?? "Not yet reviewed"}</Text>
      </View>
      <View style={s.row}>
        <Text style={s.label}>Source Type</Text>
        <Text style={s.value}>{SOURCE_LABELS[review.sourceType] ?? review.sourceType}</Text>
      </View>
      {review.sourceNotes.length > 0 && (
        <View style={s.notesWrap}>
          <Text style={s.notesTitle}>Sources</Text>
          {review.sourceNotes.map((note, i) => (
            <Text key={i} style={s.note}>• {note}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(21,40,86,0.88)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.35)",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#8F9AB8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#8F9AB8" },
  value: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#B6C0DA", flex: 1, textAlign: "right" },
  notesWrap: { gap: 4, borderTopWidth: 1, borderTopColor: "rgba(53,94,159,0.25)", paddingTop: 10 },
  notesTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8F9AB8", marginBottom: 2 },
  note: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 16 },
});
