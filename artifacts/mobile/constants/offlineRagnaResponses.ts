export interface OfflineRagnaScript {
  scenarioId: string;
  title: string;
  summary: string;
  steps: string[];
  callReminder: string;
}

/** Cached scripted responses for top urgent scenarios when Ragna chat is offline. */
export const OFFLINE_RAGNA_SCRIPTS: OfflineRagnaScript[] = [
  {
    scenarioId: "breathing-changes",
    title: "Breathing changes",
    summary:
      "Breathing often changes in late illness. Wet sounds are usually harder for you to hear than for them to feel. Long pauses between breaths are common.",
    steps: [
      "Reposition onto their side or elevate the head slightly.",
      "Keep lips and mouth moist with a damp swab.",
      "If hospice gave medications for secretions or breathlessness, call before giving any dose.",
      "Stay calm and speak softly — your presence helps.",
    ],
    callReminder: "Call hospice now if they seem distressed, lips look blue, or you are unsure.",
  },
  {
    scenarioId: "pain-worsening",
    title: "Worsening pain",
    summary:
      "Rising pain usually means the plan needs adjustment — not that medications stopped working. Breakthrough doses exist for exactly this situation.",
    steps: [
      "Note the pain level and when the last dose was given.",
      "Call hospice before giving any comfort kit medication unless they already authorized a dose for this.",
      "Try gentle repositioning and a calm, quiet room while you wait.",
      "Do not wait until morning if pain is severe.",
    ],
    callReminder: "Hospice can adjust medications within hours. Night calls are expected.",
  },
  {
    scenarioId: "oxygen-concentrator",
    title: "Oxygen concentrator trouble",
    summary:
      "Most alarms are fixable at home: check power, tubing, water trap, and that the cannula is in place.",
    steps: [
      "Confirm the machine is plugged in and the power light is on.",
      "Check tubing for kinks and that the humidifier bottle is seated correctly.",
      "Make sure nasal cannula prongs point downward into the nostrils.",
      "If the alarm continues, switch to backup oxygen if you have it and call the equipment provider.",
    ],
    callReminder: "Call equipment provider and hospice if oxygen flow stops or breathing worsens.",
  },
  {
    scenarioId: "comfort-kit",
    title: "Comfort kit medications",
    summary:
      "Comfort kit meds are for urgent symptoms — always call hospice first unless a nurse already told you exactly when to give a dose.",
    steps: [
      "Locate the kit and read labels for name, dose, and route.",
      "Call hospice to confirm which medication matches the symptom.",
      "Give only the dose on the label or as instructed.",
      "Note the time and response — hospice will ask.",
    ],
    callReminder: "Never guess on opioid doses. The call takes two minutes and prevents harm.",
  },
  {
    scenarioId: "approaching-death",
    title: "Signs death may be approaching",
    summary:
      "Sleeping more, eating less, cool hands, and breathing pattern changes are common. This does not always mean hours — sometimes days.",
    steps: [
      "Keep them comfortable: mouth care, repositioning, soft light.",
      "Gather family if you wish; there is no required timeline.",
      "Call hospice to update them on what you are seeing.",
      "Focus on presence — your voice and touch matter.",
    ],
    callReminder: "Call hospice when you first notice major changes or if you need a nurse visit.",
  },
  {
    scenarioId: "after-death-practical",
    title: "After death — first steps",
    summary:
      "There is no rush. Take time with your loved one. Hospice — not 911 — is the first call unless you were told otherwise.",
    steps: [
      "Pause and breathe. You do not need to act immediately.",
      "Call hospice when you are ready — they will pronounce and document.",
      "Do not start CPR if DNR/POLST is in place.",
      "Call the funeral home when you feel ready; hospice can help you choose.",
    ],
    callReminder: "Hospice is available 24/7 for exactly this moment.",
  },
  {
    scenarioId: "agitation-restlessness",
    title: "Agitation or restlessness",
    summary:
      "Terminal restlessness is treatable. It is not something you have to endure alone through the night.",
    steps: [
      "Speak calmly; reduce noise and bright lights.",
      "Ensure they are not in pain or needing the bathroom.",
      "Do not restrain — guide gently and keep the area safe.",
      "Call hospice — medications like haloperidol or lorazepam often help quickly.",
    ],
    callReminder: "Call now if agitation is severe or you cannot keep them safe.",
  },
  {
    scenarioId: "suction-machine",
    title: "Suction machine issues",
    summary:
      "Only suction as deep as hospice trained you. Shallow mouth suctioning is different from deep suctioning.",
    steps: [
      "Check power, canister connection, and tubing.",
      "Use clean technique with the catheter provided.",
      "Stop if you see blood or if they seem distressed.",
      "Call hospice if secretions are overwhelming or the machine fails.",
    ],
    callReminder: "Equipment provider for machine failure; hospice for clinical guidance.",
  },
  {
    scenarioId: "hospital-bed",
    title: "Hospital bed problems",
    summary:
      "Most issues are remote batteries, locked rails, or unplugged motors.",
    steps: [
      "Check that the bed is plugged in and the remote has batteries.",
      "Look for a reset button on the motor unit.",
      "Never force someone to transfer if you feel unsafe — call for help.",
      "Call equipment provider for mechanical failure; hospice for safe transfers.",
    ],
    callReminder: "Never risk a fall trying to move someone alone.",
  },
  {
    scenarioId: "not-sure-whats-happening",
    title: "Not sure what's happening",
    summary:
      "When you are uncertain, hospice wants the call. There is no such thing as bothering them.",
    steps: [
      "Describe what changed in the last few hours — breathing, color, responsiveness, pain.",
      "Check temperature of hands and whether they are responding to voice.",
      "Stay with them and keep the environment calm.",
      "Call hospice and say: 'Something feels different and I'm not sure what.'",
    ],
    callReminder: "Trust your instinct. If something feels wrong, call.",
  },
];

export function getOfflineScript(scenarioId: string): OfflineRagnaScript | undefined {
  return OFFLINE_RAGNA_SCRIPTS.find((s) => s.scenarioId === scenarioId);
}

export function getOfflineScriptByGuidanceId(guidanceId: string): OfflineRagnaScript | undefined {
  return getOfflineScript(guidanceId);
}