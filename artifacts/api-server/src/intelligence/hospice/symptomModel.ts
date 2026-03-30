// Structured symptom model for 14 major hospice symptoms

export interface SymptomGuidance {
  symptom: string;
  aliases: string[];
  urgency: "critical" | "urgent" | "moderate" | "routine";
  whatItMayMean: string;
  comfortSupport: string[];
  whatToReport: string;
  whenHospiceMustBeCalled: string;
  when911MayBeNeeded: string;
  medicationNotes: string;
  caregiverTechniques: string;
  commonMistakes: string[];
}

export const SYMPTOM_GUIDANCE_MAP: SymptomGuidance[] = [
  {
    symptom: "Pain",
    aliases: ["pain", "hurting", "aching", "uncomfortable", "grimacing", "moaning", "painful"],
    urgency: "urgent",
    whatItMayMean: "Uncontrolled cancer pain, bone pain, wound pain, neuropathic pain, or musculoskeletal pain. In nonverbal patients, facial grimacing, tense body posture, moaning, and resistance to movement are behavioral indicators.",
    comfortSupport: [
      "Give scheduled opioid medications on time — do not skip doses",
      "Offer breakthrough (PRN) dose when pain is 4/10 or above",
      "Reposition for comfort — sometimes a small change in position relieves pain significantly",
      "Ice or heat packs if appropriate for the location (avoid on areas with poor sensation or circulation)",
      "Gentle massage of areas distant from the painful site",
    ],
    whatToReport: "Pain score (0-10 or behavioral description in nonverbal patients), location, character (sharp, dull, burning, pressure), timing (constant, intermittent, with movement), and response to breakthrough medication.",
    whenHospiceMustBeCalled: "Pain above 6/10 not responding to breakthrough dose within 30-45 minutes. New pain in a new location. Pain not controlled by scheduled medications. Breakthrough doses being used more than 4 times per day.",
    when911MayBeNeeded: "Sudden severe pain in the chest, abdomen, or head that is unusual and not controlled — may indicate a new acute event.",
    medicationNotes: "Typical hospice opioid ladder: immediate-release opioid for breakthrough, extended-release or continuous delivery for baseline. Breakthrough dose = 10-15% of 24-hour opioid total. Constipation is a universal opioid side effect — always use a stimulant laxative (senna) with scheduled opioids.",
    caregiverTechniques: "Document pain scores and medication times. Use the PAINAD scale for nonverbal assessment. Offer breakthrough dose proactively before activities that cause pain (repositioning, wound care).",
    commonMistakes: [
      "Not giving scheduled opioids because patient seems comfortable — this breaks the around-the-clock coverage",
      "Withholding breakthrough doses out of fear of addiction",
      "Not calling hospice when pain is uncontrolled — this is exactly what the 24/7 line is for",
      "Using acetaminophen alone for severe cancer pain",
    ],
  },
  {
    symptom: "Shortness of Breath",
    aliases: ["breathing", "breathlessness", "dyspnea", "short of breath", "can't breathe", "difficulty breathing", "air hunger", "gasping"],
    urgency: "urgent",
    whatItMayMean: "Fluid accumulation (CHF, malignant effusion), pneumonia, disease progression (COPD, lung cancer, ALS), anemia, anxiety, or active dying process. Different causes require different approaches.",
    comfortSupport: [
      "Elevate the head of the bed 30-45 degrees (or more if needed)",
      "Point a small fan to blow cool air gently on the face — activates trigeminal nerve, reduces perceived dyspnea",
      "Loosen any tight clothing around neck or chest",
      "Keep the room cool",
      "Create a calm, quiet environment — anxiety amplifies breathlessness",
      "Use opioid medication as authorized by hospice nurse",
    ],
    whatToReport: "Breathing rate (count breaths for 15 seconds, multiply by 4), whether breathing is labored or effortful, presence of neck muscle use, color of lips and fingertips, oxygen saturation if pulse ox available, anxiety level.",
    whenHospiceMustBeCalled: "Breathing rate above 25/min, severe labored breathing, patient appears frightened or distressed, oxygen saturation below 88% if being monitored, any sudden worsening.",
    when911MayBeNeeded: "Sudden severe respiratory distress with chest pain not on a comfort-measures-only plan. CHF patients with acute pulmonary edema. Any sudden distress not responding to comfort measures in a patient not actively dying.",
    medicationNotes: "Low-dose morphine (2-5mg oral or 1-2mg SC) is the gold standard for dyspnea — it reduces the sensation of air hunger without hastening death. Lorazepam for anxiety component. Do not increase oxygen automatically — in COPD, excess O2 can suppress respiratory drive.",
    caregiverTechniques: "Fan use is evidence-based. Positioning upright is critical. Model calm breathing yourself. Stay physically close — isolation worsens breathlessness perception.",
    commonMistakes: [
      "Assuming more oxygen always helps",
      "Not using opioids for dyspnea due to fear it will cause death",
      "Leaving the patient alone when breathless",
      "Not calling hospice because you don't want to bother them",
    ],
  },
  {
    symptom: "Agitation and Restlessness",
    aliases: ["agitation", "restless", "picking", "pulling", "moaning", "trying to get up", "terminal restlessness", "combative"],
    urgency: "urgent",
    whatItMayMean: "Terminal restlessness near death is caused by brain changes, metabolic changes, or uncontrolled pain. In earlier stages: urinary retention, constipation, uncontrolled pain, medication side effects, or infection.",
    comfortSupport: [
      "Reduce room stimulation — dim lights, reduce noise, limit visitors to 1-2 calm people",
      "Speak in a calm, low voice",
      "Offer gentle touch if tolerated",
      "Check for urinary retention (when did they last urinate?)",
      "Check for constipation",
      "Call hospice for medication authorization",
    ],
    whatToReport: "What the patient is doing (picking at air, moaning, trying to get up), when it started, last bowel movement and urination, current medications and last doses, whether they seem to be in pain.",
    whenHospiceMustBeCalled: "Any moderate to severe agitation. Hospice should be called immediately — this is a clinical emergency that requires medication authorization.",
    when911MayBeNeeded: "If the patient is a fall risk due to agitation and cannot be safely managed. If there is violence or injury risk.",
    medicationNotes: "Haloperidol (Haldol) is first-line for terminal restlessness. Midazolam for refractory cases. Do not increase opioids alone — agitation is not pain. However, rule out uncontrolled pain as a contributor.",
    caregiverTechniques: "Keep the bed in its lowest position. Raise side rails. Remove hazards from the room. Assign one calm person to stay with them at all times.",
    commonMistakes: [
      "Assuming moaning or picking means they are in pain and increasing opioids without nurse guidance",
      "Leaving an agitated patient alone",
      "Not calling hospice immediately — this requires medication intervention",
      "Using the word 'combative' to describe a confused dying patient — they are not doing this intentionally",
    ],
  },
  {
    symptom: "Terminal Secretions",
    aliases: ["death rattle", "gurgling", "noisy breathing", "throat sounds", "rattling", "secretion sounds"],
    urgency: "moderate",
    whatItMayMean: "The patient can no longer effectively clear secretions from the upper airway. Occurs in the dying phase — typically within 24-48 hours of death.",
    comfortSupport: [
      "Reposition to a lateral (side-lying) position to allow gravity to help drain secretions",
      "Elevate the head slightly",
      "Call hospice for anticholinergic medication (glycopyrrolate, atropine drops, hyoscine)",
      "Provide gentle mouth care",
      "Keep family informed that this sound is not causing patient distress",
    ],
    whatToReport: "Onset time, severity of sound, patient's level of consciousness and apparent comfort.",
    whenHospiceMustBeCalled: "When secretion sounds begin — hospice should be informed and will authorize medication.",
    when911MayBeNeeded: "This is a sign of natural dying — 911 is not appropriate if DNR is in place.",
    medicationNotes: "Anticholinergics reduce secretion production: glycopyrrolate 0.2mg SC every 4 hours PRN, or atropine 1% ophthalmic drops 1-2 drops sublingual every 4 hours. Effect takes 30-60 minutes. These do not eliminate the sound completely.",
    caregiverTechniques: "The most important intervention is reassuring family that the patient is not choking and is not distressed. Position and medication are the clinical interventions.",
    commonMistakes: [
      "Attempting oral suctioning — this stimulates a gag reflex and can cause distress",
      "Not explaining to family that the patient is not suffering",
      "Leaving the patient supine when lateral positioning would help",
    ],
  },
  {
    symptom: "Confusion and Delirium",
    aliases: ["confusion", "confused", "delirious", "disoriented", "hallucinations", "not making sense", "seeing things", "talking to people who aren't there"],
    urgency: "urgent",
    whatItMayMean: "Delirium is common in hospice and has many treatable causes: dehydration, urinary retention, constipation, opioid toxicity, metabolic imbalances, infection. Near death, terminal delirium may be irreversible.",
    comfortSupport: [
      "Reduce environmental stimulation — quiet room, calm voices, one person at a time",
      "Use gentle orienting statements ('You're at home. It's safe here. I'm [name].')",
      "Ensure safety — bed rails up, remove sharp objects, don't leave alone",
      "Do not argue with or attempt to correct delusions",
      "Call hospice for assessment",
    ],
    whatToReport: "Onset (sudden vs. gradual), specific behaviors (what they are saying or doing), last bowel movement and urination, medications recently changed, temperature.",
    whenHospiceMustBeCalled: "Any new or worsening confusion warrants a call. Sudden confusion may indicate a treatable cause.",
    when911MayBeNeeded: "If the patient becomes dangerous to themselves or others.",
    medicationNotes: "Haloperidol is first-line for agitated delirium. Avoid benzodiazepines alone as they can worsen confusion. Address underlying causes if treatable.",
    caregiverTechniques: "Familiar voices, familiar surroundings, and gentle touch can reduce confusion. Keep lighting consistent — darkness worsens disorientation.",
    commonMistakes: [
      "Correcting or arguing with delusions",
      "Assuming confusion is permanent and not calling hospice",
      "Leaving a confused patient alone near exit doors or stairs",
    ],
  },
  {
    symptom: "Nausea and Vomiting",
    aliases: ["nausea", "vomiting", "sick to stomach", "throwing up", "can't keep anything down"],
    urgency: "moderate",
    whatItMayMean: "Opioid side effect (transient — resolves in 3-5 days usually), constipation, bowel obstruction, metabolic imbalances, brain metastases, gastric stasis.",
    comfortSupport: [
      "Check for constipation — the most commonly overlooked cause of nausea",
      "Keep odors minimal (avoid cooking smells, perfumes)",
      "Offer cool clear liquids if tolerated",
      "Small, frequent amounts rather than meals",
      "Fresh air if possible",
      "Call hospice for antiemetic prescription",
    ],
    whatToReport: "Onset, frequency, character of vomit (color, consistency), last bowel movement, current medications, any abdominal distension or pain.",
    whenHospiceMustBeCalled: "Persistent nausea preventing medication administration. Vomiting that has lasted more than several hours. Inability to keep antiemetics down.",
    when911MayBeNeeded: "Coffee-ground or bloody vomit. Sudden severe abdominal pain with vomiting (possible obstruction). Signs of dehydration with altered consciousness.",
    medicationNotes: "Ondansetron (Zofran) for most causes. Haloperidol for metabolic or opioid-induced. Metoclopramide for gastric stasis. Dexamethasone for bowel obstruction-related.",
    caregiverTechniques: "Position patient slightly upright. Have a basin ready. Document time, amount, and appearance of vomit.",
    commonMistakes: [
      "Not checking for constipation before assuming it's a drug side effect",
      "Stopping opioids because of nausea — usually can be managed with antiemetics",
    ],
  },
  {
    symptom: "Decreased Food and Fluid Intake",
    aliases: ["not eating", "not drinking", "refusing food", "stopped eating", "won't drink", "no appetite"],
    urgency: "routine",
    whatItMayMean: "Natural progression of illness — the body's systems are slowing and appetite decreases. This is NOT starvation in the traditional sense. It is a feature of the dying process, not a cause.",
    comfortSupport: [
      "Offer small amounts of preferred foods without pressure",
      "Ice chips, popsicles, and moist mouth swabs for comfort",
      "Focus on mouth care — keep the mouth moist even when not eating",
      "Do not supplement with tube feeding in hospice context — it does not extend life and can cause harm",
    ],
    whatToReport: "Duration of reduced intake, any signs of discomfort associated with eating attempts, swallowing problems.",
    whenHospiceMustBeCalled: "If the patient is distressed by hunger or thirst. If swallowing is causing choking or aspiration. If family conflict about artificial nutrition needs mediation.",
    when911MayBeNeeded: "This is not an emergency unless caused by a treatable new condition.",
    medicationNotes: "Dexamethasone can temporarily stimulate appetite. Megestrol acetate (Megace) for longer-term appetite stimulation if prognosis supports it.",
    caregiverTechniques: "Offer, but don't force. Oral care after any intake. Watch for aspiration signs (coughing after swallowing, wet voice).",
    commonMistakes: [
      "Forcing food or fluids — this can cause choking, aspiration, and distress",
      "Interpreting food refusal as giving up",
      "Requesting IV fluids or NG tube in a hospice patient — often causes discomfort without benefit",
    ],
  },
  {
    symptom: "Decreased Urine Output",
    aliases: ["not urinating", "dark urine", "no urine", "little urine", "decreased urine", "Foley not draining"],
    urgency: "moderate",
    whatItMayMean: "Dehydration from reduced fluid intake, kidney failure from disease progression, or urinary retention (treatable). In the dying phase (days), decreased urine is normal.",
    comfortSupport: [
      "If catheter is in place, check for kinks or blockage",
      "Note the color and amount of urine — dark and concentrated suggests dehydration",
      "If patient is able and cooperative, encourage small sips of fluid if comfortable",
    ],
    whatToReport: "Last urination time, amount, color; whether patient reports discomfort in lower abdomen (suggests retention); whether this is new or a gradual change.",
    whenHospiceMustBeCalled: "No urine output for 12+ hours in a patient not in active dying phase. Signs of urinary retention (discomfort, distension above pubic bone). Catheter that appears blocked.",
    when911MayBeNeeded: "This is rarely an emergency unless combined with severe agitation from retention.",
    medicationNotes: "Urinary retention may need a urinary catheter — hospice can place or arrange this. Bethanechol occasionally used but rarely in hospice.",
    caregiverTechniques: "Palpate (gently press) the lower abdomen above the pubic bone — a distended bladder feels firm and may be tender. Report this to the hospice nurse.",
    commonMistakes: [
      "Assuming decreased urine is simply 'part of dying' without ruling out treatable retention",
      "Not reporting absence of urine to hospice",
    ],
  },
  {
    symptom: "Inability to Swallow",
    aliases: ["can't swallow", "trouble swallowing", "choking on medication", "dysphagia", "swallowing problem", "medication won't go down"],
    urgency: "urgent",
    whatItMayMean: "Disease progression affecting swallowing function (dementia, ALS, stroke), very weakness, or active dying. This requires immediate medication route change.",
    comfortSupport: [
      "Stop all oral medications until nurse advises",
      "Switch to sublingual (under the tongue), rectal, or transdermal routes as directed",
      "Do not attempt to crush and give medications without nurse guidance",
      "Provide mouth care and moisture — do not offer liquids if swallowing is impaired",
    ],
    whatToReport: "When swallowing became impaired, which medications are due, any sign of aspiration (coughing after swallowing, wet or gurgly voice).",
    whenHospiceMustBeCalled: "Any time swallowing is significantly impaired — medications must be rerouted immediately.",
    when911MayBeNeeded: "Active aspiration event with respiratory distress.",
    medicationNotes: "Most critical hospice medications have sublingual, rectal, or transdermal equivalents. Morphine is available sublingual. Lorazepam is available sublingual. Glycopyrrolate is available SC injection.",
    caregiverTechniques: "Use a mouth swab for oral care when drinking is not safe. Stop offering fluids by mouth if swallowing is unreliable.",
    commonMistakes: [
      "Crushing and giving oral medications to a patient who cannot swallow safely",
      "Not calling hospice when swallowing stops — medication rerouting must happen quickly",
      "Continuing to offer water or food when aspiration is happening",
    ],
  },
  {
    symptom: "Fever",
    aliases: ["fever", "hot", "temperature", "sweating", "infection"],
    urgency: "moderate",
    whatItMayMean: "Infection (UTI, pneumonia, wound), aspiration, medication reaction. In the final days of dying, fever can occur from central changes without infection.",
    comfortSupport: [
      "Acetaminophen (if patient can swallow — rectal is also available) for temperature above 101°F causing discomfort",
      "Cool cloths to forehead and neck for comfort",
      "Remove excessive blankets and keep room comfortable",
      "Increase moisture in mouth with damp swabs",
    ],
    whatToReport: "Temperature reading, how it was taken, other symptoms (cough, burning urination, wound appearance), current medications.",
    whenHospiceMustBeCalled: "Temperature above 101°F that is causing distress. Any fever in the context of rapid deterioration.",
    when911MayBeNeeded: "Fever with severe confusion and stiff neck (possible meningitis — rare but serious).",
    medicationNotes: "Treatment is comfort-focused. Antibiotics may be appropriate if the infection is causing distress and is treatable, but this should be discussed with hospice.",
    caregiverTechniques: "Check temperature with appropriate thermometer. Document and report to hospice.",
    commonMistakes: [
      "Treating every fever aggressively in the final days — sometimes fever is part of the dying process",
      "Not treating fever that is causing distress — comfort is the goal",
    ],
  },
  {
    symptom: "Falls",
    aliases: ["fall", "fell", "on the floor", "fell out of bed", "collapsed"],
    urgency: "urgent",
    whatItMayMean: "Weakness and fall risk increase significantly as illness progresses. Falls can result in fractures, head injury, and serious complications.",
    comfortSupport: [
      "Do not attempt to lift someone who has fallen — this can cause injury to both",
      "Assess the patient before moving — are they responsive? Any obvious injury?",
      "Make them comfortable on the floor with a pillow and blanket while help is arranged",
      "Call hospice immediately for guidance",
    ],
    whatToReport: "What happened, where on the body they fell, level of consciousness, complaints of pain, visible injuries.",
    whenHospiceMustBeCalled: "After any fall — even without apparent injury. The hospice nurse will assess for hidden injuries.",
    when911MayBeNeeded: "If there is loss of consciousness, suspected head injury, severe pain in hip or spine (possible fracture), or inability to follow commands.",
    medicationNotes: "Review medications for fall risk — sedating medications may need adjustment. Anti-skid socks and assistive devices.",
    caregiverTechniques: "Keep call button in reach. Bed in lowest position with rails up when unsupervised. Remove floor clutter. Consider floor mat beside bed for patients at high fall risk.",
    commonMistakes: [
      "Attempting to lift a patient alone — this causes caregiver injury and patient injury",
      "Not reporting a fall to hospice because 'nothing seems broken'",
    ],
  },
  {
    symptom: "Bleeding",
    aliases: ["bleeding", "blood", "hemorrhage", "bleed", "bloody wound", "coughing blood", "blood in urine", "rectal bleeding"],
    urgency: "critical",
    whatItMayMean: "Minor wound bleeding, catheter-related bleeding, or in some diagnoses (head/neck cancer, lung cancer, liver disease), risk of catastrophic hemorrhage.",
    comfortSupport: [
      "Apply firm pressure to any wound bleeding with clean cloths or gauze",
      "Dark-colored cloths are recommended for large bleeds — reduces visual distress for family",
      "Keep the patient calm and still",
      "Call hospice and/or 911 depending on severity",
    ],
    whatToReport: "Location of bleeding, amount (soaking through bandages?), color, any other symptoms.",
    whenHospiceMustBeCalled: "Any bleeding that does not stop with 10-15 minutes of firm pressure. Any internal bleeding (coughing blood, blood in stool or urine).",
    when911MayBeNeeded: "Large volume, rapidly worsening bleeding. Any bleeding with loss of consciousness. Catastrophic hemorrhage from head/neck cancer.",
    medicationNotes: "Topical tranexamic acid can reduce some wound bleeding. Hospice may stock this. Midazolam may be used for sedation in catastrophic terminal bleed.",
    caregiverTechniques: "Know in advance if your patient is at risk for catastrophic bleed — ask the hospice team. Have dark-colored towels available.",
    commonMistakes: [
      "Not asking hospice in advance about bleed risk in high-risk diagnoses",
      "Panicking visually in front of the patient during a bleed",
    ],
  },
  {
    symptom: "Pressure Injuries and Skin Breakdown",
    aliases: ["bedsore", "pressure sore", "skin breakdown", "wound", "pressure injury", "redness", "sore on skin"],
    urgency: "moderate",
    whatItMayMean: "As activity decreases and nutrition declines, skin becomes fragile and vulnerable to breakdown. Pressure injuries are preventable but develop rapidly in late-stage illness.",
    comfortSupport: [
      "Reposition every 2 hours (or as often as is comfortable for the patient)",
      "Use a foam or alternating pressure mattress overlay",
      "Keep skin clean and dry",
      "Apply moisture barrier cream to areas exposed to moisture",
      "Report any redness or skin opening to hospice nurse",
    ],
    whatToReport: "Location, size (if visible), color (red, dark, open), any odor, level of patient discomfort.",
    whenHospiceMustBeCalled: "Any skin breakdown that is new or worsening. Any wound with odor, increasing pain, or signs of infection.",
    when911MayBeNeeded: "Skin issues alone are not 911 emergencies.",
    medicationNotes: "Wound care dressings are covered under hospice. A hospice wound care nurse can advise on dressing selection.",
    caregiverTechniques: "Bony prominences are highest risk: heels, sacrum, back of head, elbows, hips. Inspect skin with each repositioning. Float heels off the mattress with a pillow under the calves.",
    commonMistakes: [
      "Repositioning too infrequently",
      "Not reporting early redness — early intervention prevents full breakdown",
      "Turning a patient who is in the final hours of dying — in that situation, comfort takes priority over turning",
    ],
  },
];

export function findSymptomGuidance(messageText: string): SymptomGuidance | undefined {
  const lower = messageText.toLowerCase();
  return SYMPTOM_GUIDANCE_MAP.find((sg) =>
    sg.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );
}

export function findAllMatchingSymptoms(messageText: string): SymptomGuidance[] {
  const lower = messageText.toLowerCase();
  return SYMPTOM_GUIDANCE_MAP.filter((sg) =>
    sg.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );
}
