// Dying process model — timeline-based guidance for what families see and experience

export interface DyingPhase {
  phase: string;
  timeframe: string;
  signs: string[];
  whatIsHappening: string;
  whatFamilyMaySee: string;
  whatToDo: string;
  whatToSay: string;
  whatNotToDo: string;
  isEmergency: boolean;
  callHospiceNow: boolean;
}

export const DYING_PROCESS_PHASES: DyingPhase[] = [
  {
    phase: "weeks_to_days",
    timeframe: "Weeks to days remaining",
    signs: [
      "Sleeping 16-22 hours per day",
      "Eating and drinking very little",
      "Withdrawing from conversations",
      "Vivid dreams or visions",
      "Mild confusion or disorientation",
      "Mottling beginning in feet and knees",
      "Decreased interest in television or activities",
      "Talking to deceased relatives (transitional communication)",
    ],
    whatIsHappening: "The body is conserving energy and slowly reducing non-essential functions. The digestive system is slowing. Circulation is beginning to concentrate in the core. The brain is changing its processing — vivid dreams and visions are neurological, not hallucinations.",
    whatFamilyMaySee: "A person who sleeps most of the day and seems to be withdrawing from the world. They may have episodes of clarity followed by confusion. They may talk about travel, going home, or see people who aren't there.",
    whatToDo: "Keep the environment quiet and calm. Offer small sips of fluid and mouth care. Stop pushing food. Sit with them and simply be present. Reduce visitors and noise. Continue all comfort medications.",
    whatToSay: "You can still talk to them normally. Say: 'We love you. We're here. You don't need to do anything. Rest.' Even when they seem asleep, they may hear you.",
    whatNotToDo: "Do not force food or fluids. Do not try to 'wake them up' or 'get them more active.' Do not increase visitors to say goodbye all at once — keep it calm. Do not panic if they talk about seeing deceased relatives.",
    isEmergency: false,
    callHospiceNow: false,
  },
  {
    phase: "days",
    timeframe: "Days remaining (1-3 days)",
    signs: [
      "Unresponsive or minimally responsive to voice and touch",
      "Jaw relaxation, mouth breathing",
      "Cheyne-Stokes breathing (rhythmic cycles of rapid breathing then stopping for 30-60 seconds)",
      "Mottling spreading from feet to knees and thighs",
      "Extremities cold and dark",
      "Terminal secretions (gurgling breathing sound)",
      "Decreased or no urine output",
      "Eyes partially open, unfocused, or closed",
    ],
    whatIsHappening: "The cardiovascular system is failing. Blood pressure is falling and circulation is pulling to the core. Oxygen delivery to the brain is reduced. Kidney function has largely stopped. The brainstem is releasing its control of breathing in cycles. The terminal secretion sounds are from secretions pooling in the throat — the patient cannot clear them and is not distressed by them.",
    whatFamilyMaySee: "A person who appears to be unconscious. Breathing that stops and starts, sometimes with long pauses. A face that appears relaxed. Hands and feet that feel cold and look mottled or dark. A gurgling sound with each breath.",
    whatToDo: "Call the hospice nurse now to notify them that the patient is in active dying. Keep the room peaceful. Offer gentle touch and continue to speak to them. Keep the mouth moist with a damp swab. Turn off the television and reduce light. Gather family if they wish to be present.",
    whatToSay: "Continue speaking directly to them: 'We are here. We love you. You are not alone. You can go when you are ready. We will be okay.' Even in apparent unresponsiveness, hearing is believed to be the last sense to diminish.",
    whatNotToDo: "Do not try to suction oral secretions — it is more distressing than helpful. Do not attempt to force medications that can no longer be swallowed. Do not call 911 if a DNR is in place — this is the expected dying process.",
    isEmergency: false,
    callHospiceNow: true,
  },
  {
    phase: "hours",
    timeframe: "Hours remaining",
    signs: [
      "Breathing very slow and irregular, with very long pauses (30-60+ seconds)",
      "Jaw dropped, mouth open",
      "No response to voice or touch",
      "Extremities very dark, cold, and mottled",
      "Mottling may reach the torso",
      "Very slow, irregular, shallow breaths",
      "Deep gurgling or total silence between breaths",
    ],
    whatIsHappening: "The brainstem is releasing its control of breathing. The heart will stop within minutes to a few hours after breathing becomes this irregular. The body is completing its natural process of dying.",
    whatFamilyMaySee: "Very long pauses between breaths — sometimes 45-60 seconds. It may seem like death has occurred, and then they take another breath. The face appears completely relaxed. There is no sign of distress.",
    whatToDo: "Remain present if you can. Hold a hand. Speak softly. You do not need to do anything except be there. After breathing stops, wait and observe — death has occurred when breathing stops and does not resume after 1-2 minutes. Then take a moment before making any calls.",
    whatToSay: "There are no required words. You might simply say: 'I love you. Thank you. Rest now.' Silence is also perfect.",
    whatNotToDo: "Do not panic when breathing pauses for long periods. Do not call 911 if DNR is in place. Do not feel you must do anything — being present is enough.",
    isEmergency: false,
    callHospiceNow: true,
  },
  {
    phase: "at_death",
    timeframe: "The moment of death",
    signs: [
      "Breathing has stopped completely and does not resume",
      "No rise and fall of the chest",
      "No pulse — though you may not check for this",
      "Eyes may be partially open",
      "Complete stillness",
    ],
    whatIsHappening: "The heart has stopped. Death has occurred.",
    whatFamilyMaySee: "Complete stillness. An absence of breathing. A face that is profoundly at rest. Sometimes a final exhale — this is the body releasing air, not a final breath.",
    whatToDo: "Take the time you need. There is no rush. After several minutes, call the hospice 24/7 line. Let them know death has occurred. They will guide next steps. Do not call the funeral home until the nurse has pronounced death.",
    whatToSay: "Whatever comes from the heart. There are no wrong words at this moment.",
    whatNotToDo: "Do not call 911 if DNR is in place. Do not feel you must immediately call anyone. Do not feel you must leave the room.",
    isEmergency: false,
    callHospiceNow: true,
  },
];

export const UNCERTAIN_TIMING_GUIDANCE = {
  overview: "Predicting the exact time of death is impossible even for experienced clinicians. Many families ask 'how long?' — the honest answer is that we observe signs, not timelines.",
  whenFamilyAsks: "When family asks 'how long does he have?' — it is honest and kind to say: 'The signs we are seeing suggest days rather than weeks, but the exact timing is something only he and his body know. What I can tell you is that we are in the final phase and we want everyone who should be here to be here.'",
  signsToWatch: ["Mottling spreading beyond the feet", "Complete unresponsiveness", "Jaw relaxation and mouth breathing", "Cheyne-Stokes breathing pattern", "Extremities cold and dark", "No urine output for 12+ hours"],
  commonMistakes: [
    "Promising a specific timeline — this creates anxiety when it doesn't match",
    "Suggesting death is imminent when the patient stabilizes and lives longer",
    "Not calling family in time because the timeline was underestimated",
  ],
};

export function getDyingPhase(stage: string): DyingPhase | undefined {
  return DYING_PROCESS_PHASES.find((p) => p.phase === stage);
}
