export type CrisisCategory =
  | "symptoms"
  | "equipment"
  | "medications"
  | "death"
  | "emergency";

export interface CrisisShortcut {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  guidanceId: string;
  category: CrisisCategory;
  ragnaPrompt: string;
}

export const CRISIS_SHORTCUTS: CrisisShortcut[] = [
  {
    id: "breathing",
    label: "Can't breathe / breathing changed",
    subtitle: "Breathing distress or new sounds",
    icon: "wind",
    color: "#E85040",
    guidanceId: "breathing-changes",
    category: "symptoms",
    ragnaPrompt:
      "My loved one's breathing has changed or they seem distressed. Can you walk me through what to do right now and whether I should call hospice?",
  },
  {
    id: "pain",
    label: "Pain is worse",
    subtitle: "Uncontrolled or rising pain",
    icon: "zap",
    color: "#E07030",
    guidanceId: "pain-worsening",
    category: "symptoms",
    ragnaPrompt:
      "Pain seems worse than before. Can you help me understand what to try and when to call the hospice nurse?",
  },
  {
    id: "oxygen",
    label: "Oxygen not working",
    subtitle: "Concentrator alarm or no flow",
    icon: "activity",
    color: "#58B6FF",
    guidanceId: "oxygen-concentrator",
    category: "equipment",
    ragnaPrompt:
      "Our oxygen concentrator isn't working or is alarming. What should I check first, and who do I call?",
  },
  {
    id: "suction",
    label: "Suction machine problem",
    subtitle: "Machine won't run or secretions building",
    icon: "filter",
    color: "#7A9AE8",
    guidanceId: "suction-machine",
    category: "equipment",
    ragnaPrompt:
      "We're having trouble with the suction machine or heavy secretions. What can I do at home before calling hospice?",
  },
  {
    id: "hospital-bed",
    label: "Hospital bed issue",
    subtitle: "Bed stuck, remote, or positioning",
    icon: "layout",
    color: "#B89AE8",
    guidanceId: "hospital-bed",
    category: "equipment",
    ragnaPrompt:
      "The hospital bed isn't working right or I need help repositioning safely. What should I do?",
  },
  {
    id: "comfort-kit",
    label: "Comfort kit / medications",
    subtitle: "When and how to use emergency meds",
    icon: "package",
    color: "#3A9E8A",
    guidanceId: "comfort-kit",
    category: "medications",
    ragnaPrompt:
      "I have questions about our comfort kit medications — when to use them and when to call hospice first.",
  },
  {
    id: "liquid-meds",
    label: "Liquid meds / swallowing",
    subtitle: "Pills hard to swallow, liquid forms",
    icon: "droplet",
    color: "#4A8FD4",
    guidanceId: "medication-swallowing",
    category: "medications",
    ragnaPrompt:
      "Swallowing medications is getting difficult. What alternatives does hospice usually offer and when should I call?",
  },
  {
    id: "approaching-death",
    label: "Signs death may be near",
    subtitle: "What to expect and how to help",
    icon: "moon",
    color: "#9A7ACC",
    guidanceId: "approaching-death",
    category: "death",
    ragnaPrompt:
      "I think my loved one may be actively dying. Can you help me understand what I'm seeing and what to do?",
  },
  {
    id: "after-death",
    label: "They have passed away",
    subtitle: "First steps — what to do and not do",
    icon: "heart",
    color: "#B89AE8",
    guidanceId: "after-death-practical",
    category: "death",
    ragnaPrompt:
      "My loved one has just died. I'm not sure what to do first. Can you walk me through the immediate steps calmly?",
  },
];

export const MEDICATION_EDUCATION_SHORTCUTS: CrisisShortcut[] = [
  CRISIS_SHORTCUTS.find((s) => s.id === "comfort-kit")!,
  CRISIS_SHORTCUTS.find((s) => s.id === "liquid-meds")!,
  {
    id: "morphine-how",
    label: "How to give liquid morphine",
    subtitle: "Sublingual dosing — not about changing dose",
    icon: "droplet",
    color: "#E07030",
    guidanceId: "morphine-administration",
    category: "medications",
    ragnaPrompt:
      "I need help understanding how to give liquid morphine under the tongue safely. Can you walk me through it?",
  },
  {
    id: "med-side-effects",
    label: "Medication side effects",
    subtitle: "What's normal vs when to call",
    icon: "info",
    color: "#58B6FF",
    guidanceId: "medication-side-effects",
    category: "medications",
    ragnaPrompt:
      "I'm noticing possible medication side effects. Can you help me tell what's normal and when I should call hospice?",
  },
];

export const AFTER_DEATH_STEPS = [
  {
    step: 1,
    title: "Take a breath — there is no rush",
    body: "Stay with your loved one as long as you need. You do not have to do anything immediately.",
    guidanceId: "after-death-guidance",
  },
  {
    step: 2,
    title: "Call hospice — not 911",
    body: "Unless there is no DNR and you were told to call 911, hospice is your first call. They will pronounce and guide every next step.",
    guidanceId: "after-death-practical",
  },
  {
    step: 3,
    title: "Do not start CPR if DNR is in place",
    body: "Check goals of care. If DNR/POLST applies, do not call emergency services for a natural death.",
    guidanceId: "after-death-practical",
  },
  {
    step: 4,
    title: "Call the funeral home when ready",
    body: "Hospice or the social worker can help you choose. There is no deadline in the first hours.",
    guidanceId: "after-death-practical",
  },
  {
    step: 5,
    title: "Reach out for bereavement support",
    body: "Grief support continues up to 13 months. You can request the chaplain or bereavement counselor anytime.",
    guidanceId: "bereavement-support",
  },
] as const;

export function getCrisisShortcut(id: string): CrisisShortcut | undefined {
  return CRISIS_SHORTCUTS.find((s) => s.id === id)
    ?? MEDICATION_EDUCATION_SHORTCUTS.find((s) => s.id === id);
}