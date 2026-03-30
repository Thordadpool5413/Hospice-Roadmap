// Documentation coaching — what to track, how to document, and why it matters

export interface DocumentationGuide {
  situation: string;
  tags: string[];
  whatToDocument: string[];
  howToOrganize: string;
  exampleEntry: string;
  whyItMatters: string;
}

export const DOCUMENTATION_GUIDES: DocumentationGuide[] = [
  {
    situation: "Symptom tracking",
    tags: ["track", "document", "symptom log", "pain log", "journal"],
    whatToDocument: [
      "Date and time of each symptom occurrence",
      "Symptom type and location",
      "Severity on 0-10 scale (or behavioral description for nonverbal patients)",
      "What medication was given, dose, and time",
      "Response to medication (better, same, worse — and at what time)",
      "Any triggers or associated changes",
    ],
    howToOrganize: "A simple table or list format works. Date | Time | Symptom | Score | Medication Given | Response | Next Action",
    exampleEntry: "March 15 | 2:30pm | Pain (lower back) | 7/10 | Morphine 5mg oral | 8/10 after 30 min — called hospice | Nurse authorized dose increase",
    whyItMatters: "This log gives the hospice nurse and physician the information they need to adjust medications effectively. It also creates a record if care becomes inadequate.",
  },
  {
    situation: "Documenting hospice calls and responses",
    tags: ["call log", "hospice call", "no callback", "documentation"],
    whatToDocument: [
      "Date and time of call",
      "Name of person who answered",
      "What you reported",
      "What they said",
      "Any actions promised",
      "Follow-up callback time if there was one",
    ],
    howToOrganize: "Date | Time | Who Answered | What You Said | What They Said | Any Follow-Up",
    exampleEntry: "March 15 | 11:45pm | On-call nurse Linda | Reported severe pain 8/10 unresponsive to breakthrough dose | Authorized an extra breakthrough dose and said to call back in 1 hour if no improvement | Called back at 12:50am — authorized dose increase",
    whyItMatters: "A call log is your evidence if care becomes inadequate. It is also useful for the daytime nurse to understand the overnight history.",
  },
  {
    situation: "Documenting the dying process",
    tags: ["decline log", "signs of dying", "changes", "decline documentation"],
    whatToDocument: [
      "Date and time of new signs of decline",
      "Specific changes observed (mottling location, breathing changes, responsiveness)",
      "Medication given",
      "Hospice team notified — yes/no and response",
    ],
    howToOrganize: "A simple chronological journal. Each new sign with date and time.",
    exampleEntry: "March 19 | 8:00am | New mottling from feet to knees. Breathing slower. Not waking for medications. Called hospice — nurse Linda said this is expected and to call if breathing changes significantly. Comfort kit at bedside.",
    whyItMatters: "This creates a clear picture of the timeline for the hospice team and for your own memory after the death.",
  },
  {
    situation: "Documenting care failures for complaint",
    tags: ["complaint", "document failure", "report", "file complaint"],
    whatToDocument: [
      "Every call with exact time, who answered, what was said",
      "Specific failures: what was promised and what did not happen",
      "Impact on patient: symptoms that went uncontrolled, distress that occurred",
      "Names of staff involved",
      "Dates of equipment delays, missed visits, unanswered calls",
    ],
    howToOrganize: "Chronological document with each incident clearly labeled. Save voicemails if possible.",
    exampleEntry: "March 14 | Called at 11:20pm re: severe agitation. No callback by midnight. Called again at 12:15am. On-call nurse returned call at 12:45am (85-minute delay). No medication authorized, told to 'watch and wait.' Patient remained agitated until morning.",
    whyItMatters: "Documentation is the foundation of any formal complaint. It must be specific, factual, and chronological.",
  },
  {
    situation: "Patient-directed wishes and preferences",
    tags: ["wishes", "what they want", "preferences", "advance directive", "goals of care"],
    whatToDocument: [
      "What the patient has said about their wishes",
      "Date and time of the conversation",
      "Who was present",
      "Any written advance directive or POLST status",
      "Specific preferences: resuscitation wishes, hospitalization wishes, pain versus alertness tradeoff",
    ],
    howToOrganize: "A dedicated section in the care folder or a separate document.",
    exampleEntry: "March 1 | Patient stated clearly: 'I don't want to die in the hospital. Keep me home and keep me comfortable. I'd rather be a little sleepy than in pain.' Present: wife and daughter. DNR/POLST signed March 1.",
    whyItMatters: "This becomes the guiding document for all care decisions. If family conflict arises, this record is the patient's voice.",
  },
];

export const DOCUMENTATION_BASICS = {
  whatToAlwaysHaveAccessible: [
    "DNR/POLST document — posted prominently near the front door or in the bedroom",
    "Hospice agency name and 24/7 phone number",
    "Comfort kit location and list of medications",
    "Current medication list with doses and schedule",
    "Name of hospice nurse, social worker, chaplain, and medical director",
    "Funeral home contact information",
    "List of family members to notify and their phone numbers",
  ],
  keepInOneFolder: [
    "Advance directive and POLST",
    "DNR document",
    "Insurance information",
    "List of physicians and specialists",
    "Allergy list",
    "Current medication list",
    "Hospice plan of care",
  ],
  atTimeOfDeath: [
    "Have the DNR document visible and ready to give to any first responders",
    "Have the hospice number in your phone or on a card",
    "Know the name of your funeral home",
  ],
};
