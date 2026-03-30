// Red flags — urgent warning signs that require immediate action

export interface RedFlag {
  signal: string;
  aliases: string[];
  urgency: "call_911" | "call_hospice_now" | "call_hospice_urgent";
  why: string;
  immediateAction: string;
}

export const RED_FLAGS: RedFlag[] = [
  {
    signal: "Sudden large bleed",
    aliases: ["massive bleed", "blood everywhere", "coughing a lot of blood", "bleeding heavily", "hemorrhage"],
    urgency: "call_911",
    why: "Catastrophic hemorrhage from vessel erosion can be a terminal event but requires immediate response for safety and comfort.",
    immediateAction: "Call 911 AND hospice simultaneously. Apply pressure with dark-colored cloths. Stay with the patient. Speak calmly.",
  },
  {
    signal: "No DNR and breathing stops",
    aliases: ["no dnr", "no advance directive", "no polst", "resuscitate", "wants cpr"],
    urgency: "call_911",
    why: "Without a DNR/POLST, legal requirement is to call 911 for any cardiac or respiratory arrest.",
    immediateAction: "Call 911 immediately. Show them any advance directive documents when they arrive.",
  },
  {
    signal: "Sudden severe unexplained pain",
    aliases: ["sudden severe pain", "worst pain", "screaming in pain", "acute pain"],
    urgency: "call_hospice_now",
    why: "Sudden severe pain may indicate a new acute event — fracture, bowel perforation, or other serious cause.",
    immediateAction: "Call hospice immediately. Document onset, location, character. Give comfort medication as authorized.",
  },
  {
    signal: "Seizure",
    aliases: ["seizure", "convulsion", "shaking uncontrollably", "tonic clonic", "fit"],
    urgency: "call_hospice_now",
    why: "New or prolonged seizure in hospice patient — may be from brain metastases, metabolic changes, or medication.",
    immediateAction: "Call hospice. Turn patient on side. Do not restrain. Remove hazards. If seizure lasts more than 5 minutes, call 911.",
  },
  {
    signal: "ICD shock",
    aliases: ["got shocked", "ICD fired", "defibrillator shocked", "got a shock"],
    urgency: "call_hospice_now",
    why: "ICD delivering shock in a hospice patient is a care failure — the device should have been deactivated. Painful and traumatic.",
    immediateAction: "Call hospice immediately. The ICD must be deactivated urgently. Contact cardiologist if hospice cannot respond.",
  },
  {
    signal: "Sudden change in breathing — not gradual decline",
    aliases: ["suddenly can't breathe", "breathing changed suddenly", "stopped breathing", "gasping for air unexpectedly"],
    urgency: "call_hospice_now",
    why: "Sudden (not gradual) breathing change may indicate a new event (pulmonary embolism, acute edema) requiring hospice assessment.",
    immediateAction: "Call hospice immediately. Position upright. Use fan. Loosen clothing. If DNR and comfort-focused plan, await hospice.",
  },
  {
    signal: "Patient unconscious unexpectedly in non-dying phase",
    aliases: ["unconscious suddenly", "won't wake up", "unresponsive suddenly", "collapsed"],
    urgency: "call_hospice_now",
    why: "Sudden loss of consciousness in a patient not in the active dying phase may indicate a new acute event.",
    immediateAction: "Call hospice. Check for signs of breathing. If no DNR and this is unexpected — call 911.",
  },
  {
    signal: "Fire or home emergency",
    aliases: ["fire", "smoke", "gas leak", "emergency", "home emergency"],
    urgency: "call_911",
    why: "Home emergencies supersede hospice protocols — safety of patient and caregiver comes first.",
    immediateAction: "Call 911. Move patient if safely possible. DNR does not prevent 911 for non-cardiac/respiratory emergencies.",
  },
  {
    signal: "Caregiver medical emergency",
    aliases: ["caregiver collapsed", "I fell", "I'm sick", "I'm having a heart attack", "I can't breathe"],
    urgency: "call_911",
    why: "If the caregiver is incapacitated, the patient cannot be cared for. Both need emergency services.",
    immediateAction: "Call 911 for yourself. Call a family member or neighbor immediately. Call hospice to arrange alternative patient care.",
  },
  {
    signal: "Thoughts of self-harm",
    aliases: ["want to die", "thinking of hurting myself", "can't go on", "suicidal", "end my life"],
    urgency: "call_911",
    why: "Suicidal ideation in a caregiver or family member is a medical emergency.",
    immediateAction: "Call 988 (Suicide and Crisis Lifeline) immediately. If immediate danger, call 911.",
  },
];

export function detectRedFlags(messageText: string): RedFlag[] {
  const lower = messageText.toLowerCase();
  return RED_FLAGS.filter((rf) =>
    rf.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );
}

export function hasCall911Flag(flags: RedFlag[]): boolean {
  return flags.some((f) => f.urgency === "call_911");
}

export function hasCallHospiceNowFlag(flags: RedFlag[]): boolean {
  return flags.some((f) => f.urgency === "call_hospice_now" || f.urgency === "call_911");
}
