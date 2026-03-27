import { Colors } from "@/constants/colors";
import { ResourceCategory } from "@/types";

export const CATEGORY_META: Record<ResourceCategory, { label: string; icon: string; color: string; shortLabel: string }> = {
  understanding_hospice: { label: "Understanding Hospice", shortLabel: "Understanding", icon: "info",         color: Colors.primary },
  eligibility:           { label: "Eligibility",           shortLabel: "Eligibility",   icon: "clipboard",    color: Colors.journeyBefore },
  caregiver_support:     { label: "Caregiver Support",     shortLabel: "Caregiver",     icon: "heart",        color: "#B02060" },
  symptom_care:          { label: "Symptom Care",          shortLabel: "Symptoms",      icon: "activity",     color: Colors.journeyDuring },
  decision_support:      { label: "Decision Support",      shortLabel: "Decisions",     icon: "compass",      color: Colors.journeyAfter },
  after_hospice:         { label: "After Hospice",         shortLabel: "After",         icon: "sun",          color: "#3A7050" },
  grief_bereavement:     { label: "Grief & Bereavement",   shortLabel: "Grief",         icon: "cloud",        color: "#6040A0" },
  physician_resources:   { label: "For Physicians",        shortLabel: "Physicians",    icon: "user",         color: Colors.primary },
  documentation:         { label: "Documentation",         shortLabel: "Documents",     icon: "file-text",    color: "#1A8090" },
  myths_facts:           { label: "Myths & Facts",         shortLabel: "Myths & Facts", icon: "alert-circle", color: Colors.journeyDuring },
};
