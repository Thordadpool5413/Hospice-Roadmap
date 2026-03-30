import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

export function EvaluationInfoCard() {
  return (
    <View style={styles.bannerBox}>
      <Feather name="info" size={16} color={Colors.journeyBefore} />
      <Text style={styles.bannerText}>
        This is an informational assessment only — not a clinical
        determination or medical advice. Results are educational guidance.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.journeyBeforePale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
