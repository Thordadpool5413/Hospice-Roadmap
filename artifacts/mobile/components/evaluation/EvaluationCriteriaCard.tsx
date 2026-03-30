import { Feather } from "@expo/vector-icons";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationCriteriaCardProps {
  expanded: boolean;
  onToggle: () => void;
}

export function EvaluationCriteriaCard({ expanded, onToggle }: EvaluationCriteriaCardProps) {
  return (
    <Pressable onPress={onToggle} style={styles.criteriaCard}>
      <View style={styles.criteriaHeader}>
        <View style={styles.criteriaHeaderLeft}>
          <Feather name="shield" size={16} color={Colors.journeyBefore} />
          <Text style={styles.criteriaTitle}>Official Medicare Hospice Criteria</Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.journeyBefore}
        />
      </View>
      {expanded && (
        <View style={styles.criteriaBody}>
          <Text style={styles.criteriaText}>
            Under Medicare guidelines, a patient may be eligible for the
            hospice benefit when:
          </Text>
          <View style={styles.criteriaList}>
            {[
              "Two physicians certify a terminal prognosis of 6 months or less if the illness runs its normal course",
              "The patient elects to receive palliative (comfort) care rather than curative treatment",
              "Care is provided by a Medicare-certified hospice program",
            ].map((item) => (
              <View key={item} style={styles.criteriaRow}>
                <Feather name="check-circle" size={13} color={Colors.success} />
                <Text style={styles.criteriaItemText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.criteriaText}>
            The Medicare hospice benefit covers nursing care, medications for
            symptom control, medical equipment, short-term inpatient care,
            respite care, counseling, and aide services.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("https://www.medicare.gov/coverage/hospice-care")}
            style={styles.criteriaLink}
          >
            <Feather name="external-link" size={13} color={Colors.info} />
            <Text style={styles.criteriaLinkText}>Medicare.gov — Hospice Care Coverage</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  criteriaCard: {
    backgroundColor: Colors.journeyBeforePale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  criteriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  criteriaHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  criteriaTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.journeyBefore,
    letterSpacing: -0.2,
  },
  criteriaBody: {
    marginTop: 12,
    gap: 10,
  },
  criteriaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  criteriaList: {
    gap: 8,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  criteriaItemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    lineHeight: 19,
  },
  criteriaLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  criteriaLinkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },
});
