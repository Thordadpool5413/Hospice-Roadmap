export interface BenefitsSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  body: string[];
  tips?: { label: string; text: string }[];
}

export const BENEFITS_GUIDE_SECTIONS: BenefitsSection[] = [
  {
    id: "what-medicare-pays",
    title: "What Medicare Pays For",
    icon: "check-circle",
    summary: "Medicare Part A covers nearly everything needed for comfort care — most families pay nothing out of pocket.",
    body: [
      "When a person enrolls in hospice under Medicare Part A, the benefit covers a comprehensive package of care at little to no cost.",
      "Medicare pays for all medications related to the terminal diagnosis — including pain medications, anti-anxiety drugs, and symptom management. There is no copay for these.",
      "Medical equipment is covered in full: hospital bed, wheelchair, oxygen equipment, bedside commode, shower chair, suction machine, and anything else needed for comfort at home.",
      "Nursing visits are included — the frequency depends on medical need. Most patients receive multiple nurse visits per week, with more visits as illness progresses.",
      "Home health aide visits for personal care (bathing, grooming, light hygiene support) are covered.",
      "Social worker visits are included — to help with paperwork, benefits navigation, family communication, and community resources.",
      "Chaplain visits for spiritual support are covered, regardless of religion or belief.",
      "Volunteer support for companionship, reading aloud, errands, or caregiver relief is included.",
      "Bereavement counseling continues for at least 13 months after the patient's death — for family members.",
    ],
    tips: [
      {
        label: "Ask explicitly",
        text: "Not all hospices proactively schedule every service. Ask your team: 'Are we entitled to aide visits? Social worker visits? Chaplain contact?' The answer to all three is yes.",
      },
    ],
  },
  {
    id: "one-rule",
    title: "The One Rule to Know",
    icon: "info",
    summary: "Medicare covers services \"related to the terminal diagnosis.\" Understanding this rule prevents surprise bills.",
    body: [
      "The most important concept in the hospice benefit is this: Medicare covers services, medications, and equipment that are related to the patient's terminal diagnosis.",
      "Services or medications for unrelated conditions are not covered by hospice — they go through regular Medicare Parts A and B.",
      "Example — COVERED: A patient with COPD needs an albuterol nebulizer, supplemental oxygen, prednisone bursts, and morphine for air hunger. All covered.",
      "Example — NOT COVERED by hospice: That same patient breaks a wrist. Treatment for the broken wrist is not related to COPD, so it goes through regular Medicare — not hospice. Hospice doesn't take anything away; it simply doesn't pay for unrelated care.",
      "Example — COVERED: A patient with cancer has pain, anxiety, nausea, and fatigue. All of these are related to the terminal diagnosis. Medications and nursing for all of them are covered.",
      "Example — GRAY AREA: A patient with congestive heart failure (CHF) also has diabetes. If diabetes management is needed to maintain comfort (for example, preventing a hypoglycemic episode that worsens distress), many hospices will cover it. Ask your team.",
      "If you receive a bill that seems wrong, ask your hospice social worker to review it before you pay anything. Billing errors do happen.",
    ],
    tips: [
      {
        label: "Before you pay a bill",
        text: "Call your hospice and ask: 'Is this charge related to the terminal diagnosis? Should hospice have covered this?' Many billing errors are resolved with one phone call.",
      },
    ],
  },
  {
    id: "what-you-pay",
    title: "What You Might Still Pay",
    icon: "dollar-sign",
    summary: "Two situations can result in a small cost to the family — inpatient respite and nursing facility room and board.",
    body: [
      "For most hospice services, there is no copay and no deductible under Medicare Part A. But there are two exceptions to know.",
      "Inpatient Respite Care: If the hospice arranges a short inpatient stay (up to 5 days) specifically to give family caregivers a break, Medicare allows the hospice to charge a 5% copay for each day. This is typically a small amount — often $15–$40 per day depending on the facility.",
      "Room and Board in a Nursing Facility: If a hospice patient lives in a nursing home or assisted living, Medicare's hospice benefit does not cover the cost of the room and board. The patient continues to pay that facility cost through Medicaid (if eligible), out of pocket, or through private insurance. Hospice pays for the hospice services on top of that.",
      "Medications for Unrelated Conditions: Prescription drugs not related to the terminal diagnosis are not covered by hospice. They go through Medicare Part D as usual.",
      "If paying for any of these creates a hardship, tell your social worker. Hospices are required to provide services regardless of ability to pay, and many have financial assistance resources.",
    ],
    tips: [
      {
        label: "Financial hardship",
        text: "Tell your social worker if any cost is a burden. Hospices cannot deny care based on inability to pay, and your social worker may know about assistance programs.",
      },
    ],
  },
  {
    id: "the-tradeoff",
    title: "The Trade-Off Explained",
    icon: "repeat",
    summary: "Choosing hospice means pausing curative treatment for the terminal diagnosis — but it's reversible, and treatment for other conditions continues.",
    body: [
      "When a patient signs up for hospice, they agree to receive comfort-focused care rather than curative treatment for their terminal diagnosis. This is called the 'election of hospice.'",
      "What this means in practice: A patient with terminal lung cancer will not receive chemotherapy, radiation, or immunotherapy aimed at curing the cancer through the hospice benefit. These treatments shift from being covered by hospice to being the patient's responsibility — and they generally conflict with the goals of comfort care.",
      "What it does NOT mean: Treatment for other medical conditions continues normally. If a hospice patient has heart disease, diabetes, or a UTI, those conditions can still be treated under regular Medicare. Hospice does not take away any other healthcare.",
      "It does NOT mean no medications. Hospice patients often receive more medications than before — for pain, anxiety, breathlessness, nausea, secretions, and other symptoms.",
      "It does NOT mean the patient cannot go to the hospital. If something unrelated to the terminal diagnosis requires a hospital visit (for example, a broken hip from a fall), the patient can seek hospital treatment under regular Medicare.",
      "It IS reversible at any time. A patient can revoke the hospice election at any point, for any reason. If they do, they return to regular Medicare and can pursue curative treatment again. There is no penalty.",
      "Many families find that this trade-off is easier to accept once they understand: the curative treatments being paused often weren't working anymore — and the comfort-focused care they're gaining can dramatically improve quality of life.",
    ],
    tips: [
      {
        label: "Reversible at any time",
        text: "If a patient wants to leave hospice — to try a new treatment, or for any other reason — they simply notify the hospice in writing. Their Medicare coverage for other care resumes immediately.",
      },
    ],
  },
  {
    id: "social-worker",
    title: "When to Call the Social Worker",
    icon: "phone",
    summary: "Your hospice social worker is your advocate for billing, financial hardship, coverage disputes, and Medicare concerns.",
    body: [
      "Every hospice patient is entitled to social worker visits as part of the Medicare benefit. Your social worker is a trained advocate — not just a counselor. They navigate systems on your behalf.",
      "Call your social worker when you receive an unexpected bill. They can review it, dispute errors, and contact the hospice billing department on your behalf.",
      "Call when you're experiencing financial hardship. Social workers know about community resources, prescription assistance programs, emergency funds, and Medicaid eligibility.",
      "Call when you have a coverage dispute. If you believe the hospice should be covering something and they say they won't, your social worker can escalate internally.",
      "Call when you want to file a Medicare complaint. If you believe your rights have been violated or care is being withheld, your social worker can help you contact your state's Quality Improvement Organization (QIO) — which handles Medicare grievances and fast appeals.",
      "Call when you're navigating facility care. If the patient is in a nursing home or assisted living and there are questions about what hospice covers versus what the facility covers, your social worker can explain the division of responsibility.",
      "Call when family conflict is affecting care decisions. Social workers are trained to facilitate difficult family conversations and can sometimes help when family members disagree about the care plan.",
    ],
    tips: [
      {
        label: "Request a visit",
        text: "Social worker visits are covered under your benefit. If you haven't heard from your social worker in a few weeks, call the hospice and request a visit.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights as a Patient",
    icon: "shield",
    summary: "Hospice patients have formal rights under Medicare — including the right to revoke, the right to appeal, and the right to know your care plan.",
    body: [
      "Every hospice patient has legally protected rights under the Medicare Hospice Benefit. Understanding them helps you advocate for the care you deserve.",
      "Right to Revoke: You can end hospice enrollment at any time, for any reason, simply by notifying the hospice in writing. There is no penalty, no waiting period, and your Medicare coverage for other treatment resumes immediately.",
      "Right to Know Your Care Plan: You are entitled to receive and participate in your plan of care. Ask for a written copy. Ask what services are planned and on what schedule. If you were never given a plan of care, ask for one.",
      "Right to File a Grievance: If you are dissatisfied with your care, you have the right to file a formal grievance with the hospice. They are required to respond within a defined timeframe.",
      "Right to a Medicare Appeal: If the hospice wants to discharge you because they believe you are no longer eligible, you have the right to appeal that decision. You must receive written notice at least two days before discharge, and you can contact your QIO (Quality Improvement Organization) to request a fast review.",
      "Right to Choose Your Hospice: You have the right to change hospice providers once during each certification period, for any reason.",
      "Right to Non-Discrimination: Hospice care must be provided regardless of race, color, national origin, disability, or age.",
      "Right to Privacy and Dignity: You have the right to have your personal and medical information kept confidential, and to be treated with dignity and respect at all times.",
      "If you feel any of these rights have been violated, contact your state's hospice licensure authority or call 1-800-MEDICARE (1-800-633-4227) to report a concern.",
    ],
    tips: [
      {
        label: "Keep a copy",
        text: "Ask the hospice to give you a written copy of your patient rights at enrollment. Most are required to do so. It's your reference if you ever need to advocate for yourself.",
      },
    ],
  },
];
