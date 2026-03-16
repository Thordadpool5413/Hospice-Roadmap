export type UrgencyLevel = "immediate" | "soon" | "routine";

export type GuidanceCategoryId =
  | "symptoms"
  | "caregiving"
  | "medications"
  | "equipment"
  | "emotional"
  | "hospice-services"
  | "end-of-life"
  | "unsure";

export interface GuidanceStep {
  text: string;
  tip?: string;
  caution?: string;
}

export interface GuidanceScenario {
  id: string;
  categoryId: GuidanceCategoryId;
  title: string;
  subtitle: string;
  urgencyLevel: UrgencyLevel;
  icon: string;
  tags: string[];
  whatYouMayNotice: string[];
  whatItMeans: string;
  whatToDoNow: GuidanceStep[];
  whatToAvoid: string[];
  whenToCallHospice: string[];
  whatHappensNext: string;
  callHospiceNow?: boolean;
}

export interface GuidanceCategory {
  id: GuidanceCategoryId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  scenarios: GuidanceScenario[];
}

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
];

const endOfLife: GuidanceScenario[] = [
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

export const guidanceCategories: GuidanceCategory[] = [
  {
    id: "symptoms",
    title: "Symptoms & Comfort",
    subtitle: "Managing pain, breathing, and other physical changes",
    icon: "activity",
    color: "#C45A5A",
    bgColor: "#FDF0F0",
    scenarios: symptoms,
  },
  {
    id: "caregiving",
    title: "Caregiving Tasks",
    subtitle: "Step-by-step hands-on care guidance",
    icon: "heart",
    color: "#5A8A7A",
    bgColor: "#E8F3EF",
    scenarios: caregiving,
  },
  {
    id: "medications",
    title: "Medications",
    subtitle: "Comfort kit, doses, side effects, and alternatives",
    icon: "package",
    color: "#4A90B8",
    bgColor: "#EBF4FA",
    scenarios: medications,
  },
  {
    id: "equipment",
    title: "Equipment",
    subtitle: "Using and troubleshooting hospice equipment",
    icon: "tool",
    color: "#C8842A",
    bgColor: "#FDF3E0",
    scenarios: equipment,
  },
  {
    id: "emotional",
    title: "Emotional Support",
    subtitle: "Caregiver stress, difficult conversations, and family",
    icon: "message-circle",
    color: "#8A6A9A",
    bgColor: "#F0EBF6",
    scenarios: emotional,
  },
  {
    id: "hospice-services",
    title: "Hospice Services",
    subtitle: "Team roles, respite care, and available support",
    icon: "users",
    color: "#2C6E6A",
    bgColor: "#E0F2F1",
    scenarios: hospiceServices,
  },
  {
    id: "end-of-life",
    title: "End of Life & After",
    subtitle: "What to expect and what to do",
    icon: "sunset",
    color: "#3A4550",
    bgColor: "#F0F2F4",
    scenarios: endOfLife,
  },
  {
    id: "unsure",
    title: "Not Sure What's Happening",
    subtitle: "When something seems wrong but you're not sure what",
    icon: "help-circle",
    color: "#5A7FA8",
    bgColor: "#EBF2FA",
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

export const allScenarios: GuidanceScenario[] = guidanceCategories.flatMap(
  (c) => c.scenarios
);

export function findScenarioById(id: string): GuidanceScenario | undefined {
  return allScenarios.find((s) => s.id === id);
}

export function findCategoryById(id: GuidanceCategoryId): GuidanceCategory | undefined {
  return guidanceCategories.find((c) => c.id === id);
}

export function searchScenarios(query: string): GuidanceScenario[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return allScenarios.filter((s) => {
    return (
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.whatYouMayNotice.some((w) => w.toLowerCase().includes(q))
    );
  });
}
