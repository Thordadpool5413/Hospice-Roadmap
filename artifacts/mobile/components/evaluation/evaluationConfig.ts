import { Colors } from "@/constants/colors";
import { DiagnosisCategory } from "@/types";

export const diagnoses: { id: DiagnosisCategory; label: string }[] = [
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

export const performanceLevels: { value: 0 | 1 | 2 | 3 | 4; label: string; desc: string }[] = [
  { value: 0, label: "Normal", desc: "Fully active, no limitations" },
  { value: 1, label: "Mild decline", desc: "Restricted in strenuous activity" },
  { value: 2, label: "Moderate", desc: "Ambulatory, capable of self-care" },
  { value: 3, label: "Significant", desc: "Limited self-care, in bed >50% of time" },
  { value: 4, label: "Severe", desc: "Completely bedbound, no self-care" },
];

export const readinessColors = {
  low: { color: Colors.success, bg: Colors.successPale, label: "Lower Readiness" },
  moderate: { color: Colors.amber, bg: Colors.amberPale, label: "Moderate Readiness" },
  high: { color: Colors.primary, bg: Colors.primaryPale, label: "Higher Readiness" },
};
