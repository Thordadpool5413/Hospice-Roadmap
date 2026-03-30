// Disease trajectory models for 6 major hospice diagnoses

export interface DiseaseTrajectory {
  diagnosis: string;
  aliases: string[];
  trajectory: "gradual_decline" | "variable_decline" | "sudden_death_risk" | "prolonged_slow";
  typicalTimeline: string;
  earlyPhase: string;
  middlePhase: string;
  latePhase: string;
  finalPhase: string;
  commonSymptoms: string[];
  uniqueConsiderations: string;
  medicationNotes: string;
  familyPrepPoints: string[];
  unexpectedSigns: string[];
  careGapRisks: string[];
}

export const DISEASE_TRAJECTORIES: DiseaseTrajectory[] = [
  {
    diagnosis: "Advanced Cancer",
    aliases: ["cancer", "malignancy", "tumor", "metastatic", "stage 4", "oncology"],
    trajectory: "gradual_decline",
    typicalTimeline: "Weeks to months; often a clear inflection point of rapid decline 1-2 weeks before death",
    earlyPhase: "Fatigue, pain, decreased appetite, weight loss. Still ambulatory or able to be up in a chair.",
    middlePhase: "Significant weakness, increased pain, possible dyspnea, nausea. Mostly bedbound. Eating minimal amounts.",
    latePhase: "Bedbound, minimal intake, drowsy most of the day, wound care needs may increase, possible delirium.",
    finalPhase: "Unresponsive, Cheyne-Stokes breathing, mottling, terminal secretions, extremities cool and dark.",
    commonSymptoms: ["pain", "fatigue", "anorexia", "nausea", "constipation", "dyspnea", "confusion", "delirium", "bone pain", "wound pain"],
    uniqueConsiderations: "Pain is often the dominant concern. Bone metastases create fracture risk — avoid forceful repositioning. Liver metastases can cause jaundice and confusion. Brain metastases create seizure risk and rapid cognitive decline. Head and neck cancers carry risk of catastrophic hemorrhage — hospice should prepare the family in advance.",
    medicationNotes: "High opioid requirements common due to cancer pain and tolerance. Methadone may be used for complex pain. Steroids (dexamethasone) often helpful for appetite, energy, and nausea. NSAIDs can help bone pain but require renal monitoring.",
    familyPrepPoints: [
      "Weight loss and decreased appetite are expected — do not force food",
      "Pain can be managed well — report any score above 6/10",
      "Confusion may occur as the brain becomes affected or as kidneys decline",
      "Head/neck cancer patients: ask hospice explicitly about bleed risk preparation",
      "The final decline often happens faster than expected after a period of stability",
    ],
    unexpectedSigns: ["sudden severe headache (possible brain met bleed)", "seizure (brain mets)", "sudden large bleed (vessel erosion)", "sudden fracture with minimal movement"],
    careGapRisks: ["undertreated pain", "bone fracture risk not communicated", "bleed risk not prepared for", "delirium not recognized early"],
  },

  {
    diagnosis: "Advanced Dementia",
    aliases: ["dementia", "Alzheimer's", "Alzheimer", "memory", "Lewy body", "vascular dementia", "frontotemporal"],
    trajectory: "prolonged_slow",
    typicalTimeline: "Often unpredictable — can be months to years. Final phase marked by complete dependence and loss of swallowing.",
    earlyPhase: "In hospice context, already in moderate-severe dementia. Loss of language, recognition of family, and mobility.",
    middlePhase: "Bedbound, minimal purposeful movement, total care needs for all ADLs, frequent aspiration risk.",
    latePhase: "Loss of ability to swallow effectively — aspiration pneumonia is common. Minimal response to stimulation.",
    finalPhase: "Similar to other diagnoses — Cheyne-Stokes, mottling, cooling. Often more prolonged than expected.",
    commonSymptoms: ["agitation", "pain (often undertreated)", "aspiration pneumonia", "pressure injuries", "contractures", "constipation", "infections"],
    uniqueConsiderations: "Pain is frequently undertreated because patients cannot report it — use PAINAD scale for behavioral pain assessment. Aspiration pneumonia is a terminal complication — treatment should be comfort-focused, not curative. Artificial nutrition and hydration does not extend life in advanced dementia — hospice families need to understand this clearly. Behavioral changes (agitation, screaming) may represent pain.",
    medicationNotes: "Antipsychotics (haloperidol, quetiapine) for agitation but use lowest effective dose. Opioids may be needed for pain but families are often resistant — education is key. Anticholinergics contraindicated for secretions in Lewy body (use morphine instead).",
    familyPrepPoints: [
      "They may not recognize you — this is the disease, not a reflection of love",
      "Loss of swallowing is a natural progression — tube feeding is not required and does not prolong meaningful life",
      "Aspiration pneumonia is expected and is typically treated for comfort only in hospice",
      "Behavior changes and sounds may be pain — always report new agitation",
      "The end stage can last weeks to months — prepare for a prolonged final phase",
    ],
    unexpectedSigns: ["sudden high fever (infection)", "aspiration event with respiratory distress", "fracture from osteoporosis"],
    careGapRisks: ["pain undertreated (behavioral signals missed)", "pressure injuries preventable but developing", "family pressure for tube feeding against patient's best interest", "family not prepared for prolonged dying"],
  },

  {
    diagnosis: "Advanced Heart Failure",
    aliases: ["heart failure", "CHF", "congestive heart failure", "cardiac", "heart disease", "heart condition"],
    trajectory: "variable_decline",
    typicalTimeline: "Unpredictable — episodes of acute decompensation with periods of relative stability. Sudden death risk throughout.",
    earlyPhase: "Severe dyspnea with minimal exertion, significant edema, fatigue. Some oral diuretics still helping.",
    middlePhase: "Dyspnea at rest, large volume edema, orthopnea (needs multiple pillows or to sleep upright), reduced urine output.",
    latePhase: "Severe dyspnea, ascites possibly, decreased renal perfusion creating azotemia and confusion, cool extremities.",
    finalPhase: "Cheyne-Stokes breathing, peripheral cooling, Cheyne-Stokes pattern often prominent. Sudden death can still occur.",
    commonSymptoms: ["dyspnea", "edema", "fatigue", "chest discomfort", "orthopnea", "confusion", "poor appetite", "weight changes (fluid)"],
    uniqueConsiderations: "Unlike cancer, CHF trajectory is unpredictable — sudden decompensation and sudden death are realistic. Many CHF patients have implantable defibrillators (ICDs) that should be deactivated near death to prevent painful shocks — hospice must address this proactively. Diuretics may be continued for comfort even in hospice. Sleep-disordered breathing creates nighttime fear.",
    medicationNotes: "Low-dose opioids (morphine) are highly effective for dyspnea. Diuretics (furosemide) may be continued if effective for edema-related breathlessness. Reduce or stop diuretics if patient is no longer drinking. ICD deactivation discussion MUST occur before death — this is a hospice responsibility.",
    familyPrepPoints: [
      "Breathlessness is the most distressing symptom — opioids and positioning help",
      "The ICD must be deactivated — ask the hospice team if this has been done",
      "Sudden death is possible even in stable-appearing periods — prepare emotionally",
      "Fluid restriction and daily weights may no longer be appropriate in the final phase",
      "Cool extremities and bluish legs late in the disease are circulatory, not painful",
    ],
    unexpectedSigns: ["ICD firing (painful electric shock) — this is a care failure if not deactivated", "sudden cardiac death", "acute pulmonary edema with severe distress"],
    careGapRisks: ["ICD not deactivated before death", "dyspnea undertreated", "sudden death family not prepared for"],
  },

  {
    diagnosis: "Advanced Lung Disease",
    aliases: ["COPD", "emphysema", "pulmonary fibrosis", "IPF", "lung disease", "lung failure", "oxygen dependent"],
    trajectory: "gradual_decline",
    typicalTimeline: "Slow decline with possible acute exacerbations; oxygen dependency marks significant decline.",
    earlyPhase: "Severe dyspnea with activity, significant air trapping in COPD, supplemental oxygen required.",
    middlePhase: "Dyspnea with minimal exertion or at rest, CO2 retention in COPD (causing drowsiness and confusion), hypoxia.",
    latePhase: "Continuous severe dyspnea, drowsy from CO2 retention, minimal oral intake, severe fatigue.",
    finalPhase: "Respiratory failure — breathing becomes very labored and then slows. Cheyne-Stokes may be less prominent; may be more of slow labored decline to cessation.",
    commonSymptoms: ["dyspnea", "anxiety", "air hunger", "cough", "secretions", "fatigue", "CO2-related confusion", "insomnia"],
    uniqueConsiderations: "Supplemental oxygen does not always reduce dyspnea — opioids are more effective for air hunger. Anxiolytics are frequently needed — anxiety and dyspnea co-amplify. CO2 retention (hypercapnia) causes drowsiness and confusion that can look like the patient is dying when they are simply hypercapnic. Fan on face is highly effective for perceived breathlessness.",
    medicationNotes: "Low-dose oral morphine for dyspnea. Lorazepam for anxiety component. Nebulized bronchodilators continue for symptom relief. Do not over-oxygenate COPD patients — excessive O2 can suppress respiratory drive.",
    familyPrepPoints: [
      "The fan on the face helps breathlessness — use it",
      "More oxygen is not always better in COPD — trust the hospice team on oxygen levels",
      "Opioids for breathing are safe and appropriate — they reduce air hunger without hastening death",
      "Anxiety and breathlessness are connected — treating one helps the other",
      "Drowsiness from CO2 can look like the patient is near death when they may have weeks",
    ],
    unexpectedSigns: ["sudden worsening respiratory distress (COPD exacerbation)", "pneumothorax (spontaneous, especially in emphysema)"],
    careGapRisks: ["dyspnea undertreated", "anxiety not addressed", "family not prepared for CO2 drowsiness episodes"],
  },

  {
    diagnosis: "ALS and Neurodegenerative Disease",
    aliases: ["ALS", "Lou Gehrig's", "motor neuron disease", "ALS/MND", "Parkinson's", "Parkinson", "MSA", "PSP"],
    trajectory: "gradual_decline",
    typicalTimeline: "ALS: typically 3-5 years from diagnosis, 6-18 months from swallowing loss. Parkinson's: variable, often years.",
    earlyPhase: "Loss of function in affected systems — limb weakness in ALS, falls and rigidity in Parkinson's.",
    middlePhase: "ALS: Progressive limb, speech, and swallowing loss. Parkinson's: dementia may develop, severe rigidity, falls.",
    latePhase: "ALS: respiratory muscle failure is the cause of death — requires difficult ventilation discussions. Parkinson's: dysphagia, aspiration pneumonia.",
    finalPhase: "ALS: respiratory failure — may be anticipated and managed with comfort ventilation decisions. Parkinson's: similar to dementia endstage.",
    commonSymptoms: ["dyspnea (ALS)", "dysphagia", "secretion management", "aspiration", "contractures (Parkinson's)", "pain (Parkinson's)", "constipation", "anxiety", "cognitive changes"],
    uniqueConsiderations: "ALS patients often have intact cognition until death and have very specific, complex ventilation decisions to make (NIV, tracheostomy, BiPAP withdrawal). Parkinson's — do NOT use haloperidol or prochlorperazine (block dopamine, worsen rigidity). Use quetiapine for agitation. Constipation is nearly universal and severe in both conditions — aggressive bowel management required.",
    medicationNotes: "ALS: baclofen for spasticity; anticholinergics for secretions; opioids for dyspnea if NIV is withdrawn. Parkinson's: avoid haloperidol — use quetiapine for agitation. Do not suddenly stop dopaminergic medications.",
    familyPrepPoints: [
      "ALS: Have the ventilation conversation early — what do they want when breathing becomes the issue?",
      "Parkinson's patients: constipation is a major quality-of-life issue — address it aggressively",
      "Swallowing loss does not mean hospice can't help — it means we transition to different nutrition and medication approaches",
      "The person with ALS is still fully present cognitively — speak to them as such",
      "Parkinson's rigidity can cause significant pain — pain management is a priority",
    ],
    unexpectedSigns: ["sudden respiratory distress in ALS (respiratory muscle failure)", "ALS patient unable to communicate sudden change if non-verbal"],
    careGapRisks: ["ventilation conversation delayed or avoided", "constipation undertreated", "haloperidol given to Parkinson's patient", "pain in Parkinson's undertreated because patient can't report"],
  },

  {
    diagnosis: "General Frailty and Multi-System Failure",
    aliases: ["failure to thrive", "debility", "frailty", "old age", "multi-organ failure", "weakness", "elderly decline"],
    trajectory: "prolonged_slow",
    typicalTimeline: "Often the most unpredictable — can be weeks to many months. Gradual decline with possible sudden turn.",
    earlyPhase: "Significant weakness and functional decline, minimal oral intake, falls risk, confusion at times.",
    middlePhase: "Bedbound or chair-bound, dependent for all care, minimal appetite, periods of confusion.",
    latePhase: "Mostly unresponsive to surroundings, minimal intake, mottling possible, sleeping most of the day.",
    finalPhase: "Cheyne-Stokes or agonal breathing, cooling, mottling. Often peaceful.",
    commonSymptoms: ["weakness", "pain (often musculoskeletal)", "confusion", "poor intake", "pressure injury risk", "constipation", "aspiration risk"],
    uniqueConsiderations: "These patients often have multiple comorbidities — polypharmacy is a significant risk. Review all medications and stop non-hospice-aligned ones. Renal function declines affect medication dosing. These patients may surprise — a person thought to be days away can stabilize for weeks. Family education on this variability is critical.",
    medicationNotes: "Stop statins, antihypertensives not needed for comfort, diabetes medications unless needed for comfort (hypoglycemia can cause distress). Continue medications that actively contribute to comfort.",
    familyPrepPoints: [
      "The timeline is very uncertain — prepare for weeks to months",
      "Appetite loss is expected and should not be forced",
      "Skin breakdown is a significant risk — position changes every 2 hours if possible",
      "Confusion may come and go",
      "This path can be very peaceful — many frailty deaths are quiet and gradual",
    ],
    unexpectedSigns: ["sudden complete unresponsiveness (may be delirium, hypoglycemia, or rapid decline)", "hip fracture from fall"],
    careGapRisks: ["polypharmacy continuation", "pressure injuries not prevented", "timeline uncertainty causing caregiver under-preparation"],
  },
];

export function findDiseaseTrajectory(messageText: string): DiseaseTrajectory | undefined {
  const lower = messageText.toLowerCase();
  return DISEASE_TRAJECTORIES.find((dt) =>
    dt.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );
}
