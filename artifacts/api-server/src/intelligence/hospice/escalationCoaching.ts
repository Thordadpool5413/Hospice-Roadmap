// Escalation coaching — how to advocate effectively within and beyond the hospice system

export interface EscalationScript {
  situation: string;
  triggerPhrases: string[];
  escalationPath: string[];
  exampleScript: string;
  documentationGuidance: string;
  regulatoryBasis: string;
}

export const ESCALATION_SCRIPTS: EscalationScript[] = [
  {
    situation: "After-hours nurse not responding",
    triggerPhrases: ["no callback", "can't reach hospice", "not answering", "been waiting", "no response"],
    escalationPath: [
      "1. Call the hospice 24/7 line again — document the time",
      "2. If 30+ minutes with no response for urgent issue: call the main hospice office number",
      "3. Ask to speak with the supervisor or charge nurse",
      "4. If still no response and situation is urgent: call 911",
      "5. Document everything for administrator follow-up",
    ],
    exampleScript: "Say: 'I called at [time] about [patient name], an urgent issue with [symptom]. I have been waiting [duration] with no callback. I need to speak with a nurse right now. If I cannot reach anyone in the next 15 minutes, I will need to call 911.'",
    documentationGuidance: "Write down: time of first call, who answered (if anyone), time of callback, what was said. Keep a running log.",
    regulatoryBasis: "42 CFR § 418.204 requires 24/7 nursing availability. Failure to respond is a regulatory violation reportable to your state health department.",
  },
  {
    situation: "Undertreated pain or symptoms — nurse won't adjust medications",
    triggerPhrases: ["pain not controlled", "won't change medication", "just said to wait", "still in pain", "told me to be patient"],
    escalationPath: [
      "1. Ask to speak with the hospice physician or medical director directly",
      "2. Request an urgent care conference with the treatment team",
      "3. Document current pain scores, medication given, and times",
      "4. If physician not available within hours: contact hospice administrator",
      "5. File complaint with state hospice licensure if unresolved",
    ],
    exampleScript: "Say: 'I understand the nurse is managing this, but pain has been at [score] for [duration] and the current medications are not working. I need to speak with the hospice physician today — not tomorrow — for a medication adjustment.'",
    documentationGuidance: "Log every pain score with time, every medication given with time, every call to hospice, every response. This log is your evidence.",
    regulatoryBasis: "NHPCO Quality Standards and Joint Commission standards require ongoing pain assessment and medication adjustment until comfort is achieved.",
  },
  {
    situation: "Family feels hospice is not providing adequate support",
    triggerPhrases: ["no visits", "abandoned", "alone", "no support", "infrequent", "haven't seen anyone"],
    escalationPath: [
      "1. Call the hospice case manager and ask for a care conference",
      "2. Request a written copy of your current plan of care and expected visit frequency",
      "3. Ask for more frequent visits or a different level of care",
      "4. If the plan of care is not being followed: contact the administrator",
      "5. Request continuous home care if symptoms warrant 24/7 nursing",
    ],
    exampleScript: "Say: 'We have not had a visit in [duration] and we feel like we are managing this alone. We need to discuss the plan of care and what level of support we should be receiving. Can we schedule a care conference this week?'",
    documentationGuidance: "Track dates of all visits and calls. Compare to what was promised in the plan of care.",
    regulatoryBasis: "Medicare requires visit frequency to match patient acuity. As condition worsens, visits should increase.",
  },
  {
    situation: "Family wants a different hospice or to change agencies",
    triggerPhrases: ["change hospice", "switch hospice", "different agency", "unhappy with", "want to change providers"],
    escalationPath: [
      "1. You have the right to change hospice agencies at any time — this is a Medicare right",
      "2. Contact the new hospice agency you want to transfer to — they handle most of the paperwork",
      "3. You do not need to give a reason to the current hospice",
      "4. The transition is typically within 24-72 hours",
      "5. Medications and equipment are coordinated between agencies",
    ],
    exampleScript: "Say to the new agency: 'We would like to transfer our care to your hospice. The patient is currently receiving care from [agency]. Can you walk us through how the transfer works?'",
    documentationGuidance: "Keep records of why you transferred in case any billing issues arise.",
    regulatoryBasis: "42 CFR § 418.30 — Hospice patients may change hospice providers once per benefit period without losing benefits.",
  },
  {
    situation: "Formal complaint about hospice quality",
    triggerPhrases: ["file complaint", "report", "state agency", "bad hospice", "negligent", "this is wrong"],
    escalationPath: [
      "1. Start with the hospice administrator — put concerns in writing",
      "2. Contact your state health department hospice licensure division",
      "3. Contact CMS (Medicare/Medicaid) regional office for Medicare-certified agencies",
      "4. Contact accreditation body: CHAP, ACHC, or The Joint Commission",
      "5. Contact your state's Long-Term Care Ombudsman for nursing home-based hospice",
    ],
    exampleScript: "When contacting state agency: 'I would like to file a complaint about [hospice name] regarding [specific issues]. I have documentation of [dates and incidents].'",
    documentationGuidance: "Collect all documentation: call logs, care plans, names of staff, specific dates and times of failures.",
    regulatoryBasis: "CMS Conditions of Participation for Hospice (42 CFR Part 418) set minimum standards. State agencies investigate complaints.",
  },
];

export function findEscalationScript(messageText: string): EscalationScript | undefined {
  const lower = messageText.toLowerCase();
  return ESCALATION_SCRIPTS.find((es) =>
    es.triggerPhrases.some((phrase) => lower.includes(phrase))
  );
}

export const ADVOCACY_PHRASES = {
  assertingRights: [
    "We are entitled to [specific service] under the Medicare hospice benefit.",
    "The plan of care promised [X] and we have not received it.",
    "I am documenting this conversation.",
    "I need this in writing.",
    "Can I speak with the administrator?",
    "I would like a care conference scheduled within 24 hours.",
  ],
  requestingMore: [
    "We need more support than we are currently receiving.",
    "The current level of care is not matching the patient's needs.",
    "I am requesting a visit today, not tomorrow.",
    "I need to speak with the physician directly.",
    "What level of care is available if home care is not enough?",
  ],
  documentingFailures: [
    "I called at [time] and was told [X] — I am writing this down.",
    "Pain has been at [score] for [duration] despite medication.",
    "The equipment was ordered on [date] and has not arrived.",
    "A visit was promised on [date] and did not occur.",
  ],
};
