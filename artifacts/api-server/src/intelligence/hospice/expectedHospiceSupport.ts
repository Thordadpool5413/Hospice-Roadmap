// What good hospice support looks like — the standard families can use to evaluate their care

export const EXPECTED_HOSPICE_SUPPORT = {
  enrollment: {
    within24Hours: [
      "Initial nursing assessment visit to establish care needs",
      "Comfort kit (emergency medication kit) delivered and explained",
      "Hospital bed ordered if needed",
      "Emergency numbers provided",
      "DNR/POLST completed or reviewed",
    ],
    within72Hours: [
      "Comprehensive family education visit covering: disease trajectory, signs of dying, what to do at time of death, comfort kit use, when to call",
      "Social worker visit to assess family needs, financial resources, and caregiver support",
      "Chaplain contact offered",
      "Plan of care established and explained",
      "Medication profile reviewed and comfort-focused medications ordered",
    ],
    within1Week: [
      "All ordered equipment delivered",
      "Aide services scheduled if appropriate",
      "Volunteer contact offered",
      "All comfort medications at bedside",
    ],
  },

  ongoingCare: {
    nursingVisits: "Visit frequency should match patient acuity. Typical stable patient: 1-2 visits per week. Declining patient: 3-5 visits per week. Actively dying: as needed up to continuous.",
    afterHours: "24/7 phone access with a clinical person who can provide guidance, authorize medications, and send a nurse if needed. Callbacks within 30 minutes for urgent calls.",
    medicationManagement: "All comfort medications should be available and adjusted until symptoms are controlled. Pain above 6/10 persistently means a medication adjustment is needed.",
    familySupport: "Social worker available for family crisis, conflict, and caregiver needs. Chaplain available regardless of religious belief.",
    visitTypes: [
      "Skilled nursing visits",
      "Aide visits for bathing and personal care (at least 2-3x/week for patients needing this)",
      "Social worker visits",
      "Chaplain visits",
      "Medical director involvement for complex symptom management",
    ],
  },

  activelyDyingPhase: {
    responseToDecline: "When a patient is actively dying, the hospice team should increase visits and be proactive — not reactive.",
    whatFamilyCanExpect: [
      "A nurse visit when active dying signs are reported",
      "Authorization of comfort medications before distress occurs",
      "Explicit education on signs of death and what to do",
      "Proactive family support",
      "Offer of after-death pronouncement visit",
    ],
    ifHospiceIsNotResponding: "Call the hospice and say: 'My family member appears to be actively dying. I need a nurse to come today and I need medication authorization now.'",
  },

  timeOfDeathSupport: {
    whatHospiceMustProvide: [
      "24/7 phone guidance at the time of death",
      "A nurse to come to the home to pronounce death",
      "Help with physician contact for death certificate",
      "Guidance on medication disposal",
      "Bereavement support information",
    ],
    callbackTime: "A nurse should contact you within 30-60 minutes of your call announcing the death.",
  },

  bereavementSupport: {
    duration: "CMS requires hospice to offer bereavement follow-up for 13 months after the death.",
    whatItIncludes: [
      "Initial bereavement call within 2 weeks of death",
      "Regular phone or written contact",
      "Referral to bereavement counseling if needed",
      "Memorial service invitation if the hospice holds them",
    ],
    ifItDoesntHappen: "If the hospice does not contact you within 2-3 weeks after the death, call them and request bereavement services.",
  },
};

export const HOSPICE_QUALITY_BENCHMARKS = [
  "Comfort kit delivered within 24 hours of enrollment",
  "Family education completed within 72 hours of enrollment",
  "24/7 phone access with clinical response",
  "Nurse visit within 30-60 minutes for after-hours urgent call (visit, not just phone)",
  "Pain controlled (below 5/10) within 24 hours of reporting",
  "Dyspnea reduced to non-distressing level within 24 hours of reporting",
  "Equipment delivered within 24-48 hours of order (urgent equipment same-day)",
  "Social worker contact within 5 days of enrollment",
  "Chaplain contact offered within 5 days of enrollment",
  "Time of death nurse visit (pronouncement) within 2 hours",
  "Bereavement contact within 2 weeks of death",
];
