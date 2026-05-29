import { PatientProfile, SymptomEntry } from "@/types";

export type ScriptUrgency = "urgent" | "routine" | "emotional";

export interface CallScript {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  urgency: ScriptUrgency;
  /** Primary guidance scenario this script is linked FROM (for back-links on the detail view). */
  guidanceScenarioId?: string;
  template: string;
}

/**
 * Maps Situation Finder scenario IDs → the most relevant CallScript ID.
 * Used by guidance/[id].tsx to surface a "Know what to say" CTA.
 */
export const SCENARIO_TO_SCRIPT: Record<string, string> = {
  // Symptom reporting
  "breathing-changes":   "report-symptom",
  "pain-worsening":      "report-symptom",
  "agitation-restlessness": "report-symptom",
  "confusion-delirium":  "report-symptom",
  "hallucinations":      "report-symptom",
  "nausea-vomiting":     "report-symptom",
  "fever":               "report-symptom",
  "seizures":            "after-hours",
  "bleeding":            "after-hours",
  // Medication / supply
  "comfort-kit":         "medication-change",
  "pain-management":     "medication-change",
  "swallowing-difficulty": "medication-change",
  // Nurse visit
  "skin-breakdown":      "nurse-visit",
  "fall-recovery":       "nurse-visit",
  "decreased-appetite":  "nurse-visit",
  "swelling":            "nurse-visit",
  "urinary-changes":     "nurse-visit",
  // End of life / emotional
  "approaching-death":   "dying-process",
  // Crisis care
  "crisis-care-gip":     "request-crisis-care",
};

export const CALL_SCRIPTS: CallScript[] = [
  {
    id: "report-symptom",
    title: "Report a New or Worsening Symptom",
    subtitle: "Pain, breathlessness, agitation, or any sudden change",
    icon: "alert-circle",
    urgency: "urgent",
    guidanceScenarioId: "pain-worsening",
    template:
      "Hi, my name is {{callerName}} and I'm calling about {{patientName}}. I'm noticing {{symptomDescription}} — it started {{symptomOnset}} and currently {{patientName}}'s pain level is {{currentPain}} out of 10. {{patientName}} has {{diagnosis}} and is on {{currentMedications}}. I'm not sure if this is expected or if something needs to be adjusted — can a nurse help us figure out what to do?",
  },
  {
    id: "medication-change",
    title: "Request a Medication Change",
    subtitle: "Dose adjustment, breakthrough medication, or new comfort measure",
    icon: "package",
    urgency: "routine",
    template:
      "Hi, this is {{callerName}} calling about {{patientName}}. I'm concerned that {{patientName}}'s current medications aren't providing enough relief — {{painContext}}. Their current comfort kit includes {{currentMedications}}. I'd like to speak with a nurse or have someone review whether a medication adjustment might help keep {{patientName}} more comfortable.",
  },
  {
    id: "what-to-expect",
    title: "Ask About What to Expect Next",
    subtitle: "Timeline, changes in condition, or signs to watch for",
    icon: "map",
    urgency: "routine",
    guidanceScenarioId: "approaching-death",
    template:
      "Hi, I'm {{callerName}} — I care for {{patientName}}, who has {{diagnosis}}. Over the past few days I've noticed some changes and I'm wondering what to expect going forward. I want to make sure I'm prepared and that {{patientName}} is as comfortable as possible. Could a nurse call me back to walk me through what we might see in the coming days?",
  },
  {
    id: "after-hours",
    title: "After-Hours Urgent Call",
    subtitle: "When something can't wait until morning",
    icon: "moon",
    urgency: "urgent",
    template:
      "Hi, I'm calling the hospice after-hours line. My name is {{callerName}} and I care for {{patientName}}, who has {{diagnosis}}. I'm calling because {{urgentConcern}}. {{patientName}}'s pain is currently {{currentPain}} out of 10. I need guidance on what to do right now — can someone help me?",
  },
  {
    id: "equipment-problem",
    title: "Equipment or Supply Problem",
    subtitle: "Broken device, missing supply, or delivery issue",
    icon: "tool",
    urgency: "routine",
    template:
      "Hi, this is {{callerName}} calling about {{patientName}}. We're having an issue with {{equipmentIssue}}. The equipment we have in the home includes {{equipmentInHome}}. This is affecting {{patientName}}'s care and comfort, and we need it resolved as soon as possible. Can you connect me with the right team or let me know next steps?",
  },
  {
    id: "nurse-visit",
    title: "Request a Nurse Visit",
    subtitle: "Something needs in-person assessment",
    icon: "user-check",
    urgency: "routine",
    template:
      "Hi, this is {{callerName}} calling about {{patientName}}, who has {{diagnosis}}. I'd like to request a nurse visit — I'm seeing some changes that I'd feel better having assessed in person. {{patientName}}'s recent symptom levels have been {{painContext}}. Can we schedule a visit at your earliest convenience?",
  },
  {
    id: "respite",
    title: "Caregiver Needs a Break — Respite Care",
    subtitle: "Request short-term relief so you can rest",
    icon: "coffee",
    urgency: "emotional",
    template:
      "Hi, this is {{callerName}}. I am the primary caregiver for {{patientName}}, who has {{diagnosis}}. I've been providing around-the-clock care and I need some support. I'd like to learn about respite options so I can take a break and make sure I can continue to care well for {{patientName}}. Can someone talk me through what's available?",
  },
  {
    id: "dying-process",
    title: "Discuss the Dying Process",
    subtitle: "Understand what to expect and how to respond",
    icon: "heart",
    urgency: "emotional",
    guidanceScenarioId: "approaching-death",
    template:
      "Hi, my name is {{callerName}} and I care for {{patientName}}, who has {{diagnosis}}. I'm seeing some changes that I think may mean {{patientName}} is getting closer to the end of life, and I want to understand what's happening. I have some questions about what to expect and how to keep {{patientName}} comfortable through this. Can a nurse or social worker call me when they have time?",
  },
  {
    id: "spiritual-support",
    title: "Spiritual or Emotional Support",
    subtitle: "Chaplain visit, counseling, or grief support for the family",
    icon: "sun",
    urgency: "emotional",
    template:
      "Hi, this is {{callerName}} — I'm a caregiver for {{patientName}}. Our family is going through an incredibly difficult time, and I think we could benefit from some emotional or spiritual support. I'd like to request a visit from a chaplain or social worker if one is available. Is that something the team can arrange for us?",
  },
  {
    id: "care-plan-change",
    title: "Request a Care Plan Change",
    subtitle: "New goals, comfort focus, or changing priorities",
    icon: "edit-3",
    urgency: "routine",
    template:
      "Hi, my name is {{callerName}} and I'm calling about {{patientName}}, who has {{diagnosis}}. We've been thinking about {{patientName}}'s care plan and I'd like to talk with someone about making some changes. Our main priorities right now are comfort and {{whatMattersMost}}. Can a nurse or social worker schedule a time to discuss updating the plan with us?",
  },
  {
    id: "request-crisis-care",
    title: "Request Crisis-Level Care",
    subtitle: "Intensive nursing at home or inpatient facility for uncontrolled symptoms",
    icon: "alert-triangle",
    urgency: "urgent",
    guidanceScenarioId: "crisis-care-gip",
    template:
      "Hi, my name is {{callerName}} and I'm calling about {{patientName}}, who has {{diagnosis}}. I need to request continuous care or crisis-level care. Symptoms are not controlled and I cannot manage this safely at home. {{painContext}}. I am asking for a formal assessment for Continuous Home Care or General Inpatient care. Please send a nurse or advise on next steps right now.",
  },
];

const AGITATION_LABELS = ["none", "mild", "moderate", "severe"];

function formatMedications(profile: PatientProfile | undefined): string {
  if (!profile) return "comfort medications on hand";
  if (profile.medications && profile.medications.length > 0) {
    const names = profile.medications.map((m) => {
      let label = m.name;
      if (m.doseNote) label += ` (${m.doseNote})`;
      return label;
    });
    return names.join(", ");
  }
  if (profile.comfortKitMedications?.trim()) {
    return profile.comfortKitMedications.trim();
  }
  return "comfort medications on hand";
}

function formatSymptomContext(latest: SymptomEntry | null): string {
  if (!latest) return "elevated symptom levels";
  const parts: string[] = [];
  if (latest.pain >= 1) parts.push(`pain ${latest.pain}/10`);
  if (latest.breathlessness >= 1) parts.push(`breathlessness ${latest.breathlessness}/10`);
  if (latest.nausea >= 1) parts.push(`nausea ${latest.nausea}/10`);
  if (latest.agitation > 0) parts.push(`${AGITATION_LABELS[latest.agitation]} agitation`);
  return parts.length > 0 ? parts.join(", ") : "some discomfort";
}

export function interpolateScript(
  template: string,
  profile: PatientProfile | undefined,
  latestSymptom: SymptomEntry | null,
): string {
  const patientName = profile?.patientName?.trim() || "my loved one";
  const diagnosis = profile?.diagnosis?.trim() || "their diagnosis";
  const hospicePhone = profile?.hospicePhone?.trim() || "[hospice number]";
  const currentMedications = formatMedications(profile);
  const currentPain = latestSymptom ? `${latestSymptom.pain}` : "[current pain level]";
  const equipmentInHome = profile?.equipmentInHome?.trim() || "[equipment in home]";
  const whatMattersMost =
    profile?.goalsOfCare?.whatMattersMost?.trim() ||
    "dignity and comfort";

  const painContext =
    latestSymptom
      ? `On the last check-in (${latestSymptom.date}), ${patientName} had ${formatSymptomContext(latestSymptom)}`
      : "symptom levels have been elevated";

  const replacements: Record<string, string> = {
    "{{patientName}}": patientName,
    "{{diagnosis}}": diagnosis,
    "{{hospicePhone}}": hospicePhone,
    "{{currentMedications}}": currentMedications,
    "{{currentPain}}": currentPain,
    "{{equipmentInHome}}": equipmentInHome,
    "{{whatMattersMost}}": whatMattersMost,
    "{{painContext}}": painContext,
    "{{callerName}}": "[your name]",
    "{{symptomDescription}}": "[describe the symptom]",
    "{{symptomOnset}}": "[when it started]",
    "{{urgentConcern}}": "[describe the urgent concern]",
    "{{equipmentIssue}}": "[describe the equipment problem]",
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

export const URGENCY_LABELS: Record<ScriptUrgency, string> = {
  urgent: "Urgent",
  routine: "Routine",
  emotional: "Support",
};

export const URGENCY_COLORS: Record<ScriptUrgency, string> = {
  urgent: "#C03040",
  routine: "#63C8FF",
  emotional: "#B97DFF",
};
