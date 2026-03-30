// Service failure scenarios — patterns of poor hospice response and how to address them

export interface ServiceFailureScenario {
  id: string;
  title: string;
  triggerPhrases: string[];
  whatWentWrong: string;
  whatShouldHaveHappened: string;
  whatToDoNow: string;
  exactLanguage: string;
  documentationNeeded: string;
  escalationPath: string;
}

export const SERVICE_FAILURE_SCENARIOS: ServiceFailureScenario[] = [
  {
    id: "SFS-001",
    title: "Family Not Told About Comfort Kit",
    triggerPhrases: ["don't know how to use", "wasn't told about", "never explained", "what's in the kit", "what do I do with"],
    whatWentWrong: "The family has a comfort kit but was not educated on its contents, purpose, or when to call before using it.",
    whatShouldHaveHappened: "Education on the comfort kit should occur at delivery, not during a crisis.",
    whatToDoNow: "Call the hospice line now. Ask the nurse to walk you through the kit over the phone immediately, and schedule an in-person teaching visit.",
    exactLanguage: "'We have the comfort kit but have not been educated on it. I need someone to walk me through each medication, what it's for, and when to call before using it — now, over the phone, and then in person as soon as possible.'",
    documentationNeeded: "Date of kit delivery, date education was requested, date education occurred.",
    escalationPath: "If this request is not fulfilled within 24 hours, contact the hospice administrator.",
  },
  {
    id: "SFS-002",
    title: "Family Calls in Crisis — Told to Just Wait",
    triggerPhrases: ["just said to wait", "told me to observe", "nothing they can do", "just watch", "just monitoring"],
    whatWentWrong: "An after-hours or on-call nurse responded to a genuine symptom crisis with vague reassurance and no clinical plan.",
    whatShouldHaveHappened: "The nurse should provide specific guidance, authorize medications, offer a visit, and give a concrete plan with a follow-up call.",
    whatToDoNow: "Call again. Ask specifically: 'What medication can I give right now? What dose? When should I call back? Can someone come out tonight?'",
    exactLanguage: "'I called earlier and was told to watch and wait. The situation has not improved. I need specific medication authorization and I need to know exactly what to do. What can I give now and what is the plan?'",
    documentationNeeded: "Time of first call, what was said, time of second call.",
    escalationPath: "If no clinical guidance is provided after two calls, escalate to the hospice administrator or call 911 for a safety emergency.",
  },
  {
    id: "SFS-003",
    title: "Nurse Dismisses Caregiver Concern",
    triggerPhrases: ["nurse said it's normal", "dismissed", "told not to worry", "just normal aging", "said it will pass", "minimized"],
    whatWentWrong: "A nurse dismissed a clinical concern without adequate assessment or explanation.",
    whatShouldHaveHappened: "Clinical concerns should be taken seriously, assessed, and explained — even if they are expected.",
    whatToDoNow: "Call back and ask to speak with the charge nurse or hospice physician. You have the right to a second opinion within the same agency.",
    exactLanguage: "'I spoke with a nurse earlier who told me this concern is normal, but I am not satisfied with that answer without more explanation. I would like to speak with the supervising nurse or physician to discuss this further.'",
    documentationNeeded: "Time of call, name of nurse, what you said, what they said.",
    escalationPath: "Request a care conference with the team. If still unresolved, contact the administrator.",
  },
  {
    id: "SFS-004",
    title: "No Visit for Days During Active Decline",
    triggerPhrases: ["no visit", "days without", "haven't seen anyone", "hasn't visited", "we're alone"],
    whatWentWrong: "Visit frequency has not been adjusted as the patient's condition has worsened.",
    whatShouldHaveHappened: "Visit frequency must increase as patient acuity increases. An actively declining patient may need daily visits.",
    whatToDoNow: "Call the hospice case manager and request an urgent visit today. Say that the patient's condition has changed.",
    exactLanguage: "'The patient's condition has been declining and we have not had a visit in [X days]. We need a nurse to come today. The current visit frequency is not matching what we are seeing clinically.'",
    documentationNeeded: "Date of last visit, date of your call, what was said, date of next scheduled visit.",
    escalationPath: "Request a different level of care (continuous home care) if the situation warrants it.",
  },
  {
    id: "SFS-005",
    title: "ICD Not Deactivated in Heart Failure Patient",
    triggerPhrases: ["ICD", "defibrillator", "shocked", "got shocked", "device shocked", "pacemaker"],
    whatWentWrong: "An ICD (implantable cardioverter-defibrillator) has not been deactivated in a hospice patient with advanced heart failure, resulting in painful electric shocks.",
    whatShouldHaveHappened: "ICD deactivation discussion and documentation should be one of the earliest goals of hospice enrollment for any patient with a device.",
    whatToDoNow: "Call the hospice team immediately and demand this be addressed today. The process to deactivate an ICD requires a physician order and often a device clinic appointment.",
    exactLanguage: "'My family member received a shock from their ICD. This device needs to be deactivated immediately. I need the hospice physician to order this today and arrange the appointment. This is a patient comfort emergency.'",
    documentationNeeded: "Date of ICD shock, time, clinical response. All communications about deactivation.",
    escalationPath: "If the hospice physician does not act within 24 hours, contact the cardiologist who manages the device directly.",
  },
  {
    id: "SFS-006",
    title: "Haloperidol or Prochlorperazine Given to Parkinson's Patient",
    triggerPhrases: ["Parkinson", "Parkinson's", "haloperidol", "Haldol", "prochlorperazine", "Compazine", "worse after medication", "rigid after medication"],
    whatWentWrong: "Dopamine-blocking medications (haloperidol, prochlorperazine, metoclopramide) have been prescribed for a patient with Parkinson's disease, potentially causing severe worsening of rigidity and symptoms.",
    whatShouldHaveHappened: "These medications are contraindicated in Parkinson's disease. Quetiapine is the appropriate antipsychotic. The prescribing physician should have been aware of the diagnosis.",
    whatToDoNow: "Stop the medication and call the hospice physician immediately. Report what was given and describe any worsening.",
    exactLanguage: "'I understand [medication] was ordered, but I know that dopamine-blocking medications are contraindicated in Parkinson's disease. I would like the physician to review this order immediately and confirm it is safe or change it.'",
    documentationNeeded: "Medication given, date and time, patient response, call to hospice.",
    escalationPath: "Request medical director review of the prescription. Report as a medication error to the administrator.",
  },
];

export function findServiceFailureScenario(messageText: string): ServiceFailureScenario | undefined {
  const lower = messageText.toLowerCase();
  return SERVICE_FAILURE_SCENARIOS.find((sfs) =>
    sfs.triggerPhrases.some((phrase) => lower.includes(phrase))
  );
}
