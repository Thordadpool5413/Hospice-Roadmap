// ─────────────────────────────────────────────────────────────────────────────
// California — Reviewed Legal Content
// Review Status: reviewed
// Last Reviewed: 2025-01 (verify for currency before public release)
// Sources: California Probate Code §4600–4806, California POLST Coalition,
//          California Attorney General Office
//
// IMPORTANT NOTES:
// - California uses "Advance Health Care Directive" — not "Living Will" or "Proxy".
// - California requires two qualified witnesses OR notary acknowledgment (not both).
// - Execution requirements are specific — read carefully.
// - California has a robust POLST program.
// ─────────────────────────────────────────────────────────────────────────────

import { createReviewMeta } from "../helpers";
import { StateLegalRegistry } from "../types";

const REVIEWED_META = createReviewMeta(
  "reviewed",
  "Legal Review Team",
  "official_state_source",
  [
    "California Probate Code §4600–4806 (Health Care Decisions Law)",
    "California Attorney General — Advance Health Care Directive",
    "California POLST Coalition",
    "Coalition for Compassionate Care of California",
  ],
);

export const CALIFORNIA: StateLegalRegistry = {
  stateCode: "CA",
  stateName: "California",
  overview: {
    summary:
      "California uses the Advance Health Care Directive under the California Health Care Decisions Law. This document combines a healthcare agent designation and personal care instructions in one form. California also has a robust POLST program for patients with serious illness. Two qualified witnesses or notary acknowledgment — not both — are required for execution.",
    commonlyUsedDocuments: [
      "Advance Health Care Directive",
      "POLST (Physician Orders for Life-Sustaining Treatment)",
      "Power of Attorney for Health Care (older terminology, now part of AHCD)",
    ],
    namingNotes: [
      "California uses 'Advance Health Care Directive' — not 'Living Will' or 'Health Care Proxy' as primary terms.",
      "The Advance Health Care Directive combines the healthcare agent designation and care instructions in one document.",
      "California has an active POLST program — different from and in addition to the Advance Health Care Directive.",
    ],
    planningNotes: [
      "The Advance Health Care Directive is the primary planning document for California adults.",
      "California allows use of a form different from the official state form if it meets legal requirements.",
      "POLST is appropriate for patients with serious illness who have immediate clinical decisions to make.",
    ],
    importantWarnings: [
      "California's witness requirements are specific — disqualifying relationships exist.",
      "Either two qualified witnesses OR notary acknowledgment is required — not both.",
      "A notary or witness who is your healthcare provider is disqualified.",
    ],
  },
  documents: [
    {
      id: "ca_advance_health_care_directive",
      stateCode: "CA",
      title: "Advance Health Care Directive",
      commonNames: [
        "AHCD",
        "Advance Directive",
        "Power of Attorney for Health Care",
        "Living Will",
        "Healthcare Agent Designation",
      ],
      category: "advance_directive",
      section: "planning_documents",
      summary:
        "The California Advance Health Care Directive is the primary legal document for health care planning in California. It allows you to name a health care agent to make decisions on your behalf and to document your specific wishes about medical treatment. California allows use of its official form or any written document that meets statutory requirements.",
      whatItDoes:
        "Designates a health care agent with legal authority to make healthcare decisions on your behalf when you cannot. Also records your specific instructions about treatment, end-of-life care, organ donation, and other healthcare decisions.",
      whoItsFor:
        "Any California adult (18 or older, or an emancipated minor) who wants to name a healthcare decision-maker and document care instructions.",
      whoSigns: ["The patient (principal)", "Either two qualified witnesses OR a notary public (not both)"],
      witnessRequirement: {
        required: "varies",
        details:
          "If using the witness option (instead of notary): Two adult witnesses are required. Witnesses cannot be the named healthcare agent. Witnesses cannot be the patient's healthcare provider or employee of a healthcare institution where the patient is receiving care. Neither witness may be related by blood, marriage, or adoption, or be entitled to the patient's estate. If the principal is in a skilled nursing facility, one witness must be an ombudsman or advocate.",
      },
      notaryRequirement: {
        required: "varies",
        details:
          "Notary acknowledgment may be used INSTEAD of two witnesses. If using notary, witnesses are not also required. The notary cannot be the patient's healthcare provider.",
      },
      specialRequirements: [
        "Use either two qualified witnesses OR notary acknowledgment — not both.",
        "If in a skilled nursing facility, one witness must be a state-certified ombudsman.",
        "California allows a different form than the official state form if it meets Probate Code requirements.",
        "Your healthcare agent should be at least 18 years old.",
        "Your healthcare agent cannot be your healthcare provider or an employee of your care facility, unless they are a family member.",
      ],
      honoredBy: [
        "All California healthcare providers and facilities",
        "Physicians",
        "Hospitals",
        "Nursing facilities",
        "Hospices",
        "EMS (with appropriate medical orders in place)",
      ],
      honoredBySummary:
        "Recognized by all California healthcare providers under the California Health Care Decisions Law. Agent authority activates when the patient lacks decision-making capacity as determined by the patient's physician.",
      outOfStateRecognition:
        "Other states may honor California advance directives under their own laws, but this is not guaranteed. Consider that state's forms if spending significant time out of California.",
      howToCompleteSteps: [
        "Download the California Advance Health Care Directive from the California Attorney General's website or use a legally compliant alternative form.",
        "Choose your healthcare agent — someone you trust completely who knows your values.",
        "Talk to your agent about your wishes before completing the form.",
        "Complete Part 1 (Power of Attorney for Health Care) to designate your agent.",
        "Complete Part 2 (Instructions for Health Care) to record your specific wishes.",
        "Complete Part 3 (Donation of Organs at Death) if desired.",
        "Complete Part 4 (Primary Physician) to name your primary physician.",
        "Sign the document using EITHER two qualified witnesses OR a notary acknowledgment.",
        "Distribute copies to your agent, physician, hospice team, and relevant care providers.",
      ],
      storageGuidance: [
        "Keep the original in an accessible location — not in a safe deposit box.",
        "Give copies to your healthcare agent and alternate agent.",
        "Provide a copy to your primary physician for your medical record.",
        "Give a copy to your hospice team.",
        "Consider registering with the California Advance Directive Registry.",
      ],
      officialFormUrl: "https://oag.ca.gov/sites/all/files/agweb/pdfs/consumers/ProbateCodeAdvanceHealthCareDirective.pdf",
      officialInfoUrl: "https://oag.ca.gov/consumers/general/ad",
      additionalOfficialUrls: [
        {
          label: "California Attorney General — Advance Directives",
          url: "https://oag.ca.gov/consumers/general/ad",
          sourceType: "official_attorney_general_source",
          isOfficial: true,
        },
        {
          label: "California Probate Code §4600–4806",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=4600.&lawCode=PROB",
          sourceType: "official_legislative_source",
          isOfficial: true,
        },
        {
          label: "Coalition for Compassionate Care of California",
          url: "https://coalitionccc.org/",
          sourceType: "official_health_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "California's Advance Health Care Directive is one of the most comprehensive planning tools available. Without it, healthcare decisions may default to family members in a state-defined hierarchy that may not reflect your wishes, or to the courts.",
        whenToUseIt:
          "Every California adult should have an Advance Health Care Directive, regardless of age or health status. Complete it now — not when a crisis arrives.",
        commonMistakes: [
          "Using both witnesses AND a notary — only one method is needed.",
          "Choosing disqualified witnesses (healthcare providers, facility employees, people with inheritance interests).",
          "Not completing the form in a skilled nursing facility with the required ombudsman witness.",
          "Not giving copies to the healthcare agent and medical team.",
          "Using an outdated form — verify against current California Probate Code requirements.",
        ],
        questionsToAsk: [
          "Have I used the correct witness method — either two qualified witnesses OR a notary?",
          "Is my healthcare agent someone who will advocate for my wishes under pressure?",
          "Have I been specific about my wishes in Part 2 of the form?",
          "Does my physician have a copy in my medical record?",
          "Have I considered registering with the California Advance Directive Registry?",
        ],
      },
      review: REVIEWED_META,
    },
    {
      id: "ca_polst",
      stateCode: "CA",
      title: "POLST — Physician Orders for Life-Sustaining Treatment",
      commonNames: ["POLST", "California POLST", "Physician Orders for Life-Sustaining Treatment"],
      category: "medical_order",
      section: "medical_orders",
      summary:
        "California's POLST form is a portable physician-signed medical order for patients with serious illness or advanced age. It documents specific medical treatment decisions and travels with the patient across all care settings, including EMS.",
      whatItDoes:
        "Creates immediately actionable medical orders addressing CPR, level of medical intervention, and artificial nutrition. Unlike the Advance Health Care Directive, a POLST is a current medical order — not a statement of future wishes.",
      whoItsFor:
        "Patients with serious illness, frailty, or advanced age who have specific current medical treatment decisions documented in consultation with their physician or healthcare team.",
      whoSigns: [
        "The patient or authorized representative",
        "A California licensed physician, nurse practitioner, or physician assistant",
      ],
      witnessRequirement: {
        required: false,
        details: "Witnesses are not required for California POLST.",
      },
      notaryRequirement: {
        required: false,
        details: "Notarization is not required for California POLST.",
      },
      specialRequirements: [
        "Must be completed through a shared decision-making conversation with a qualified clinician.",
        "The POLST form must be on the official California POLST bright PINK form for EMS recognition.",
        "Should be reviewed and updated as the patient's condition or wishes change.",
      ],
      honoredBy: [
        "California EMS and paramedics",
        "Hospitals",
        "Nursing facilities",
        "Hospice teams",
        "All California healthcare providers",
      ],
      honoredBySummary:
        "Recognized across all California care settings including EMS. The pink POLST form is the standard. Ensure it is visible and accessible.",
      outOfStateRecognition:
        "California POLST may not be directly recognized in all other states. Each state has its own version. Ask your hospice team if traveling.",
      howToCompleteSteps: [
        "Have a thorough goals-of-care conversation with your physician or hospice clinician.",
        "Discuss CPR, medical intervention levels, and artificial nutrition preferences.",
        "Complete the California POLST form on the official pink paper.",
        "Have both the patient (or authorized representative) and clinician sign.",
        "Keep the original where it is immediately visible — with the patient, at bedside, or on the refrigerator.",
        "Give copies to all care providers.",
      ],
      storageGuidance: [
        "Keep the original pink form visible and with the patient — not filed away.",
        "Give copies to your hospice team and all care facilities.",
        "Review and update whenever the patient's goals change.",
      ],
      officialFormUrl: "https://capolst.org/polst-for-patients-families/",
      officialInfoUrl: "https://capolst.org/",
      additionalOfficialUrls: [
        {
          label: "California POLST Coalition",
          url: "https://capolst.org/",
          sourceType: "official_health_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "POLST ensures that specific treatment decisions are immediately actionable medical orders, not just preferences. EMS and hospitals can act on them in a crisis without delay.",
        whenToUseIt:
          "When a patient with serious illness has made specific, current decisions about life-sustaining treatment with their clinical team.",
        commonMistakes: [
          "Treating POLST as a substitute for an Advance Health Care Directive — they serve different purposes.",
          "Storing POLST where EMS cannot find it quickly.",
          "Not updating POLST when goals of care change.",
        ],
        questionsToAsk: [
          "Does the POLST reflect current goals of care?",
          "Is the POLST accessible to EMS if needed?",
          "Has the treating clinician signed the current form?",
          "When was this last reviewed?",
        ],
      },
      review: REVIEWED_META,
    },
  ],
  registryInfo: {
    hasKnownRegistry: true,
    registryName: "California Advance Directive Registry",
    registrySummary:
      "California maintains an Advance Directive Registry operated by the Secretary of State. Registering ensures healthcare providers can access your advance directive. Registration is optional but recommended.",
    registryLinks: [
      {
        label: "California Advance Directive Registry",
        url: "https://www.sos.ca.gov/notary/advance-health-care-directive-registry",
        sourceType: "official_state_source",
        isOfficial: true,
      },
    ],
  },
  officialResources: [
    {
      label: "California Attorney General — Advance Directives",
      url: "https://oag.ca.gov/consumers/general/ad",
      sourceType: "official_attorney_general_source",
      isOfficial: true,
    },
    {
      label: "California POLST Coalition",
      url: "https://capolst.org/",
      sourceType: "official_health_source",
      isOfficial: true,
    },
    {
      label: "California Advance Directive Registry",
      url: "https://www.sos.ca.gov/notary/advance-health-care-directive-registry",
      sourceType: "official_state_source",
      isOfficial: true,
    },
  ],
  review: REVIEWED_META,
};
