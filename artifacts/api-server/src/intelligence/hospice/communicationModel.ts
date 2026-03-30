import type { CommunicationPlaybook, RoleType } from "./types.js";

export const COMMUNICATION_PLAYBOOKS: CommunicationPlaybook[] = [
  {
    id: "PLAY-CAREGIVER",
    targetAudience: "caregiver",
    tone: "Warm, steady, protective, and deeply practical. Never condescending. Acknowledge exhaustion directly.",
    goal: "Equip the caregiver with specific actions, clear language to use with the clinical team, and emotional validation that makes them feel less alone.",
    examplePhrases: [
      "You're doing something incredibly hard.",
      "Here's exactly what to say when you call.",
      "You are not overreacting — trust your instincts.",
      "The hospice team needs to hear this today.",
    ],
    reportingStructure: "SBAR: Situation, Background, Assessment, Request. Pre-organize what you will say before calling hospice.",
    commonMistakes: [
      "Waiting too long to call because they don't want to bother the nurse",
      "Downplaying symptoms when reporting",
      "Not documenting calls and responses",
      "Not asking for what they specifically need",
    ],
  },
  {
    id: "PLAY-PATIENT",
    targetAudience: "patient",
    tone: "Respectful, unhurried, deeply human. Treat the patient as fully present and capable of decision-making unless clearly otherwise. Meet them where they are emotionally.",
    goal: "Give the patient a voice in their own care. Help them articulate needs, preferences, and fears. Support their dignity and agency.",
    examplePhrases: [
      "You get to decide what matters most right now.",
      "What would make today more comfortable for you?",
      "You don't have to explain yourself to anyone.",
      "Your voice in this matters most.",
    ],
    reportingStructure: "Encourage patients to use 'I' statements: 'I am in pain at [location] — it's a [score]/10.' Help them articulate what would help.",
    commonMistakes: [
      "Speaking over the patient to the caregiver",
      "Assuming the patient cannot participate in decisions",
      "Not asking the patient directly what they want",
    ],
  },
  {
    id: "PLAY-FAMILY",
    targetAudience: "family",
    tone: "Compassionate, direct, and honest. Family members deserve truth delivered with kindness. Acknowledge different grief styles.",
    goal: "Help family understand what is happening, what to expect, and how to support the patient and each other without conflict or confusion.",
    examplePhrases: [
      "I know this is not what you hoped to hear.",
      "What your mother/father/loved one needs most right now is...",
      "Different family members may react differently — that's okay.",
      "The most important thing you can do right now is...",
    ],
    reportingStructure: "Family should designate one contact person to communicate with the hospice team to avoid conflicting information.",
    commonMistakes: [
      "Arguing in the presence of the patient",
      "Making care decisions based on what family wants rather than what the patient wanted",
      "Not asking the hospice team for a family meeting",
    ],
  },
  {
    id: "PLAY-PHYSICIAN",
    targetAudience: "physician",
    tone: "Clinical but collaborative. Use medical terminology but lead with the patient's goals of care.",
    goal: "Ensure the physician understands the patient's current clinical picture and goals, and is aligned with the hospice plan.",
    examplePhrases: [
      "The patient's goals are comfort-focused. The DNR/POLST is in place.",
      "Current symptom management includes [medications]. Pain is at [score].",
      "We are seeing signs consistent with active dying — can you discuss current medication orders?",
    ],
    reportingStructure: "SBAR adapted for clinical: Situation (current clinical status), Background (diagnosis, trajectory, current medications), Assessment (symptom burden, trajectory), Request (medication adjustment, plan clarification).",
    commonMistakes: [
      "Not sharing the hospice goals of care document with the physician",
      "Physicians not being aware of current comfort kit contents",
    ],
  },
  {
    id: "PLAY-NURSE",
    targetAudience: "nurse",
    tone: "Direct, organized, and efficient. Nurses appreciate clear reporting and specific asks.",
    goal: "Communicate the clinical situation efficiently and get specific guidance or authorization.",
    examplePhrases: [
      "Pain is at 7/10. I gave [dose] [medication] at [time]. After 45 minutes it's still 6/10.",
      "She is making a gurgling sound with breathing that started 30 minutes ago.",
      "I need medication authorization for the comfort kit.",
    ],
    reportingStructure: "Name + patient name + what changed + when + what you gave + response + what you need now.",
    commonMistakes: [
      "Over-explaining before getting to the clinical problem",
      "Not having the comfort kit accessible when calling",
    ],
  },
  {
    id: "PLAY-SOCIAL-WORKER",
    targetAudience: "social_worker",
    tone: "Open, honest, and vulnerable. Social workers need to hear the real emotional state.",
    goal: "Surface the emotional, practical, and systemic issues that are not being addressed in clinical conversations.",
    examplePhrases: [
      "I'm not coping as well as I appear.",
      "There's conflict in our family about care decisions.",
      "We don't know what we're entitled to and I'm afraid to ask.",
      "I need respite care and I don't know how to arrange it.",
    ],
    reportingStructure: "Start with the highest-priority concern. Be honest about what isn't working.",
    commonMistakes: [
      "Trying to appear more capable than you are",
      "Not asking for practical help (respite, financial resources)",
    ],
  },
  {
    id: "PLAY-CHAPLAIN",
    targetAudience: "chaplain",
    tone: "Open, non-denominational, existential. Chaplains meet people where they are spiritually regardless of tradition.",
    goal: "Give expression to the spiritual and existential dimensions of the dying experience.",
    examplePhrases: [
      "I'm not sure what I believe, but I'm scared.",
      "I just need someone to sit with me.",
      "They asked to pray — can you help us with that?",
      "I'm angry and I don't know where to put it.",
    ],
    reportingStructure: "There is no structure — simply begin where you are.",
    commonMistakes: [
      "Assuming chaplain support requires religious belief",
      "Not requesting chaplain because 'we're not religious'",
    ],
  },
  {
    id: "PLAY-FRIEND",
    targetAudience: "friend",
    tone: "Gentle, normalizing, and accepting. Friends often feel helpless and afraid of saying the wrong thing.",
    goal: "Help friends understand how to show up without platitudes, and give them specific ways to help.",
    examplePhrases: [
      "Just being here is enough.",
      "You don't need to fix anything.",
      "It's okay to cry in front of them.",
      "You can ask directly: 'What do you need from me today?'",
    ],
    reportingStructure: "Friends don't need a reporting structure — they need permission to be human.",
    commonMistakes: [
      "Saying 'Let me know if you need anything' — too vague to act on",
      "Avoiding the person because death is uncomfortable",
      "Trying to find a silver lining or positive spin",
      "Telling the family about their own experiences with death",
    ],
  },
];

export const TALKING_TO_CHILDREN_SCRIPT = {
  under5: "Keep it simple and concrete: 'Grandpa is very sick and his body is going to stop working soon. He is going to die.' Avoid metaphors. Let them see the person if they want. Don't hide tears.",
  age5to12: "They can understand permanence of death. Be honest: 'He is dying. That means we will never be able to hug him again, but we will always remember him and love him.' Prepare them for the change in appearance.",
  teenagers: "Treat them with adult honesty. They may withdraw or act out — both are grief. Give them a role if possible. Don't force participation but leave the door open.",
  allAges: "Use the words 'died' and 'death.' Avoid 'passed away,' 'went to sleep,' or 'lost.' These create confusion and fear. Answer questions honestly. It's okay to say 'I don't know.'",
};

export function getPlaybookForRole(role: RoleType): CommunicationPlaybook | undefined {
  return COMMUNICATION_PLAYBOOKS.find((p) => p.targetAudience === role);
}
