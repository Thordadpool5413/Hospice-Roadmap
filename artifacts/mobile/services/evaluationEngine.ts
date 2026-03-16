import { DiagnosisCategory, EvaluationInput, EvaluationResult } from "@/types";

const DISCLAIMER =
  "This assessment is for educational and informational purposes only. It does not constitute a medical diagnosis, clinical determination, or recommendation for hospice enrollment. Hospice eligibility is determined by a licensed physician based on a comprehensive clinical evaluation. Please consult a qualified healthcare provider for all medical decisions.";

const diagnosisBaseScores: Record<DiagnosisCategory, number> = {
  cancer: 40,
  chf: 30,
  copd: 28,
  dementia: 25,
  stroke: 22,
  general_debility: 20,
  liver_disease: 32,
  renal_disease: 28,
  aids: 30,
  other: 15,
};

const diagnosisLabels: Record<DiagnosisCategory, string> = {
  cancer: "Cancer",
  chf: "Congestive Heart Failure",
  copd: "COPD",
  dementia: "Dementia / Alzheimer's",
  stroke: "Stroke / Neurological Condition",
  general_debility: "General Debility / Failure to Thrive",
  liver_disease: "Liver Disease",
  renal_disease: "Renal Disease",
  aids: "AIDS / HIV",
  other: "Other Terminal Illness",
};

export function runEvaluation(input: EvaluationInput): EvaluationResult {
  let score = diagnosisBaseScores[input.diagnosis] ?? 15;

  if (input.performanceStatus >= 3) score += 20;
  else if (input.performanceStatus === 2) score += 10;
  else if (input.performanceStatus === 1) score += 5;

  if (input.weightLoss) score += 10;

  if (input.hospitalizations >= 3) score += 15;
  else if (input.hospitalizations === 2) score += 10;
  else if (input.hospitalizations === 1) score += 5;

  if (input.declineRate === "rapid") score += 15;
  else if (input.declineRate === "gradual") score += 7;

  if (input.painLevel >= 7) score += 10;
  else if (input.painLevel >= 4) score += 5;

  if (input.adlDecline) score += 10;

  const normalizedScore = Math.min(100, score);

  const keyFactors: string[] = [];
  const nextSteps: string[] = [];

  if (input.performanceStatus >= 3) {
    keyFactors.push("Significant decline in functional ability and daily activities");
  }
  if (input.weightLoss) {
    keyFactors.push("Unintentional weight loss, suggesting disease progression");
  }
  if (input.hospitalizations >= 2) {
    keyFactors.push(`Multiple recent hospitalizations (${input.hospitalizations}), indicating unstable condition`);
  }
  if (input.declineRate === "rapid") {
    keyFactors.push("Rapid rate of clinical decline over recent months");
  }
  if (input.adlDecline) {
    keyFactors.push("Increasing dependence with activities of daily living");
  }
  if (input.painLevel >= 6) {
    keyFactors.push("Significant pain or discomfort affecting quality of life");
  }

  if (keyFactors.length === 0) {
    keyFactors.push(`Diagnosis of ${diagnosisLabels[input.diagnosis]} noted`);
    keyFactors.push("Current clinical picture does not yet suggest immediate hospice need");
  }

  let readinessLevel: "low" | "moderate" | "high";
  let summary: string;

  if (normalizedScore >= 65) {
    readinessLevel = "high";
    summary = `Based on the information you've shared, this patient may have clinical characteristics consistent with hospice eligibility. The combination of diagnosis, functional decline, and symptom burden suggests a conversation with a hospice provider is appropriate and timely.`;
    nextSteps.push("Speak with the attending physician about a formal hospice evaluation");
    nextSteps.push("Contact a local hospice provider for a no-obligation assessment");
    nextSteps.push("Review advance care planning documents and ensure they are current");
    nextSteps.push("Begin exploring hospice providers in your area");
  } else if (normalizedScore >= 35) {
    readinessLevel = "moderate";
    summary = `The information you've shared suggests this patient has some characteristics that may be relevant to hospice consideration, though a clearer clinical picture may be needed. An open conversation with the care team about goals of care may be a helpful next step.`;
    nextSteps.push("Have a goals-of-care conversation with the attending physician");
    nextSteps.push("Ask about palliative care as a complementary option");
    nextSteps.push("Review and update advance care planning documents");
    nextSteps.push("Continue monitoring for changes in condition or function");
  } else {
    readinessLevel = "low";
    summary = `Based on the information provided, this patient may not yet meet typical hospice eligibility thresholds. However, it's never too early to learn about hospice or to engage in advance care planning conversations with your healthcare team.`;
    nextSteps.push("Continue working with the current care team");
    nextSteps.push("Consider a palliative care consultation for enhanced symptom support");
    nextSteps.push("Review and complete advance care planning documents");
    nextSteps.push("Learn more about hospice so you're prepared when the time comes");
  }

  return {
    readinessLevel,
    score: normalizedScore,
    summary,
    keyFactors,
    nextSteps,
    disclaimer: DISCLAIMER,
  };
}
