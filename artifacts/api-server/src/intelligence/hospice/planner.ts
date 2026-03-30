import { detectCareGaps } from "./careGapModel.js";
import { detectRedFlags, hasCall911Flag } from "./redFlags.js";
import { detectAudienceStyle, detectJourneyStage, detectRole, detectUrgency, getResponseLengthGuidance, isMiddleOfNight } from "./roleAdaptation.js";
import { retrieveKnowledgeBlocks, formatBlocksForPrompt } from "./retrieval.js";
import { findBestScenario } from "./scenarioMap.js";
import { findDiseaseTrajectory } from "./diseaseModel.js";
import { getDyingPhase } from "./dyingProcessModel.js";
import { getPlaybookForRole } from "./communicationModel.js";
import type { ConcernDomain, ResponsePlan } from "./types.js";

export function buildResponsePlan(
  messageText: string,
  patientContext: string,
): ResponsePlan {
  const combinedText = `${messageText} ${patientContext}`;

  // ─── Detection Layer ──────────────────────────────────────────────────────

  const role = detectRole(combinedText);
  const journeyStage = detectJourneyStage(combinedText);
  const urgency = detectUrgency(combinedText);
  const audienceStyle = detectAudienceStyle(combinedText, urgency);
  const scenario = findBestScenario(combinedText);
  const careGapTypes = detectCareGaps(combinedText);
  const redFlags = detectRedFlags(combinedText);
  const call911Now = hasCall911Flag(redFlags);
  const escalateNow = call911Now || urgency === "critical" || urgency === "urgent";

  // ─── Retrieval ────────────────────────────────────────────────────────────

  const retrieval = retrieveKnowledgeBlocks(messageText, patientContext, urgency, journeyStage);

  // ─── Domain Aggregation ───────────────────────────────────────────────────

  const allDomains = new Set<ConcernDomain>([
    ...retrieval.matchedDomains,
    ...(scenario?.domains ?? []),
  ]);
  const domains = [...allDomains];

  // ─── Required Sections ───────────────────────────────────────────────────

  const requiredSections: string[] = [];

  if (urgency === "critical") {
    requiredSections.push("What to do RIGHT NOW (numbered steps)");
    requiredSections.push("Call 911 — when and why");
  } else if (urgency === "urgent") {
    requiredSections.push("What may be happening");
    requiredSections.push("What to do now (specific steps)");
    requiredSections.push("When to call hospice now");
  } else {
    requiredSections.push("What may be happening");
    requiredSections.push("What to do now");
    requiredSections.push("What to watch for");
  }

  if (domains.includes("dying_process") || journeyStage === "days" || journeyStage === "hours") {
    requiredSections.push("What to expect — what you may see");
    requiredSections.push("How to support the room");
  }
  if (domains.includes("time_of_death") || journeyStage === "at_death") {
    requiredSections.push("What to do first after death");
    requiredSections.push("Who to call and when");
  }
  if (domains.includes("after_death")) {
    requiredSections.push("What happens next — practical steps");
  }
  if (domains.includes("grief_bereavement")) {
    requiredSections.push("What you may be feeling — and why it's okay");
    requiredSections.push("When to seek bereavement support");
  }
  if (domains.includes("care_gap")) {
    requiredSections.push("What good support should look like");
    requiredSections.push("What to ask for — exact language");
    requiredSections.push("What to document");
  }
  if (domains.includes("communication_coaching")) {
    requiredSections.push("What to say — exact language");
    requiredSections.push("Reporting structure (SBAR if calling hospice)");
  }
  if (domains.includes("caregiver_support")) {
    requiredSections.push("How to get through tonight");
    requiredSections.push("What support is available");
  }
  if (isMiddleOfNight()) {
    requiredSections.push("How to get through tonight");
    if (!requiredSections.includes("When to call hospice now")) {
      requiredSections.push("When to call hospice now");
    }
  }

  // ─── Must Say / Must Avoid ────────────────────────────────────────────────

  const mustSay: string[] = [];
  const mustAvoid: string[] = [];

  mustAvoid.push(
    "Vague reassurance without a plan",
    "Implying hospice always provides adequate care without question",
    "Cold clinical language when the person is clearly distressed",
    "Optimistic minimizing of serious symptoms",
    "Saying 'this is normal' without explaining what that means and what to do",
  );

  if (call911Now) {
    mustSay.push("Call 911 NOW — exact instructions");
  }
  if (escalateNow) {
    mustSay.push("Call hospice NOW — exact instructions");
  }
  if (careGapTypes.length > 0) {
    mustSay.push("Name what good care should have looked like");
    mustSay.push("Give exact language to use with hospice");
    mustAvoid.push("Defending hospice when a clear care gap exists");
  }
  if (journeyStage === "at_death") {
    mustSay.push("You do not need to rush — take the time you need");
    mustSay.push("Call hospice first, not 911, with DNR in place");
    mustAvoid.push("Rushing the family through the post-death steps");
  }
  if (journeyStage === "days" || journeyStage === "hours") {
    mustSay.push("Hearing is often the last sense to go — keep talking to them");
    mustSay.push("This is a natural process — what you are seeing is expected");
  }
  if (audienceStyle === "grieving") {
    mustSay.push("Name their grief directly — do not route around it");
    mustAvoid.push("Rushing to clinical information before emotional acknowledgment");
  }
  if (role === "patient") {
    mustSay.push("Address the patient directly, not as if they are not present");
    mustAvoid.push("Speaking about 'the patient' in third person if addressing a patient");
  }
  if (domains.includes("dying_process")) {
    mustSay.push("Reassure family that what they are seeing is expected and not painful to the patient");
    mustAvoid.push("Describing dying signs in clinical language that sounds cold or frightening");
  }

  // ─── Suggested Follow-ups ────────────────────────────────────────────────

  const suggestedFollowUps: string[] = [];

  if (domains.includes("dying_process")) {
    suggestedFollowUps.push("What will happen in the final hours?", "How do I know when death has occurred?");
  }
  if (domains.includes("symptom_management")) {
    suggestedFollowUps.push("When should I call the hospice nurse about this?", "What can I do at home right now to help?");
  }
  if (domains.includes("care_gap")) {
    suggestedFollowUps.push("What should I document from this situation?", "Who do I escalate to if this doesn't improve?");
  }
  if (domains.includes("grief_bereavement")) {
    suggestedFollowUps.push("Where can I get bereavement support?", "How do I help other family members through this?");
  }
  if (domains.includes("after_death")) {
    suggestedFollowUps.push("What happens with the equipment and medications?", "When will hospice contact us about bereavement support?");
  }

  // ─── Communication Mode ───────────────────────────────────────────────────

  const playbook = getPlaybookForRole(role);
  const communicationMode = playbook
    ? `${playbook.tone} — Goal: ${playbook.goal}`
    : "Warm, steady, and practical. Always emotion before information.";

  // ─── Disease context ─────────────────────────────────────────────────────

  const disease = findDiseaseTrajectory(combinedText);
  const dyingPhase = getDyingPhase(journeyStage);

  // ─── Build injected knowledge package ────────────────────────────────────

  const knowledgeSections: string[] = [];

  knowledgeSections.push(
    `RESPONSE PLAN INTELLIGENCE PACKAGE`,
    `══════════════════════════════════`,
    `Role detected: ${role}`,
    `Journey stage: ${journeyStage}`,
    `Urgency level: ${urgency}`,
    `Audience style: ${audienceStyle}`,
    `${getResponseLengthGuidance(audienceStyle, urgency)}`,
    ``,
  );

  if (call911Now) {
    knowledgeSections.push(
      `⚠️ HARD STOP — CALL 911 NOW`,
      `The following red flags were detected: ${redFlags.filter(rf => rf.urgency === "call_911").map(rf => rf.signal).join(", ")}`,
      `Lead your response with clear 911 instruction before anything else.`,
      ``,
    );
  } else if (escalateNow) {
    knowledgeSections.push(
      `⚠️ URGENT — CALL HOSPICE NOW`,
      `This situation requires immediate hospice contact.`,
      `Lead with clear instruction to call the hospice 24/7 line.`,
      ``,
    );
  }

  if (careGapTypes.length > 0) {
    knowledgeSections.push(
      `CARE GAP SIGNALS DETECTED: ${careGapTypes.join(", ")}`,
      `The person may be experiencing inadequate hospice support. Name this directly if appropriate.`,
      `Help them understand what good support should look like and give them exact language to use.`,
      ``,
    );
  }

  if (scenario) {
    knowledgeSections.push(
      `MATCHED SCENARIO: ${scenario.label}`,
      ``,
    );
  }

  if (disease) {
    knowledgeSections.push(
      `DISEASE TRAJECTORY CONTEXT — ${disease.diagnosis.toUpperCase()}`,
      `Late phase: ${disease.latePhase}`,
      `Final phase: ${disease.finalPhase}`,
      `Key family prep points: ${disease.familyPrepPoints.join("; ")}`,
      ``,
    );
  }

  if (dyingPhase && journeyStage !== "unknown") {
    knowledgeSections.push(
      `DYING PROCESS PHASE — ${dyingPhase.phase.toUpperCase()}`,
      `What family may see: ${dyingPhase.whatFamilyMaySee}`,
      `What to do: ${dyingPhase.whatToDo}`,
      `What NOT to do: ${dyingPhase.whatNotToDo}`,
      ``,
    );
  }

  const formattedBlocks = formatBlocksForPrompt(retrieval.blocks);
  if (formattedBlocks) {
    knowledgeSections.push(
      `RETRIEVED KNOWLEDGE BLOCKS (use these as primary grounding)`,
      `─────────────────────────────────────────────────────────────`,
      formattedBlocks,
      ``,
    );
  }

  if (requiredSections.length > 0) {
    knowledgeSections.push(
      `REQUIRED RESPONSE SECTIONS (address these specifically)`,
      requiredSections.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      ``,
    );
  }

  if (mustSay.length > 0) {
    knowledgeSections.push(
      `MUST SAY (include these)`,
      mustSay.map((s) => `• ${s}`).join("\n"),
      ``,
    );
  }

  if (mustAvoid.length > 0) {
    knowledgeSections.push(
      `MUST AVOID (do not do these)`,
      mustAvoid.map((s) => `• ${s}`).join("\n"),
      ``,
    );
  }

  if (communicationMode) {
    knowledgeSections.push(
      `COMMUNICATION MODE: ${communicationMode}`,
    );
  }

  return {
    role,
    journeyStage,
    urgency,
    audienceStyle,
    domains,
    matchedScenario: scenario?.scenarioId ?? null,
    retrievedBlockIds: retrieval.blocks.map((b) => b.id),
    careGapSignals: careGapTypes,
    communicationMode,
    requiredSections,
    mustSay,
    mustAvoid,
    suggestedFollowUps,
    escalateNow,
    call911Now,
    injectedKnowledge: knowledgeSections.join("\n"),
  };
}
