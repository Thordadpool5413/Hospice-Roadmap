import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StateOverview } from "@/content/legal/types";

interface StateOverviewCardProps {
  overview: StateOverview;
}

export function StateOverviewCard({ overview }: StateOverviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={s.card}>
      <Text style={s.summary}>{overview.summary}</Text>

      {overview.importantWarnings.length > 0 && (
        <View style={s.warningsWrap}>
          {overview.importantWarnings.map((w, i) => (
            <View key={i} style={s.warningRow}>
              <Feather name="alert-triangle" size={12} color="#D59A32" style={{ marginTop: 2 }} />
              <Text style={s.warningText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      {!expanded ? (
        <Pressable onPress={() => setExpanded(true)} style={s.expandBtn}>
          <Text style={s.expandLabel}>Show naming & planning notes</Text>
          <Feather name="chevron-down" size={13} color="#67B7FF" />
        </Pressable>
      ) : (
        <>
          {overview.namingNotes.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Naming Notes</Text>
              {overview.namingNotes.map((n, i) => (
                <Text key={i} style={s.bulletItem}>• {n}</Text>
              ))}
            </View>
          )}
          {overview.planningNotes.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Planning Notes</Text>
              {overview.planningNotes.map((n, i) => (
                <Text key={i} style={s.bulletItem}>• {n}</Text>
              ))}
            </View>
          )}
          <Pressable onPress={() => setExpanded(false)} style={s.expandBtn}>
            <Text style={s.expandLabel}>Show less</Text>
            <Feather name="chevron-up" size={13} color="#67B7FF" />
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(20,40,88,0.78)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.45)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  summary: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 20 },
  warningsWrap: { gap: 6 },
  warningRow: { flexDirection: "row", gap: 7 },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#D59A32", lineHeight: 17 },
  section: { gap: 5 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#8F9AB8", textTransform: "uppercase", letterSpacing: 0.5 },
  bulletItem: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 18 },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  expandLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#67B7FF" },
});
