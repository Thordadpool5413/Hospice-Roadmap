// ─────────────────────────────────────────────────────────────────────────────
// Massachusetts — Reviewed Legal Content
// Review Status: reviewed
// Last Reviewed: 2025-01 (verify for currency before public release)
// Sources: MGL Chapter 201D, MA Executive Office of Health and Human Services,
//          MA MOLST Coalition, MA POLST Coalition
//
// IMPORTANT NOTES:
// - Massachusetts is transitioning from MOLST to POLST. MOLST remains valid
//   per state guidance until further notice.
// - The Health Care Proxy and MOLST are separate and serve different purposes.
// - MA does not have a statewide advance directive registry as of last review.
// ─────────────────────────────────────────────────────────────────────────────

import { createReviewMeta } from "../helpers";
import { StateLegalRegistry } from "../types";

const REVIEWED_META = createReviewMeta(
  "reviewed",
  "Legal Review Team",
  "official_state_source",
  [
    "Massachusetts General Laws Chapter 201D (Health Care Proxies)",
    "MA Executive Office of Health and Human Services",
    "Massachusetts MOLST Coalition guidance",
    "Massachusetts POLST Coalition materials",
  ],
);

export const MASSACHUSETTS: StateLegalRegistry = {
  stateCode: "MA",
  stateName: "Massachusetts",
  overview: {
    summary:
      "Massachusetts uses the Health Care Proxy to name a decision-maker. For medical orders, Massachusetts has historically used MOLST and is transitioning toward POLST. Both MOLST and POLST are physician-signed medical orders. The Health Care Proxy is a planning document; MOLST/POLST is a medical order — they are not interchangeable.",
    commonlyUsedDocuments: [
      "Health Care Proxy",
      "MOLST (Medical Orders for Life-Sustaining Treatment)",
      "POLST (being phased in)",
      "Durable Power of Attorney for Health Care (older terminology)",
    ],
    namingNotes: [
      "Massachusetts uses 'Health Care Proxy' for the decision-maker document.",
      "Massachusetts used MOLST for many years; POLST is being phased in.",
      "MOLST remains valid per current state guidance until further notice.",
      "Do not confuse the Health Care Proxy (who decides) with MOLST (what medical orders apply right now).",
    ],
    planningNotes: [
      "Complete a Health Care Proxy to authorize a trusted person to make decisions.",
      "MOLST/POLST is completed with a physician when there are current, specific medical orders to document.",
      "Both documents can be in effect at the same time and serve different functions.",
    ],
    importantWarnings: [
      "Massachusetts is actively transitioning from MOLST to POLST — verify current state guidance.",
      "A Health Care Proxy does not give your proxy automatic authority over financial matters.",
      "MOLST/POLST is a medical order that travels with the patient and is immediately actionable by EMS.",
    ],
  },
  documents: [
    {
      id: "ma_health_care_proxy",
      stateCode: "MA",
      title: "Massachusetts Health Care Proxy",
      commonNames: ["Health Care Proxy", "Healthcare Proxy", "Healthcare Agent", "DPAHC"],
      category: "healthcare_proxy",
      section: "decision_makers",
      summary:
        "The Massachusetts Health Care Proxy designates a trusted person (your proxy) to make healthcare decisions on your behalf if you lose decision-making capacity. It is governed by Massachusetts General Laws Chapter 201D.",
      whatItDoes:
        "Authorizes your chosen health care agent to make all healthcare decisions — including decisions about life-sustaining treatment — when you cannot make them yourself. The proxy speaks with your legal authority.",
      whoItsFor:
        "Any Massachusetts adult (18 or older) who wants to ensure a trusted person is authorized to make medical decisions on their behalf if they become incapacitated.",
      whoSigns: ["The patient (principal)", "Two adult witnesses"],
      witnessRequirement: {
        required: true,
        details:
          "Two adult witnesses are required. Witnesses cannot be the named health care agent or alternate. Witnesses cannot be the patient's healthcare provider or healthcare facility employee involved in the patient's care.",
      },
      notaryRequirement: {
        required: false,
        details: "Notarization is not required under Massachusetts law for a Health Care Proxy.",
      },
      specialRequirements: [
        "The health care agent must be 18 or older.",
        "The health care agent cannot also serve as a witness.",
        "Consider naming an alternate agent in case the primary is unavailable.",
        "You may include specific instructions to guide your agent, though instructions are optional.",
      ],
      honoredBy: ["Hospitals", "Physicians", "Hospices", "Nursing facilities", "All Massachusetts healthcare providers"],
      honoredBySummary:
        "Recognized by all Massachusetts healthcare providers under Chapter 201D. Becomes effective when the patient's physician determines the patient lacks decision-making capacity.",
      outOfStateRecognition:
        "Other states may honor a Massachusetts Health Care Proxy under their own laws, but this is not guaranteed. If you spend significant time in another state, consider that state's forms as well.",
      howToCompleteSteps: [
        "Choose a health care agent — someone you trust deeply who knows your values.",
        "Talk to your agent before completing the form so they understand your wishes.",
        "Download the Massachusetts Health Care Proxy form from MOLST Coalition, your physician, or the state.",
        "Complete the form, naming your agent and an optional alternate.",
        "Add any specific instructions you want your agent to follow.",
        "Sign the form in front of two qualifying adult witnesses.",
        "Give copies to your agent, alternate, physician, and hospice team.",
      ],
      storageGuidance: [
        "Keep the original in an accessible location — not in a safe deposit box.",
        "Give copies to your health care agent and alternate agent.",
        "Provide a copy to your primary physician for your medical record.",
        "Give a copy to your hospice team.",
        "Tell family members where the original is kept.",
      ],
      officialFormUrl: "https://www.mass.gov/doc/health-care-proxy-form/download",
      officialInfoUrl: "https://www.mass.gov/guides/health-care-proxies-in-massachusetts",
      additionalOfficialUrls: [
        {
          label: "Massachusetts General Laws Chapter 201D",
          url: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleII/Chapter201D",
          sourceType: "official_legislative_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "Without a Health Care Proxy, Massachusetts law specifies a default hierarchy that may not reflect your wishes. A Health Care Proxy ensures the person you trust most has the legal authority to speak for you.",
        whenToUseIt:
          "Every Massachusetts adult should have a Health Care Proxy regardless of age or health. Do not wait for a diagnosis.",
        commonMistakes: [
          "Naming an agent without talking to them about your wishes.",
          "Not naming an alternate in case the primary is unavailable.",
          "Storing the document where it cannot be accessed in an emergency.",
          "Not updating the proxy after major health changes or relationship changes.",
        ],
        questionsToAsk: [
          "Does my health care agent truly understand my values and wishes?",
          "Have I named an alternate agent?",
          "Does my physician have a copy in my medical record?",
          "Is my agent someone who can advocate forcefully under pressure?",
        ],
      },
      review: REVIEWED_META,
    },
    {
      id: "ma_molst",
      stateCode: "MA",
      title: "MOLST — Medical Orders for Life-Sustaining Treatment",
      commonNames: ["MOLST", "Medical Orders for Life-Sustaining Treatment", "POLST (transitioning)"],
      category: "medical_order",
      section: "medical_orders",
      summary:
        "MOLST is a physician-signed portable medical order that documents specific medical treatment decisions, including resuscitation, hospitalization, and other life-sustaining interventions. Massachusetts is transitioning toward POLST, but MOLST remains valid per current state guidance.",
      whatItDoes:
        "Creates actionable medical orders that travel with the patient across all care settings. Addresses CPR, hospital transfers, artificial nutrition, and other specific treatment decisions. Unlike an advance directive, a MOLST is an immediate physician's order.",
      whoItsFor:
        "Patients with serious illness, frailty, or advanced age who have made specific decisions about life-sustaining treatment in consultation with their physician. Most appropriate for patients with limited life expectancy.",
      whoSigns: [
        "The patient (or authorized decision-maker if patient lacks capacity)",
        "A licensed Massachusetts physician, nurse practitioner, or physician assistant",
      ],
      witnessRequirement: {
        required: false,
        details: "Witnesses are not required for MOLST in Massachusetts, though the conversation and shared decision-making process is essential.",
      },
      notaryRequirement: {
        required: false,
        details: "Notarization is not required for MOLST.",
      },
      specialRequirements: [
        "MOLST requires a conversation between the patient (or decision-maker) and a qualified clinician.",
        "MOLST is a medical order, not simply a statement of preferences — it should reflect a shared clinical decision.",
        "Massachusetts is transitioning to POLST — confirm current state guidance on whether new patients should complete MOLST or POLST.",
        "Existing MOLST forms remain valid per state guidance until further notice.",
      ],
      honoredBy: [
        "Massachusetts EMS and paramedics",
        "Hospitals",
        "Nursing facilities",
        "Hospice teams",
        "All Massachusetts healthcare providers",
      ],
      honoredBySummary:
        "MOLST is recognized across Massachusetts care settings including EMS. It is an immediately actionable medical order. All copies should be visibly accessible.",
      outOfStateRecognition:
        "MOLST may not be directly recognized outside Massachusetts. Each state has its own version of portable medical orders. Ask your hospice team if traveling.",
      howToCompleteSteps: [
        "Have an in-depth conversation with your physician or hospice team about your current health, prognosis, and goals of care.",
        "Discuss each section of the MOLST: CPR, hospitalization, level of medical intervention, and artificial nutrition.",
        "Make decisions that reflect your values and goals.",
        "Both the patient (or surrogate) and clinician sign the form.",
        "The original should be kept with the patient — not filed away.",
        "Provide copies to all involved care providers.",
      ],
      storageGuidance: [
        "Keep the original MOLST with the patient at all times — at bedside, on the refrigerator, or wherever EMS would look.",
        "A copy should be in the patient's medical chart at all facilities.",
        "Give a copy to your hospice team.",
        "If the patient transitions to a new care setting, ensure the MOLST transfers with them.",
      ],
      officialFormUrl: "https://www.molst-ma.org/molst-form",
      officialInfoUrl: "https://www.molst-ma.org/",
      additionalOfficialUrls: [
        {
          label: "Massachusetts MOLST Coalition",
          url: "https://www.molst-ma.org/",
          sourceType: "official_health_source",
          isOfficial: true,
        },
        {
          label: "MA Executive Office of Health and Human Services",
          url: "https://www.mass.gov/orgs/executive-office-of-health-and-human-services",
          sourceType: "official_state_source",
          isOfficial: true,
        },
      ],
      educationContent: {
        whyItMatters:
          "MOLST (and POLST as it is phased in) ensures that specific treatment decisions are documented as medical orders — not just preferences. EMS and hospitals can act on them immediately. Without MOLST, EMS must attempt full resuscitation by default.",
        whenToUseIt:
          "When a patient has a serious illness and has made clear, specific decisions about life-sustaining treatment. Usually completed in consultation with a physician or hospice team.",
        commonMistakes: [
          "Treating MOLST as a substitute for a Health Care Proxy — they serve different purposes.",
          "Filing MOLST in a folder or drawer where EMS cannot find it.",
          "Not updating MOLST when goals of care change.",
          "Assuming a MOLST completed months ago still reflects current wishes without reviewing it.",
        ],
        questionsToAsk: [
          "Does our MOLST reflect the patient's current goals of care?",
          "Is the MOLST accessible to EMS if needed?",
          "Has the treating physician reviewed and signed the current MOLST?",
          "Do we need to transition from MOLST to POLST given the state's current guidance?",
        ],
      },
      review: REVIEWED_META,
    },
  ],
  registryInfo: {
    hasKnownRegistry: false,
    registryName: null,
    registrySummary:
      "Massachusetts does not have a centralized statewide advance directive registry as of last review. Keep original documents accessible with the patient and care team.",
    registryLinks: [],
  },
  officialResources: [
    {
      label: "Massachusetts Health Care Proxy — Official Guide",
      url: "https://www.mass.gov/guides/health-care-proxies-in-massachusetts",
      sourceType: "official_state_source",
      isOfficial: true,
    },
    {
      label: "Massachusetts MOLST Coalition",
      url: "https://www.molst-ma.org/",
      sourceType: "official_health_source",
      isOfficial: true,
    },
    {
      label: "MGL Chapter 201D — Health Care Proxies",
      url: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleII/Chapter201D",
      sourceType: "official_legislative_source",
      isOfficial: true,
    },
  ],
  review: REVIEWED_META,
};
