import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  type DimensionValue,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { EvaluationResult } from "@/types";

import { readinessColors } from "./evaluationConfig";

interface EvaluationResultsViewProps {
  result: EvaluationResult;
  insetsBottom: number;
  onStartOver: () => void;
}

export function EvaluationResultsView({ result, insetsBottom, onStartOver }: EvaluationResultsViewProps) {
  const config = readinessColors[result.readinessLevel];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insetsBottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.resultHero, { backgroundColor: config.bg }]}>
        <Text style={[styles.resultLevel, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.resultSummary}>{result.summary}</Text>
        <View style={styles.scoreBar}>
          <View style={[styles.scoreBarFill, { width: `${result.score}%` as DimensionValue, backgroundColor: config.color }]} />
        </View>
        <Text style={[styles.scoreText, { color: config.color }]}>Score: {result.score}/100</Text>
      </View>

      <View style={styles.resultSection}>
        <Text style={styles.resultSectionTitle}>Key Clinical Factors</Text>
        <View style={styles.factorList}>
          {result.keyFactors.map((factor, i) => (
            <View key={i} style={styles.factorRow}>
              <Feather name="check-circle" size={16} color={config.color} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.resultSection}>
        <Text style={styles.resultSectionTitle}>Suggested Next Steps</Text>
        <View style={styles.stepList}>
          {result.nextSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.disclaimerBox}>
        <Feather name="alert-circle" size={16} color={Colors.amber} />
        <Text style={styles.disclaimerBoxText}>{result.disclaimer}</Text>
      </View>

      <View style={styles.cmsBenefitCard}>
        <View style={styles.cmsBenefitHeader}>
          <Feather name="shield" size={16} color={Colors.journeyBefore} />
          <Text style={styles.cmsBenefitTitle}>Medicare Hospice Benefit</Text>
        </View>
        <Text style={styles.cmsBenefitText}>
          Medicare Part A covers hospice care for patients certified with a
          terminal illness and a life expectancy of 6 months or less. The
          benefit includes:
        </Text>
        <View style={styles.cmsBenefitList}>
          {[
            "Nursing care and physician services",
            "Medical equipment and supplies",
            "Prescription drugs for symptom control",
            "Short-term inpatient and respite care",
            "Counseling and social work services",
            "Aide and homemaker services",
          ].map((item) => (
            <View key={item} style={styles.cmsBenefitRow}>
              <Feather name="check" size={12} color={Colors.success} />
              <Text style={styles.cmsBenefitItemText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cmsBenefitNote}>
          <Feather name="info" size={12} color={Colors.textMuted} />
          <Text style={styles.cmsBenefitNoteText}>
            Two physicians must certify the patient's eligibility. Use our
            provider search to find CMS-certified hospice programs near you.
          </Text>
        </View>
        <Pressable
          onPress={() => Linking.openURL("https://www.medicare.gov/coverage/hospice-care")}
          style={styles.cmsBenefitLink}
        >
          <Feather name="external-link" size={13} color={Colors.info} />
          <Text style={styles.cmsBenefitLinkText}>Medicare.gov — Hospice Care Coverage</Text>
        </Pressable>
      </View>

      <View style={styles.resultActions}>
        <Button
          title="Find CMS-Certified Providers"
          onPress={() => router.push("/(tabs)/providers")}
          fullWidth
          size="lg"
        />
        <Button
          title="Start Over"
          onPress={onStartOver}
          variant="outline"
          fullWidth
          size="md"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  resultHero: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginTop: 8,
  },
  resultLevel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  resultSummary: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  resultSection: {
    gap: 12,
  },
  resultSectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  factorList: {
    gap: 10,
  },
  factorRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  factorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  stepList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  disclaimerBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.amberPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  disclaimerBoxText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  resultActions: {
    gap: 10,
    paddingBottom: 8,
  },
  cmsBenefitCard: {
    backgroundColor: Colors.journeyBeforePale,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cmsBenefitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cmsBenefitTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.journeyBefore,
    letterSpacing: -0.2,
  },
  cmsBenefitText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  cmsBenefitList: {
    gap: 6,
  },
  cmsBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cmsBenefitItemText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  cmsBenefitNote: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    backgroundColor: Colors.surfaceMid,
    borderRadius: 8,
    padding: 10,
  },
  cmsBenefitNoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 16,
  },
  cmsBenefitLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cmsBenefitLinkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },
});
