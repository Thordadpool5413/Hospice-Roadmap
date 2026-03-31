// ─────────────────────────────────────────────────────────────────────────────
// Florida — Reviewed Legal Content
// Review Status: reviewed
// Last Reviewed: 2025-01 (verify for currency before public release)
// Sources: Florida Statutes Ch. 765, FL Dept of Health, FL Agency for Health
//          Care Administration
//
// IMPORTANT NOTES:
// - Florida DNRO must be printed on YELLOW paper to be valid for EMS.
// - Florida DNRO is a specific EMS-oriented order, different from a hospital DNR.
// - The Designation of Health Care Surrogate and the Living Will are separate documents.
// - Verify all official URLs before public release — state websites change.
// ─────────────────────────────────────────────────────────────────────────────

import { createReviewMeta } from "../helpers";
import { StateLegalRegistry } from "../types";

const REVIEWED_META = createReviewMeta(
  "reviewed",
  "Legal Review Team",
  "official_state_source",
  [
    "Florida Statutes Chapter 765 (Health Care Advance Directives)",
    "Florida Department of Health DNRO guidance",
    "Florida Agency for Health Care Administration",
  ],
);

export const FLORIDA: StateLegalRegistry = {
  stateCode: "FL",
  stateName: "Florida",
  overview: {
    summary:
      "Florida uses its own named documents under Florida Statutes Chapter 765. The primary planning documents are the Designation of Health Care Surrogate and the Living Will. Florida also has a state-specific DNRO (Do Not Resuscitate Order) that must be on yellow paper for EMS recognition.",
    commonlyUsedDocuments: [
      "Designation of Health Care Surrogate",
      "Living Will",
      "Florida DNRO (yellow paper)",
      "Durable Power of Attorney (financial — separate from health care)",
    ],
    namingNotes: [
      "Florida does not use the term 'Health Care Proxy' — it uses 'Health Care Surrogate'.",
      "Florida does not have a statewide POLST program as of last review. The DNRO serves a similar EMS-recognition function.",
      "The Living Will and Designation of Health Care Surrogate are separate documents and should both be completed.",
    ],
    planningNotes: [
      "Both the Living Will and the Designation of Health Care Surrogate should be completed and kept together.",
      "The Florida DNRO is a physician-signed order and must be on yellow paper. It is separate from an advance directive.",
      "Provide copies to your physician, healthcare surrogate, and hospice team.",
    ],
    importantWarnings: [
      "A Florida DNRO on any color paper other than yellow may not be recognized by EMS.",
      "The Living Will expresses wishes but does not appoint a decision-maker — the Surrogate Designation does that.",
      "Financial power of attorney is a separate document from health care planning documents.",
    ],
  },
  documents: [
    {
      id: "fl_advance_directive",
      stateCode: "FL",
      title: "Florida Advance Directive",
      commonNames: ["Advance Directive", "FL Advance Directive"],
      category: "advance_directive",
      section: "planning_documents",
      summary:
        "Florida's Advance Directive encompasses both a Designation of Health Care Surrogate and a Living Will. These may be completed on the same state form or separately. Together they name a decision-maker and record your care wishes.",
      whatItDoes:
        "Names a Health Care Surrogate to make medical decisions when you cannot, and records your specific wishes about life-sustaining treatment, end-of-life care, and other medical decisions.",
      whoItsFor:
        "Any competent adult in Florida who wants to ensure their healthcare wishes are documented and a trusted person is authorized to make decisions on their behalf.",
      whoSigns: ["The patient (principal)", "Two adult witnesses"],
      witnessRequirement: {
        required: true,
        details:
          "Two adult witnesses are required. At least one witness must NOT be a spouse or blood relative. Neither witness may be the named surrogate. Witnesses may not be healthcare providers involved in your care.",
      },
      notaryRequirement: {
        required: false,
        details: "Notarization is not required under Florida law for advance directives, but some attorneys recommend it for added legal strength.",
      },
      specialRequirements: [
        "At least one witness must not be a spouse or blood relative of the principal.",
        "Neither witness may be the designated surrogate.",
        "Witnesses may not be owners, operators, or employees of a healthcare facility where the principal is a patient.",
      ],
      honoredBy: ["Hospitals", "Physicians", "Hospices", "Nursing facilities", "EMS (Living Will component, not DNRO function)"],
      honoredBySummary:
        "Florida advance directives are recognized by healthcare facilities and providers throughout the state. EMS does not typically honor a Living Will in the field — a Florida DNRO on yellow paper is needed for that.",
      outOfStateRecognition:
        "Other states may honor Florida advance directives under their own out-of-state recognition laws, but this is not guaranteed. If you spend significant time in another state, consider completing that state's forms as well.",
      howToCompleteSteps: [
        "Download the Florida Advance Directive form from the Florida Department of Health or use any legally compliant form.",
        "Identify your chosen Health Care Surrogate and discuss your wishes with them in advance.",
        "Complete the Designation of Health Care Surrogate section, naming your surrogate and an alternate if desired.",
        "Complete the Living Will section with your specific wishes about end-of-life treatment.",
        "Sign in front of two adult witnesses who meet Florida's witness requirements.",
        "Provide copies to your physician, your surrogate, your hospice team, and keep the original in an accessible location.",
      ],
      storageGuidance: [
        "Keep the original in a known, accessible location at home — not in a safe deposit box.",
        "Give a copy to your designated Health Care Surrogate.",
        "Give a copy to your primary physician and have it placed in your medical record.",
        "Give a copy to your hospice team.",
        "Tell close family members where the document is stored.",
      ],
      officialFormUrl: "https://www.floridahealth.gov/licensing-and-regulation/end-of-life-planning/_documents/fl-advance-directive.pdf",
      officialInfoUrl: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
      additionalOfficialUrls: [
        {
          label: "Florida Statutes Chapter 765",
          url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0765/0765.htm",
          sourceType: "official_legislative_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "Without an advance directive, Florida law specifies a default hierarchy for medical decision-making that may not reflect your wishes. Completing this document ensures your voice is heard even when you cannot speak.",
        whenToUseIt:
          "Complete this document while you are a competent adult. Do not wait for a diagnosis or crisis. Anyone 18 or older in Florida should consider completing an advance directive.",
        commonMistakes: [
          "Not naming an alternate surrogate in case the primary is unavailable.",
          "Storing the document where it cannot be accessed in an emergency.",
          "Not discussing your wishes with your surrogate before a crisis.",
          "Using an outdated form that may not comply with current Florida law.",
        ],
        questionsToAsk: [
          "Have you talked to your surrogate about your specific wishes?",
          "Does your physician have a copy in your medical record?",
          "Have you reviewed this document recently, especially after major health changes?",
          "Does your surrogate know where the original is kept?",
        ],
      },
      review: REVIEWED_META,
    },
    {
      id: "fl_health_care_surrogate",
      stateCode: "FL",
      title: "Designation of Health Care Surrogate",
      commonNames: ["Health Care Surrogate", "Healthcare Proxy", "Healthcare Agent"],
      category: "healthcare_proxy",
      section: "decision_makers",
      summary:
        "The Florida Designation of Health Care Surrogate names a trusted person to make healthcare decisions on your behalf when you are unable to make them yourself. This is the Florida equivalent of what other states call a Health Care Proxy or Healthcare Agent.",
      whatItDoes:
        "Authorizes a specific person to make all healthcare decisions on your behalf when you lack decision-making capacity. This includes decisions about treatment, surgery, medications, and end-of-life care.",
      whoItsFor:
        "Any competent adult in Florida who wants to ensure a trusted person is legally authorized to make healthcare decisions if they become incapacitated.",
      whoSigns: ["The patient (principal)", "Two adult witnesses"],
      witnessRequirement: {
        required: true,
        details:
          "Two adult witnesses required. At least one witness must NOT be a spouse or blood relative. The named surrogate cannot be a witness.",
      },
      notaryRequirement: {
        required: false,
        details: "Not required by Florida statute for the health care surrogate designation.",
      },
      specialRequirements: [
        "The surrogate must be 18 or older.",
        "The surrogate cannot be the patient's healthcare provider.",
        "Consider naming an alternate surrogate in case the primary is unavailable.",
      ],
      honoredBy: ["Hospitals", "Physicians", "Hospice providers", "Nursing facilities"],
      honoredBySummary:
        "Recognized by all Florida healthcare facilities and providers. The surrogate's authority activates when two physicians document that the patient lacks decision-making capacity.",
      outOfStateRecognition:
        "May be honored by other states under their own laws, but varies. Florida surrogate designations may not be automatically recognized in states with different legal frameworks.",
      howToCompleteSteps: [
        "Choose a surrogate you trust completely — someone who knows your values and can advocate for you under pressure.",
        "Talk to your surrogate in advance about your wishes, values, and what matters most to you.",
        "Complete the Designation of Health Care Surrogate form (may be part of Florida Advance Directive form).",
        "Sign in front of two qualifying witnesses.",
        "Give a copy to your surrogate, your physician, and your hospice team.",
      ],
      storageGuidance: [
        "Keep the original accessible, not locked away.",
        "Give copies to your surrogate, alternate surrogate, physician, and hospice team.",
      ],
      officialFormUrl: "https://www.floridahealth.gov/licensing-and-regulation/end-of-life-planning/_documents/fl-advance-directive.pdf",
      officialInfoUrl: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
      additionalOfficialUrls: [],
      educationContent: {
        whyItMatters:
          "This document gives legal authority to the person you trust most. Without it, hospitals must follow a default hierarchy that may not include the person you would choose.",
        whenToUseIt:
          "Every adult in Florida should complete this document, regardless of age or health status.",
        commonMistakes: [
          "Naming someone without talking to them about your wishes first.",
          "Not naming an alternate in case the primary surrogate is unavailable.",
          "Choosing a surrogate who lives far away or may not be reachable in a crisis.",
        ],
        questionsToAsk: [
          "Does my surrogate truly understand and accept my wishes?",
          "Is my surrogate someone who can make difficult decisions under stress?",
          "Have I named an alternate in case my primary surrogate is unavailable?",
        ],
      },
      review: REVIEWED_META,
    },
    {
      id: "fl_living_will",
      stateCode: "FL",
      title: "Florida Living Will",
      commonNames: ["Living Will", "Directive to Physicians"],
      category: "living_will",
      section: "planning_documents",
      summary:
        "A Florida Living Will documents your specific wishes about life-sustaining treatment and end-of-life care. It speaks for you when you cannot. It does not name a decision-maker — that is the Surrogate Designation.",
      whatItDoes:
        "States your wishes about whether you want life-sustaining treatment continued, withheld, or withdrawn under specific circumstances. Addresses situations including terminal illness, persistent vegetative state, and end-stage conditions.",
      whoItsFor:
        "Any competent Florida adult who wants to document specific wishes about end-of-life treatment, especially around life-sustaining measures.",
      whoSigns: ["The patient (principal)", "Two adult witnesses"],
      witnessRequirement: {
        required: true,
        details: "Two adult witnesses required, with the same requirements as the Surrogate Designation.",
      },
      notaryRequirement: {
        required: false,
        details: "Not required by Florida statute.",
      },
      specialRequirements: [
        "Should be completed alongside the Designation of Health Care Surrogate, not instead of it.",
        "Be specific about your wishes — vague language may be difficult to interpret in a crisis.",
      ],
      honoredBy: ["Hospitals", "Physicians", "Hospices", "Nursing facilities"],
      honoredBySummary:
        "Honored by Florida healthcare facilities and providers. EMS typically does not honor a Living Will in the field — a DNRO (on yellow paper) is needed for that purpose.",
      outOfStateRecognition:
        "May be honored by other states; varies by state law. Consider completing the destination state's form if traveling.",
      howToCompleteSteps: [
        "Complete as part of the Florida Advance Directive or as a standalone document.",
        "Be specific about situations you are addressing — terminal illness, vegetative state, end-stage conditions.",
        "State clearly whether you want life-sustaining treatment continued, withheld, or withdrawn.",
        "Sign in front of two qualifying witnesses.",
        "Store and distribute copies alongside your Surrogate Designation.",
      ],
      storageGuidance: [
        "Keep with your Surrogate Designation document.",
        "Provide copies to your physician, surrogate, and hospice team.",
      ],
      officialFormUrl: "https://www.floridahealth.gov/licensing-and-regulation/end-of-life-planning/_documents/fl-advance-directive.pdf",
      officialInfoUrl: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
      additionalOfficialUrls: [],
      educationContent: {
        whyItMatters:
          "The Living Will gives specific instructions that guide your surrogate and medical team even if your surrogate is unavailable or uncertain. It reduces the burden on family members of making these decisions without guidance.",
        whenToUseIt:
          "Complete it while you are a competent adult. Update it after major diagnoses or changes in your values and wishes.",
        commonMistakes: [
          "Assuming the Living Will replaces the need for a Health Care Surrogate (it does not).",
          "Being too vague about specific wishes.",
          "Not updating the document after a major health change.",
        ],
        questionsToAsk: [
          "Have I been specific about what I want — and do not want — in each scenario?",
          "Does my surrogate have a copy and understand my wishes?",
          "Have I discussed this with my physician?",
        ],
      },
      review: REVIEWED_META,
    },
    {
      id: "fl_dnro",
      stateCode: "FL",
      title: "Florida Do Not Resuscitate Order (DNRO)",
      commonNames: ["DNRO", "Florida DNR", "Out-of-Hospital DNR", "EMS DNR", "Yellow Form"],
      category: "medical_order",
      section: "medical_orders",
      summary:
        "The Florida DNRO is a physician-signed medical order that instructs EMS and emergency responders not to attempt resuscitation. It must be printed on bright YELLOW paper to be valid for EMS recognition. It is a medical order, not an advance directive.",
      whatItDoes:
        "Instructs EMS personnel, paramedics, and emergency responders not to perform CPR, electrical resuscitation, endotracheal intubation, or other resuscitative measures. It applies outside of a hospital setting.",
      whoItsFor:
        "Patients with a terminal condition or serious illness who have decided, with their physician, that they do not want resuscitation attempts — especially at home or in a non-hospital setting.",
      whoSigns: ["The patient (if competent) or healthcare surrogate", "The patient's physician"],
      witnessRequirement: {
        required: false,
        details: "Witnesses are not required for the DNRO, but the patient or surrogate and physician must both sign.",
      },
      notaryRequirement: {
        required: false,
        details: "Notarization is not required for the Florida DNRO.",
      },
      specialRequirements: [
        "MUST be printed on bright yellow paper to be recognized by Florida EMS.",
        "Must be signed by both the patient (or surrogate) and a licensed Florida physician.",
        "The original yellow form should be kept where EMS can see it quickly — by the bed, on the refrigerator, or with the patient.",
        "A laminated copy may also be worn as a wristband or necklace — ask your hospice team.",
      ],
      honoredBy: [
        "Florida EMS and paramedics",
        "Emergency responders",
        "Hospice teams",
        "Nursing facilities",
      ],
      honoredBySummary:
        "Florida EMS will honor the DNRO when it is on yellow paper, signed correctly, and accessible. A Living Will alone does NOT direct EMS — the yellow DNRO is required for that purpose.",
      outOfStateRecognition:
        "Not automatically honored in other states. Each state has its own EMS DNR process. If traveling, ask your hospice team about temporary arrangements.",
      howToCompleteSteps: [
        "Discuss with your physician whether a DNRO is appropriate given your current condition and wishes.",
        "Obtain the official Florida DNRO form — your hospice team or physician can provide it.",
        "Print the DNRO on bright yellow paper (this is a legal requirement in Florida).",
        "Have both the patient (or surrogate) and the physician sign the form.",
        "Place the original yellow form in a visible, accessible location in the home.",
        "Inform EMS, if ever called, that a Florida DNRO is in place.",
        "Tell your family and caregivers where the form is kept.",
      ],
      storageGuidance: [
        "Keep the original yellow form visible — by the bed, on the refrigerator door, or near the front door.",
        "Do NOT store in a drawer, cabinet, or folder where EMS cannot easily find it.",
        "Give copies to your hospice team and your care facility if applicable.",
        "Ask your hospice about DNRO identification jewelry (wristband, medallion) as a backup.",
      ],
      officialFormUrl: "https://www.floridahealth.gov/licensing-and-regulation/end-of-life-planning/_documents/dnro.pdf",
      officialInfoUrl: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
      additionalOfficialUrls: [
        {
          label: "FL Dept of Health — End of Life Planning",
          url: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
          sourceType: "official_health_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "Without a Florida DNRO on yellow paper, EMS is legally required to attempt resuscitation when called. A Living Will or verbal statement is not enough for EMS in Florida. The yellow form is the only way to ensure EMS honors a DNR request at home.",
        whenToUseIt:
          "When a patient with a terminal or serious condition has made a clear, informed decision not to undergo resuscitation — particularly in a home or non-hospital setting.",
        commonMistakes: [
          "Printing the DNRO on white paper — it will not be recognized by Florida EMS.",
          "Keeping the DNRO in a drawer or file where EMS cannot find it quickly.",
          "Assuming a Living Will is enough to direct EMS — it is not.",
          "Not getting the physician's signature.",
        ],
        questionsToAsk: [
          "Is our DNRO printed on yellow paper?",
          "Is it in a visible location where EMS would find it immediately?",
          "Does our hospice team have a copy?",
          "Does our family know where the form is?",
        ],
      },
      review: REVIEWED_META,
    },
  ],
  registryInfo: {
    hasKnownRegistry: false,
    registryName: null,
    registrySummary:
      "Florida does not have a centralized statewide advance directive registry as of last review. Keep original documents accessible at home and with your care team.",
    registryLinks: [],
  },
  officialResources: [
    {
      label: "Florida Dept of Health — End of Life Planning",
      url: "https://www.floridahealth.gov/programs-and-services/community-health/end-of-life-planning/index.html",
      sourceType: "official_health_source",
      isOfficial: true,
    },
    {
      label: "Florida Statutes Chapter 765",
      url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0765/0765.htm",
      sourceType: "official_legislative_source",
      isOfficial: true,
    },
  ],
  review: REVIEWED_META,
};
