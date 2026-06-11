import {
  GuidanceCategoryId,
  GuidanceCategory,
  GuidanceContentItem,
  GuidanceGovernance,
  GuidanceScenario,
  GuidanceStage,
} from "./types";

// ─── Default governance ──────────────────────────────────────────────────────
// Owner is assigned per-category via getOwnerForCategory below.
const DEFAULT_GOVERNANCE: GuidanceGovernance = {
  owner: "Care Coordination Team",
  reviewDate: null,
  approved: true,
  version: "1.0.0",
  sourceType: "clinical_editorial",
};

// Map each guidance category to the clinical team responsible for its content.
function getOwnerForCategory(categoryId: GuidanceCategoryId): string {
  switch (categoryId) {
    case "symptoms":
    case "medications":
      return "Symptom Management Team";
    case "emotional":
    case "advocacy":
      return "Communication & Family Team";
    case "end-of-life":
      return "End-of-Life Care Team";
    case "caregiving":
    case "equipment":
    case "hospice-services":
    case "unsure":
    default:
      return "Care Coordination Team";
  }
}

// Helper: assign appropriate stages by category
function getStagesForCategory(categoryId: GuidanceCategoryId): GuidanceStage[] {
  switch (categoryId) {
    case "symptoms":
    case "caregiving":
    case "medications":
    case "equipment":
    case "emotional":
    case "end-of-life":
      return ["during", "after"];
    case "hospice-services":
      return ["before", "during"];
    case "advocacy":
      return ["before", "during", "after"];
    case "unsure":
    default:
      return ["before", "during", "after"];
  }
}

// ─── Raw scenario arrays ─────────────────────────────────────────────────────
// Content is preserved exactly as authored. Do not edit copy here — submit a
// governance review request and update the reviewDate in the item's governance.

const symptoms: GuidanceScenario[] = [
  {
    id: "breathing-changes",
    categoryId: "symptoms",
    title: "Breathing Changes",
    subtitle: "Labored breathing, gasping, noisy breaths, or long pauses",
    urgencyLevel: "immediate",
    icon: "wind",
    tags: ["breathing", "gasping", "wet breathing", "noisy", "rattling", "apnea", "stops breathing", "labored"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Breathing that sounds wet, bubbly, or rattling",
      "Long pauses between breaths (10–60 seconds)",
      "Very fast or very slow breathing",
      "Mouth open, chin moving up and down",
      "Bluish color around lips or fingertips",
      "Nostrils flaring, shoulders lifting with each breath",
    ],
    whatItMeans:
      "Breathing changes are common in hospice and do not always mean the person is in distress. The wet or rattling sound (sometimes called the 'death rattle') is caused by secretions in the throat — it sounds harder than it feels. Long pauses in breathing are a normal sign as the body slows down. These changes often mean death may be close.",
    whatToDoNow: [
      { text: "Stay calm and stay with your loved one. Your presence is the most important thing." },
      { text: "Gently reposition them on their side to help secretions drain — this can reduce the rattling sound." },
      { text: "Keep the mouth moist using a small damp swab or lip balm." },
      { text: "Use a fan aimed gently near (not directly at) the face — moving air can ease the feeling of breathlessness." },
      { text: "If oxygen is being used, keep it in place as directed by hospice." },
      { text: "Speak softly and reassure them — hearing is often the last sense to go." },
      { text: "Contact hospice — they can provide medications such as morphine or lorazepam that effectively ease breathing discomfort." },
    ],
    whatToAvoid: [
      "Do not suction secretions unless hospice has specifically trained and instructed you to do so",
      "Do not prop them straight upright — this can make breathing harder",
      "Do not withhold reassurance — speak gently even if you think they cannot hear you",
      "Do not call 911 unless hospice directs you to",
    ],
    whenToCallHospice: [
      "Breathing changes happen suddenly or you are frightened",
      "You feel the person may be in distress or pain",
      "You need medication delivered for comfort",
      "You have any concern and want guidance",
    ],
    whatHappensNext:
      "Hospice will guide you through this by phone or send a nurse. They can authorize comfort medications and support you in real time. Breathing changes often stabilize for a period or may signal that death is nearing — either way, hospice will help you know what to expect.",
  },
  {
    id: "pain-worsening",
    categoryId: "symptoms",
    title: "Worsening Pain",
    subtitle: "Pain that is harder to control or not responding to medication",
    urgencyLevel: "immediate",
    icon: "alert-circle",
    tags: ["pain", "hurting", "moaning", "grimacing", "uncomfortable", "distress", "suffering"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Moaning, groaning, or crying out",
      "Facial grimacing or furrowed brow",
      "Guarding a part of the body (holding, tensing)",
      "Restlessness that does not respond to comfort",
      "Refusing to move or be touched",
      "Saying 'it hurts' or 'please stop'",
    ],
    whatItMeans:
      "Pain in hospice can be managed well. If pain seems to be breaking through, it may mean that the current medication dose needs adjustment, that the medication schedule needs to change, or that a new type of discomfort is present. You do not have to wait for a scheduled dose if your loved one is in distress.",
    whatToDoNow: [
      { text: "Give the prescribed breakthrough pain medication if available — this is what it is for. Check the label for how much and how often." },
      { text: "Reposition them gently — sometimes a small change in position brings significant relief." },
      { text: "Apply warmth (warm blanket, heating pad on low) to the area if appropriate." },
      { text: "Speak calmly and reassure them that help is coming." },
      { text: "Call hospice — they can adjust the medication plan immediately." },
    ],
    whatToAvoid: [
      "Do not delay giving breakthrough medication if it is available and ordered",
      "Do not give more than the prescribed dose even if the pain seems severe — call hospice instead",
      "Do not assume the pain is untreatable — it almost always can be managed better",
      "Do not wait and see if it improves on its own — comfort is the priority",
    ],
    whenToCallHospice: [
      "Pain is not controlled with current medications",
      "You are unsure how much breakthrough medication to give",
      "Pain seems to be in a new location",
      "The person appears distressed and you need help",
    ],
    whatHappensNext:
      "Hospice will review the medication plan and can often adjust doses or add medications within hours. They may also send a nurse to assess directly. Good pain control in hospice is achievable — call so they can help.",
  },
  {
    id: "agitation-restlessness",
    categoryId: "symptoms",
    title: "Agitation or Restlessness",
    subtitle: "Picking at the air, pulling at sheets, or seeming very unsettled",
    urgencyLevel: "immediate",
    icon: "activity",
    tags: ["agitation", "restless", "picking", "pulling", "thrashing", "terminal restlessness", "confused movement", "anxious"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Picking at clothing, tubing, or the air",
      "Pulling at bed sheets or trying to get out of bed",
      "Moaning or calling out repeatedly",
      "Legs moving constantly, unable to stay still",
      "Appearing frightened or distressed",
      "Confusion combined with physical restlessness",
    ],
    whatItMeans:
      "Terminal restlessness is a common experience in the final days of life. It can be caused by pain, urinary retention, constipation, medication changes, or the dying process itself. It is not a sign of emotional suffering in the way we imagine — but it should be treated, because comfort medications work very well.",
    whatToDoNow: [
      { text: "Stay calm — your calm presence helps." },
      { text: "Speak softly. Use their name. Say simple, reassuring things." },
      { text: "Check for basic discomfort: Is their bladder full? Are they constipated? Are they too hot or cold?" },
      { text: "Gently hold their hand or place a hand on their arm if they find it comforting." },
      { text: "Dim the lights and reduce noise in the room." },
      { text: "Call hospice — they can order medications specifically for terminal restlessness that work quickly." },
    ],
    whatToAvoid: [
      "Do not restrain their arms or legs — this increases distress",
      "Do not argue with them or try to correct confused statements",
      "Do not leave them alone for extended periods",
      "Do not wait more than an hour without calling hospice if medications are not helping",
    ],
    whenToCallHospice: [
      "Restlessness is new or sudden",
      "Comfort measures at home are not helping",
      "You are worried about their safety or yours",
      "You want medication ordered to help them rest",
    ],
    whatHappensNext:
      "Hospice will typically recommend or send medications such as haloperidol or lorazepam that are very effective for terminal restlessness. A nurse may come to assess and administer them. Most people settle within a short time with appropriate treatment.",
  },
  {
    id: "confusion-delirium",
    categoryId: "symptoms",
    title: "Confusion or Delirium",
    subtitle: "Not recognizing people, saying things that don't make sense",
    urgencyLevel: "soon",
    icon: "help-circle",
    tags: ["confused", "delirium", "not recognizing", "disoriented", "doesn't know where they are", "saying strange things", "talking to people not there"],
    whatYouMayNotice: [
      "Not knowing where they are or what day it is",
      "Not recognizing familiar people",
      "Saying things that don't make sense",
      "Talking to people who are not in the room",
      "Alternating between calm and agitated",
      "Asking the same question over and over",
    ],
    whatItMeans:
      "Confusion is very common in late-stage illness and may be caused by the illness itself, medications, dehydration, infection, constipation, or the dying process. In the final days, a form of confusion called 'terminal delirium' is normal. Most of the time, you cannot reverse this — but you can keep them comfortable and safe.",
    whatToDoNow: [
      { text: "Speak slowly, clearly, and calmly. Use their name." },
      { text: "Gently reorient them if it helps: 'You're at home, in your bedroom. I'm here with you.'" },
      { text: "Do not argue with confused statements — redirect gently instead." },
      { text: "Keep the environment calm — dim lights, low noise, familiar voices." },
      { text: "Ensure they are safe — put bed rails up if needed, clear fall hazards." },
      { text: "Call hospice if the confusion is new, sudden, or severe." },
    ],
    whatToAvoid: [
      "Do not argue or try to correct all confused statements — it increases distress",
      "Do not leave them alone if they are trying to get out of bed",
      "Do not introduce new people or stimulating environments",
      "Do not assume confusion means they cannot hear or feel your presence",
    ],
    whenToCallHospice: [
      "Confusion is sudden and new — it could have a treatable cause",
      "They are a danger to themselves due to confusion",
      "You are emotionally overwhelmed and need support",
      "You want to know if medication can help them rest",
    ],
    whatHappensNext:
      "Hospice will assess whether the confusion has a treatable cause. If it is part of the dying process, they will focus on keeping them comfortable and peaceful, and support you through this difficult time.",
  },
  {
    id: "hallucinations",
    categoryId: "symptoms",
    title: "Hallucinations or Visions",
    subtitle: "Seeing or talking to people or things that aren't there",
    urgencyLevel: "routine",
    icon: "eye",
    tags: ["hallucinations", "seeing things", "talking to dead relatives", "visions", "angels", "calling out to someone"],
    whatYouMayNotice: [
      "Reaching out to or talking to someone you cannot see",
      "Describing seeing deceased relatives or loved ones",
      "Looking upward and appearing peaceful",
      "Describing a place or journey",
      "Seeming comforted by what they are seeing",
    ],
    whatItMeans:
      "Near the end of life, it is very common for people to see or speak with deceased loved ones, describe beautiful places, or seem to be preparing for a journey. These experiences are well-documented and are generally comforting to the person, even if they are surprising to family. They are not a sign of psychosis or that something is wrong.",
    whatToDoNow: [
      { text: "Do not dismiss or correct the visions — enter their reality gently." },
      { text: "If they seem comforted, simply say 'That sounds peaceful' or 'I'm here with you.'" },
      { text: "If they seem distressed, hold their hand, speak softly, and call hospice." },
      { text: "Write down what they say if you would like to remember it — many families find these moments meaningful." },
    ],
    whatToAvoid: [
      "Do not tell them 'there's no one there' or that they are imagining things",
      "Do not express alarm in front of them — keep your voice calm",
      "Do not call 911 for peaceful visions",
    ],
    whenToCallHospice: [
      "The visions seem to be causing fear or distress",
      "The person is trying to get up or leave because of what they are seeing",
      "You are worried and want reassurance",
    ],
    whatHappensNext:
      "If distressing, hospice can provide gentle medications to reduce frightening hallucinations while preserving peaceful ones. Many families find these experiences to be a meaningful part of the dying process.",
  },
  {
    id: "swallowing-difficulty",
    categoryId: "symptoms",
    title: "Swallowing Problems",
    subtitle: "Choking, coughing during eating, or refusing to swallow",
    urgencyLevel: "soon",
    icon: "coffee",
    tags: ["swallowing", "choking", "coughing when eating", "refusing food", "can't swallow", "aspirating", "gurgling after eating"],
    whatYouMayNotice: [
      "Coughing or choking during eating or drinking",
      "Gurgling sound in the throat after swallowing",
      "Food or liquid coming out of the mouth or nose",
      "Taking a very long time to swallow",
      "Refusing food or drink",
      "Wet or gurgly voice after eating",
    ],
    whatItMeans:
      "Swallowing difficulty (dysphagia) is common in late illness and can happen because of weakness, neurological changes, or the dying process. When swallowing is unsafe, food and liquid can enter the airway instead of the stomach (aspiration), causing coughing or pneumonia. Decreased interest in food and difficulty swallowing are natural parts of dying — the body is slowing down.",
    whatToDoNow: [
      { text: "Stop the meal or drink immediately if choking occurs." },
      { text: "Sit the person upright at 90 degrees during and for 30 minutes after any eating or drinking." },
      { text: "Thicken liquids if hospice has recommended this — water can be more dangerous than thickened drinks." },
      { text: "Offer small amounts — a teaspoon at a time — and wait for a full swallow before offering more." },
      { text: "Focus on pleasure, not nutrition. A few bites of a favorite food is meaningful even if intake is small." },
      { text: "Keep the mouth moist with small sips, ice chips, or wet swabs even when eating stops." },
    ],
    whatToAvoid: [
      "Do not force food or drink if swallowing is unsafe",
      "Do not use straws — they can speed liquid into the airway",
      "Do not offer thin liquids (water, juice) without hospice guidance if choking is occurring",
      "Do not feel that stopping food means you are giving up — it is a compassionate choice",
    ],
    whenToCallHospice: [
      "Swallowing problems are new or suddenly worse",
      "You are concerned about aspiration or pneumonia",
      "Medications are hard to swallow",
      "You need guidance on what is safe to offer",
    ],
    whatHappensNext:
      "Hospice will advise on safe textures and consistencies, and help transition medications to liquid or sublingual forms. As the person nears the end of life, decreasing appetite and swallowing ability are natural — hospice will help you make this transition with compassion.",
  },
  {
    id: "nausea-vomiting",
    categoryId: "symptoms",
    title: "Nausea or Vomiting",
    subtitle: "Feeling sick to the stomach or vomiting",
    urgencyLevel: "soon",
    icon: "frown",
    tags: ["nausea", "vomiting", "sick to stomach", "throwing up", "queasy", "not keeping food down"],
    whatYouMayNotice: [
      "Complaints of nausea or stomach upset",
      "Loss of interest in food",
      "Vomiting one or more times",
      "Pale skin or sweating with nausea",
      "Retching without producing vomit",
    ],
    whatItMeans:
      "Nausea in hospice can be caused by medications (especially opioids), constipation, illness progression, anxiety, or other factors. It is almost always treatable. If vomiting is severe or ongoing, it needs hospice attention.",
    whatToDoNow: [
      { text: "Keep them upright or slightly reclined — lying flat can worsen nausea." },
      { text: "Offer small sips of clear liquids — ginger ale, broth, or water." },
      { text: "Remove strong food smells from the room." },
      { text: "Use a cool, damp cloth on the forehead or back of the neck." },
      { text: "Check if an anti-nausea medication has been prescribed — give it as directed." },
      { text: "Call hospice if vomiting is severe or preventing medication from being kept down." },
    ],
    whatToAvoid: [
      "Do not offer large meals — small frequent amounts are better",
      "Do not offer strong-smelling or greasy foods",
      "Do not give oral medications right after vomiting — call hospice for alternatives",
    ],
    whenToCallHospice: [
      "Vomiting is severe or happening more than twice",
      "Medications cannot be kept down",
      "The person is showing signs of dehydration (dry mouth, no urine)",
      "Nausea is not improving with current treatment",
    ],
    whatHappensNext:
      "Hospice can prescribe very effective anti-nausea medications in different forms (dissolving tablets, suppositories, or patches) so that swallowing a pill is not required. Call and let them know what is happening.",
  },
  {
    id: "pain-management",
    categoryId: "symptoms",
    title: "Pain Not Well Controlled",
    subtitle: "Pain that keeps coming back or is not fully relieved",
    urgencyLevel: "soon",
    icon: "thermometer",
    tags: ["pain", "hurts", "aching", "not enough medication", "breakthrough pain"],
    whatYouMayNotice: [
      "Person saying pain returns before the next dose is due",
      "Person grimacing or tensing between medication doses",
      "Pain rating consistently above their comfort level",
      "Increasing need for breakthrough doses",
    ],
    whatItMeans:
      "When pain consistently returns before the next scheduled dose, it usually means the regular dose needs to be adjusted — not that the medication isn't working. This is a common and very manageable situation. Hospice adjusts medication plans regularly.",
    whatToDoNow: [
      { text: "Document when pain returns relative to the last dose — this helps hospice adjust the schedule." },
      { text: "Use breakthrough doses as prescribed when pain returns." },
      { text: "Call hospice to report the pattern — they will adjust the plan." },
      { text: "Use non-medication comfort: repositioning, warmth, distraction, calm environment." },
    ],
    whatToAvoid: [
      "Do not delay calling hospice about uncontrolled pain — it is always a priority",
      "Do not give extra doses beyond what is prescribed without calling first",
      "Do not assume this is 'the best it can be' — pain control can almost always be improved",
    ],
    whenToCallHospice: [
      "Pain returns before the next scheduled dose regularly",
      "Breakthrough medication is needed more than the allowed frequency",
      "Pain is not responding to current medications",
    ],
    whatHappensNext:
      "Hospice will review and adjust the medication regimen. This often means increasing the scheduled dose, changing the frequency, or adding a medication that works differently. Good pain control is achievable.",
  },
  {
    id: "decreased-appetite",
    categoryId: "symptoms",
    title: "Decreased Appetite",
    subtitle: "Eating very little or refusing food and drink",
    urgencyLevel: "routine",
    icon: "minus-circle",
    tags: ["not eating", "won't eat", "refusing food", "appetite loss", "not hungry", "not drinking"],
    whatYouMayNotice: [
      "Taking only a few bites where they used to eat full meals",
      "Saying they are not hungry even for favorite foods",
      "Refusing to eat altogether",
      "Drinking less than usual",
      "No longer interested in mealtimes",
    ],
    whatItMeans:
      "Decreased appetite is one of the most natural signs that the body is slowing down. As the body approaches the end of life, it no longer needs nutrition the way it once did. This is not starvation — it is a natural transition. Forcing food can actually cause discomfort. The goal shifts to comfort and pleasure, not calories.",
    whatToDoNow: [
      { text: "Offer very small amounts of favorite foods — a spoonful of ice cream or a sip of juice is meaningful." },
      { text: "Let them guide what and how much they want — do not pressure." },
      { text: "Keep the mouth moist with wet swabs, a damp cloth, or lip balm even when eating stops." },
      { text: "Sit with them at mealtime for connection, even if they do not eat." },
      { text: "Talk to hospice or a social worker if you feel distressed about not being able to feed them — this is very common." },
    ],
    whatToAvoid: [
      "Do not force or pressure eating — it causes discomfort and conflict",
      "Do not interpret the refusal of food as giving up — it is the body's natural wisdom",
      "Do not use feeding tubes unless specifically discussed and decided with the care team",
    ],
    whenToCallHospice: [
      "You are very distressed about not being able to feed your loved one",
      "The person is uncomfortable and you think it might be related to hunger",
      "You want guidance on keeping the mouth comfortable",
    ],
    whatHappensNext:
      "Hospice will help you understand this process and provide guidance on mouth care and comfort. Many families find that once they understand this is natural, the distress decreases. Hospice social workers and chaplains can provide emotional support around this transition.",
  },
  {
    id: "skin-breakdown",
    categoryId: "symptoms",
    title: "Skin Breakdown or Pressure Sores",
    subtitle: "Red areas, open skin, or wounds from pressure",
    urgencyLevel: "soon",
    icon: "alert-triangle",
    tags: ["bed sore", "pressure sore", "pressure ulcer", "skin breakdown", "wound", "red skin", "open sore"],
    whatYouMayNotice: [
      "Red or darkened areas on skin, especially over bony areas (tailbone, heels, hips)",
      "Skin that looks broken, blistered, or open",
      "Skin that appears shiny, dry, or cracked",
      "Person reacting with pain when area is touched",
      "A wound that was there before getting worse",
    ],
    whatItMeans:
      "When someone is spending most of their time in bed or a chair, pressure on certain areas can reduce blood flow and damage skin. This is a common challenge in hospice. Prevention is much easier than treatment. If skin is already broken, hospice needs to assess and guide wound care.",
    whatToDoNow: [
      { text: "Reposition the person every 2 hours if possible — side to side, or use pillows to shift pressure." },
      { text: "Place pillows under heels to lift them off the mattress." },
      { text: "Keep skin clean and dry — moisture from incontinence dramatically increases risk." },
      { text: "Apply barrier cream or moisture barrier to areas exposed to moisture." },
      { text: "Do not massage red areas — this can cause more damage." },
      { text: "Call hospice so they can assess and recommend wound care supplies." },
    ],
    whatToAvoid: [
      "Do not massage reddened areas — it damages fragile tissue",
      "Do not use donut-shaped rings or inflatable cushions — they increase pressure on surrounding areas",
      "Do not leave moisture (urine, sweat) on skin for extended periods",
      "Do not apply tape directly to fragile skin",
    ],
    whenToCallHospice: [
      "New skin breakdown appears",
      "An existing wound looks worse or has a new smell",
      "You need wound care supplies or instruction",
      "Repositioning is not possible and you need help",
    ],
    whatHappensNext:
      "Hospice will assess the wound and recommend appropriate dressings and care routines. They can order wound care supplies and have the nurse demonstrate proper care. In late-stage illness, some skin changes are unavoidable — hospice will help you focus on comfort and prevention.",
  },
  {
    id: "approaching-death",
    categoryId: "symptoms",
    title: "Signs That Death May Be Near",
    subtitle: "Physical changes that may signal the final hours or days",
    urgencyLevel: "immediate",
    icon: "sunset",
    tags: ["dying", "death approaching", "mottling", "cold hands", "not responsive", "hours to live", "actively dying", "last stage"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Mottled or blotchy purplish-blue skin, especially on legs and feet",
      "Hands and feet becoming very cold, while body remains warm",
      "Very long pauses between breaths (more than 10–15 seconds)",
      "Eyes partially open, glassy, or not focusing",
      "Jaw relaxing open",
      "No response to voice or touch, or very minimal response",
      "Dramatic decrease in urine output",
      "Changes in skin color — very pale, gray, or yellowish",
    ],
    whatItMeans:
      "These signs tell us that the body is shutting down and death may be hours to days away. This is a natural process, not a medical emergency. The person is usually not in pain or distress during this time. Your presence and calm voice are still meaningful — hearing often remains until the very end.",
    whatToDoNow: [
      { text: "Call hospice to let them know — they will guide you and may send a nurse." },
      { text: "Call family members who wish to be present so they have time to come." },
      { text: "Stay with your loved one. Sit close, hold their hand, speak softly." },
      { text: "Play soft music or read aloud if that feels meaningful." },
      { text: "Keep the room comfortable — not too warm or cold." },
      { text: "Continue mouth care — keep lips moist." },
      { text: "It is okay to leave the room for short periods. Death sometimes occurs when a caregiver steps away — this is common and is not your fault." },
    ],
    whatToAvoid: [
      "Do not call 911 unless hospice tells you to — emergency services are trained to resuscitate, which is not the goal of hospice",
      "Do not try to force water or food",
      "Do not leave the phone far away",
      "Do not feel you must be silent — talking to them is loving, not disturbing",
    ],
    whenToCallHospice: [
      "You notice any of these signs — call right away",
      "You want guidance on what to expect",
      "You want a nurse to come and be present",
      "At any time you feel afraid or uncertain",
    ],
    whatHappensNext:
      "Hospice will stay in close contact, may send a nurse, and will guide you through this time. After death, hospice will tell you exactly what steps to take. You do not need to rush — take the time you need with your loved one.",
  },
  {
    id: "constipation",
    categoryId: "symptoms",
    title: "Constipation",
    subtitle: "No bowel movement in several days, straining, or discomfort",
    urgencyLevel: "soon",
    icon: "alert-triangle",
    tags: ["constipation", "no bowel movement", "straining", "hard stool", "not going to bathroom", "opioid constipation"],
    whatYouMayNotice: [
      "No bowel movement in 3 or more days",
      "Straining or pain with attempts to have a bowel movement",
      "Hard, dry stools",
      "Bloating, stomach cramping, or distension",
      "Nausea or decreased appetite related to constipation",
      "Restlessness or agitation (constipation can cause discomfort even when it's hard to identify)",
    ],
    whatItMeans:
      "Constipation is one of the most common and preventable problems in hospice. Pain medications (opioids) almost always cause constipation, and this does not improve on its own without a bowel regimen. Untreated constipation can cause significant discomfort, agitation, and even confusion. It is very treatable.",
    whatToDoNow: [
      { text: "Check: when was the last bowel movement? More than 3 days without one needs attention.", tip: "Keep a simple log — even a note on your phone helps hospice help you." },
      { text: "Ensure a stool softener and/or laxative is in place — hospice should have ordered this with any opioid. Call if not." },
      { text: "Encourage fluid intake if swallowing is safe — even small sips help." },
      { text: "Warm liquids (tea, warm water) can help stimulate bowel activity." },
      { text: "Gentle movement if possible — even sitting up in a chair helps." },
      { text: "Call hospice if no bowel movement in 3+ days, if there is significant pain, or if the abdomen feels very hard or bloated." },
    ],
    whatToAvoid: [
      "Do not assume constipation will resolve without intervention when someone is on opioids — it will not",
      "Do not use enemas without hospice guidance",
      "Do not ignore new abdominal pain or hardness — these need assessment",
    ],
    whenToCallHospice: [
      "No bowel movement in 3 or more days",
      "Significant abdominal pain, distension, or bloating",
      "Person is very uncomfortable or restless and constipation may be the cause",
      "Current medications are not working",
    ],
    whatHappensNext:
      "Hospice will review the bowel regimen and can order more effective interventions if needed. Constipation is almost always resolvable with appropriate treatment, and preventing it is a core part of good hospice care.",
  },
  {
    id: "fever",
    categoryId: "symptoms",
    title: "Fever",
    subtitle: "High temperature or signs of infection",
    urgencyLevel: "soon",
    icon: "thermometer",
    tags: ["fever", "high temperature", "infection", "hot skin", "shaking", "chills", "temperature"],
    whatYouMayNotice: [
      "Skin that feels hot and dry, or sweaty",
      "Flushed face or cheeks",
      "Shaking or chills",
      "Increased confusion",
      "Faster breathing or heart rate",
      "Temperature above 100.4°F (38°C)",
    ],
    whatItMeans:
      "In hospice, fever may indicate an infection or may be part of the illness process itself. In the final stages of life, low-grade fevers can be a normal part of the body's changes. Whether or how aggressively to treat a fever depends on the goals of care — comfort is always the priority. Call hospice to discuss.",
    whatToDoNow: [
      { text: "Check temperature if a thermometer is available and the person can tolerate it." },
      { text: "Apply a cool, damp cloth to the forehead, back of the neck, or armpits — this brings comfort even when not aimed at reducing fever." },
      { text: "Offer cool fluids if swallowing is safe." },
      { text: "Use a light blanket or sheet rather than heavy covers." },
      { text: "Acetaminophen (Tylenol) can reduce fever and discomfort if hospice has approved its use — follow the label or hospice guidance." },
      { text: "Call hospice to report the fever and get guidance based on the specific situation.", caution: "Do not give aspirin or ibuprofen without checking with hospice." },
    ],
    whatToAvoid: [
      "Do not use cold baths or ice — these cause shivering which raises the body's heat production",
      "Do not give aspirin to adults in some conditions without checking — call hospice first",
      "Do not assume all fevers need aggressive treatment in hospice — comfort is the guide",
    ],
    whenToCallHospice: [
      "Temperature above 102°F (38.9°C)",
      "Person is very uncomfortable or the fever is not improving with comfort measures",
      "Confusion worsens significantly",
      "Anytime you are uncertain",
    ],
    whatHappensNext:
      "Hospice will help you determine whether the fever is treatable, whether treatment aligns with comfort goals, and what measures are most appropriate. In late-stage illness, some fevers are part of the dying process and comfort-focused care is the priority.",
  },
  {
    id: "fatigue-weakness",
    categoryId: "symptoms",
    title: "Extreme Fatigue or Weakness",
    subtitle: "Sleeping most of the time, unable to lift arms or legs",
    urgencyLevel: "routine",
    icon: "battery",
    tags: ["fatigue", "tired", "weakness", "sleeping all day", "can't lift arms", "can't move legs", "exhausted", "sleeping a lot"],
    whatYouMayNotice: [
      "Sleeping most of the day and night",
      "Difficulty holding a cup, lifting arms, or turning independently",
      "Speaking only briefly and then sleeping again",
      "Eyes closing mid-conversation",
      "Much less engagement than usual",
    ],
    whatItMeans:
      "Progressive fatigue and weakness is one of the most predictable parts of serious illness. As the body's energy reserves decline, sleep becomes the default state. This is not laziness or giving up — it is the body conserving resources. The amount of time a person sleeps often increases significantly in the final weeks and days. Your presence during these quiet times still matters.",
    whatToDoNow: [
      { text: "Allow rest without interruption — do not try to keep them awake." },
      { text: "Schedule important conversations, visits, or activities during natural alert periods.", tip: "Many people are most alert in the mornings — plan meaningful time then." },
      { text: "Keep the environment calm and quiet — the senses remain sensitive even when asleep." },
      { text: "Speak softly when they are asleep — your voice may still bring comfort." },
      { text: "Ensure comfort during long periods of rest — reposition every 1–2 hours, provide mouth care, keep skin clean and dry." },
      { text: "Use this time to care for yourself — rest, eat, and reach out for support." },
    ],
    whatToAvoid: [
      "Do not try to wake them frequently to eat or drink",
      "Do not interpret increased sleep as a sign that they are suffering",
      "Do not have loud or distressing conversations in the room while they sleep",
    ],
    whenToCallHospice: [
      "Sudden dramatic increase in sleeping over 24 hours",
      "Cannot be awakened at all",
      "You are uncertain whether this is normal",
    ],
    whatHappensNext:
      "Increasing sleep is a natural part of the dying process. Hospice will help you understand what is expected and guide you through this transition. It is also a signal to ensure that all meaningful conversations and connections have been made.",
  },
  {
    id: "urinary-changes",
    categoryId: "symptoms",
    title: "Urinary Changes",
    subtitle: "Decreased urine, dark urine, or urinary incontinence",
    urgencyLevel: "soon",
    icon: "droplet",
    tags: ["urine", "urinary", "no urine", "dark urine", "catheter", "incontinence", "not urinating"],
    whatYouMayNotice: [
      "Very little or no urine output for 12 or more hours",
      "Urine that is very dark, brown, or tea-colored",
      "Strong-smelling urine",
      "Urinary incontinence (leaking or accidents)",
      "Discomfort or agitation that may relate to a full bladder",
      "Catheter that is not draining well",
    ],
    whatItMeans:
      "Decreased urine output is a very common sign as the kidneys slow down in late illness. Very dark or tea-colored urine often signals dehydration or kidney changes. In the final days, urine may stop almost entirely as the body shuts down. If incontinence is new, good skin care and prompt brief changes are essential.",
    whatToDoNow: [
      { text: "Note how long it has been since any urine was produced." },
      { text: "Check for signs that a full bladder may be causing discomfort — lower abdominal firmness or restlessness." },
      { text: "For incontinence: keep skin clean and dry, apply barrier cream, change briefs promptly." },
      { text: "If a catheter is in place: check that the tubing is not kinked or blocked. Check that the collection bag is not too full.", tip: "Catheter bag should be emptied when about half to two-thirds full." },
      { text: "Call hospice if there is no urine for 12+ hours and the person seems uncomfortable, or if you suspect a blockage." },
    ],
    whatToAvoid: [
      "Do not push large amounts of fluid if the kidneys are failing — it does not help and may cause discomfort",
      "Do not leave a person in a soiled brief — skin breaks down rapidly",
      "Do not attempt to insert or replace a catheter without training",
    ],
    whenToCallHospice: [
      "No urine in 12 or more hours with signs of discomfort",
      "Catheter appears blocked or has stopped draining",
      "New signs of urinary tract infection (foul odor, cloudy urine, agitation)",
      "You need guidance on catheter care",
    ],
    whatHappensNext:
      "Hospice will assess whether decreased urine is a natural part of the dying process or whether a catheter or other intervention might improve comfort. Near the end of life, cessation of urine is an expected change.",
  },
  {
    id: "swelling",
    categoryId: "symptoms",
    title: "Swelling (Edema)",
    subtitle: "Puffy legs, ankles, feet, or abdomen",
    urgencyLevel: "routine",
    icon: "alert-circle",
    tags: ["swelling", "edema", "puffy legs", "swollen ankles", "fluid", "abdomen swelling", "bloated"],
    whatYouMayNotice: [
      "Legs, ankles, or feet that are visibly swollen or puffy",
      "Skin that feels tight or shiny over swollen areas",
      "Shoes or socks that no longer fit",
      "A large, distended abdomen",
      "Pitting — when you press the skin and the indentation stays",
    ],
    whatItMeans:
      "Swelling (edema) occurs when the body retains fluid, which is common in serious illness due to heart, kidney, or liver changes, or low protein levels. In hospice, the goal is comfort rather than complete elimination of swelling. Some swelling cannot be reversed but its discomfort can be managed.",
    whatToDoNow: [
      { text: "Elevate swollen legs above the level of the heart when resting — use pillows under the calves and feet." },
      { text: "Keep skin over swollen areas clean, moisturized, and protected from pressure — swollen skin breaks down easily." },
      { text: "Use properly fitted, non-binding clothing and socks — avoid tight elastic." },
      { text: "Gentle repositioning to relieve pressure on swollen areas." },
      { text: "Report new or worsening swelling to hospice." },
    ],
    whatToAvoid: [
      "Do not massage severely swollen limbs without hospice guidance",
      "Do not apply compression stockings without hospice guidance — in some conditions these are harmful",
      "Do not restrict fluids on your own without hospice guidance",
    ],
    whenToCallHospice: [
      "Swelling is new, sudden, or rapidly worsening",
      "Skin over swollen areas appears broken, blistered, or weeping",
      "Swelling seems to be causing pain or significant discomfort",
    ],
    whatHappensNext:
      "Hospice will assess the cause and may consider gentle diuretic medications if they align with comfort goals. They will also advise on skin protection and positioning to prevent breakdown over swollen areas.",
  },
  {
    id: "bleeding",
    categoryId: "symptoms",
    title: "Bleeding",
    subtitle: "Any unexpected bleeding — mouth, nose, wound, or elsewhere",
    urgencyLevel: "immediate",
    icon: "alert-octagon",
    tags: ["bleeding", "blood", "hemorrhage", "blood in mouth", "nose bleed", "blood in urine", "blood from wound"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Blood from the mouth, nose, or a wound",
      "Blood in the urine or stool",
      "Unexplained bruising",
      "A wound that will not stop bleeding",
      "Coughing up blood",
    ],
    whatItMeans:
      "Bleeding in hospice can range from minor (small nosebleeds) to serious (active hemorrhage). In some illnesses, significant bleeding can occur near the end of life. Hospice teams prepare for this and have comfort measures and supplies to help. If large-scale bleeding occurs, call hospice immediately and focus on keeping the person calm.",
    whatToDoNow: [
      { text: "Stay calm — your calm presence helps the person you are caring for." },
      { text: "Call hospice immediately for any significant bleeding.", caution: "Do not wait to see if major bleeding stops on its own." },
      { text: "For minor nosebleeds: pinch the soft part of the nose, tilt head slightly forward, and apply gentle pressure for 10–15 minutes." },
      { text: "For wound bleeding: apply firm, gentle pressure with a clean cloth or gauze." },
      { text: "For large-scale or sudden bleeding: call hospice immediately. Dark-colored towels can minimize visual distress. Stay with the person." },
      { text: "Speak softly and reassuringly — do not show panic." },
    ],
    whatToAvoid: [
      "Do not leave the person alone during active bleeding",
      "Do not pack a nose bleed too deeply",
      "Do not give blood thinning medications (aspirin, ibuprofen) without checking with hospice",
    ],
    whenToCallHospice: [
      "Any significant bleeding that cannot be controlled with simple pressure",
      "Blood from the lungs, stomach, or rectum",
      "You are frightened or feel this may be a serious situation",
    ],
    whatHappensNext:
      "Hospice will guide you through the situation. For people at risk of significant bleeding, hospice will often prepare you in advance with a plan and comfort medications. After the event, a hospice nurse will follow up to provide support and assess next steps.",
  },
  {
    id: "seizures",
    categoryId: "symptoms",
    title: "Seizures",
    subtitle: "Shaking, stiffening, or uncontrolled movements",
    urgencyLevel: "immediate",
    icon: "zap",
    tags: ["seizure", "convulsion", "shaking", "stiffening", "jerking movements", "fell during seizure"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Sudden stiffening of the body",
      "Rhythmic jerking or shaking of arms, legs, or the whole body",
      "Eyes rolling back or staring blankly",
      "Loss of consciousness during the event",
      "Confusion, sleepiness, or weakness immediately after",
      "Brief whole-body stiffening followed by limpness",
    ],
    whatItMeans:
      "Seizures can occur in some illnesses affecting the brain or in the final stages of life. A first-time seizure always needs hospice contact. For people known to have seizures, hospice usually has a plan in place. Most seizures stop on their own within 1–3 minutes.",
    whatToDoNow: [
      { text: "Stay calm. Start timing the seizure so you can report it to hospice." },
      { text: "Protect from injury: move sharp or hard objects away. Do not restrain.", caution: "Never put anything in the person's mouth during a seizure." },
      { text: "If they are in bed: lower the side rails and leave them in place. If on the floor, cushion the head." },
      { text: "After the seizure stops: turn them onto their side to prevent choking on secretions." },
      { text: "Call hospice immediately after the seizure." },
      { text: "Stay with them while they recover — they may be confused and frightened." },
    ],
    whatToAvoid: [
      "Do not put anything in the mouth — this is a dangerous myth",
      "Do not restrain the person — you can cause injury",
      "Do not leave them alone",
      "Do not give water immediately after — wait until they are fully alert",
    ],
    whenToCallHospice: [
      "After any seizure — always call",
      "The seizure lasts more than 5 minutes — this is an emergency",
      "A second seizure occurs without full recovery between them",
      "The person does not regain consciousness after several minutes",
    ],
    whatHappensNext:
      "Hospice will assess the situation and may add anti-seizure medications to the comfort kit. If seizures are a known risk, they will help you prepare and know what to do. Most people are drowsy and confused after a seizure but recover to their baseline within 15–30 minutes.",
  },
];

const caregiving: GuidanceScenario[] = [
  {
    id: "bed-bath",
    categoryId: "caregiving",
    title: "Bed Bath",
    subtitle: "How to bathe someone in bed comfortably and safely",
    urgencyLevel: "routine",
    icon: "droplet",
    tags: ["bathing", "bed bath", "washing", "hygiene", "cleaning", "sponge bath"],
    whatYouMayNotice: [
      "Person needs bathing but cannot safely get to a tub or shower",
      "Skin has odor or areas need cleaning",
      "Person is spending most of their time in bed",
    ],
    whatItMeans:
      "A bed bath is a gentle way to keep someone clean and comfortable when they cannot get up. It also gives you time to check for skin changes. Many people find a warm bath very soothing.",
    whatToDoNow: [
      { text: "Gather supplies first: two basins (one soapy, one rinse), washcloths, towels, clean clothing or gown, and barrier cream." },
      { text: "Fill basins with comfortably warm (not hot) water. Test on your inner wrist." },
      { text: "Close doors and windows to keep the room warm." },
      { text: "Explain each step before you do it — even if they seem unaware." },
      { text: "Start with the face — use plain water, no soap. Gently wipe from inner to outer eye, then face." },
      { text: "Work from cleanest to least clean: face → arms → chest → abdomen → legs → back → perineal area last." },
      { text: "Cover areas not being washed with a dry towel for warmth and dignity." },
      { text: "Rinse each area well — soap residue can irritate skin." },
      { text: "Pat dry — do not rub. Apply lotion or barrier cream where needed." },
      { text: "Change linens if soiled. Roll the person to one side to change the bottom sheet." },
    ],
    whatToAvoid: [
      "Do not use water that is too hot — skin in illness is fragile",
      "Do not rush — calm and gentle is the priority",
      "Do not scrub fragile or broken skin",
      "Do not leave them uncovered and cold between steps",
    ],
    whenToCallHospice: [
      "You notice new skin breakdown, redness, or wounds during bathing",
      "The person becomes distressed during bathing and you are unsure why",
      "You need a demonstration from the hospice aide",
      "You need special supplies for wound care",
    ],
    whatHappensNext:
      "The hospice aide can demonstrate this technique and assist with bathing. This is exactly what they are trained to do — do not hesitate to ask them to show you step by step.",
  },
  {
    id: "repositioning",
    categoryId: "caregiving",
    title: "Repositioning in Bed",
    subtitle: "Safely turning or moving someone to prevent pressure sores",
    urgencyLevel: "routine",
    icon: "refresh-cw",
    tags: ["repositioning", "turning", "moving in bed", "pressure sore prevention", "side to side"],
    whatYouMayNotice: [
      "Person has been in the same position for more than 2 hours",
      "They are unable to move themselves",
      "Red areas forming on bony parts of the body",
    ],
    whatItMeans:
      "Repositioning every 1–2 hours is one of the most important ways to prevent pressure sores. It also helps with breathing and overall comfort. The goal is to change the pressure points on the body.",
    whatToDoNow: [
      { text: "Raise the bed to a comfortable working height if possible (reduces back strain)." },
      { text: "Lower the head of the bed flat, or as flat as the person tolerates." },
      { text: "Stand on the side you are turning toward." },
      { text: "Gently cross their far arm over their chest and bend their far knee." },
      { text: "Place one hand on their shoulder and one on their hip — roll them toward you onto their side." },
      { text: "Place a pillow behind their back to keep them on their side." },
      { text: "Place a pillow between their knees to prevent hip discomfort." },
      { text: "Lift heels off the mattress using a pillow under the calves." },
      { text: "Make sure there are no wrinkles in sheets under them — wrinkles cause pressure." },
    ],
    whatToAvoid: [
      "Do not drag the person across the sheet — always lift or roll",
      "Do not leave them at an angle greater than 30 degrees on one side for too long",
      "Do not skip repositioning because they seem comfortable — pressure builds up silently",
      "Do not attempt to reposition alone if the person is heavy without a lift or assistance",
    ],
    whenToCallHospice: [
      "You are unable to reposition safely without injuring yourself or them",
      "New redness or skin breakdown appears",
      "You need a hospital bed or repositioning equipment",
      "You want the aide to demonstrate technique",
    ],
    whatHappensNext:
      "The hospice nurse or aide can demonstrate repositioning and recommend equipment like a draw sheet, repositioning wedges, or a specialized mattress. If repositioning is physically difficult, call and ask for help — this is a common request.",
  },
  {
    id: "mouth-care",
    categoryId: "caregiving",
    title: "Mouth Care",
    subtitle: "Keeping the mouth clean and comfortable",
    urgencyLevel: "routine",
    icon: "smile",
    tags: ["mouth care", "oral hygiene", "dry mouth", "teeth", "toothbrush", "swabs", "lips"],
    whatYouMayNotice: [
      "Dry or cracked lips",
      "Thick secretions or crusting in the mouth",
      "Odor from the mouth",
      "Person cannot brush their own teeth",
      "Person is no longer able to swallow safely",
    ],
    whatItMeans:
      "Mouth care is one of the most comforting things you can do. As eating and drinking decrease, the mouth can become very dry and uncomfortable. Regular gentle mouth care prevents infection, reduces odor, and brings real comfort.",
    whatToDoNow: [
      { text: "Use a soft toothbrush or foam mouth swabs — both work well." },
      { text: "For those who can spit: brush teeth or dentures gently with toothpaste, rinse with water or alcohol-free mouthwash." },
      { text: "For those who cannot swallow safely: use a damp swab to clean the gums, tongue, and inside of cheeks. Do not use liquid they might inhale." },
      { text: "Apply lip balm or petroleum jelly to cracked lips — this brings significant comfort." },
      { text: "Offer small sips of water or ice chips if swallowing is safe." },
      { text: "Do mouth care at least twice daily — more often if the mouth looks dry." },
    ],
    whatToAvoid: [
      "Do not use lemon glycerin swabs — these dry out the mouth more",
      "Do not use full mouthwash rinse with someone who cannot safely swallow or spit",
      "Do not skip mouth care even when eating has stopped — it remains very important for comfort",
    ],
    whenToCallHospice: [
      "You see white patches in the mouth (may be thrush/fungal infection)",
      "There is bleeding from the gums or mouth",
      "You need mouth care supplies",
    ],
    whatHappensNext:
      "Hospice can provide appropriate mouth care supplies and treat any infections like thrush. The hospice aide can demonstrate technique during their visit.",
  },
  {
    id: "changing-briefs",
    categoryId: "caregiving",
    title: "Changing Adult Briefs",
    subtitle: "How to change incontinence briefs while keeping dignity",
    urgencyLevel: "routine",
    icon: "shield",
    tags: ["diaper", "briefs", "incontinence", "changing", "adult brief", "dignity", "perineal care"],
    whatYouMayNotice: [
      "Person is incontinent of urine or stool",
      "Brief is soiled and needs changing",
      "Person cannot get to the bathroom independently",
    ],
    whatItMeans:
      "Incontinence is common in late illness and does not diminish the person's dignity. Prompt, gentle brief changes prevent skin breakdown and discomfort. With practice, this becomes a routine part of care.",
    whatToDoNow: [
      { text: "Gather supplies: clean brief, wipes or warm washcloths, barrier cream, disposable gloves, waste bag." },
      { text: "Explain what you are about to do, even if they seem unaware." },
      { text: "Put on gloves. Lower any bed rails on the side you are working from." },
      { text: "Roll the person onto their side, away from you." },
      { text: "Unfasten the soiled brief and fold the soiled side inward." },
      { text: "Clean from front to back — always front to back to prevent infection." },
      { text: "Gently clean all skin folds and creases. Pat dry — do not rub." },
      { text: "Apply barrier cream (zinc oxide or similar) to protect skin." },
      { text: "Slide the clean brief under them with the back half spread flat behind them." },
      { text: "Roll them back, pull the front up, and fasten snugly but not tight." },
      { text: "Dispose of soiled brief and gloves. Wash your hands thoroughly." },
    ],
    whatToAvoid: [
      "Do not wipe back to front — this spreads bacteria toward the urinary tract",
      "Do not leave soiled briefs in place longer than necessary — skin breakdown happens quickly",
      "Do not use harsh or fragranced wipes — these irritate fragile skin",
      "Do not rush — dignity matters throughout",
    ],
    whenToCallHospice: [
      "Skin under the brief is red, raw, or broken",
      "You notice blood in urine or stool",
      "The person develops a rash or yeast infection in the brief area",
      "You need supplies or training from the aide",
    ],
    whatHappensNext:
      "The hospice aide can demonstrate this technique and help you feel more confident. They can also recommend the best brief size and type and order skin care supplies.",
  },
  {
    id: "fall-recovery",
    categoryId: "caregiving",
    title: "If a Patient Has Fallen",
    subtitle: "What to do immediately if your loved one falls",
    urgencyLevel: "immediate",
    icon: "alert-triangle",
    tags: ["fall", "fell", "on the floor", "can't get up", "fallen", "dropped"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Person is on the floor",
      "You heard a crash or thud",
      "Person is unable to get up on their own",
      "Person may be confused, in pain, or frightened",
    ],
    whatItMeans:
      "Falls in hospice patients are serious and need immediate attention. Even if there is no visible injury, internal injury is possible. Your first priority is not moving them — your priority is assessing and calling for help.",
    whatToDoNow: [
      { text: "Stay calm. Kneel or sit on the floor beside them and speak calmly." },
      { text: "Do not immediately try to lift them — injuries can be made worse by moving." },
      { text: "Ask them if they are in pain and where." },
      { text: "Check for obvious injuries: is there any bleeding? Is any limb in an abnormal position?" },
      { text: "Call hospice immediately — they will guide you on whether to call 911 or how to safely assist." },
      { text: "If they are comfortable and not injured, you can place a pillow under their head and a blanket over them while help arrives." },
      { text: "Stay with them until help arrives or hospice walks you through the next steps." },
    ],
    whatToAvoid: [
      "Do not attempt to lift them alone — this can injure both of you",
      "Do not move them if you suspect a head, neck, or spine injury",
      "Do not leave them alone on the floor",
      "Do not scold them for falling — it increases distress",
    ],
    whenToCallHospice: [
      "Immediately — call as soon as the fall happens",
    ],
    whatHappensNext:
      "Hospice will guide you through an assessment by phone and determine whether a nurse needs to come or whether 911 is needed. They will also follow up with a falls risk assessment and may recommend bed rails, grab bars, or a hospital bed if not already in place.",
  },
  {
    id: "bed-to-chair-transfer",
    categoryId: "caregiving",
    title: "Bed to Chair Transfer",
    subtitle: "Safely moving someone from bed to a chair or wheelchair",
    urgencyLevel: "routine",
    icon: "move",
    tags: ["transfer", "bed to chair", "wheelchair", "moving", "getting up", "sitting up"],
    whatYouMayNotice: [
      "Person needs to move from bed to a chair",
      "Person has limited ability to bear weight",
      "Person needs assistance standing",
    ],
    whatItMeans:
      "Transfers require planning and technique to protect both the person and the caregiver. When in doubt about safety, do not attempt the transfer alone — call hospice for training or equipment.",
    whatToDoNow: [
      { text: "Place the chair or wheelchair at a 45-degree angle to the bed, on the person's stronger side if applicable." },
      { text: "Lock wheelchair wheels if applicable." },
      { text: "Sit the person up at the edge of the bed, feet flat on the floor. Allow a moment for dizziness to pass." },
      { text: "Stand in front of them, slightly to one side. Place your feet shoulder-width apart." },
      { text: "Have them place hands on your upper arms — not around your neck." },
      { text: "Place your hands around their trunk or use a gait belt if available." },
      { text: "On a count of three, have them lean forward and push to standing — assist but let them do as much as possible." },
      { text: "Pivot with them — turning your feet rather than twisting your back." },
      { text: "Lower them into the chair slowly, guiding their hips back first." },
    ],
    whatToAvoid: [
      "Do not allow them to hold onto your neck — this is unsafe for both of you",
      "Do not attempt transfers alone if the person cannot bear any weight",
      "Do not rush the sit-to-stand — dizziness from position changes is common",
      "Do not attempt if either of you feels unsafe",
    ],
    whenToCallHospice: [
      "You are unsure whether the person can safely transfer",
      "You have injured yourself doing transfers",
      "You need equipment like a gait belt or lift",
      "You want the aide to demonstrate technique",
    ],
    whatHappensNext:
      "Hospice can provide gait belt training, recommend assistive equipment, and evaluate whether a mechanical lift is needed. Caregiver safety matters too — do not push through unsafe situations alone.",
  },
  {
    id: "boosting-in-bed",
    categoryId: "caregiving",
    title: "Boosting Up in Bed",
    subtitle: "Moving someone who has slid down toward the foot of the bed",
    urgencyLevel: "routine",
    icon: "arrow-up",
    tags: ["boosting", "slide up bed", "move up in bed", "repositioning", "slid down"],
    whatYouMayNotice: [
      "Person has slid down and their head is no longer on the pillow",
      "Person is uncomfortable and needs to move up",
    ],
    whatItMeans:
      "When someone cannot reposition themselves, they slide down in bed over time. Boosting them back up requires technique to avoid dragging skin across the sheets, which causes friction injuries. If possible, this is a two-person task.",
    whatToDoNow: [
      { text: "Lower the head of the bed flat or as close to flat as tolerated.", tip: "The flatter the bed, the less friction when moving." },
      { text: "Remove pillows from behind the head temporarily." },
      { text: "If available, use a draw sheet (a folded sheet under the person from shoulders to hips) — two people each hold one side and lift slightly while sliding up." },
      { text: "Alone: ask the person to bend their knees and push with their feet while you guide their upper body.", tip: "Bend your own knees and keep your back straight — protect yourself." },
      { text: "Slide, do not drag — even a slight lift makes a significant difference to skin safety." },
      { text: "Reposition the pillow, restore head-of-bed angle, and check for comfort when done." },
    ],
    whatToAvoid: [
      "Do not drag across the sheets — this tears fragile skin",
      "Do not try to boost without a draw sheet if you are alone and the person is heavy",
      "Do not twist your back — face the direction you are moving",
    ],
    whenToCallHospice: [
      "You cannot safely boost without risking injury to yourself or the patient",
      "You need a draw sheet or slide board",
      "Skin is being damaged from frequent sliding",
    ],
    whatHappensNext:
      "The hospice aide can demonstrate this technique and assist during visits. A draw sheet, slide board, or mechanical lift can make this much safer — ask hospice to arrange these if boosting is a regular challenge.",
  },
  {
    id: "feeding-assistance",
    categoryId: "caregiving",
    title: "Feeding Assistance",
    subtitle: "Helping someone eat or drink safely",
    urgencyLevel: "routine",
    icon: "coffee",
    tags: ["feeding", "helping eat", "can't feed themselves", "feeding assistance", "mealtime"],
    whatYouMayNotice: [
      "Person cannot manage utensils or cup independently",
      "Person is eating very slowly",
      "Person is spilling food or liquid",
    ],
    whatItMeans:
      "When weakness or coordination problems make self-feeding difficult, a caregiver can assist. The goal is to preserve dignity, safety, and enjoyment — not just caloric intake. As illness progresses, the importance shifts from nutrition to pleasure and connection.",
    whatToDoNow: [
      { text: "Sit at the person's level — never stand over them while feeding. This puts them in a more natural swallowing position.", tip: "Sitting beside them rather than across from them often feels more natural." },
      { text: "Ensure they are sitting upright at 90 degrees or as close as possible before offering any food or drink." },
      { text: "Offer small amounts — a teaspoon at a time. Wait for a full swallow before offering more." },
      { text: "Alternate food and liquid to keep the mouth moist and help clear the throat." },
      { text: "Watch for signs of swallowing difficulty: coughing, wet voice, or a gurgling sound after eating." },
      { text: "Keep mealtimes unhurried and pleasant — conversation, music, or familiar settings help." },
      { text: "Honor their preferences — even a few bites of a loved food matters more than a balanced meal.", tip: "Ask: 'What sounds good to you today?'" },
    ],
    whatToAvoid: [
      "Do not rush — mealtime is also a time for connection",
      "Do not use straws — they deliver liquid too fast for safe swallowing",
      "Do not force eating if the person refuses — this can damage trust and cause aspiration",
    ],
    whenToCallHospice: [
      "Consistent coughing or choking during meals",
      "Sudden refusal to eat that is new and unexplained",
      "You suspect swallowing is unsafe",
    ],
    whatHappensNext:
      "If swallowing difficulties arise, hospice will assess and advise on safe consistencies. As illness progresses and appetite declines, hospice will help you transition the focus from nutrition to comfort and pleasure.",
  },
  {
    id: "skin-care",
    categoryId: "caregiving",
    title: "Skin Care",
    subtitle: "Protecting and moisturizing fragile skin",
    urgencyLevel: "routine",
    icon: "shield",
    tags: ["skin care", "dry skin", "fragile skin", "moisturizer", "lotion", "skin protection", "barrier cream"],
    whatYouMayNotice: [
      "Skin that looks dry, paper-thin, or flaky",
      "Skin that tears easily",
      "Redness in areas of pressure or moisture",
      "Person complains of itchy or irritated skin",
    ],
    whatItMeans:
      "Skin becomes fragile in serious illness due to poor nutrition, dehydration, immobility, and medication effects. Good daily skin care is one of the most important things you can do to prevent serious wounds and keep the person comfortable.",
    whatToDoNow: [
      { text: "Moisturize the skin at least once daily after bathing — use a gentle, unscented lotion or cream.", tip: "Focus on heels, elbows, lower back, and other bony areas." },
      { text: "Apply barrier cream (zinc oxide or petroleum jelly) to areas exposed to moisture from incontinence." },
      { text: "Keep skin dry — moisture from sweat, urine, or wound drainage greatly increases breakdown risk." },
      { text: "Inspect skin with each bath or brief change — look for new redness, breakdown, or bruising.", caution: "Report any new wounds or open areas to hospice — early treatment prevents serious problems." },
      { text: "Ensure sheets are free of wrinkles and crumbs under the person." },
      { text: "Use soft, smooth fabrics — avoid rough textures directly on fragile skin." },
    ],
    whatToAvoid: [
      "Do not massage reddened areas — this damages tissue rather than helping",
      "Do not use alcohol-based products on fragile skin",
      "Do not use fragranced soaps or lotions — these can irritate sensitive skin",
      "Do not apply tape directly to fragile skin without a protective barrier",
    ],
    whenToCallHospice: [
      "Any new wound, open area, or significant breakdown appears",
      "You need wound care supplies or instruction",
      "Skin problems seem to be causing pain or discomfort",
    ],
    whatHappensNext:
      "Hospice will advise on wound care and can order appropriate supplies. Prevention is always easier than treatment — a quick daily inspection is one of the best things you can do.",
  },
  {
    id: "comfort-positioning",
    categoryId: "caregiving",
    title: "Comfort Positioning",
    subtitle: "Positioning for maximum comfort and pressure relief",
    urgencyLevel: "routine",
    icon: "layout",
    tags: ["positioning", "comfort position", "pillows", "pressure relief", "side lying", "backrest"],
    whatYouMayNotice: [
      "Person seems uncomfortable in their current position",
      "Person cannot tell you what they need",
      "You want to know the best positioning options",
    ],
    whatItMeans:
      "Comfort positioning involves using pillows, wedges, and repositioning to distribute pressure away from vulnerable areas and support the body in natural alignment. Good positioning reduces pain, prevents wounds, and can significantly improve rest.",
    whatToDoNow: [
      { text: "Side-lying position (30-degree tilt): Place a pillow behind the back to maintain a slight angle. This is safer than flat on one side (less pressure on the hip) and good for breathing." },
      { text: "Between the knees: place a pillow between the knees when side-lying to protect the hip and knee joints." },
      { text: "Heel elevation: slide a pillow under the calves so that the heels float — heels are very vulnerable to pressure wounds.", caution: "Pillows should be under the calves, not the heels themselves." },
      { text: "Semi-reclined: head of bed elevated 30 degrees is good for breathing and reduces aspiration risk during and after feeding." },
      { text: "Arm support: support arms with pillows to prevent shoulder strain and reduce swelling." },
      { text: "Change position at least every 2 hours — set a timer if helpful." },
    ],
    whatToAvoid: [
      "Do not position directly on a bony prominence (hip, shoulder blade, tailbone) for extended periods",
      "Do not use donut-shaped cushions — these increase pressure on the surrounding tissue",
      "Do not position with the head of bed above 30 degrees for long periods unless needed for breathing or feeding",
    ],
    whenToCallHospice: [
      "Repositioning is causing significant pain",
      "You need a specialized mattress or cushion",
      "You want the aide to demonstrate positioning techniques",
    ],
    whatHappensNext:
      "Hospice can order alternating pressure mattresses, foam overlays, or other positioning aids. The aide can also show you techniques in person during their visits.",
  },
];

const medications: GuidanceScenario[] = [
  {
    id: "comfort-kit",
    categoryId: "medications",
    title: "Using the Comfort Kit",
    subtitle: "Understanding the emergency medications provided by hospice",
    urgencyLevel: "routine",
    icon: "package",
    tags: ["comfort kit", "emergency medications", "hospice medications", "morphine", "ativan", "lorazepam", "haloperidol"],
    whatYouMayNotice: [
      "You have received a comfort kit but are not sure what each medication is for",
      "A situation has arisen where you may need to use a comfort kit medication",
      "You want to be prepared before a crisis happens",
    ],
    whatItMeans:
      "A comfort kit (also called an emergency or crisis kit) is a set of medications provided to the home so that caregivers can address common distressing symptoms immediately without waiting for a delivery. These medications are safe and have been ordered specifically for your loved one by the hospice physician. Always call hospice before using them so they can confirm the right dose for the situation.",
    whatToDoNow: [
      { text: "Store the comfort kit in a consistent, safe location that is accessible to you but away from children." },
      { text: "Know what is in the kit: most include a pain medication (often morphine), an anti-anxiety medication (often lorazepam), an anti-nausea medication, and something for secretions." },
      { text: "Read the labels — each bottle will have the patient name, medication name, dose, and when to use it." },
      { text: "When a symptom arises, call hospice first — they will confirm which medication and how much to give." },
      { text: "Most comfort kit medications are given under the tongue (sublingual) or in the cheek — not swallowed." },
      { text: "After using any comfort kit medication, call hospice to report what you gave and how the person responded." },
    ],
    whatToAvoid: [
      "Do not use comfort kit medications without calling hospice first unless a nurse has specifically told you to give a dose in a specific situation",
      "Do not give more than the labeled dose",
      "Do not share medications with anyone else",
      "Do not store near heat, light, or moisture",
    ],
    whenToCallHospice: [
      "Anytime before using a comfort kit medication — they will guide you",
      "After using a comfort kit medication — to report and get follow-up guidance",
      "If the kit runs low and needs to be refilled",
      "If you are unsure what any medication is for",
    ],
    whatHappensNext:
      "After using a comfort kit medication, the hospice nurse will check in to see how the person responded and whether additional doses or medication changes are needed. These medications are powerful and effective — they are there to help you prevent suffering.",
  },
  {
    id: "missed-dose",
    categoryId: "medications",
    title: "Missed or Late Medication Dose",
    subtitle: "What to do if a scheduled medication was missed",
    urgencyLevel: "soon",
    icon: "clock",
    tags: ["missed dose", "forgot medication", "late dose", "skipped medication"],
    whatYouMayNotice: [
      "You realize you missed a scheduled medication time",
      "You are not sure whether a dose was given or not",
    ],
    whatItMeans:
      "Missing a dose of a regular medication can allow pain or symptoms to return. For most hospice medications, there is a clear approach: give the dose if it is within a short window, or skip and resume the next scheduled time. Always call hospice when uncertain — they will tell you exactly what to do for each specific medication.",
    whatToDoNow: [
      { text: "Note what medication was missed and how long ago the dose was due." },
      { text: "Call hospice to ask what to do — they will give specific guidance for that medication." },
      { text: "Do not double dose without being instructed to — some medications cannot be safely doubled." },
      { text: "If symptoms are returning (pain, discomfort), mention this when you call — a breakthrough dose may be appropriate while you catch up." },
      { text: "After the situation is resolved, consider setting an alarm or reminder system for future doses." },
    ],
    whatToAvoid: [
      "Do not give a double dose without hospice guidance",
      "Do not guess — call hospice whenever uncertain",
      "Do not skip notifying hospice and just resuming on your own if you are unsure",
    ],
    whenToCallHospice: [
      "Any time a dose is missed and you are unsure what to do",
      "When symptoms are returning due to the missed dose",
      "When you want to set up a better medication management routine",
    ],
    whatHappensNext:
      "Hospice will tell you whether to give the missed dose now, wait for the next scheduled time, or use a breakthrough medication to cover symptoms in the meantime. They can also send someone to help set up a medication organizer or create a clearer schedule.",
  },
  {
    id: "medication-swallowing",
    categoryId: "medications",
    title: "Swallowing Medications",
    subtitle: "When pills are hard to swallow or unsafe",
    urgencyLevel: "soon",
    icon: "pill",
    tags: ["can't swallow pills", "medication swallowing", "crush medication", "liquid medication", "sublingual"],
    whatYouMayNotice: [
      "Person is choking or coughing when trying to take pills",
      "Person refuses pills because of swallowing difficulty",
      "Pills are not being swallowed completely",
    ],
    whatItMeans:
      "When swallowing becomes difficult, many hospice medications can be changed to liquid form, under-tongue (sublingual) drops, skin patches, or suppositories. Do not crush medications without first checking with hospice — some medications are dangerous if crushed. There is almost always an alternative.",
    whatToDoNow: [
      { text: "Stop giving any pill that is being choked on or that the person cannot swallow safely." },
      { text: "Call hospice immediately — medication in alternative forms can usually be arranged quickly." },
      { text: "While waiting, note which medications are affected and when doses are due." },
      { text: "Do not crush any medication without first checking with hospice or a pharmacist." },
    ],
    whatToAvoid: [
      "Do not crush extended-release medications — this can cause dangerous overdose",
      "Do not force pills if the person is choking",
      "Do not skip medications without calling hospice — symptoms will return without them",
    ],
    whenToCallHospice: [
      "Swallowing pills is becoming unsafe",
      "You need medication changed to a different form",
      "You are unsure which medications can be safely crushed",
    ],
    whatHappensNext:
      "Hospice will contact the pharmacy and physician to convert medications to safer forms. This usually happens within hours. There is almost always a way to deliver the same medication safely without swallowing pills.",
  },
  {
    id: "medication-side-effects",
    categoryId: "medications",
    title: "Medication Side Effects",
    subtitle: "Common side effects and what to do about them",
    urgencyLevel: "routine",
    icon: "info",
    tags: ["side effects", "medication reaction", "drowsy from medication", "constipation from medication", "opioid side effects"],
    whatYouMayNotice: [
      "Increased drowsiness after starting a new medication",
      "Constipation that started with pain medications",
      "Nausea after a medication dose",
      "Confusion that may be medication-related",
      "Itching after starting an opioid",
    ],
    whatItMeans:
      "Pain medications (opioids like morphine) commonly cause constipation, drowsiness, and sometimes nausea when first started. Drowsiness often improves within a few days as the body adjusts. Constipation does not improve on its own and needs a stool softener or laxative — hospice will order this routinely. Severe reactions like difficulty breathing need immediate attention.",
    whatToDoNow: [
      { text: "For drowsiness: This is normal for the first few days on a new opioid — call hospice if it is extreme or worsening." },
      { text: "For constipation: Ensure a bowel regimen (stool softener) is in place — call hospice to add one if not." },
      { text: "For nausea: Can be given an anti-nausea medication. Call hospice." },
      { text: "For itching: A small amount of diphenhydramine (Benadryl) may help — call hospice first." },
      { text: "For any severe reaction (severe allergic response, difficulty breathing, extreme confusion): call 911 and immediately contact hospice." },
    ],
    whatToAvoid: [
      "Do not stop medications abruptly without calling hospice",
      "Do not give additional medications without checking for interactions",
      "Do not assume side effects are untreatable — hospice can address most of them",
    ],
    whenToCallHospice: [
      "Side effects are interfering with comfort",
      "You are unsure whether something is a side effect or a new symptom",
      "You think a medication may be causing harm",
    ],
    whatHappensNext:
      "Hospice will review the medication and may adjust the dose, change the medication, or add a medication to manage the side effect. Most side effects can be managed very well.",
  },
  {
    id: "morphine-administration",
    categoryId: "medications",
    title: "Giving Morphine (Sublingual)",
    subtitle: "How to give liquid morphine under the tongue for pain or breathing",
    urgencyLevel: "soon",
    icon: "droplet",
    tags: ["morphine", "opioid", "sublingual", "liquid morphine", "breakthrough pain", "pain medication", "giving morphine", "how to give"],
    whatYouMayNotice: [
      "Your loved one is in pain or having difficulty breathing",
      "Hospice has asked you to give morphine from the comfort kit",
      "You are uncertain how to give it correctly",
      "You want to feel prepared before a crisis occurs",
    ],
    whatItMeans:
      "Liquid morphine is one of the most effective medications in hospice for controlling pain and easing the feeling of breathlessness. It is safe when used as directed. In hospice, it is commonly given under the tongue (sublingual) so it absorbs quickly — especially when swallowing is difficult. You are not hurrying death by giving this medication. You are preventing suffering.",
    whatToDoNow: [
      {
        text: "Call hospice first to confirm the dose — the label on the bottle tells you the concentration and maximum dose, but the nurse will confirm the right amount for the current situation.",
        tip: "Keep the comfort kit in the same place every time so you can find it quickly. Know the dose before you need it.",
      },
      {
        text: "Draw up the prescribed dose using the dropper or syringe that came with the bottle.",
        caution: "Do not estimate — use the dropper or syringe markings to measure exactly.",
      },
      {
        text: "Tilt their head back slightly or turn it to the side. Gently place the dropper or syringe under the tongue or into the cheek pouch.",
      },
      {
        text: "Release the medication slowly. It does not need to be swallowed — it absorbs through the lining of the mouth.",
        tip: "If they cannot hold their head back, place in the cheek — it still absorbs well.",
      },
      { text: "Stay with them for at least 15–30 minutes to watch for response. Pain or breathing distress should ease within 20–30 minutes." },
      {
        text: "If there is no improvement after 30 minutes and they are still in distress, call hospice — a second dose may be appropriate or a stronger dose may be needed.",
      },
      { text: "Document the time, dose, and their response. Hospice will ask for this information." },
    ],
    whatToAvoid: [
      "Do not give more than the labeled dose without calling hospice first",
      "Do not give morphine to someone who is unconscious and cannot swallow — ask hospice about sublingual route in that case",
      "Do not mix morphine with other liquids or medications without asking",
      "Do not feel that giving this medication means you are 'giving up' — it is comfort care",
    ],
    whenToCallHospice: [
      "Before giving any comfort kit medication — they will confirm the right dose",
      "If one dose is not enough and the person is still in distress",
      "If you are uncertain which medication to use",
      "After every comfort kit use — to report and get guidance",
    ],
    whatHappensNext:
      "Hospice will check in to see how the person responded. If the current dose is not enough, they can adjust the prescription. If you used the comfort kit frequently, they may set up a scheduled dose to prevent breakthrough pain from recurring.",
  },
  {
    id: "lorazepam-use",
    categoryId: "medications",
    title: "Using Lorazepam (Ativan)",
    subtitle: "Anti-anxiety medication for anxiety, air hunger, or restlessness",
    urgencyLevel: "soon",
    icon: "shield",
    tags: ["lorazepam", "ativan", "anxiety medication", "anti-anxiety", "air hunger", "restlessness medication", "calming medication"],
    whatYouMayNotice: [
      "Your loved one seems anxious, panicked, or very unsettled",
      "They are breathing hard and seem frightened by the feeling",
      "They cannot stop moving or seem terrified",
      "Hospice has asked you to give lorazepam from the comfort kit",
    ],
    whatItMeans:
      "Lorazepam (brand name Ativan) is an anti-anxiety medication that works quickly to ease feelings of panic, anxiety, and air hunger (the frightening sensation of not getting enough air). It is also used for restlessness. In hospice, it is given sublingually (under the tongue) or by mouth. It is not a sedative in the way people fear — at comfort kit doses, it simply takes the edge off distress.",
    whatToDoNow: [
      {
        text: "Call hospice to confirm you should give lorazepam and to confirm the dose.",
        tip: "Lorazepam and morphine are often given together for breathing crises — hospice will guide whether to give one or both.",
      },
      { text: "Draw up the prescribed dose using the dropper or syringe." },
      {
        text: "Place under the tongue or in the cheek pouch and release slowly. It absorbs through the mouth lining.",
        caution: "Do not give it by mouth if they are having trouble swallowing — sublingual is the correct route.",
      },
      { text: "Create a calm environment: lower lights, reduce noise, speak softly and slowly." },
      { text: "Stay with them. Your calm presence is itself reassuring. Breathe slowly and encourage them to match your pace if able." },
      { text: "Effects typically begin within 15–20 minutes. Allow time before deciding the dose was not enough." },
    ],
    whatToAvoid: [
      "Do not give more than the prescribed dose without calling hospice",
      "Do not give lorazepam and then leave the person alone — monitor for breathing changes",
      "Do not give in an agitated struggle — wait for a calm moment or call hospice for guidance",
    ],
    whenToCallHospice: [
      "Before giving lorazepam",
      "If anxiety or restlessness does not improve with one dose",
      "If the person becomes very drowsy after the dose",
      "If you are not sure whether morphine or lorazepam is the right choice for the situation",
    ],
    whatHappensNext:
      "Hospice may adjust the standing medication plan to prevent anxiety from breaking through. If this is happening frequently, they may set up a scheduled dose or a continuous infusion pump to keep the person comfortable around the clock.",
  },
  {
    id: "medication-running-low",
    categoryId: "medications",
    title: "Running Low on Medications",
    subtitle: "What to do when comfort kit or regular medications are almost gone",
    urgencyLevel: "soon",
    icon: "alert-triangle",
    tags: ["running out of medication", "low medication", "refill", "comfort kit refill", "out of morphine", "medication supply"],
    whatYouMayNotice: [
      "The comfort kit bottle is nearly empty",
      "You only have a few doses of a regular scheduled medication left",
      "The pharmacy is closed and you are not sure what to do",
      "You have used several doses and are worried about running out",
    ],
    whatItMeans:
      "Running out of comfort medications is a genuine emergency — these medications are what stand between your loved one and uncontrolled pain or distress. Hospice and hospice pharmacies are available 24 hours a day precisely for this situation. Do not wait until you have run out completely to make the call.",
    whatToDoNow: [
      {
        text: "Call hospice as soon as you realize you are getting low — do not wait until the medication is gone.",
        tip: "A good rule: call hospice when you are down to 2–3 doses of any comfort medication.",
      },
      { text: "Tell them which medication is low, how much is left, how recently you used doses, and why (what symptoms you were treating)." },
      {
        text: "Hospice will arrange a refill through the hospice pharmacy, which delivers 24 hours a day, 7 days a week.",
        caution: "Regular retail pharmacies do not stock hospice comfort kit medications in most cases — the hospice pharmacy handles this.",
      },
      { text: "While waiting for the refill: conserve remaining doses for true distress. Call hospice before giving another dose so they can track usage." },
      { text: "If you are completely out and the person is in distress: call hospice immediately — they can send a nurse with emergency medication or arrange urgent delivery." },
    ],
    whatToAvoid: [
      "Do not wait until the last dose to call — call when supplies are getting low",
      "Do not try to get a refill at a regular pharmacy without guidance — the hospice pharmacy is the correct source",
      "Do not give lower doses than prescribed to make medications last — call hospice instead",
      "Do not panic — hospice is equipped for exactly this situation 24 hours a day",
    ],
    whenToCallHospice: [
      "Whenever you are getting low on any comfort medication",
      "If you have unexpectedly used many doses and are concerned about supply",
      "If you are completely out and the person needs medication now",
    ],
    whatHappensNext:
      "Hospice will arrange an urgent refill through the hospice pharmacy. Delivery is typically within hours. If the person is in distress in the meantime, the nurse will either come with medication or guide you through interim measures.",
  },
  {
    id: "patch-medication",
    categoryId: "medications",
    title: "Medication Patch Care",
    subtitle: "Fentanyl or other skin patches — placement, rotation, and removal",
    urgencyLevel: "routine",
    icon: "square",
    tags: ["fentanyl patch", "medication patch", "skin patch", "pain patch", "patch fell off", "patch rotation", "where to put patch"],
    whatYouMayNotice: [
      "A medication patch has fallen off or is partially detached",
      "You need to change the patch and are unsure where to place it",
      "The skin under the patch looks irritated or red",
      "You are not sure how long the patch has been on",
    ],
    whatItMeans:
      "Fentanyl and other medication patches deliver medication continuously through the skin over 48–72 hours. They provide steady, around-the-clock pain control without pills. Proper placement and site rotation are important — an unstuck patch stops delivering medication, and a used patch still contains enough medication to be dangerous if touched or swallowed by others.",
    whatToDoNow: [
      {
        text: "Apply patches to clean, dry, flat skin — good sites include the upper chest, upper arm, upper back, or abdomen. Avoid bony areas, skin folds, and areas with broken or irritated skin.",
        tip: "Rotate sites with each change — never put a new patch in the exact same spot as the old one.",
      },
      {
        text: "Press firmly for 30 seconds when applying. The warmth of your hand helps it stick.",
        caution: "Do not cut patches. Do not apply heating pads over a patch — heat increases the rate of absorption and can cause overdose.",
      },
      { text: "Write the date and time of application on the edge of the patch with a pen or marker so you know when to change it." },
      {
        text: "When removing a used patch: fold it in half sticky-side-in, then flush it down the toilet or place in a disposal pouch (usually provided by the pharmacy).",
        caution: "Used patches still contain significant medication — never put in regular trash where children, pets, or others could access them.",
      },
      { text: "If a patch has fallen off: call hospice immediately. They will advise whether to reapply, use a new patch, or cover with breakthrough medication." },
      { text: "If the skin under the patch is red or irritated: rotate to a new site and call hospice — they may recommend a skin barrier or different adhesive." },
    ],
    whatToAvoid: [
      "Do not cut patches — this causes unpredictable dosing",
      "Do not apply heating pads over a patch",
      "Do not flush in toilet if your community has a medication take-back program — use that instead",
      "Do not touch the adhesive side with bare fingers when applying — use gloves or the backing",
      "Do not apply to irritated, broken, or oily skin",
    ],
    whenToCallHospice: [
      "A patch has fallen off and you are unsure what to do",
      "Skin irritation is severe or the patch site looks infected",
      "You are unsure when the patch is due for a change",
      "Pain seems to be returning before the patch change is due — may need a dose adjustment",
    ],
    whatHappensNext:
      "Hospice will advise on the correct next step and can adjust the patch dose or frequency if pain is not well-controlled. They can also arrange for skin barrier products if irritation is a recurring problem.",
  },
];

const equipment: GuidanceScenario[] = [
  {
    id: "oxygen-concentrator",
    categoryId: "equipment",
    title: "Oxygen Concentrator",
    subtitle: "Understanding and troubleshooting home oxygen equipment",
    urgencyLevel: "immediate",
    icon: "wind",
    tags: ["oxygen", "oxygen machine", "concentrator", "not working", "alarm", "oxygen alarm", "low oxygen"],
    callHospiceNow: false,
    whatYouMayNotice: [
      "Alarm sounding on the oxygen machine",
      "Machine making unusual sounds or noises",
      "Person says oxygen does not seem to be helping",
      "Tubing disconnected or kinked",
      "Machine has stopped working",
    ],
    whatItMeans:
      "An oxygen concentrator pulls oxygen from room air and delivers it through tubing and a nasal cannula. Most problems are simple tubing issues that you can fix. If the machine has truly stopped working, there are steps to take while you contact the equipment provider.",
    whatToDoNow: [
      { text: "Check that the machine is plugged in and the power switch is on." },
      { text: "Check all tubing for kinks, disconnections, or blockages." },
      { text: "Check that the nasal cannula prongs are correctly positioned in the nostrils." },
      { text: "Clean or replace the filter if it looks visibly dirty (usually on the side or back of the machine)." },
      { text: "If an alarm is sounding: most oxygen concentrators alarm when flow is blocked, power is interrupted, or the filter needs cleaning." },
      { text: "If the machine is not working: use portable backup oxygen if available, open windows for fresh air, and call the equipment provider immediately." },
      { text: "Call hospice if the person seems short of breath or distressed while equipment issues are being resolved." },
    ],
    whatToAvoid: [
      "Do not allow smoking or open flames near oxygen — oxygen is highly flammable",
      "Do not place the machine in an enclosed space or cover the vents",
      "Do not extend tubing beyond the manufacturer's length recommendation",
      "Do not use petroleum-based products (Vaseline) near oxygen — use water-based alternatives",
    ],
    whenToCallHospice: [
      "The person is in respiratory distress and equipment cannot be quickly fixed",
      "The alarm continues after checking all the above steps",
      "You are unsure if the oxygen is helping or not",
    ],
    whatHappensNext:
      "The equipment provider has a 24-hour emergency line and is required to respond. Hospice can also call on your behalf. If oxygen is needed urgently, hospice can arrange for portable tanks to bridge the gap.",
  },
  {
    id: "hospital-bed",
    categoryId: "equipment",
    title: "Hospital Bed",
    subtitle: "Using the hospital bed remote and adjusting safely",
    urgencyLevel: "routine",
    icon: "monitor",
    tags: ["hospital bed", "bed remote", "bed controls", "adjusting bed", "head of bed", "bed won't move", "electric bed"],
    whatYouMayNotice: [
      "Unsure how to use the bed remote",
      "Bed will not adjust when using the remote",
      "Remote is making a sound but bed is not moving",
      "Person wants a different position",
    ],
    whatItMeans:
      "Hospital beds can adjust the head up and down, the foot up and down, and the entire bed height up and down. This flexibility is important for comfort, repositioning, pressure relief, and caregiver safety. Most issues are simple.",
    whatToDoNow: [
      { text: "Identify the bed controls: usually a hand-held pendant or a panel on the side rail." },
      { text: "Head up/down controls the angle of the upper body — good for breathing and eating." },
      { text: "Foot up/down can raise the knees — helpful for comfort and reducing swelling in legs." },
      { text: "Bed height controls how high the whole bed is — raise it to work at waist height, lower it for getting in and out." },
      { text: "If the bed is not responding: check that it is plugged in. Check for a lock or childproof setting on the remote." },
      { text: "If the bed has made a grinding noise or stopped mid-movement: unplug and replug. If it still does not work, call the equipment provider." },
    ],
    whatToAvoid: [
      "Do not raise the head too high for someone with swallowing difficulty",
      "Do not lower the bed to the lowest setting for caregiving — keep it at a working height for your back",
      "Do not leave bed at full height if the person might try to get up independently",
    ],
    whenToCallHospice: [
      "Bed is not functioning and you cannot reposition safely",
      "You need additional equipment like bed rails or an alternating pressure mattress",
    ],
    whatHappensNext:
      "The equipment provider can troubleshoot or replace a malfunctioning bed. Most equipment providers have a 24-hour line for urgent situations.",
  },
  {
    id: "suction-machine",
    categoryId: "equipment",
    title: "Suction Machine",
    subtitle: "When and how to use a suction machine for secretions",
    urgencyLevel: "soon",
    icon: "zap",
    tags: ["suction", "suction machine", "secretions", "gurgling", "choking on secretions", "rattling"],
    whatYouMayNotice: [
      "Excess secretions collecting in the mouth or throat",
      "Gurgling or rattling sound from the mouth",
      "Person cannot clear their own throat",
    ],
    whatItMeans:
      "A suction machine removes secretions from the mouth and upper throat. It is typically used when a person cannot swallow or clear secretions independently. Oral suctioning (shallow, in the mouth only) is different from deep suctioning — only do what hospice has specifically trained and authorized you to do.",
    whatToDoNow: [
      { text: "Only use the suction machine if hospice has specifically trained you and authorized its use." },
      { text: "If trained: position the person on their side or with head turned to allow drainage." },
      { text: "Use the correct suction catheter size as shown by the nurse." },
      { text: "Apply suction only when withdrawing the catheter — not when inserting." },
      { text: "Limit each suction attempt to 10–15 seconds." },
      { text: "Rinse the catheter with clean water between uses." },
      { text: "If NOT trained on suctioning: position on side for comfort, call hospice for guidance." },
    ],
    whatToAvoid: [
      "Do not perform deep suctioning (into the throat) unless specifically trained and directed",
      "Do not suction longer than 15 seconds continuously",
      "Do not use tap water to prime or rinse if sterile water was specified",
    ],
    whenToCallHospice: [
      "Secretions are severe and repositioning is not helping",
      "You have not been trained and the person seems distressed by secretions",
      "The suction machine has stopped working",
    ],
    whatHappensNext:
      "Hospice can prescribe medications that reduce the production of secretions, which is often more effective and more comfortable than suctioning. They will also train you on safe oral suctioning technique if needed.",
  },
  {
    id: "equipment-failure",
    categoryId: "equipment",
    title: "Equipment Not Working",
    subtitle: "General guidance when hospice equipment fails",
    urgencyLevel: "immediate",
    icon: "alert-octagon",
    tags: ["equipment broken", "not working", "equipment failure", "machine stopped", "equipment emergency"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Equipment has stopped working",
      "An alarm is sounding and cannot be resolved",
      "Equipment is making unusual sounds",
      "A part has broken or tubing has failed",
    ],
    whatItMeans:
      "Equipment failure in a hospice setting needs to be addressed quickly, especially for life-comfort equipment like oxygen. All hospice equipment providers are required to have 24-hour emergency lines for exactly this situation.",
    whatToDoNow: [
      { text: "Check the basics: Is it plugged in? Is the power switch on? Is there a reset button?" },
      { text: "Check all connections: tubing, power cord, filters." },
      { text: "Call the equipment provider's 24-hour emergency number (this should be in your patient emergency information)." },
      { text: "Call hospice and let them know — they can also contact the equipment provider on your behalf and guide you through interim steps." },
      { text: "For oxygen failure: use portable backup tanks if available, open windows, and keep the person calm and still to reduce oxygen demand." },
    ],
    whatToAvoid: [
      "Do not attempt to repair equipment yourself",
      "Do not wait until morning to call if the equipment is critical",
      "Do not panic — there are backup options while help is on the way",
    ],
    whenToCallHospice: [
      "Immediately when critical equipment fails and the person is in distress",
    ],
    whatHappensNext:
      "The equipment provider will dispatch emergency service or replacement equipment. Hospice will support you through the gap and can arrange alternative solutions.",
  },
  {
    id: "catheter-care",
    categoryId: "equipment",
    title: "Urinary Catheter Care",
    subtitle: "Managing a Foley catheter — draining the bag, skin care, signs of problems",
    urgencyLevel: "soon",
    icon: "droplet",
    tags: ["catheter", "foley", "urinary catheter", "catheter bag", "catheter not draining", "urine bag", "catheter care", "catheter blocked"],
    whatYouMayNotice: [
      "The catheter bag is full and needs to be emptied",
      "The catheter does not seem to be draining",
      "There is leaking around the catheter",
      "The urine looks very dark, cloudy, or has an unusual smell",
      "The person seems uncomfortable near the catheter site",
    ],
    whatItMeans:
      "A urinary catheter (Foley catheter) drains urine from the bladder through a tube into a collection bag. It is commonly used in hospice when a person can no longer control urination or when getting up to urinate is no longer safe. Routine care keeps it comfortable and working. Most problems are simple and can be fixed at home — some need hospice attention.",
    whatToDoNow: [
      {
        text: "Empty the drainage bag when it is about half to two-thirds full — do not let it get completely full, which can cause backflow.",
        tip: "Empty into a measuring cup or toilet. Record the amount if hospice has asked you to track output.",
      },
      {
        text: "To empty: open the drain valve at the bottom of the bag into a container, then close the valve firmly. Do not let the drain port touch the inside of the container or the floor.",
        caution: "Always wear gloves when emptying the bag.",
      },
      {
        text: "Keep the bag below the level of the bladder at all times — it should never be lifted above the waist. This prevents backflow of urine into the bladder.",
      },
      {
        text: "Clean around the catheter entry site daily with warm water and mild soap, wiping away from the body. Pat dry gently.",
      },
      {
        text: "If the catheter is not draining: check that the tubing is not kinked, twisted, or compressed under the body or mattress. Straighten any kinks.",
        tip: "Ensure the bag is hung lower than the bladder — drainage relies on gravity.",
      },
      {
        text: "If urine looks very dark, cloudy, bloody, or smells very strongly — or if there is fever — call hospice. These can be signs of a urinary tract infection or dehydration.",
      },
    ],
    whatToAvoid: [
      "Do not pull or tug on the catheter — the balloon inside the bladder holds it in place",
      "Do not lift the drainage bag above waist level",
      "Do not disconnect the tubing from the bag unnecessarily",
      "Do not use powder or lotion directly around the catheter insertion site",
      "Do not attempt to reinsert a catheter that has come out — call hospice",
    ],
    whenToCallHospice: [
      "The catheter has come out or looks like it is coming out",
      "Urine is bloody, cloudy, foul-smelling, or the person has a fever",
      "The catheter is not draining despite checking for kinks and positioning",
      "There is significant leaking around the catheter tube",
      "The person is in pain or discomfort at the catheter site",
    ],
    whatHappensNext:
      "Hospice can send a nurse to replace a catheter, obtain a urine specimen if infection is suspected, or assess whether the catheter is still the right approach. Many catheter problems are resolved quickly once properly assessed.",
  },
  {
    id: "alternating-pressure-mattress",
    categoryId: "equipment",
    title: "Alternating Pressure Mattress",
    subtitle: "Understanding and using the pressure-relief air mattress and pump",
    urgencyLevel: "routine",
    icon: "layers",
    tags: ["alternating pressure", "air mattress", "pressure mattress", "pump alarm", "pressure relief", "bedsore prevention", "air pump"],
    whatYouMayNotice: [
      "The pump is making a normal cycling sound but you are unsure if it is working",
      "The pump alarm is sounding",
      "The mattress feels flat or underinflated",
      "You want to understand how to use the pressure settings",
    ],
    whatItMeans:
      "An alternating pressure mattress uses a pump to alternately inflate and deflate air cells within the mattress on a cycle (usually every 5–10 minutes). This continuously shifts pressure points, dramatically reducing the risk of pressure sores (bedsores) in someone who is mostly in bed. The pump sound is normal — it is working when you hear it cycling.",
    whatToDoNow: [
      {
        text: "Confirm the pump is plugged in and the hose connecting the pump to the mattress is firmly attached at both ends.",
      },
      {
        text: "The pump should make a gentle hum and cycle sound regularly — this is normal. If it is completely silent for a long period, check the power connection.",
        tip: "Some pumps have an indicator light that shows it is cycling. Green usually means working correctly.",
      },
      {
        text: "Adjust the pressure setting based on your loved one's weight and hospice's instructions. Most pumps have a dial — a higher number means firmer inflation.",
        caution: "If unsure about the correct pressure setting, call hospice rather than guessing. Too low and the person bottoms out; too high reduces the alternating benefit.",
      },
      {
        text: "Use only one layer of a regular flat sheet over the mattress. Do not use thick mattress pads, egg-crate foam overlays, or multiple layers on top — these defeat the pressure-relief benefit.",
      },
      {
        text: "If an alarm is sounding: check for a disconnected hose, a kinked hose, or a punctured air cell (you may feel or hear air escaping). Reconnect, unkink, or call the equipment provider.",
      },
      { text: "Continue your regular repositioning schedule even with the mattress — it helps but does not replace turning." },
    ],
    whatToAvoid: [
      "Do not use thick mattress pads or heavy blankets draped over the mattress",
      "Do not sit or stand on the mattress — it is not designed for that weight and shape",
      "Do not ignore a pump alarm — address it or call the equipment provider",
      "Do not use safety pins or sharp objects near the mattress",
    ],
    whenToCallHospice: [
      "A new pressure sore has appeared despite using the mattress",
      "The pump alarm cannot be resolved",
      "You are unsure whether the pressure setting is correct",
    ],
    whatHappensNext:
      "If the pump fails, the equipment provider has 24-hour service and can replace it. Hospice can also assess any skin concerns and adjust the care plan, including more frequent repositioning or wound care.",
  },
  {
    id: "cpap-bipap-hospice",
    categoryId: "equipment",
    title: "CPAP or BiPAP in Hospice",
    subtitle: "Whether to continue sleep apnea equipment and how to decide",
    urgencyLevel: "routine",
    icon: "wind",
    tags: ["cpap", "bipap", "sleep apnea machine", "breathing machine", "continue cpap", "stop cpap", "respiratory equipment"],
    whatYouMayNotice: [
      "Your loved one has been using CPAP or BiPAP for sleep apnea",
      "You are wondering whether to keep using it now that they are on hospice",
      "The mask is uncomfortable and causing skin irritation",
      "They no longer seem to want to wear it",
    ],
    whatItMeans:
      "CPAP and BiPAP machines were prescribed to treat obstructive sleep apnea, which is a chronic condition. In hospice, the goal shifts from treating chronic conditions to maximizing comfort. Many people in hospice find the mask uncomfortable, especially as they spend more time sleeping. Whether to continue is a personal decision that should be made with the hospice team, weighing comfort against any benefit.",
    whatToDoNow: [
      {
        text: "Talk with the hospice nurse or physician about whether CPAP or BiPAP is still serving a comfort purpose.",
        tip: "If the person is sleeping most of the time and the mask is waking or disturbing them, it is often appropriate to discontinue it.",
      },
      {
        text: "If you decide to continue using it: ensure the mask fits well and there is no skin breakdown from the mask straps. Check the bridge of the nose and the forehead daily.",
      },
      {
        text: "If the mask is causing skin breakdown or sores: stop using it and call hospice — skin comfort comes first.",
        caution: "Mask sores on the nose or face can become serious quickly in someone who is immobile.",
      },
      {
        text: "If your loved one resists the mask or removes it during sleep: this is often a signal that it is no longer comfortable or acceptable to them. This can be honored.",
      },
      {
        text: "Stopping CPAP or BiPAP does not cause immediate distress in most hospice patients — the conditions that make sleep apnea dangerous in healthy people are different at end of life.",
      },
    ],
    whatToAvoid: [
      "Do not feel obligated to force the mask if the person resists",
      "Do not stop without at least a brief conversation with the hospice team",
      "Do not assume continuing CPAP is required — it is not a hospice-covered comfort therapy in most cases",
    ],
    whenToCallHospice: [
      "Skin breakdown is occurring under the mask",
      "You are unsure whether to continue or discontinue",
      "The person seems distressed by the equipment",
      "You would like guidance on the decision",
    ],
    whatHappensNext:
      "The hospice team will help you weigh the benefits and burdens. In most cases, comfort is prioritized and CPAP or BiPAP is gradually or immediately discontinued. Hospice can also address any breathing discomfort that follows with medications.",
  },
];

const emotional: GuidanceScenario[] = [
  {
    id: "caregiver-overwhelm",
    categoryId: "emotional",
    title: "Caregiver Overwhelm",
    subtitle: "When you are exhausted, stressed, or feel you cannot continue",
    urgencyLevel: "soon",
    icon: "heart",
    tags: ["overwhelmed", "burnout", "caregiver stress", "exhausted", "can't do this", "caregiver fatigue", "need help", "breaking down"],
    whatYouMayNotice: [
      "Feeling exhausted even after rest",
      "Feeling resentful, isolated, or hopeless",
      "Crying more than usual or feeling numb",
      "Neglecting your own health or meals",
      "Feeling like you cannot do this anymore",
      "Anger or frustration that scares you",
    ],
    whatItMeans:
      "Caregiver burnout is real, serious, and very common. It does not mean you have failed. It means you are human and have been carrying an enormous weight. Acknowledging this is not weakness — it is wisdom. There are real supports available through hospice designed exactly for this.",
    whatToDoNow: [
      { text: "Call hospice and tell them honestly how you are feeling — this is within their scope of support." },
      { text: "Ask for a visit from the hospice social worker — they specialize in exactly this." },
      { text: "Ask about respite care — hospice provides short-term inpatient stays so caregivers can rest." },
      { text: "Accept help when offered — even small tasks like a meal or an errand make a difference." },
      { text: "Give yourself permission to step outside, cry, or call someone you trust." },
    ],
    whatToAvoid: [
      "Do not keep pushing through alone until you break — ask for help before that point",
      "Do not shame yourself for feeling overwhelmed",
      "Do not isolate — connection is one of the most protective things during this time",
    ],
    whenToCallHospice: [
      "You feel you cannot safely continue caregiving",
      "You are having thoughts of harming yourself or the person you are caring for",
      "You feel emotionally or physically unable to provide care",
      "You want to request respite care",
    ],
    whatHappensNext:
      "Hospice will connect you with the social worker and can arrange respite care, additional aide visits, or volunteer support. If you are in immediate emotional crisis, the 988 Suicide and Crisis Lifeline (call or text 988) is available 24 hours.",
  },
  {
    id: "patient-asking-if-dying",
    categoryId: "emotional",
    title: "Patient Asks If They Are Dying",
    subtitle: "How to respond when your loved one asks about death",
    urgencyLevel: "routine",
    icon: "message-circle",
    tags: ["am I dying", "how long do I have", "patient asking about death", "difficult conversation", "what do I say"],
    whatYouMayNotice: [
      "Your loved one directly asks 'Am I dying?' or 'How long do I have?'",
      "They make comments that suggest they know they are approaching death",
      "They want to talk about death and you are not sure how to respond",
    ],
    whatItMeans:
      "When a person in hospice asks about dying, they are usually not looking for a medical prognosis — they are looking for honesty, connection, and reassurance that they will not be alone. These conversations, while hard, are deeply meaningful and often a relief for everyone.",
    whatToDoNow: [
      { text: "Take a breath. Sit down with them. Let them know you are not in a rush." },
      { text: "Reflect the question back gently: 'What are you feeling right now?' or 'What made you think about that today?'" },
      { text: "If they want honesty, you can say something like: 'Yes, the doctors have told us that your illness is serious and that we may not have a lot of time. But I want you to know that you won't be alone and we will keep you comfortable.'" },
      { text: "It is okay to cry together. It is okay to say 'I don't know what to say, but I love you.'" },
      { text: "Ask what they need: 'Is there something you are worried about? Is there something you want to do or say?'" },
      { text: "Call the hospice social worker or chaplain — they are trained for this and can be present for these conversations." },
    ],
    whatToAvoid: [
      "Do not change the subject or offer false reassurance ('You're going to be fine!') if they are sincerely asking",
      "Do not leave them alone after a difficult conversation",
      "Do not feel you must have the perfect words — your presence matters more than what you say",
    ],
    whenToCallHospice: [
      "You want support for this conversation before or after it happens",
      "Your loved one seems very distressed or anxious",
      "You want the chaplain or social worker to be present",
    ],
    whatHappensNext:
      "Hospice social workers and chaplains have extensive experience with these conversations and can help both you and your loved one process them. Many people report that having honest, loving conversations about death brings enormous peace.",
  },
  {
    id: "children-asking-questions",
    categoryId: "emotional",
    title: "Children Asking About Illness or Death",
    subtitle: "How to talk to children about what is happening",
    urgencyLevel: "routine",
    icon: "users",
    tags: ["children", "kids", "explaining death", "what do I tell the kids", "children and hospice", "grandchildren asking"],
    whatYouMayNotice: [
      "A child is asking questions about why their loved one is sick",
      "A child is asking if their relative is going to die",
      "A child is acting out, withdrawing, or showing signs of distress",
    ],
    whatItMeans:
      "Children are perceptive and almost always sense when something serious is happening, even when adults try to hide it. Honest, age-appropriate explanations — using real words like 'dying' — help children cope far better than silence or confusion. Hospice social workers and bereavement counselors specialize in supporting children through this.",
    whatToDoNow: [
      { text: "Use simple, honest language. Children do better with truth than with euphemisms that confuse them." },
      { text: "For young children (ages 3–6): 'Grandma is very, very sick. The doctors cannot make her better. She is going to die, which means her body will stop working and she won't be with us anymore. But we will always love her and remember her.'" },
      { text: "For older children: be more direct and allow them to ask questions. Answer honestly. 'I don't know' is okay." },
      { text: "Let them feel — do not tell them not to cry. Cry together if needed." },
      { text: "Ask them what they are thinking and what they are worried about." },
      { text: "Give them choices: 'Would you like to visit? It's okay if you don't want to.'" },
      { text: "Maintain routines where possible — school, activities — they are grounding." },
    ],
    whatToAvoid: [
      "Do not use euphemisms like 'went to sleep' or 'passed away to heaven' with very young children without explaining what dying means",
      "Do not tell children to be strong or not to cry",
      "Do not exclude children from the process entirely — they often do better when included appropriately",
    ],
    whenToCallHospice: [
      "A child is showing significant behavioral changes or distress",
      "You want guidance on how to have this conversation",
      "You want the social worker to speak with the child or teen",
    ],
    whatHappensNext:
      "Hospice social workers and bereavement counselors can meet with children and teens, and often have age-appropriate resources and activities. Many hospices also offer children's grief groups. Bereavement support for children continues after the death.",
  },
  {
    id: "anticipatory-grief",
    categoryId: "emotional",
    title: "Grieving Before the Death",
    subtitle: "Understanding anticipatory grief — the mourning that happens while your loved one is still alive",
    urgencyLevel: "routine",
    icon: "cloud",
    tags: ["anticipatory grief", "grieving before death", "grief", "mourning", "loss", "sadness", "pre-death grief", "already grieving"],
    whatYouMayNotice: [
      "Feeling profound sadness even while your loved one is still alive",
      "Crying or feeling grief as if the person is already gone",
      "Feeling guilty for grieving 'too soon'",
      "Going through waves of sadness, numbness, anger, and unexpected moments of peace",
      "Finding it hard to be present because of the anticipation of loss",
    ],
    whatItMeans:
      "Anticipatory grief is the grief that begins before a death and is entirely normal. You are mourning not just the future loss, but many losses already happening — the person's health, your old life, shared future plans, and the relationship as it was. This grief does not mean you have given up hope or that you love them any less. Research shows that anticipatory grief can actually help with adjustment after the death — it is not something to fight.",
    whatToDoNow: [
      {
        text: "Allow yourself to feel what you feel without judgment. Grief before death is real grief — it deserves the same compassion you would give anyone who is grieving.",
        tip: "You do not have to choose between grieving and cherishing the time that remains. Both can happen at once.",
      },
      { text: "Talk about it — to a friend, a family member, or the hospice social worker. Naming the feeling reduces its power to isolate you." },
      {
        text: "Find ways to be present with your loved one right now. Grief about the future can be anchored by the reality of today — they are still here.",
      },
      { text: "Journal, pray, walk, make art, or do whatever helps you process emotion — there is no wrong way to grieve." },
      {
        text: "If grief is making it hard to function or care safely, call hospice. The social worker and chaplain can provide regular support.",
      },
    ],
    whatToAvoid: [
      "Do not feel guilty for grieving before the death — it is healthy and human",
      "Do not suppress your grief entirely — it will find its way out",
      "Do not feel that your grief means you want the person to die",
      "Do not compare your grief to others' — there is no correct way to grieve",
    ],
    whenToCallHospice: [
      "Grief is interfering with your ability to care or function",
      "You want to talk with the social worker or chaplain",
      "You are feeling isolated, hopeless, or having thoughts of harming yourself",
    ],
    whatHappensNext:
      "The hospice team — social worker, chaplain, and bereavement counselor — are available to support you both before and after the death. You do not have to navigate this alone. The 988 Suicide and Crisis Lifeline (call or text 988) is available 24 hours if you are in emotional crisis.",
  },
  {
    id: "family-disagreements",
    categoryId: "emotional",
    title: "Family Disagreements About Care",
    subtitle: "When family members cannot agree on decisions or approach",
    urgencyLevel: "soon",
    icon: "alert-circle",
    tags: ["family disagreement", "family conflict", "arguing about care", "disagreement hospice", "family meeting", "care decisions conflict"],
    whatYouMayNotice: [
      "Family members disagree on whether hospice was the right choice",
      "Conflict over how much pain medication to give",
      "Some family members want aggressive treatment and others do not",
      "One family member is undermining the care plan",
      "Tension or arguments during an already stressful time",
    ],
    whatItMeans:
      "Family conflict during hospice is very common. People who love the same person often have different beliefs, different relationships with the patient, different levels of information, and different ways of coping with loss. Conflict usually comes from love — and from fear. The hospice team is experienced in navigating family conflict and can be a neutral, supportive resource.",
    whatToDoNow: [
      {
        text: "Request a family meeting facilitated by the hospice social worker. This is one of the most valuable things hospice offers — a neutral space where everyone can be heard.",
        tip: "Family meetings can happen in person, by phone, or by video for members who are distant.",
      },
      {
        text: "Keep the focus on the patient's wishes and comfort. When conversation gets heated, return to the question: 'What would [name] want right now?'",
      },
      {
        text: "Share information equally — sometimes conflict comes from family members not having the same clinical picture. Ask hospice to speak directly with the family member who is struggling.",
        caution: "HIPAA applies — the patient or their health care proxy needs to authorize sharing of medical information with other family members.",
      },
      { text: "Be patient with family members who are in denial or shock — they may be in an earlier stage of grief than you. Confrontation often increases resistance." },
      { text: "Protect the patient from hearing conflicts — stress and tension can affect their comfort even when they seem unresponsive." },
    ],
    whatToAvoid: [
      "Do not argue at the bedside",
      "Do not make unilateral care decisions without the health care proxy's involvement",
      "Do not exclude the patient from their own care decisions if they are still able to participate",
      "Do not let conflict delay comfort care — if there is an acute need, call hospice and address the care need first",
    ],
    whenToCallHospice: [
      "You need a family meeting facilitated by the social worker",
      "A family member is interfering with the care plan",
      "You are not sure who has the legal authority to make decisions",
      "The conflict is affecting the patient's comfort or care",
    ],
    whatHappensNext:
      "The hospice social worker and sometimes the medical director can help mediate. They can clarify the legal authority of the health care proxy, explain the care plan in terms family members can understand, and create space for everyone's concerns to be heard. Family meetings often de-escalate conflict significantly.",
  },
];

const hospiceServices: GuidanceScenario[] = [
  {
    id: "hospice-team-roles",
    categoryId: "hospice-services",
    title: "Who Is on the Hospice Team?",
    subtitle: "Understanding each team member's role and how to reach them",
    urgencyLevel: "routine",
    icon: "users",
    tags: ["hospice team", "nurse", "social worker", "chaplain", "aide", "volunteers", "who to call"],
    whatYouMayNotice: [
      "You are not sure who to call for different needs",
      "You are not sure what services are available to you",
      "You want to know how to request additional support",
    ],
    whatItMeans:
      "Hospice is a team — not just a nurse who visits. Every member of the team has a different specialty and can provide different kinds of support. You can request any of them at any time.",
    whatToDoNow: [
      { text: "Hospice Nurse (RN): Your primary clinical contact. Call the main hospice line for any medical questions, symptom concerns, or medication needs. They can visit, send medications, and contact the physician on your behalf." },
      { text: "Hospice Aide (CNA): Helps with bathing, grooming, mouth care, and personal hygiene. Usually visits 2–5 times per week depending on need. Ask for more visits if needed." },
      { text: "Social Worker (MSW): Helps with emotional support, family communication, caregiver stress, paperwork, community resources, and advance care planning. Request a visit anytime." },
      { text: "Chaplain: Provides spiritual support for any faith background — or none. Helps with finding meaning, processing fears, and supporting peaceful dying. Not just for religious families." },
      { text: "Volunteers: Can sit with your loved one, run errands, provide companionship, or give caregivers a break. Trained and supervised by hospice. Ask your team to connect you." },
      { text: "Bereavement Counselor: Supports families before and after the death. Available for up to 13 months after loss." },
    ],
    whatToAvoid: [
      "Do not wait to ask for support — hospice is designed to be proactive",
      "Do not assume a service is unavailable — ask before assuming",
    ],
    whenToCallHospice: [
      "Anytime you want to request any of these team members",
      "To increase aide visit frequency",
      "To request a social worker or chaplain visit",
    ],
    whatHappensNext:
      "Your hospice coordinator or nurse can connect you with any team member. Most requests can be accommodated within 24–48 hours, and urgent requests are handled same-day.",
  },
  {
    id: "respite-care",
    categoryId: "hospice-services",
    title: "Respite Care",
    subtitle: "Short-term inpatient stays so caregivers can rest",
    urgencyLevel: "routine",
    icon: "home",
    tags: ["respite", "respite care", "break from caregiving", "inpatient hospice", "caregiver rest", "short stay"],
    whatYouMayNotice: [
      "You are exhausted and need time to rest",
      "You have a family emergency or commitment that takes you away",
      "You need a break to recover physically or emotionally",
    ],
    whatItMeans:
      "Respite care is a Medicare hospice benefit that allows caregivers to take a break. The patient stays at an inpatient hospice facility or nursing facility for up to 5 consecutive days at a time so that the primary caregiver can rest. It is not a sign of giving up — it is a planned, temporary break.",
    whatToDoNow: [
      { text: "Call your hospice team and ask to discuss respite care." },
      { text: "Tell them honestly why you need a break and when you think you might need it." },
      { text: "Respite can often be planned in advance — it does not need to be a crisis situation." },
      { text: "Ask what the facility is like and whether you can visit before the stay." },
    ],
    whatToAvoid: [
      "Do not wait until you have collapsed from exhaustion to ask",
      "Do not feel guilty — respite is a built-in part of the hospice benefit for exactly this reason",
    ],
    whenToCallHospice: [
      "You need a break and want to arrange respite care",
      "You are in crisis and need emergency respite immediately",
    ],
    whatHappensNext:
      "Hospice will arrange a facility stay, handle the paperwork, and coordinate the transfer. When you are ready, your loved one returns home. Respite care is fully covered under the Medicare hospice benefit.",
  },
  {
    id: "continuous-home-care",
    categoryId: "hospice-services",
    title: "Crisis Care at Home",
    subtitle: "When hospice can send continuous nursing support during a medical crisis",
    urgencyLevel: "soon",
    icon: "activity",
    tags: ["crisis care", "continuous home care", "hospice nurse staying", "overnight nurse", "24 hour care", "nurse stays home", "crisis at home"],
    whatYouMayNotice: [
      "Symptoms are very difficult to control and you feel overwhelmed",
      "You need someone present overnight because you cannot manage alone",
      "Your loved one is in acute distress and you need consistent nursing support",
    ],
    whatItMeans:
      "Continuous Home Care (also called Crisis Care) is a Medicare hospice benefit that provides nursing or hospice aide support for most of a 24-hour period when symptoms cannot be managed with the regular care plan. A nurse can be in your home for extended hours during an acute crisis. This is one of the most underused hospice benefits — many families do not know it exists.",
    whatToDoNow: [
      {
        text: "Call hospice and clearly describe what is happening: what symptoms are uncontrolled, how long it has been, and why you feel you need consistent support.",
        tip: "Be direct: 'I cannot manage this on my own right now. I need more support in the home.'",
      },
      { text: "Ask specifically: 'Is my loved one eligible for crisis-level care or continuous home care right now?'" },
      { text: "While waiting for the response or for a nurse to arrive: use the comfort kit for symptom management as directed, keep the environment calm, and stay close." },
    ],
    whatToAvoid: [
      "Do not assume that having a nurse available by phone is all hospice can offer — continuous home care is a real option",
      "Do not wait until you are in complete crisis to ask — the earlier you call, the sooner support can be arranged",
    ],
    whenToCallHospice: [
      "Symptoms are not manageable and you need hands-on support",
      "You are unsafe to be alone with the patient in their current condition",
      "You want to ask whether crisis-level care is appropriate",
    ],
    whatHappensNext:
      "If criteria are met, hospice will arrange for a nurse to be present in your home for an extended period. Once the crisis is stabilized, care transitions back to the regular level. This benefit is specifically designed to keep people at home and out of the emergency room during difficult moments.",
  },
  {
    id: "advance-directives",
    categoryId: "hospice-services",
    title: "DNR, POLST & Advance Directives",
    subtitle: "Understanding legal documents that guide care decisions",
    urgencyLevel: "routine",
    icon: "file-text",
    tags: ["DNR", "do not resuscitate", "POLST", "MOLST", "advance directive", "living will", "healthcare proxy", "power of attorney", "code status"],
    whatYouMayNotice: [
      "You are not sure what documents your loved one has or needs",
      "A hospital or care facility is asking about code status",
      "You want to make sure your loved one's wishes are documented",
      "You are unsure about the difference between a DNR and a living will",
    ],
    whatItMeans:
      "Several different legal documents guide medical decisions at end of life. They serve different purposes and are used in different situations. Understanding what each one does — and making sure the right ones are in place — helps ensure your loved one's wishes are honored, especially if you need to call 911 or go to a hospital.",
    whatToDoNow: [
      {
        text: "DNR (Do Not Resuscitate): An order that tells emergency responders and medical staff not to attempt CPR if the heart stops. In hospice, most patients have a DNR. Without one, emergency responders are legally required to attempt resuscitation.",
        tip: "Keep a copy of the DNR visibly accessible in the home — on the refrigerator or near the front door — so it can be found immediately in an emergency.",
      },
      {
        text: "POLST / MOLST (Physician Orders for Life-Sustaining Treatment / Medical Orders for Life-Sustaining Treatment): A medical order signed by a physician that travels with the patient and guides emergency responders about resuscitation, hospitalization, and other interventions. More powerful than an advance directive in an emergency.",
      },
      {
        text: "Living Will / Advance Directive: A document written by the patient (while still able) expressing their wishes about specific medical interventions. Guides decision-makers but is not itself a medical order.",
      },
      {
        text: "Healthcare Proxy / Durable Power of Attorney for Healthcare: A document naming who has the legal authority to make medical decisions if the patient cannot. If you are not formally named as proxy, your authority to make decisions may be limited.",
        caution: "If there is no healthcare proxy document and the patient cannot speak for themselves, medical decisions may default to next-of-kin in a legally defined order — which may not match the patient's wishes.",
      },
      { text: "Ask your hospice nurse or social worker which documents are in place and whether any are missing. They can help facilitate getting documents signed." },
    ],
    whatToAvoid: [
      "Do not assume these documents are all the same thing — each has a different legal purpose",
      "Do not wait until a crisis to find out whether documents exist",
      "Do not call 911 without knowing the code status — if a DNR is in place, calling 911 can override it unless first responders can see it",
    ],
    whenToCallHospice: [
      "You want to confirm which documents are in place",
      "You are unsure about code status",
      "You need help getting a POLST signed or updated",
      "A family conflict has arisen about who has legal decision-making authority",
    ],
    whatHappensNext:
      "The hospice social worker can review which documents are in place, explain what each means, and help arrange for any missing documents to be completed. The hospice physician can sign a POLST. These conversations are best done early and calmly, before a crisis.",
  },
  {
    id: "crisis-care-gip",
    categoryId: "hospice-services",
    title: "When to Ask for Hospital-Level Hospice Care",
    subtitle: "Intensive nursing at home or an inpatient facility — options most families never hear about",
    urgencyLevel: "immediate",
    icon: "alert-triangle",
    callHospiceNow: true,
    tags: [
      "crisis", "hospital", "inpatient", "uncontrolled pain", "can't manage at home",
      "crisis care", "hospital level", "intensive nursing", "continuous care", "severe symptoms",
      "GIP", "CHC", "general inpatient", "continuous home care", "respiratory distress",
      "agitation crisis", "refractory nausea", "symptoms out of control",
    ],
    whatYouMayNotice: [
      "Pain that does not respond to the comfort kit medications you have at home",
      "Severe difficulty breathing — gasping, fast breathing, air hunger that won't calm down",
      "Extreme agitation or restlessness that does not respond to comfort measures",
      "Nausea or vomiting so severe that medications cannot be kept down",
      "You feel you cannot safely manage what is happening alone at home",
    ],
    whatItMeans:
      "Medicare's hospice benefit includes two higher levels of care that go beyond the standard nursing visits most families receive. The first is intensive nursing at home (sometimes called Continuous Home Care or Crisis Care): a nurse comes to your home and stays for most of a 24-hour period until the crisis is controlled. The second is hospital-level care at a facility (called General Inpatient or GIP): your loved one moves temporarily to an inpatient hospice unit or hospital for intensive symptom management, then returns home when stable. Both are fully covered under Medicare when criteria are met — but families almost never learn these options exist until they are already in crisis. The goal is to control symptoms and avoid a 911 call, which breaks the hospice plan and often leads to unnecessary hospital admission.",
    whatToDoNow: [
      {
        text: "Call your hospice nurse right now and use these words: 'I need to request continuous care or crisis-level care. Symptoms are not controlled and I cannot manage this safely at home.'",
        tip: "Being specific about the words 'continuous care' or 'crisis care' or 'general inpatient' helps the nurse understand you know your rights. They must assess whether criteria are met.",
      },
      {
        text: "Describe what you are seeing clearly: which symptoms are uncontrolled, for how long, and what you have already tried. If comfort kit medications are not working, say so explicitly.",
      },
      {
        text: "If intensive home nursing is arranged (Continuous Home Care), a nurse will come to your home and stay for hours at a time — typically 8 or more hours per day. They will administer and adjust medications directly. You do not need to manage alone.",
      },
      {
        text: "If an inpatient stay is arranged (General Inpatient), your loved one will be transported to an inpatient hospice unit or designated hospital unit with around-the-clock nursing. Once symptoms are controlled — usually within 1–3 days — they return home.",
        tip: "GIP is not giving up on home care. It is a temporary move to control symptoms, followed by return home when stabilized.",
      },
      {
        text: "While waiting for the nurse's response: use any comfort kit medications as directed, keep the environment as calm as possible, and do not leave your loved one alone if they are in distress.",
        caution: "Do not call 911 unless the hospice nurse instructs you to. A 911 call bypasses the hospice plan and typically results in hospital admission and loss of hospice comfort care.",
      },
    ],
    whatToAvoid: [
      "Do not assume that phone guidance is the only level of support hospice can offer during a crisis",
      "Do not wait until you have completely exhausted yourself before asking for crisis-level support",
      "Do not call 911 as a first response — call hospice first and let them guide you",
      "Do not accept 'just watch and wait' if symptoms are severe and uncontrolled — you have the right to request an assessment for crisis care",
    ],
    whenToCallHospice: [
      "Pain is above 7/10 and not responding to comfort kit medications",
      "Breathing is severely distressed and comfort measures at home are not helping",
      "Agitation or restlessness is extreme and the person cannot be settled",
      "Nausea is severe enough that medications cannot be kept down",
      "You feel unsafe or unable to provide the level of care needed at home",
    ],
    whatHappensNext:
      "The hospice nurse will assess whether criteria for crisis-level care are met. If they qualify: Continuous Home Care can begin within hours, with a nurse coming to your home. General Inpatient care requires a transfer and is arranged the same day when medically necessary. If the hospice says criteria are not met, ask them to explain why in writing and ask what would need to change for that to be reassessed. If you feel the denial is wrong, you have the right to contact your Medicare Quality Improvement Organization (QIO) for a fast appeal — hospice must inform you of this right.",
  },
  {
    id: "volunteer-services",
    categoryId: "hospice-services",
    title: "Hospice Volunteer Support",
    subtitle: "What hospice volunteers can do for you — and how to ask",
    urgencyLevel: "routine",
    icon: "gift",
    tags: ["volunteer", "hospice volunteer", "companionship", "errands", "caregiver break", "sitting with patient", "volunteer visit"],
    whatYouMayNotice: [
      "You are overwhelmed and could use another set of hands",
      "Your loved one would benefit from companionship when you cannot be there",
      "You need help with errands or practical tasks",
      "You did not know volunteers were available",
    ],
    whatItMeans:
      "Hospice volunteers are a federally required part of the hospice program. They are trained, background-checked, and supervised by hospice. They are available at no additional cost. Most caregivers do not use this service simply because they do not know it exists or do not ask. Volunteers can provide meaningful practical relief.",
    whatToDoNow: [
      { text: "Call your hospice team and say: 'I would like to be connected with a hospice volunteer.'" },
      {
        text: "Common things volunteers can help with include: sitting with your loved one so you can sleep or leave the house; reading aloud, playing music, or simply providing companionship; running errands, picking up medications, or grocery shopping; light yard work or household tasks; writing letters or cards on behalf of the patient.",
        tip: "Volunteers are not medical caregivers — they do not give medications or perform medical tasks. But the practical and companionship support they provide can be enormous.",
      },
      { text: "Tell hospice what would be most helpful — they will try to match a volunteer whose skills and personality fit your situation." },
    ],
    whatToAvoid: [
      "Do not assume volunteers are only for companionship — ask what your specific hospice offers",
      "Do not hesitate to ask — volunteers signed up specifically to help in this way",
    ],
    whenToCallHospice: [
      "Anytime you want to request a volunteer",
      "When you want companionship support for your loved one",
      "When you need practical help with errands or tasks",
    ],
    whatHappensNext:
      "Hospice will coordinate a volunteer and match you based on availability and need. Volunteer visits can be scheduled regularly or on an as-needed basis. Many families form meaningful connections with hospice volunteers.",
  },
];

const endOfLife: GuidanceScenario[] = [
  {
    id: "final-days-what-to-expect",
    categoryId: "end-of-life",
    title: "The Final Days — What to Expect",
    subtitle: "Signs that death may be 1–3 days away and what is normal",
    urgencyLevel: "soon",
    icon: "sunset",
    tags: ["final days", "dying signs", "close to death", "last few days", "actively dying", "signs death is near", "what to expect"],
    whatYouMayNotice: [
      "Sleeping much more — sometimes almost all the time",
      "Not wanting food or water, even small amounts",
      "Skin on hands, feet, knees, or nose appears mottled (blotchy purple-blue patterns)",
      "Hands and feet feel cool even when the rest of the body is warm",
      "Breathing becomes irregular — faster, then slower, with pauses",
      "Jaw may relax, mouth may hang open",
      "Eyes may be partially open but unfocused",
      "They may become unresponsive to your voice or touch",
      "Urine output decreases significantly or stops",
    ],
    whatItMeans:
      "These signs tell you that the body is slowing down and turning its energy inward. They are a natural part of the dying process — not a medical emergency, not a sign of pain or suffering, and not something to reverse. Mottling (the blotchy coloring) is one of the most reliable signs that death is within hours to a few days. The decreased need for food and water is the body's way of easing the transition — the person is not starving. These are signs to be with, not to fight.",
    whatToDoNow: [
      {
        text: "Call hospice and let them know what you are seeing. They will come to assess, guide you, and help you know what stage you are in.",
        tip: "You do not need to have the 'right' words. Just describe what you see: 'Their breathing has changed. Their hands are cold. I think we might be close.'",
      },
      {
        text: "Gather those who need to be present. If family members need to travel, now is the time to make those calls.",
      },
      {
        text: "Continue mouth care with a damp swab — even if they are not drinking, keeping the mouth moist is comforting.",
      },
      {
        text: "Keep medications available and use as directed for any signs of pain, restlessness, or difficult breathing — do not wait to see if it passes.",
      },
      {
        text: "Speak to them softly. Hearing is believed to remain until the very end. Tell them who is in the room. Tell them what you need to tell them. Give them permission to go.",
        tip: "Many people seem to wait for permission — for everyone to arrive, or for someone they love to say 'It's okay. We'll be okay. You can go.'",
      },
      {
        text: "Take care of yourself too — eat something, step outside for a few minutes, let others take a turn at the bedside.",
      },
    ],
    whatToAvoid: [
      "Do not call 911 for these changes — they are expected and normal in hospice",
      "Do not try to rouse them with loud voices or strong stimulation",
      "Do not force food or water — the body no longer needs it and it can cause discomfort",
      "Do not leave them alone if you can avoid it — most people do not want to die alone",
    ],
    whenToCallHospice: [
      "When you first notice these signs — hospice should be updated",
      "When you are unsure whether something is comfort-related",
      "When you need medication guidance or replenishment",
      "When you need emotional support or just to talk to someone",
    ],
    whatHappensNext:
      "Hospice will visit to assess and can give you a clearer sense of timing, though no one can predict the exact moment. They will ensure medications are stocked, walk you through what to expect in the hours ahead, and be available by phone around the clock. You are not alone in this.",
  },
  {
    id: "last-hours",
    categoryId: "end-of-life",
    title: "The Final Hours",
    subtitle: "What the last hours of life look like and how to be present",
    urgencyLevel: "immediate",
    icon: "moon",
    tags: ["final hours", "last hours", "actively dying", "imminent death", "very close to death", "hours away"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "Breathing has changed to Cheyne-Stokes pattern — clusters of breaths followed by long pauses (10–60 seconds)",
      "Breathing sounds wet or rattling",
      "The jaw is relaxed and the mouth is open",
      "Eyes are partially open but unseeing",
      "No response to voice or touch",
      "Mottling (purple-blue blotching) has spread from extremities toward the trunk",
      "Skin feels cool and may look very pale, gray, or slightly yellow",
      "Complete stillness",
    ],
    whatItMeans:
      "These are signs that death is likely within hours, sometimes minutes. The body is completing a natural process. The person is not in pain — in fact, at this stage they are typically deeply unconscious. The sounds of breathing can be alarming to witness but are not a sign of distress. This is one of the most sacred moments a family can share.",
    whatToDoNow: [
      {
        text: "Call hospice now. Tell them what you are observing. A nurse may come or guide you by phone. Either way, you will not be alone.",
      },
      {
        text: "Gather the people who need to be there. Make those calls now.",
        caution: "If someone is traveling to be present, let them know the timeline honestly so they can make decisions about how quickly to come.",
      },
      {
        text: "Be present in whatever way feels right to you — hold their hand, sit beside them, play soft music, pray, or simply breathe.",
      },
      {
        text: "Speak to them. Even if they cannot respond, hearing remains. Say what you need to say. 'I love you. Thank you. We will be okay. You can rest now.'",
        tip: "There is no wrong thing to say. Your presence and your voice are the gift.",
      },
      {
        text: "Continue giving medications for any visible signs of discomfort — labored breathing, visible agitation, or facial tension. Call hospice if you are unsure.",
      },
      {
        text: "When death occurs: take a moment. You do not need to do anything immediately. Call hospice — not 911 — when you are ready.",
      },
    ],
    whatToAvoid: [
      "Do not call 911 — call hospice",
      "Do not attempt resuscitation if there is a DNR in place",
      "Do not feel you must fill the silence — silence is okay",
      "Do not feel you failed if you were not in the room when death occurred — many people seem to choose to go when loved ones step away briefly",
    ],
    whenToCallHospice: [
      "Now — call hospice when you observe these signs",
      "When death occurs — hospice is your first call",
    ],
    whatHappensNext:
      "After death, hospice will guide every next step. A nurse will come to confirm the death and complete the necessary documentation. There is no rush. You have time to be with your loved one, to gather family, and to say goodbye before the funeral home is called.",
  },
  {
    id: "meaningful-goodbye",
    categoryId: "end-of-life",
    title: "Saying a Meaningful Goodbye",
    subtitle: "How to be present, what to say, and how to complete your relationship",
    urgencyLevel: "routine",
    icon: "heart",
    tags: ["goodbye", "saying goodbye", "what to say", "final words", "meaningful time", "completing relationship", "last conversation", "end of life conversation"],
    whatYouMayNotice: [
      "You want to say something meaningful but don't know how to start",
      "You are worried about saying the wrong thing",
      "Your loved one may not be able to respond but you want to reach them",
      "You want to make the most of the time that remains",
    ],
    whatItMeans:
      "Meaningful goodbyes are not about having perfect words. They are about presence, honesty, and love. Research on what dying people most need reveals a consistent pattern: they want to know they are loved, they want forgiveness (given and received), they want to know their life mattered, and they want permission to go. These are things you can offer, whatever the circumstances.",
    whatToDoNow: [
      {
        text: "The five things: Hospice chaplains and grief counselors often teach the 'five things' framework — five things people need to say and hear at end of life:",
        tip: "'I love you.' 'Thank you.' 'I forgive you.' 'Please forgive me.' 'Goodbye.' These do not all need to be said in one conversation. They can happen over time, in any order.",
      },
      {
        text: "Speak simply and directly. If your loved one is still alert: 'I just want you to know how much I love you. You have meant everything to me.' You do not need an elaborate speech.",
      },
      {
        text: "If they are unresponsive: speak to them anyway. Assume they can hear. Tell them who is in the room. Tell them about your love. Tell them what you will carry forward from knowing them.",
      },
      {
        text: "Share memories together — tell a story, recall a moment from your shared life. Even if they cannot respond, these stories surround them.",
      },
      {
        text: "Give permission if it feels true. 'You don't have to worry about us. We'll take care of each other. It's okay to rest now.' Many people seem to hold on waiting for this.",
        tip: "Saying 'you can go' does not mean you want them to go. It means you are releasing them from the obligation to stay.",
      },
      {
        text: "Take care of yourself in these conversations — step outside when you need to, cry without shame, ask hospice for support before or after.",
      },
    ],
    whatToAvoid: [
      "Do not wait for the 'right moment' — the right moment is now",
      "Do not assume they cannot hear because they are unresponsive",
      "Do not feel you must stay stoic — tears are part of love",
      "Do not leave things unsaid if you can say them now",
    ],
    whenToCallHospice: [
      "You would like support from the hospice chaplain or social worker for these conversations",
      "You are struggling emotionally and want to talk with someone",
      "You want guidance on how to support other family members or children during this time",
    ],
    whatHappensNext:
      "The hospice chaplain and social worker are trained to support these conversations and can be present with you. Many families describe these final conversations as among the most important of their lives. Whatever words you find — they are enough.",
  },
  {
    id: "after-death-practical",
    categoryId: "end-of-life",
    title: "Practical Steps After the Death",
    subtitle: "What happens in the days after your loved one dies",
    urgencyLevel: "routine",
    icon: "clipboard",
    tags: ["after death", "after someone dies", "what to do after death", "funeral home", "death certificate", "medication disposal", "equipment removal", "next steps"],
    whatYouMayNotice: [
      "You are not sure what needs to happen in the days following the death",
      "You have questions about medications, equipment, or the death certificate",
      "You are overwhelmed by logistics while also grieving",
    ],
    whatItMeans:
      "Hospice will guide you through every practical step. You do not need to figure this out alone. Most things do not need to happen immediately — you have time. The priority in the first moments is to be with your loved one and with each other.",
    whatToDoNow: [
      {
        text: "In the first moments: call hospice (not 911). Take time with your loved one if you need it. There is no rush to call the funeral home.",
        tip: "You can take as much time as you need before the funeral home comes. Some families spend an hour or more — bathing, dressing, praying, or simply being together.",
      },
      {
        text: "Hospice will: send a nurse to confirm the death and complete paperwork; contact the physician who will sign the death certificate; guide you on calling the funeral home.",
      },
      {
        text: "Funeral home: call when you are ready. They will come and transport your loved one. If you are unsure which funeral home to use, the hospice social worker can provide a list.",
      },
      {
        text: "Medications: hospice will arrange for the collection and disposal of all controlled substances (morphine, lorazepam, etc.) — do not flush or put in the trash without guidance. Other medications can usually be disposed of through a pharmacy take-back program.",
        caution: "Controlled substances must be properly disposed of — keep them secured until hospice collects them.",
      },
      {
        text: "Equipment: hospice will arrange for the collection of all rented equipment (hospital bed, oxygen, wheelchair, etc.) within a few days. You do not need to return it yourself.",
      },
      {
        text: "Death certificate: the physician must sign the death certificate. Hospice coordinates this. You will need multiple certified copies — typically 8–10 — for banks, insurance, benefits, and legal purposes.",
      },
      {
        text: "Notify: Social Security Administration (benefits stop the month of death), employer, banks, life insurance companies, and any other relevant institutions — but these can wait until you are ready.",
      },
    ],
    whatToAvoid: [
      "Do not call 911 — call hospice",
      "Do not feel pressured to rush any of the above steps",
      "Do not flush controlled medications without guidance",
      "Do not do this alone — ask family, friends, or the hospice social worker for help with logistics",
    ],
    whenToCallHospice: [
      "Immediately after the death — they are your first call",
      "Whenever you have questions about medications, equipment, or next steps",
      "To connect with the bereavement counselor",
    ],
    whatHappensNext:
      "Hospice bereavement support continues for up to 13 months after the death — phone calls, mailings, and in many cases counseling. You will not be abandoned. The social worker and bereavement counselor will reach out, and you can call them anytime.",
  },
  {
    id: "bereavement-support",
    categoryId: "end-of-life",
    title: "Grief & Bereavement Support",
    subtitle: "What to expect in grief and what help is available",
    urgencyLevel: "routine",
    icon: "coffee",
    tags: ["grief", "bereavement", "mourning", "after death", "grief support", "loss", "coping with death", "grieving"],
    whatYouMayNotice: [
      "Overwhelming sadness, numbness, or disbelief in the days after the death",
      "Physical symptoms — exhaustion, not eating, not sleeping",
      "Waves of grief that come unexpectedly — at a smell, a song, or a random moment",
      "Feeling like you are not 'doing grief right'",
      "Wondering when you will feel better",
    ],
    whatItMeans:
      "Grief is not a problem to solve or a stage to get through. It is the natural response to love and loss. It does not follow a schedule and it does not look the same for any two people. Grief changes over time — it does not disappear, but it becomes more integrated into life. There is no wrong way to grieve, and there is no timeline you should be on.",
    whatToDoNow: [
      {
        text: "Allow yourself to feel what you feel — sadness, anger, relief, guilt, peace, numbness. All of these are valid grief responses and none of them mean something is wrong with you.",
        tip: "Relief after a prolonged illness is very common. It is not a sign that you didn't love the person — it is a sign that you were with them through something very hard.",
      },
      {
        text: "Take care of the basics: eat even when you are not hungry, sleep when you can, move your body, accept help with meals and tasks.",
      },
      {
        text: "Connect with hospice bereavement support — they will reach out, and you can call them. This support is included in the hospice benefit for 13 months after the death.",
      },
      {
        text: "Consider a grief support group. Many hospices offer them, and they provide something unique: people who understand what you are going through without explanation.",
      },
      {
        text: "If grief is accompanied by thoughts of self-harm, inability to function for an extended period, or feeling completely hopeless: reach out to a mental health professional. The 988 Suicide and Crisis Lifeline (call or text 988) is available 24 hours.",
        caution: "Normal grief and complicated grief are different. If you feel stuck in the most acute phase of grief for more than several months, speak with a counselor.",
      },
    ],
    whatToAvoid: [
      "Do not isolate if you can avoid it — grief is harder alone",
      "Do not put a timeline on your grief or let others put one on you",
      "Do not make major life decisions in the first several months",
      "Do not confuse grieving with weakness — it is the evidence of love",
    ],
    whenToCallHospice: [
      "Anytime in the 13 months following the death",
      "When you want to be connected with the bereavement counselor",
      "When you want to find a grief support group",
    ],
    whatHappensNext:
      "Your hospice bereavement team will follow up with you by phone and mail in the months following the death. Many hospices offer individual counseling, group support, and memorial events. You are not alone in this — the relationship with hospice does not end when your loved one dies.",
  },
  {
    id: "after-death-guidance",
    categoryId: "end-of-life",
    title: "If You Think the Patient Has Died",
    subtitle: "What to do immediately after death occurs",
    urgencyLevel: "immediate",
    icon: "sunset",
    tags: ["died", "death", "passed away", "gone", "no pulse", "not breathing", "what do I do now", "after death"],
    callHospiceNow: true,
    whatYouMayNotice: [
      "No visible breathing for an extended period",
      "No response to voice or touch",
      "Eyes may be partially open or fixed",
      "Jaw has relaxed open",
      "Skin color has changed significantly",
    ],
    whatItMeans:
      "Death in hospice is an expected event, and there is a clear plan for what happens next. You do not need to rush. You have time to be present, to say what you need to say, and to gather yourself before taking any steps.",
    whatToDoNow: [
      { text: "Take a moment. You do not need to do anything immediately. Be present with your loved one." },
      { text: "Call the hospice main line — 24 hours a day — and tell them you believe your loved one has died. This is your first call." },
      { text: "Do NOT call 911 — calling 911 triggers a legal obligation to attempt resuscitation, which is not consistent with hospice care. Only call 911 if hospice directs you to." },
      { text: "The hospice nurse will either come to the home or guide you through confirmation by phone." },
      { text: "After the nurse confirms the death, hospice will contact the physician for the death certificate." },
      { text: "Call your funeral home when you are ready — the body does not need to be moved quickly." },
      { text: "You may wish to call close family members to be present or to share the news." },
    ],
    whatToAvoid: [
      "Do not call 911 unless hospice tells you to",
      "Do not feel rushed to call the funeral home immediately",
      "Do not be alone if you can avoid it — call someone to be with you",
    ],
    whenToCallHospice: [
      "Immediately — hospice should be your first call",
    ],
    whatHappensNext:
      "Hospice will guide every next step: confirming the death, the death certificate, medications and equipment disposal, and bereavement support. They will also follow up with you in the days and weeks ahead. Your bereavement support continues for up to 13 months after the death.",
  },
];

const advocacy: GuidanceScenario[] = [
  {
    id: "not-enough-visits",
    categoryId: "advocacy",
    title: "We're Not Getting Enough Visits",
    subtitle: "Nurse visits feel too infrequent for the level of care needed",
    urgencyLevel: "soon",
    icon: "calendar",
    tags: [
      "not enough visits", "too few visits", "nurse not coming", "no aide",
      "visit frequency", "not seeing us enough", "we need more help",
      "hospice not visiting", "infrequent visits",
    ],
    whatYouMayNotice: [
      "Nurse visits feel too infrequent given how much the patient's condition has changed",
      "You are managing complex care without enough professional guidance",
      "Aide visits have not started or were reduced without explanation",
      "You feel exhausted and unsupported between visits",
      "Medication needs have changed but no one has come to assess",
    ],
    whatItMeans:
      "Under the Medicare Hospice Benefit, your loved one is entitled to nursing visits, home health aide services, social work, and chaplain visits based on their individual needs — not a fixed minimum schedule. If the patient's condition is worsening or you are struggling as a caregiver, the plan of care should be updated to reflect that. Visit frequency is not one-size-fits-all, and you have the right to ask for more.",
    whatToDoNow: [
      {
        text: "Call your hospice nurse and describe specifically what is happening: 'Since the last visit, here is what has changed...' Be concrete.",
        tip: "The more specific you are, the easier it is for the team to justify increasing visits in the plan of care.",
      },
      {
        text: "Request a formal care conference — this is your right under the Medicare Hospice Benefit. Ask to review the current plan of care and discuss visit frequency.",
      },
      {
        text: "Ask directly: 'Can we increase nurse visits to [X] per week given what is happening?' You are allowed to ask.",
      },
      {
        text: "Document each visit date, who came, and what was done. If aide services were promised but not delivered, note that too.",
        tip: "A written log gives you clear evidence if you need to escalate.",
      },
      {
        text: "If the nurse visit frequency does not change and you remain unsatisfied, ask to speak with the hospice director of clinical services.",
      },
    ],
    whatToAvoid: [
      "Do not assume the current schedule is the maximum — hospice can and does increase visits when conditions warrant",
      "Do not wait until a crisis to ask for more support — advocate before things deteriorate",
      "Do not feel embarrassed about asking — advocating for appropriate care is your role",
      "Do not accept 'everything looks fine' if you feel otherwise — you see the patient daily",
    ],
    whenToCallHospice: [
      "Symptoms have changed significantly since the last visit",
      "You are overwhelmed and cannot manage care safely between visits",
      "A promised service (aide, social worker, chaplain) has not started",
      "You want to formally request increased visit frequency",
    ],
    whatHappensNext:
      "Hospice is required by Medicare to update the plan of care when patient needs change. If your request is documented and still denied, you have the right to contact your state's hospice licensure authority or the Medicare ombudsman. Most often, a direct conversation with the clinical director resolves the issue.",
  },
  {
    id: "disagree-with-care-team",
    categoryId: "advocacy",
    title: "I Disagree with What I'm Being Told",
    subtitle: "Getting a second opinion or challenging a clinical recommendation",
    urgencyLevel: "soon",
    icon: "message-square",
    tags: [
      "disagree", "second opinion", "don't agree", "wrong diagnosis", "wrong medication",
      "challenge the team", "dispute", "care team wrong", "question the nurse",
      "doctor wrong", "want another opinion", "don't trust the recommendation",
    ],
    whatYouMayNotice: [
      "A recommendation from the hospice team does not feel right to you",
      "You believe a symptom is being undertreated or misidentified",
      "The nurse or physician explained something that contradicts what you have read or been told previously",
      "Your loved one's wishes are not being honored in the care approach",
      "You feel dismissed when you raise concerns",
    ],
    whatItMeans:
      "You have every right to question, challenge, and seek clarification on any recommendation the hospice team makes. Good hospice care is collaborative — you are a partner, not a passive recipient. A second opinion within hospice is a legitimate and accepted request. If you feel unheard, there are structured escalation paths.",
    whatToDoNow: [
      {
        text: "Write down your specific concern before the conversation: What was recommended? What bothers you about it? What outcome do you want?",
        tip: "Clarity on your concern helps the conversation move forward rather than staying in frustration.",
      },
      {
        text: "Ask your nurse or physician to explain the recommendation in plain language: 'Help me understand why this is being recommended and what the alternatives are.'",
      },
      {
        text: "Request to speak with the hospice medical director — this is your right. The medical director oversees clinical decisions and can review your case directly.",
      },
      {
        text: "Ask for a care conference that includes the full interdisciplinary team: nurse, social worker, physician, and if appropriate, chaplain.",
      },
      {
        text: "If you want a second opinion from a palliative care physician outside the hospice, you may seek one — hospice does not end if you ask an outside provider for a consultation.",
        caution: "Check with your primary care provider about how this interacts with the hospice benefit, as some specialty consultations may need prior authorization.",
      },
    ],
    whatToAvoid: [
      "Do not withhold your concern out of politeness — the team cannot address what they do not know",
      "Do not assume the team is always right simply because they are professionals — you know your loved one",
      "Do not go around the team without first trying direct communication — document your attempts",
    ],
    whenToCallHospice: [
      "You disagree with a specific treatment recommendation and want it reviewed",
      "You feel your concerns have been dismissed without explanation",
      "You want to request a care conference or speak with the medical director",
      "Your loved one's documented wishes are not being followed",
    ],
    whatHappensNext:
      "Most disagreements resolve when families are given a thorough explanation and feel genuinely heard. If you remain unsatisfied after speaking with the clinical director and medical director, you may contact your state's hospice oversight body. You also have the right to transfer to a different hospice agency at any time — this is your choice.",
  },
  {
    id: "patient-wants-to-stop-hospice",
    categoryId: "advocacy",
    title: "The Patient Wants to Stop Hospice",
    subtitle: "Understanding the revocation process and what comes next",
    urgencyLevel: "routine",
    icon: "log-out",
    tags: [
      "revoke hospice", "stop hospice", "leave hospice", "discharge from hospice",
      "revocation", "wants curative treatment", "wants chemo again", "going back to treatment",
      "re-enrollment", "can we re-enroll", "changing their mind",
    ],
    whatYouMayNotice: [
      "The patient is expressing a wish to pursue curative or life-prolonging treatment again",
      "The patient wants to try a new clinical trial or therapy",
      "The patient or family is asking whether they can stop hospice and start again later",
      "There is uncertainty about whether revoking hospice is reversible",
    ],
    whatItMeans:
      "A patient enrolled in hospice has the unconditional right to revoke — stop — hospice care at any time and for any reason. This is protected under Medicare law. Revoking hospice means the Medicare Hospice Benefit ends, and the patient returns to standard Medicare coverage for any treatments they choose. They can re-enroll in hospice at any point if they again meet eligibility criteria (prognosis of 6 months or less if the disease runs its natural course).",
    whatToDoNow: [
      {
        text: "Contact your hospice agency and state clearly: 'The patient wants to revoke hospice enrollment.' The agency will provide a written Revocation Statement for the patient or their legal representative to sign.",
      },
      {
        text: "Understand that revocation is effective the day the statement is signed and submitted. There is no waiting period.",
      },
      {
        text: "Ask the hospice social worker to help coordinate the transition back to standard Medicare — they can assist with getting primary care and specialist appointments reinstated.",
        tip: "Medications supplied by hospice typically stop at revocation — ask about bridge prescriptions before you sign.",
      },
      {
        text: "Ask what equipment (hospital bed, wheelchair, oxygen) was supplied by hospice — these items may need to be returned or transferred to a different billing arrangement.",
      },
      {
        text: "If the patient may want to re-enroll in hospice later, know that they can — re-enrollment is available as long as they continue to meet the 6-month prognosis criteria.",
        tip: "There is no limit to how many times a patient may revoke and re-enroll.",
      },
    ],
    whatToAvoid: [
      "Do not assume revoking hospice is permanent — re-enrollment is always an option if eligibility is met",
      "Do not feel that honoring the patient's wish to revoke means abandoning them — it is their right",
      "Do not delay notifying hospice once the patient has decided — the transition requires coordination",
    ],
    whenToCallHospice: [
      "The patient has expressed a wish to revoke or is asking questions about it",
      "You want to understand what stops being covered at revocation",
      "You need help coordinating the care transition to standard Medicare",
      "You want to understand re-enrollment eligibility",
    ],
    whatHappensNext:
      "Once the Revocation Statement is signed, the hospice will process the discharge and standard Medicare coverage resumes immediately. The hospice team is still available to help with the transition for a short window. If curative treatment is later unsuccessful or the patient's goals shift again, the hospice team can help with re-enrollment.",
  },
  {
    id: "patient-keeps-falling",
    categoryId: "advocacy",
    title: "The Patient Keeps Falling",
    subtitle: "Fall prevention, PT evaluation, and making the home safer",
    urgencyLevel: "soon",
    icon: "alert-triangle",
    tags: [
      "fall", "falling", "keeps falling", "fell again", "fall prevention",
      "physical therapy", "PT evaluation", "unsafe", "home safety",
      "balance problems", "unsteady", "can't walk safely",
    ],
    callHospiceNow: false,
    whatYouMayNotice: [
      "The patient has fallen more than once in a short period",
      "Walking has become increasingly unsteady or requires more assistance",
      "The patient is determined to walk independently despite the risk",
      "The home has hazards — loose rugs, poor lighting, bathroom without grab bars",
      "You are afraid to leave the patient alone even briefly",
    ],
    whatItMeans:
      "Falls in hospice patients are common and carry serious risk — injury from a fall can accelerate decline and cause significant pain. At the same time, forcing someone to stop all movement can harm dignity and quality of life. The goal is not elimination of all risk but reduction of serious harm through practical changes, equipment, and a formal safety evaluation. Repeated falls are a care signal that warrants a hospice response.",
    whatToDoNow: [
      {
        text: "Call hospice and report the falls — document the date, time, circumstances, and whether there was any injury for each fall.",
        tip: "Hospice teams use fall documentation to trigger a formal safety review and determine if a physical therapy (PT) evaluation is indicated.",
      },
      {
        text: "Ask specifically: 'Can we request a physical therapy evaluation for fall risk and home safety?' Under the Medicare Hospice Benefit, PT is a covered service when clinically indicated.",
      },
      {
        text: "Walk through the home and address immediate hazards: remove loose rugs, clear walkways, ensure lighting is adequate, and place a nightlight in the bathroom.",
      },
      {
        text: "Ask hospice about obtaining a bedside commode, grab bars, or a transfer belt — these are often supplied by hospice as durable medical equipment.",
        tip: "A grab bar in the bathroom and a raised toilet seat often prevent the most common fall locations.",
      },
      {
        text: "If the patient gets up at night unassisted, consider a fall mat beside the bed and a bed alarm to alert you before they stand.",
      },
      {
        text: "Discuss the balance between safety and autonomy with the hospice social worker — this is often a difficult family conversation and they can help mediate.",
      },
    ],
    whatToAvoid: [
      "Do not physically restrain the patient — this is considered a dignity violation and increases agitation",
      "Do not assume falls are inevitable and untreatable — most falls have identifiable contributing causes",
      "Do not wait for another fall to request a PT evaluation — advocate proactively",
      "Do not blame yourself if a fall occurs despite precautions — falls happen in the best of care environments",
    ],
    whenToCallHospice: [
      "A fall has just occurred — report it even if there is no obvious injury, as internal injury can occur",
      "You want to request a physical therapy home safety evaluation",
      "The patient refuses to use a walker or assistive device and you are concerned",
      "Falls are increasing in frequency",
    ],
    whatHappensNext:
      "After a reported fall, hospice will typically conduct a fall risk assessment and may send a nurse for an in-person evaluation. A PT evaluation can result in a home exercise plan, assistive device recommendations, and a formal home safety assessment. Hospice can also order equipment like a hospital bed with rails, a bedside commode, or a gait belt to make transfers safer.",
  },
  {
    id: "family-conflict-over-care",
    categoryId: "advocacy",
    title: "Our Family Is Fighting About Care",
    subtitle: "Requesting a family meeting and the social worker's mediation role",
    urgencyLevel: "routine",
    icon: "users",
    tags: [
      "family conflict", "fighting about care", "family disagreeing", "family argument",
      "family meeting", "disagree about hospice", "some want treatment", "family won't agree",
      "sibling conflict", "family dispute", "conflict over decisions",
    ],
    whatYouMayNotice: [
      "Family members disagree about whether hospice was the right choice",
      "Some family members want to pursue more aggressive treatment against the patient's wishes",
      "The primary caregiver feels unsupported or criticized by other family members",
      "Decisions about care are becoming contentious and emotionally charged",
      "The patient is aware of the conflict and it is adding to their distress",
    ],
    whatItMeans:
      "Family conflict around hospice care is extremely common and does not mean the family is dysfunctional. Grief, guilt, fear, and different levels of acceptance create strong emotions that can fracture communication. The hospice social worker is specifically trained to facilitate these conversations. A formal family meeting — facilitated by the social worker and often including the nurse and chaplain — is one of the most powerful tools available and is included in your hospice benefit.",
    whatToDoNow: [
      {
        text: "Contact your hospice social worker and say: 'We are having family conflict about the care plan. Can you facilitate a family meeting?'",
        tip: "You do not need to have the conflict resolved before asking — the meeting is the tool for resolution.",
      },
      {
        text: "Ask whether the meeting can be held in person or via video — hospice social workers can often accommodate remote family members.",
      },
      {
        text: "Before the meeting, ask the social worker to share the patient's documented goals of care and any advance directives (POLST, living will, healthcare proxy designation) — these documents anchor the conversation.",
        caution: "If there is no documented healthcare proxy and the patient still has capacity, the patient's own voice is the primary authority.",
      },
      {
        text: "During the meeting, allow the social worker to facilitate — they are skilled at creating space for all voices without letting any one person dominate.",
      },
      {
        text: "If the conflict involves a healthcare proxy designation that is being challenged, ask to speak with the hospice social worker and medical director together — they can clarify the legal authority structure.",
      },
    ],
    whatToAvoid: [
      "Do not try to force consensus before the meeting — allow the facilitated process to work",
      "Do not exclude family members from the meeting out of frustration — their presence (even difficult) is usually better than their absence",
      "Do not override the patient's stated and documented wishes, even under family pressure",
      "Do not let conflict fester — it typically worsens over time and affects the patient's experience",
    ],
    whenToCallHospice: [
      "Family conflict is escalating and affecting the patient's care or comfort",
      "You want to request a facilitated family meeting",
      "You need a social worker to help clarify decision-making authority",
      "A family member is threatening to call 911 or disrupt the hospice plan",
    ],
    whatHappensNext:
      "The hospice social worker will typically schedule the family meeting within a few days. They will prepare by reviewing the patient's chart, goals of care documentation, and speaking with the primary caregiver. The meeting usually results in a clearer shared understanding of the patient's wishes and a reinforced care plan. If conflict remains severe, the social worker can refer to ethics consultation or a community mediator.",
  },
  {
    id: "hospice-not-responding",
    categoryId: "advocacy",
    title: "Hospice Isn't Responding to My Calls",
    subtitle: "What to do when the on-call line does not call back",
    urgencyLevel: "immediate",
    icon: "phone-off",
    tags: [
      "not calling back", "no callback", "can't reach hospice", "hospice not responding",
      "no answer", "waiting for hours", "on-call not answering", "hospice unresponsive",
      "can't get through", "left a message", "no response",
    ],
    callHospiceNow: true,
    whatYouMayNotice: [
      "You called the hospice on-call line and no one has called back within 30 minutes",
      "You have called multiple times and are still waiting",
      "It is the middle of the night or a weekend and you cannot reach anyone",
      "There is an active symptom or situation that requires guidance now",
    ],
    whatItMeans:
      "Medicare-certified hospices are required by federal law to provide nursing coverage 24 hours a day, 7 days a week — including evenings, weekends, and holidays. A failure to return calls within a reasonable time (generally 30–60 minutes for a non-emergency, immediately for an urgent symptom) is a care gap. You should not be left without access to a nurse when you need one.",
    whatToDoNow: [
      {
        text: "Call the on-call number again immediately. If you have been waiting more than 30 minutes for an urgent symptom, call again — systems sometimes fail.",
      },
      {
        text: "Write down the exact times you called, the number you used, and whether it rang or went to voicemail. This documentation matters.",
        tip: "Include the date, time of each call, what you said in the message, and how long you waited. This is your record of the unmet obligation.",
      },
      {
        text: "Look for a backup number — your hospice intake paperwork or plan of care document may list a secondary on-call number or an administrator contact.",
      },
      {
        text: "If the situation is a medical emergency and you cannot reach hospice, call 911. Doing so does not automatically end hospice enrollment, but it does signal a significant care gap.",
        caution: "If the patient has a DNR or POLST, have it visible for emergency responders.",
      },
      {
        text: "After the situation resolves, call the hospice administrative office during business hours and report the lack of response formally. Ask for the name of the person who takes the complaint.",
      },
      {
        text: "If the problem recurs, file a complaint with your state's health department or the Medicare hospice oversight office. You can also call 1-800-MEDICARE to report the hospice.",
      },
    ],
    whatToAvoid: [
      "Do not assume you are bothering them or calling too often — calling back when you have an urgent need is appropriate",
      "Do not wait hours in an emergency hoping someone will call",
      "Do not accept repeated non-response without filing a formal complaint — this protects future families",
    ],
    whenToCallHospice: [
      "Any time you cannot reach the on-call line — call again",
      "After a response failure, during business hours, to report it formally",
      "When you need to speak with the director of nursing or administrator about response failures",
    ],
    whatHappensNext:
      "A formal complaint submitted to the hospice administrator creates a required internal review. If the problem is systemic, Medicare-certified hospices can face corrective action plans and loss of certification. Most agencies respond quickly to a documented complaint because the regulatory stakes are high. You have the right to switch hospice agencies at any time if response failures continue.",
  },
];

export const guidanceCategories: GuidanceCategory[] = [
  {
    id: "symptoms",
    title: "Symptoms & Comfort",
    subtitle: "Managing pain, breathing, and other physical changes",
    icon: "activity",
    color: "#E07878",
    bgColor: "#2C0E0E",
    scenarios: symptoms,
  },
  {
    id: "caregiving",
    title: "Caregiving Tasks",
    subtitle: "Step-by-step hands-on care guidance",
    icon: "heart",
    color: "#E07840",
    bgColor: "#2C1808",
    scenarios: caregiving,
  },
  {
    id: "medications",
    title: "Medications",
    subtitle: "Comfort kit, doses, side effects, and alternatives",
    icon: "package",
    color: "#6AB4D8",
    bgColor: "#0E2030",
    scenarios: medications,
  },
  {
    id: "equipment",
    title: "Equipment",
    subtitle: "Using and troubleshooting hospice equipment",
    icon: "tool",
    color: "#E0A848",
    bgColor: "#2E2510",
    scenarios: equipment,
  },
  {
    id: "emotional",
    title: "Emotional Support",
    subtitle: "Caregiver stress, difficult conversations, and family",
    icon: "message-circle",
    color: "#B090C8",
    bgColor: "#1E1230",
    scenarios: emotional,
  },
  {
    id: "hospice-services",
    title: "Hospice Services",
    subtitle: "Team roles, respite care, and available support",
    icon: "users",
    color: "#E8A830",
    bgColor: "#0E2018",
    scenarios: hospiceServices,
  },
  {
    id: "end-of-life",
    title: "End of Life & After",
    subtitle: "What to expect and what to do",
    icon: "sunset",
    color: "#7090B8",
    bgColor: "#1A2848",
    scenarios: endOfLife,
  },
  {
    id: "advocacy",
    title: "Advocacy & Rights",
    subtitle: "When to push back, escalate, and advocate for better care",
    icon: "shield",
    color: "#7BC8A4",
    bgColor: "#0E2418",
    scenarios: advocacy,
  },
  {
    id: "unsure",
    title: "Not Sure What's Happening",
    subtitle: "When something seems wrong but you're not sure what",
    icon: "help-circle",
    color: "#7AAAD0",
    bgColor: "#152038",
    scenarios: [
      {
        id: "not-sure-whats-happening",
        categoryId: "unsure",
        title: "I'm Not Sure What's Happening",
        subtitle: "When you don't know if something is normal or concerning",
        urgencyLevel: "soon",
        icon: "help-circle",
        tags: ["not sure", "don't know", "something seems wrong", "is this normal", "worried", "concerned", "what is this"],
        whatYouMayNotice: [
          "Something seems different but you can't identify exactly what",
          "Your gut says something is wrong",
          "You are unsure whether to call or wait",
        ],
        whatItMeans:
          "You do not need to know what is wrong before you call hospice. Your instinct that something is off is enough reason to call. Hospice staff would rather hear from you when everything is fine than have you wait when something is serious. There is no such thing as an unnecessary call to hospice.",
        whatToDoNow: [
          { text: "Take a slow breath. Look at the person: Are they breathing? Are they in obvious distress?" },
          { text: "Check comfort basics: Are they in pain? Too hot or cold? Do they need to be repositioned?" },
          { text: "Note what you are observing: What is different from yesterday? When did it start?" },
          { text: "Call hospice and describe exactly what you are seeing — use simple words. 'They seem different. Their breathing sounds different. They aren't responding the same way.' This is enough." },
          { text: "While waiting for a callback: stay with them, keep them comfortable, and remain calm." },
        ],
        whatToAvoid: [
          "Do not wait until you have everything figured out to call",
          "Do not call 911 for changes that are gradual or expected — call hospice first",
          "Do not assume that because you cannot identify the problem, there isn't one",
        ],
        whenToCallHospice: [
          "Anytime you are uncertain — this is the most important time to call",
          "When your instinct says something is wrong",
          "When you feel frightened or alone",
        ],
        whatHappensNext:
          "Hospice will listen to your description, ask questions, and guide you. They may talk you through what you are seeing, reassure you, or send a nurse to assess in person. You are not alone in this — that is what hospice is for.",
      },
    ],
  },
];

// ─── Flat structured item list with governance metadata ──────────────────────
// Derived from guidanceCategories. Governance placeholders applied uniformly;
// update individual items with real owner/reviewDate as the workflow matures.
export const guidanceItems: GuidanceContentItem[] = guidanceCategories.flatMap((cat) =>
  cat.scenarios.map((s) => ({
    ...s,
    stages: getStagesForCategory(s.categoryId),
    keywords: s.tags,
    governance: {
      ...DEFAULT_GOVERNANCE,
      owner: getOwnerForCategory(s.categoryId),
      sourceType:
        s.categoryId === "hospice-services"
          ? ("operational" as const)
          : ("clinical_editorial" as const),
    },
  }))
);
