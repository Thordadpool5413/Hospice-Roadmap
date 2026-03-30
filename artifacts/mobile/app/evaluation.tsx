import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { EvaluationCountSelector } from "@/components/evaluation/EvaluationCountSelector";
import { EvaluationCriteriaCard } from "@/components/evaluation/EvaluationCriteriaCard";
import { EvaluationInfoCard } from "@/components/evaluation/EvaluationInfoCard";
import { EvaluationPainScale } from "@/components/evaluation/EvaluationPainScale";
import { EvaluationQuestionSection } from "@/components/evaluation/EvaluationQuestionSection";
import { EvaluationResultsView } from "@/components/evaluation/EvaluationResultsView";
import { EvaluationSelectOption } from "@/components/evaluation/EvaluationSelectOption";
import { EvaluationYesNoToggle } from "@/components/evaluation/EvaluationYesNoToggle";
import { diagnoses, performanceLevels } from "@/components/evaluation/evaluationConfig";
import { runEvaluation } from "@/services/evaluationEngine";
import { DiagnosisCategory, EvaluationInput, EvaluationResult } from "@/types";

const DECLINE_RATE_OPTIONS = [
  { id: "rapid" as const, label: "Rapid", desc: "Noticeable decline week to week or month to month" },
  { id: "gradual" as const, label: "Gradual", desc: "Slow decline over many months" },
  { id: "stable" as const, label: "Stable", desc: "No significant recent decline" },
];

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

  const toggleCriteria = useCallback(() => setCriteriaExpanded((prev) => !prev), []);

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
    return (
      <EvaluationResultsView
        result={result}
        insetsBottom={insets.bottom}
        onStartOver={() => setResult(null)}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <EvaluationCriteriaCard expanded={criteriaExpanded} onToggle={toggleCriteria} />

      <EvaluationInfoCard />

      <EvaluationQuestionSection
        title="1. Primary Diagnosis"
        subtitle="Select the condition most relevant to this patient."
      >
        <View style={styles.optionList}>
          {diagnoses.map((d) => (
            <EvaluationSelectOption
              key={d.id}
              label={d.label}
              selected={diagnosis === d.id}
              onPress={() => setDiagnosis(d.id)}
            />
          ))}
        </View>
      </EvaluationQuestionSection>

      <EvaluationQuestionSection
        title="2. Performance Status (ECOG)"
        subtitle="How would you describe the patient's current functional level?"
      >
        <View style={styles.optionList}>
          {performanceLevels.map((lvl) => (
            <EvaluationSelectOption
              key={lvl.value}
              label={lvl.label}
              desc={lvl.desc}
              selected={performance === lvl.value}
              onPress={() => setPerformance(lvl.value)}
            />
          ))}
        </View>
      </EvaluationQuestionSection>

      <EvaluationQuestionSection title="3. Unintentional Weight Loss (Past 6 Months)">
        <EvaluationYesNoToggle value={weightLoss} onChange={setWeightLoss} />
      </EvaluationQuestionSection>

      <EvaluationQuestionSection title="4. Hospitalizations in Past 6 Months">
        <EvaluationCountSelector value={hospitalizations} onChange={setHospitalizations} />
      </EvaluationQuestionSection>

      <EvaluationQuestionSection
        title="5. Rate of Clinical Decline"
        subtitle="How quickly has the patient's condition been declining?"
      >
        <View style={styles.optionList}>
          {DECLINE_RATE_OPTIONS.map((opt) => (
            <EvaluationSelectOption
              key={opt.id}
              label={opt.label}
              desc={opt.desc}
              selected={declineRate === opt.id}
              onPress={() => setDeclineRate(opt.id)}
            />
          ))}
        </View>
      </EvaluationQuestionSection>

      <EvaluationQuestionSection
        title="6. Current Pain or Discomfort Level"
        subtitle="0 = No pain, 10 = Worst possible pain"
      >
        <EvaluationPainScale value={painLevel} onChange={setPainLevel} />
      </EvaluationQuestionSection>

      <EvaluationQuestionSection
        title="7. Decline in Activities of Daily Living (ADLs)"
        subtitle="Has there been increasing dependence with bathing, dressing, eating, or mobility?"
      >
        <EvaluationYesNoToggle value={adlDecline} onChange={setAdlDecline} />
      </EvaluationQuestionSection>

      <EvaluationQuestionSection
        title="8. Advance Directives in Place?"
        subtitle="Does the patient have a Healthcare Power of Attorney, Living Will, or POLST?"
      >
        <EvaluationYesNoToggle value={advanceDirectives} onChange={setAdvanceDirectives} />
      </EvaluationQuestionSection>

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
  optionList: {
    gap: 8,
  },
});
