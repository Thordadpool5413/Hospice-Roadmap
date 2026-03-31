import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function LegalDisclaimerCard({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[s.card, compact && s.cardCompact]}>
      <Feather name="alert-triangle" size={compact ? 14 : 16} color="#D59A32" style={s.icon} />
      <Text style={[s.text, compact && s.textCompact]}>
        {compact
          ? "Educational only — not legal advice."
          : "This information is educational and not legal advice. State laws, forms, and acceptance rules can change. Use official state forms and consider legal, clinical, or state-specific guidance when needed."}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(213,154,50,0.08)",
    borderWidth: 1,
    borderColor: "rgba(213,154,50,0.25)",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardCompact: {
    padding: 10,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  icon: { marginTop: 1 },
  text: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#B6C0DA",
    lineHeight: 18,
  },
  textCompact: { fontSize: 11, lineHeight: 16 },
});
