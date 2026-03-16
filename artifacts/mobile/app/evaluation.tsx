import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  type DimensionValue,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { runEvaluation } from "@/services/evaluationEngine";
import {
  DiagnosisCategory,
  EvaluationInput,
  EvaluationResult,
} from "@/types";

const diagnoses: { id: DiagnosisCategory; label: string }[] = [
  { id: "cancer", label: "Cancer" },
  { id: "chf", label: "Congestive Heart Failure" },
  { id: "copd", label: "COPD" },
  { id: "dementia", label: "Dementia / Alzheimer's" },
  { id: "stroke", label: "Stroke / Neurological Condition" },
  { id: "general_debility", label: "General Debility / Failure to Thrive" },
  { id: "liver_disease", label: "Liver Disease" },
  { id: "renal_disease", label: "Renal Disease" },
  { id: "aids", label: "AIDS / HIV" },
  { id: "other", label: "Other Terminal Illness" },
];

const performanceLevels: { value: 0 | 1 | 2 | 3 | 4; label: string; desc: string }[] = [
  { value: 0, label: "Normal", desc: "Fully active, no limitations" },
  { value: 1, label: "Mild decline", desc: "Restricted in strenuous activity" },
  { value: 2, label: "Moderate", desc: "Ambulatory, capable of self-care" },
  { value: 3, label: "Significant", desc: "Limited self-care, in bed >50% of time" },
  { value: 4, label: "Severe", desc: "Completely bedbound, no self-care" },
];

const readinessColors = {
  low: { color: Colors.success, bg: Colors.successPale, label: "Lower Readiness" },
  moderate: { color: Colors.amber, bg: Colors.amberPale, label: "Moderate Readiness" },
  high: { color: Colors.primary, bg: Colors.primaryPale, label: "Higher Readiness" },
};

function SelectOption({
  label,
  selected,
  onPress,
  desc,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  desc?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
        {selected && <View style={styles.optionRadioDot} />}
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
          {label}
        </Text>
        {desc && <Text style={styles.optionDesc}>{desc}</Text>}
      </View>
    </Pressable>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.yesNoRow}>
      {[
        { label: "Yes", val: true },
        { label: "No", val: false },
      ].map(({ label, val }) => (
        <Pressable
          key={label}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(val);
          }}
          style={({ pressed }) => [
            styles.yesNoBtn,
            value === val && styles.yesNoBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text
            style={[
              styles.yesNoBtnText,
              value === val && styles.yesNoBtnTextActive,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function EvaluationScreen() {
  const insets = useSafeAreaInsets();
  const [diagnosis, setDiagnosis] = useState<DiagnosisCategory | null>(null);
  const [performance, setPerformance] = useState<0 | 1 | 2 | 3 | 4 | null>(null);
  const [weightLoss, setWeightLoss] = useState<boolean | null>(null);
  const [hospitalizations, setHospitalizations] = useState<number | null>(null);
  const [declineRate, setDeclineRate] = useState<"rapid" | "gradual" | "stable" | null>(null);
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [adlDecline, setAdlDecline] = useState<boolean | null>(null);
  const [advanceDirectives, setAdvanceDirectives] = useState<boolean | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);

  const toggleCriteria = useCallback(() => {
    setCriteriaExpanded((prev) => !prev);
  }, []);

  const canSubmit =
    diagnosis !== null &&
    performance !== null &&
    weightLoss !== null &&
    hospitalizations !== null &&
    declineRate !== null &&
    painLevel !== null &&
    adlDecline !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const input: EvaluationInput = {
      diagnosis: diagnosis!,
      performanceStatus: performance!,
      weightLoss: weightLoss!,
      hospitalizations: hospitalizations!,
      declineRate: declineRate!,
      painLevel: painLevel!,
      adlDecline: adlDecline!,
      advanceDirectives: advanceDirectives ?? false,
    };
    const r = runEvaluation(input);
    setResult(r);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (result) {
    const config = readinessColors[result.readinessLevel];
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Hero */}
        <View style={[styles.resultHero, { backgroundColor: config.bg }]}>
          <Text style={[styles.resultLevel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={styles.resultSummary}>{result.summary}</Text>

          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${result.score}%` as DimensionValue, backgroundColor: config.color }]} />
          </View>
          <Text style={[styles.scoreText, { color: config.color }]}>
            Score: {result.score}/100
          </Text>
        </View>

        {/* Key Factors */}
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

        {/* Next Steps */}
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

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Feather name="alert-circle" size={16} color={Colors.amber} />
          <Text style={styles.disclaimerBoxText}>{result.disclaimer}</Text>
        </View>

        <View style={styles.cmsBenefitCard}>
          <View style={styles.cmsBenefitHeader}>
            <Feather name="shield" size={16} color="#1A6DAA" />
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
            onPress={() =>
              Linking.openURL("https://www.medicare.gov/coverage/hospice-care")
            }
            style={styles.cmsBenefitLink}
          >
            <Feather name="external-link" size={13} color={Colors.info} />
            <Text style={styles.cmsBenefitLinkText}>
              Medicare.gov — Hospice Care Coverage
            </Text>
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
            onPress={() => setResult(null)}
            variant="outline"
            fullWidth
            size="md"
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Official Medicare Hospice Criteria - Collapsible */}
      <Pressable
        onPress={toggleCriteria}
        style={styles.criteriaCard}
      >
        <View style={styles.criteriaHeader}>
          <View style={styles.criteriaHeaderLeft}>
            <Feather name="shield" size={16} color="#1A6DAA" />
            <Text style={styles.criteriaTitle}>Official Medicare Hospice Criteria</Text>
          </View>
          <Feather
            name={criteriaExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#1A6DAA"
          />
        </View>
        {criteriaExpanded && (
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
              onPress={() =>
                Linking.openURL(
                  "https://www.medicare.gov/coverage/hospice-care"
                )
              }
              style={styles.criteriaLink}
            >
              <Feather name="external-link" size={13} color={Colors.info} />
              <Text style={styles.criteriaLinkText}>
                Medicare.gov — Hospice Care Coverage
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Disclaimer Banner */}
      <View style={styles.bannerBox}>
        <Feather name="info" size={16} color={Colors.journeyBefore} />
        <Text style={styles.bannerText}>
          This is an informational assessment only — not a clinical
          determination or medical advice. Results are educational guidance.
        </Text>
      </View>

      {/* Diagnosis */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>1. Primary Diagnosis</Text>
        <Text style={styles.questionSubtitle}>
          Select the condition most relevant to this patient.
        </Text>
        <View style={styles.optionList}>
          {diagnoses.map((d) => (
            <SelectOption
              key={d.id}
              label={d.label}
              selected={diagnosis === d.id}
              onPress={() => setDiagnosis(d.id)}
            />
          ))}
        </View>
      </View>

      {/* Performance Status */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>2. Performance Status (ECOG)</Text>
        <Text style={styles.questionSubtitle}>
          How would you describe the patient's current functional level?
        </Text>
        <View style={styles.optionList}>
          {performanceLevels.map((lvl) => (
            <SelectOption
              key={lvl.value}
              label={lvl.label}
              desc={lvl.desc}
              selected={performance === lvl.value}
              onPress={() => setPerformance(lvl.value)}
            />
          ))}
        </View>
      </View>

      {/* Weight Loss */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>
          3. Unintentional Weight Loss (Past 6 Months)
        </Text>
        <YesNoToggle value={weightLoss} onChange={setWeightLoss} />
      </View>

      {/* Hospitalizations */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>
          4. Hospitalizations in Past 6 Months
        </Text>
        <View style={styles.countRow}>
          {[0, 1, 2, 3, 4].map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHospitalizations(n);
              }}
              style={({ pressed }) => [
                styles.countBtn,
                hospitalizations === n && styles.countBtnActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.countBtnText,
                  hospitalizations === n && styles.countBtnTextActive,
                ]}
              >
                {n === 4 ? "4+" : String(n)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Decline Rate */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>5. Rate of Clinical Decline</Text>
        <Text style={styles.questionSubtitle}>
          How quickly has the patient's condition been declining?
        </Text>
        <View style={styles.optionList}>
          {[
            { id: "rapid" as const, label: "Rapid", desc: "Noticeable decline week to week or month to month" },
            { id: "gradual" as const, label: "Gradual", desc: "Slow decline over many months" },
            { id: "stable" as const, label: "Stable", desc: "No significant recent decline" },
          ].map((opt) => (
            <SelectOption
              key={opt.id}
              label={opt.label}
              desc={opt.desc}
              selected={declineRate === opt.id}
              onPress={() => setDeclineRate(opt.id)}
            />
          ))}
        </View>
      </View>

      {/* Pain Level */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>6. Current Pain or Discomfort Level</Text>
        <Text style={styles.questionSubtitle}>0 = No pain, 10 = Worst possible pain</Text>
        <View style={styles.painRow}>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPainLevel(n);
              }}
              style={({ pressed }) => [
                styles.painBtn,
                painLevel === n && styles.painBtnActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.painBtnText,
                  painLevel === n && styles.painBtnTextActive,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ADL Decline */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>
          7. Decline in Activities of Daily Living (ADLs)
        </Text>
        <Text style={styles.questionSubtitle}>
          Has there been increasing dependence with bathing, dressing, eating,
          or mobility?
        </Text>
        <YesNoToggle value={adlDecline} onChange={setAdlDecline} />
      </View>

      {/* Advance Directives */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionTitle}>
          8. Advance Directives in Place?
        </Text>
        <Text style={styles.questionSubtitle}>
          Does the patient have a Healthcare Power of Attorney, Living Will, or
          POLST?
        </Text>
        <YesNoToggle value={advanceDirectives} onChange={setAdvanceDirectives} />
      </View>

      <Button
        title="View Assessment Results"
        onPress={handleSubmit}
        disabled={!canSubmit}
        fullWidth
        size="lg"
      />
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
  bannerBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.journeyBeforePale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C5D8EF",
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  questionBlock: {
    gap: 10,
  },
  questionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  questionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: -4,
  },
  optionList: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionRadioSelected: {
    borderColor: Colors.primary,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  yesNoRow: {
    flexDirection: "row",
    gap: 10,
  },
  yesNoBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  yesNoBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  yesNoBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  yesNoBtnTextActive: {
    color: Colors.primaryDark,
  },
  countRow: {
    flexDirection: "row",
    gap: 10,
  },
  countBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  countBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  countBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  countBtnTextActive: {
    color: Colors.primaryDark,
  },
  painRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  painBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  painBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  painBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  painBtnTextActive: {
    color: Colors.primaryDark,
  },
  // Results
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
    borderColor: "#E8C97A",
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
  criteriaCard: {
    backgroundColor: "#E8F4FD",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#B8DAEF",
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
    color: "#1A6DAA",
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
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  criteriaLinkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },
  cmsBenefitCard: {
    backgroundColor: "#E8F4FD",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#B8DAEF",
  },
  cmsBenefitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cmsBenefitTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1A6DAA",
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
    backgroundColor: "rgba(255,255,255,0.5)",
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
    backgroundColor: "rgba(255,255,255,0.5)",
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
