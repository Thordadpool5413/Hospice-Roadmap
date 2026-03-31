import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LegalRequirement } from "@/content/legal/types";

function RequirementRow({ label, req }: { label: string; req: LegalRequirement }) {
  const isRequired = req.required === true;
  const isUnknown = req.required === "unknown";
  const isVaries = req.required === "varies";
  const color = isRequired ? "#D59A32" : isUnknown ? "#8F9AB8" : isVaries ? "#B97DFF" : "#58B6FF";
  const statusText = isRequired ? "Required" : isUnknown ? "Unknown" : isVaries ? "Varies" : "Not Required";
  const icon = isRequired ? "alert-circle" : isUnknown ? "help-circle" : isVaries ? "info" : "check-circle";

  return (
    <View style={s.row}>
      <View style={s.rowTop}>
        <Feather name={icon as any} size={14} color={color} />
        <Text style={s.rowLabel}>{label}</Text>
        <View style={[s.pill, { backgroundColor: color + "18", borderColor: color + "40" }]}>
          <Text style={[s.pillText, { color }]}>{statusText}</Text>
        </View>
      </View>
      {req.details ? (
        <Text style={s.rowDetails}>{req.details}</Text>
      ) : null}
    </View>
  );
}

interface LegalRequirementsCardProps {
  witnessReq: LegalRequirement;
  notaryReq: LegalRequirement;
  specialReqs?: string[];
}

export function LegalRequirementsCard({ witnessReq, notaryReq, specialReqs }: LegalRequirementsCardProps) {
  return (
    <View style={s.card}>
      <Text style={s.title}>Execution Requirements</Text>
      <RequirementRow label="Witness" req={witnessReq} />
      <View style={s.divider} />
      <RequirementRow label="Notary" req={notaryReq} />
      {specialReqs && specialReqs.length > 0 && (
        <>
          <View style={s.divider} />
          <Text style={s.specialTitle}>Special Requirements</Text>
          {specialReqs.map((r, i) => (
            <View key={i} style={s.specialRow}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.specialText}>{r}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "rgba(21,40,86,0.88)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.50)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#F3F6FF",
    marginBottom: 2,
  },
  row: { gap: 6 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#B6C0DA" },
  pill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  pillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  rowDetails: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8F9AB8",
    lineHeight: 18,
    paddingLeft: 22,
  },
  divider: { height: 1, backgroundColor: "rgba(53,94,159,0.25)" },
  specialTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#B6C0DA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specialRow: { flexDirection: "row", gap: 6 },
  bullet: { fontSize: 12, color: "#63C8FF", marginTop: 2 },
  specialText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 18 },
});
