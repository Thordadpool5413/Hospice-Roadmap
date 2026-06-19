import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { HOSPICE_TEAM_MATRIX } from "@/constants/hospiceTeamMatrix";

interface Props {
  compact?: boolean;
}

export function HospiceTeamMatrix({ compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.headerLeft}>
          <Feather name="users" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>Who do I call for what?</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.primary} />
      </Pressable>

      {expanded && (
        <View style={styles.list}>
          {HOSPICE_TEAM_MATRIX.map((row) => (
            <View key={row.role} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={[styles.iconWrap, { backgroundColor: row.color + "22" }]}>
                  <Feather name={row.icon as any} size={16} color={row.color} />
                </View>
                <View style={styles.rowTitleWrap}>
                  <Text style={styles.role}>{row.role}</Text>
                  <Text style={styles.available}>{row.available}</Text>
                </View>
              </View>
              <Text style={styles.when}>{row.when}</Text>
              {row.callFor.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: row.color }]}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(55, 85, 170, 0.22)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.2,
  },
  list: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  row: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(55, 85, 170, 0.18)",
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitleWrap: { flex: 1, gap: 1 },
  role: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#E8F0FF" },
  available: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6A80AE" },
  when: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary, marginLeft: 44 },
  bulletRow: { flexDirection: "row", gap: 6, marginLeft: 44 },
  bullet: { fontSize: 14, lineHeight: 18 },
  bulletText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9AB0D8",
    lineHeight: 17,
  },
});