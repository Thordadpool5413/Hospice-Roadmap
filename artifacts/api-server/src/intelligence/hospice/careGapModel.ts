import type { CareGapSignal, CareGapType } from "./types.js";

export const CARE_GAP_SIGNALS: CareGapSignal[] = [
  {
    type: "poor_education",
    description: "The family was enrolled in hospice but never received thorough education about what to expect, how to use medications, or what to do when things change.",
    whatShouldHaveHappened: "A comprehensive education visit should occur within 72 hours of enrollment covering: the dying process, comfort kit use, when to call, what to expect, and what to do at the time of death.",
    whatToAskFor: "Request a teaching visit from the hospice nurse. Ask specifically: 'Can we schedule a visit where you walk us through everything we need to know?'",
    whatToSay: "'We feel like we were not adequately prepared for what is happening. We need a comprehensive teaching session as soon as possible.'",
    whatToDocument: "Date of request, name of person spoken with, date of scheduled teaching visit.",
    whenToEscalateFurther: "If education is refused or repeatedly deferred, contact the hospice administrator.",
  },
  {
    type: "no_preparation",
    description: "The family was not prepared for the dying process, signs of approaching death, or what to do at the time of death.",
    whatShouldHaveHappened: "Hospice is required to prepare families for the dying process. This includes written materials and verbal education about signs of decline and death.",
    whatToAskFor: "Ask for written materials and a nurse visit specifically to review signs of dying and what to do. Ask: 'Can you walk us through exactly what we will see as things get closer and what we should do?'",
    whatToSay: "'No one has explained what the end is going to look like. We need to know what to expect and what to do so we are not panicking when it happens.'",
    whatToDocument: "Record what was said, by whom, and when. Note that preparation was requested.",
    whenToEscalateFurther: "If nurse or team refuses to have this conversation, escalate to administrator or patient advocate.",
  },
  {
    type: "delayed_callback",
    description: "The family called the hospice after-hours or on-call line and did not receive a timely callback.",
    whatShouldHaveHappened: "CMS requires 24/7 phone access with a clinical person available to respond. Callbacks should occur within 30 minutes for urgent calls.",
    whatToAskFor: "Document the time of each call and the time of callback. If delay is persistent, request a meeting with the hospice administrator.",
    whatToSay: "'I called at [time] and did not receive a callback for [duration]. This is unacceptable when someone is in distress. I need to understand why this happened and what will change.'",
    whatToDocument: "Time of call, name of who answered or voicemail, time of callback, content of callback.",
    whenToEscalateFurther: "File a complaint with state health department licensure office if pattern continues.",
  },
  {
    type: "vague_after_hours",
    description: "The after-hours nurse provided vague reassurance without specific guidance, a clear plan, or an offer to visit.",
    whatShouldHaveHappened: "The on-call nurse should provide specific clinical guidance, authorize medication use if needed, offer a visit for urgent situations, and create a clear follow-up plan.",
    whatToAskFor: "Ask specifically: 'What do I do if this gets worse in the next two hours? Can you authorize the comfort kit medication? Should someone come out tonight?'",
    whatToSay: "'I appreciate the call, but I need a specific plan, not just reassurance. What exactly should I do if this happens, and when should I call you back?'",
    whatToDocument: "Time of call, name of on-call nurse, what was said, what was advised.",
    whenToEscalateFurther: "If vague guidance leads to a crisis or preventable 911 call, document this and report to administrator.",
  },
  {
    type: "symptom_gap",
    description: "Pain, breathlessness, agitation, or other symptoms are not being adequately controlled despite calls to the hospice team.",
    whatShouldHaveHappened: "The hospice physician and nurse should adjust medications until symptoms are controlled. NHPCO quality standards require ongoing assessment and adjustment.",
    whatToAskFor: "Ask to speak directly with the hospice physician or medical director. Ask: 'What is the medication plan for today? What is the maximum dose that can be used? When will we reassess?'",
    whatToSay: "'This symptom is not controlled and it has been [duration]. I need to speak with the doctor, not just the nurse, and I need a specific plan that will actually control this.'",
    whatToDocument: "Symptom scores, times medications were given, response, every call to hospice, every response.",
    whenToEscalateFurther: "Contact the hospice medical director directly. File a complaint if uncontrolled symptoms persist for more than a few hours.",
  },
  {
    type: "equipment_delay",
    description: "Medical equipment (hospital bed, wheelchair, oxygen, suction, etc.) was ordered but has not been delivered within a reasonable time.",
    whatShouldHaveHappened: "Medically necessary equipment should be delivered within 24-48 hours of the order. Urgent equipment (oxygen for respiratory distress) should be same-day.",
    whatToAskFor: "Call the hospice case manager and ask: 'What is the status of the equipment order? When will it be delivered? Who is the equipment company and can I call them directly?'",
    whatToSay: "'The equipment was ordered [X days] ago and has not arrived. This is affecting patient comfort and safety. I need this resolved today.'",
    whatToDocument: "Date equipment was ordered, what was ordered, name of who confirmed the order, date/time delivered.",
    whenToEscalateFurther: "If equipment delays are causing patient distress, escalate to the hospice administrator immediately.",
  },
  {
    type: "comfort_kit_confusion",
    description: "The family has a comfort kit but was never taught what medications it contains, when to use them, or how to give them.",
    whatShouldHaveHappened: "Comfort kit education should occur when the kit is delivered, not at crisis time. Family should know the purpose of each medication and who to call before using.",
    whatToAskFor: "Request immediate education: 'Can a nurse come today to walk us through the comfort kit? We don't know what's in it or when to use anything.'",
    whatToSay: "'We have the comfort kit but no one has explained it to us. We need someone to walk us through each medication, what it's for, and when to give it.'",
    whatToDocument: "When kit was delivered, whether education was offered, what was covered.",
    whenToEscalateFurther: "If a medication is needed urgently and no nurse guidance is available, call the after-hours line immediately.",
  },
  {
    type: "family_feels_abandoned",
    description: "The family has not heard from the hospice team in an extended period, visits are infrequent, or they feel they are managing alone.",
    whatShouldHaveHappened: "Visit frequency should match patient acuity. As the patient declines, visits should increase. Families should not feel they are managing alone at any point.",
    whatToAskFor: "Call the hospice and ask for a care conference. Ask: 'How often should we be getting visits? What is our current visit schedule? What happens when things get worse?'",
    whatToSay: "'We are managing this essentially alone and we need more support. What can the hospice provide that we have not been getting?'",
    whatToDocument: "Dates of visits, calls to hospice requesting more support, responses received.",
    whenToEscalateFurther: "If hospice cannot provide adequate support and the patient's acuity warrants more, request an inpatient or continuous care level of care.",
  },
  {
    type: "time_of_death_unprepared",
    description: "The family was not prepared for what to do when the patient dies — who to call, what to expect, what happens next.",
    whatShouldHaveHappened: "Every hospice family should receive clear, written guidance on what to do when death occurs: who to call first (hospice, not 911), what to expect, when to call the funeral home.",
    whatToAskFor: "Ask the hospice nurse: 'Can you walk us through exactly what we do when the death occurs? Who do we call first? What should we expect?'",
    whatToSay: "'We have never been told what to do when it actually happens. We need to know now, before it occurs.'",
    whatToDocument: "Date the conversation was requested and held.",
    whenToEscalateFurther: "If this conversation is refused or deferred, it is a patient safety issue — escalate to administrator.",
  },
  {
    type: "after_death_unprepared",
    description: "The family was not prepared for the practical and emotional aspects of the period after death.",
    whatShouldHaveHappened: "Hospice should provide education on medication disposal, equipment retrieval, death certificate process, and bereavement resources before death, not after.",
    whatToAskFor: "Ask the hospice team before death occurs: 'What happens after the death in terms of medications, the hospital bed, the death certificate, and support for us?'",
    whatToSay: "'We want to understand the practical aspects of what happens after, so we are not trying to figure all of this out in the middle of our grief.'",
    whatToDocument: "Date education was provided and what was covered.",
    whenToEscalateFurther: "If bereavement follow-up does not occur within expected timeframes after death, contact the hospice administrator.",
  },
  {
    type: "inadequate_pain_control",
    description: "The patient is experiencing pain scores above 6/10 consistently and the hospice team has not adjusted medications adequately.",
    whatShouldHaveHappened: "Hospice care requires ongoing pain assessment and medication adjustment until comfort is achieved. Undertreated pain is a quality failure.",
    whatToAskFor: "Request an urgent medication review with the hospice physician: 'The current medications are not controlling the pain. I need to speak with the doctor today about adjusting the regimen.'",
    whatToSay: "'Pain has been at [score] consistently. The current medications are not working. I need the doctor to make a medication change today, not tomorrow.'",
    whatToDocument: "Pain scores, medication doses and times, responses, all calls to hospice and responses.",
    whenToEscalateFurther: "Contact the hospice medical director. File a formal complaint if pain remains uncontrolled.",
  },
  {
    type: "inadequate_dyspnea_control",
    description: "The patient is experiencing distressing breathlessness and the hospice team has not provided adequate management.",
    whatShouldHaveHappened: "Dyspnea is highly treatable with opioids, positioning, fan use, and anxiolytics. No patient should experience prolonged distressing breathlessness without medication intervention.",
    whatToAskFor: "Request authorization for opioid and/or anxiolytic medication for dyspnea: 'The patient is in respiratory distress. I need medication authorization now, not in a few hours.'",
    whatToSay: "'The breathlessness is causing significant distress. This is treatable. I need the nurse or doctor to authorize medication changes immediately.'",
    whatToDocument: "Breathing rate, apparent distress level, times medications were given, responses, calls to hospice.",
    whenToEscalateFurther: "If distressing breathlessness is not addressed within an hour, escalate to the hospice medical director.",
  },
];

export function detectCareGaps(messageText: string): CareGapType[] {
  const lower = messageText.toLowerCase();
  const gaps: CareGapType[] = [];

  const patterns: Array<[string[], CareGapType]> = [
    [["no one told", "no one explained", "never told", "wasn't prepared", "not prepared", "didn't know", "nobody said"], "poor_education"],
    [["no one prepared", "didn't prepare", "not ready for", "unprepared for death", "don't know what to do when"], "no_preparation"],
    [["no callback", "didn't call back", "never called", "waiting for callback", "30 minutes", "not responding"], "delayed_callback"],
    [["vague", "just said wait", "just told me to wait", "no plan", "not helpful", "useless advice"], "vague_after_hours"],
    [["pain not controlled", "still in pain", "medications not working", "not working", "still hurting"], "symptom_gap"],
    [["equipment not here", "equipment hasn't arrived", "bed not delivered", "oxygen not here", "still waiting for"], "equipment_delay"],
    [["don't know how to use", "comfort kit", "don't know what's in", "never showed me", "wasn't explained"], "comfort_kit_confusion"],
    [["alone", "no one comes", "haven't heard", "haven't visited", "feel abandoned", "managing alone"], "family_feels_abandoned"],
    [["what do i do when", "when they die", "what happens when", "don't know what to do at death"], "time_of_death_unprepared"],
    [["what happens after", "after the death", "after they die", "funeral home", "what do we do next"], "after_death_unprepared"],
  ];

  for (const [keywords, gap] of patterns) {
    if (keywords.some((kw) => lower.includes(kw))) {
      gaps.push(gap);
    }
  }

  return [...new Set(gaps)];
}

export function getCareGapSignal(type: CareGapType): CareGapSignal | undefined {
  return CARE_GAP_SIGNALS.find((cg) => cg.type === type);
}
