import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "/api";
const STORAGE_KEY = "@hospice_roadmap_interviews";

// ─── Data Model ──────────────────────────────────────────────────────────────

interface InterviewData {
  hospiceName: string; branch: string; date: string; contactPerson: string;
  ownershipType: string; ownershipOther: string;
  adminName: string; adminPhone: string;
  clinicalManagerName: string; clinicalManagerPhone: string;
  medicalDirectorName: string; medicalDirectorPhone: string;
  firstImpression: string; firstImpressionNotes: string;
  rnVisits: string; aideVisits: string; socialWorker: string; chaplain: string;
  afterHours: string; afterHoursResponseTime: string; agencyStaff: string; routineCareRealistic: string;
  chcExplanation: string; gipFacility: string; gipApproval: string;
  respiteFacility: string; respiteDistance: string; respiteDistanceFeel: string;
  weekendCrisis: string; crisisConfidence: string;
  effectiveDate: string; effectiveDateType: string; revocationAnswer: string; changeOfMindInstruction: string;
  discussedDischarge: string; dischargeCriteria: string; medicationsOnDischarge: string;
  equipmentOnDischarge: string; capPressure: string; trustOnMoney: string;
  primaryLocation: string; locationOther: string; medicaidPath: string; ltcPolicy: string;
  scoreHardQuestions: number; scoreOwnershipClarity: number; scoreRoutineVisits: number;
  scoreCrisisCredibility: number; scoreMoneyHonesty: number; scoreGutFeeling: number;
  biggestGreenFlag: string; biggestRedFlag: string; finalLabel: string;
}

const DEFAULT: InterviewData = {
  hospiceName: "", branch: "", date: "", contactPerson: "",
  ownershipType: "", ownershipOther: "",
  adminName: "", adminPhone: "",
  clinicalManagerName: "", clinicalManagerPhone: "",
  medicalDirectorName: "", medicalDirectorPhone: "",
  firstImpression: "", firstImpressionNotes: "",
  rnVisits: "", aideVisits: "", socialWorker: "", chaplain: "",
  afterHours: "", afterHoursResponseTime: "", agencyStaff: "", routineCareRealistic: "",
  chcExplanation: "", gipFacility: "", gipApproval: "",
  respiteFacility: "", respiteDistance: "", respiteDistanceFeel: "",
  weekendCrisis: "", crisisConfidence: "",
  effectiveDate: "", effectiveDateType: "", revocationAnswer: "", changeOfMindInstruction: "",
  discussedDischarge: "", dischargeCriteria: "", medicationsOnDischarge: "",
  equipmentOnDischarge: "", capPressure: "", trustOnMoney: "",
  primaryLocation: "", locationOther: "", medicaidPath: "", ltcPolicy: "",
  scoreHardQuestions: 0, scoreOwnershipClarity: 0, scoreRoutineVisits: 0,
  scoreCrisisCredibility: 0, scoreMoneyHonesty: 0, scoreGutFeeling: 0,
  biggestGreenFlag: "", biggestRedFlag: "", finalLabel: "",
};

interface CategoryScore { name: string; score: number; color: string; finding: string; }
interface ScoringResult {
  overallScore: number; recommendation: string; recommendationReason: string;
  categoryScores: CategoryScore[]; greenFlags: string[]; redFlags: string[];
  questionsToAsk: string[]; narrative: string;
}

interface SavedInterview {
  id: string; savedAt: string;
  hospiceName: string; overallScore: number; recommendation: string;
  interviewData: InterviewData; result: ScoringResult;
}

// ─── Small Reusable UI ────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, hint, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; multiline?: boolean;
}) {
  return (
    <View style={ui.field}>
      <Text style={ui.fieldLabel}>{label}</Text>
      {hint ? <Text style={ui.fieldHint}>{hint}</Text> : null}
      <TextInput
        style={[ui.textInput, multiline && { minHeight: 72, textAlignVertical: "top" }]}
        value={value} onChangeText={onChange}
        placeholder={placeholder ?? ""} placeholderTextColor={Colors.textSubtle}
        multiline={multiline}
      />
    </View>
  );
}

function RadioGroup({ label, hint, options, value, onChange }: {
  label: string; hint?: string;
  options: { value: string; label: string; flag?: "green" | "yellow" | "red" }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={ui.radioGroup}>
      <Text style={ui.fieldLabel}>{label}</Text>
      {hint ? <Text style={ui.fieldHint}>{hint}</Text> : null}
      <View style={ui.radioOptions}>
        {options.map((opt) => {
          const selected = value === opt.value;
          const flagColor = opt.flag === "green" ? Colors.success : opt.flag === "red" ? Colors.error : opt.flag === "yellow" ? Colors.warning : Colors.primary;
          return (
            <Pressable key={opt.value}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(selected ? "" : opt.value); }}
              style={({ pressed }) => [ui.radioOption, selected && { borderColor: flagColor, backgroundColor: flagColor + "14" }, pressed && { opacity: 0.8 }]}
            >
              <View style={[ui.radioCircle, selected && { borderColor: flagColor, backgroundColor: flagColor }]}>
                {selected && <View style={ui.radioDot} />}
              </View>
              <Text style={[ui.radioLabel, selected && { color: flagColor }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={ui.scoreRow}>
      <Text style={ui.scoreLabel}>{label}</Text>
      <View style={ui.scorePips}>
        {[1,2,3,4,5].map((n) => (
          <Pressable key={n}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(n); }}
            style={[ui.scorePip, value >= n && { backgroundColor: n <= 2 ? Colors.error : n === 3 ? Colors.warning : Colors.success }]}
          >
            <Text style={[ui.scorePipText, value >= n && { color: "#fff" }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Educational explainer (collapsible) ─────────────────────────────────────

function SectionIntro({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={ui.educBox}>
      <Pressable onPress={() => setOpen(v => !v)} style={ui.educHeader}>
        <Feather name="book-open" size={15} color={Colors.primary} />
        <Text style={ui.educTitle}>{title}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={15} color={Colors.textMuted} />
      </Pressable>
      {open && <View style={ui.educBody}>{children}</View>}
    </View>
  );
}

function EducLine({ children }: { children: string }) {
  return <Text style={ui.educLine}>{children}</Text>;
}

function TermDef({ term, children }: { term: string; children: string }) {
  return (
    <View style={ui.termRow}>
      <Text style={ui.termLabel}>{term}:</Text>
      <Text style={ui.termDef}>{children}</Text>
    </View>
  );
}

// ─── Section 1 ────────────────────────────────────────────────────────────────

function Section1({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Why ownership type matters">
        <EducLine>Not all hospices are the same kind of organization — and ownership affects decisions.</EducLine>
        <TermDef term="Nonprofit">Surplus money goes back into care. Often more staff, more generous with crisis benefits.</TermDef>
        <TermDef term="Hospital-owned">Usually well-staffed and held to hospital accountability standards.</TermDef>
        <TermDef term="Large national for-profit">Can be excellent, but corporate targets may influence care decisions. Ask more questions.</TermDef>
        <TermDef term="Private-equity backed">PE firms often cut costs aggressively. OIG investigations have found higher rates of premature discharge and skipped visits. Proceed with caution.</TermDef>
        <EducLine>Getting the names and phone numbers of actual leaders now means you have someone to call if the bedside team isn't responding.</EducLine>
      </SectionIntro>

      <Field label="Hospice Legal Name" value={d.hospiceName} onChange={(v) => set("hospiceName", v)} placeholder="e.g. Sunrise Hospice LLC" />
      <Field label="Branch / Location" value={d.branch} onChange={(v) => set("branch", v)} placeholder="City or office name" hint="Large hospices may have multiple offices — you want the one actually providing your care." />
      <Field label="Date of Interview" value={d.date} onChange={(v) => set("date", v)} placeholder="e.g. March 30, 2026" />
      <Field label="Person We Met (Name & Title)" value={d.contactPerson} onChange={(v) => set("contactPerson", v)} placeholder="e.g. Jane Smith, Intake RN" hint="Was this an intake coordinator, a nurse, or a salesperson? Salespeople can overpromise — a nurse or clinical manager is more accountable." />

      <RadioGroup
        label="Ownership Type"
        hint="Ask directly: 'Who owns this organization?' They are required to tell you."
        options={[
          { value: "nonprofit", label: "Nonprofit", flag: "green" },
          { value: "hospital", label: "Hospital-owned", flag: "green" },
          { value: "large-forprofit", label: "Large national for-profit", flag: "yellow" },
          { value: "regional-forprofit", label: "Regional for-profit" },
          { value: "pe-backed", label: "Private-equity backed", flag: "red" },
          { value: "other", label: "Other" },
        ]}
        value={d.ownershipType}
        onChange={(v) => set("ownershipType", v)}
      />
      {d.ownershipType === "other" && (
        <Field label="Specify Ownership" value={d.ownershipOther} onChange={(v) => set("ownershipOther", v)} />
      )}

      <View style={ui.subSection}>
        <Text style={ui.subSectionTitle}>Leaders We Can Call</Text>
        <Text style={ui.subSectionHint}>Write these down now. If a crisis isn't handled right, you'll want names — not a call center.</Text>
        <Field label="Administrator Name" value={d.adminName} onChange={(v) => set("adminName", v)} />
        <Field label="Administrator Phone" value={d.adminPhone} onChange={(v) => set("adminPhone", v)} placeholder="(___) ___-____" />
        <Field label="Clinical Manager Name" value={d.clinicalManagerName} onChange={(v) => set("clinicalManagerName", v)} />
        <Field label="Clinical Manager Phone" value={d.clinicalManagerPhone} onChange={(v) => set("clinicalManagerPhone", v)} placeholder="(___) ___-____" />
        <Field label="Medical Director Name" value={d.medicalDirectorName} onChange={(v) => set("medicalDirectorName", v)} />
        <Field label="Medical Director Phone" value={d.medicalDirectorPhone} onChange={(v) => set("medicalDirectorPhone", v)} placeholder="(___) ___-____" />
      </View>

      <RadioGroup
        label="First Impression — How did they communicate?"
        hint="Your gut feeling during this conversation is data. Hospice care is deeply relational — if they're already being vague or sales-y, that often continues."
        options={[
          { value: "clear-direct", label: "Clear and direct — answered questions without deflection", flag: "green" },
          { value: "warm-vague", label: "Warm but vague — nice but dodged specifics", flag: "yellow" },
          { value: "salesy-rushed", label: "Sales-y or rushed — felt like they wanted to close, not inform", flag: "red" },
        ]}
        value={d.firstImpression}
        onChange={(v) => set("firstImpression", v)}
      />
      <Field label="Notes" value={d.firstImpressionNotes} onChange={(v) => set("firstImpressionNotes", v)} multiline placeholder="Anything else about your first impression — body language, what they avoided, what surprised you…" />
    </View>
  );
}

// ─── Section 2 ────────────────────────────────────────────────────────────────

function Section2({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Understanding routine care visits">
        <EducLine>Medicare requires hospice to provide a "team" — but doesn't set a minimum visit count. That means the number of visits is negotiated, and a good hospice will commit to specifics.</EducLine>
        <TermDef term="RN (Registered Nurse)">Manages pain and symptoms, assesses changes, trains caregivers. This is your most important clinical relationship.</TermDef>
        <TermDef term="Aide">Helps with bathing, grooming, positioning. Critical for patient dignity and caregiver rest. Ask specifically how many days per week.</TermDef>
        <TermDef term="Social Worker">Handles paperwork, advance directives, family dynamics, insurance, and Medicaid planning. Should visit at least monthly — not just "as needed."</TermDef>
        <TermDef term="Chaplain">Provides spiritual care regardless of religion. Research shows hospice chaplaincy reduces anxiety and improves family experience significantly.</TermDef>
        <TermDef term="Agency nurses">Contract nurses hired from staffing agencies. They don't know your loved one and read the care plan off a tablet when they arrive. High agency use = lower continuity of care.</TermDef>
        <EducLine>A hospice that won't give you specific numbers for visits is a hospice that doesn't want to be held accountable.</EducLine>
      </SectionIntro>

      <RadioGroup
        label="RN (Registered Nurse) Visits per Week"
        hint="Ask: 'How many times per week will an RN visit us?' Push for a number, not a range like 'as needed.'"
        options={[
          { value: "1-2", label: "1–2 per week — minimal but acceptable for stable patients" },
          { value: "3-4", label: "3–4 per week — good standard of care", flag: "green" },
          { value: "5plus", label: "5+ per week — excellent, especially if patient is actively declining", flag: "green" },
          { value: "unclear", label: "Wouldn't give a number / said 'as needed'", flag: "red" },
        ]}
        value={d.rnVisits}
        onChange={(v) => set("rnVisits", v)}
      />
      <RadioGroup
        label="Aide Visits per Week"
        hint="Ask: 'How many days per week will an aide come to help with bathing and personal care?'"
        options={[
          { value: "1-2", label: "1–2 per week" },
          { value: "3-4", label: "3–4 per week", flag: "green" },
          { value: "5plus", label: "5+ per week (daily aide care)", flag: "green" },
          { value: "unclear", label: "Wouldn't say / unclear", flag: "red" },
        ]}
        value={d.aideVisits}
        onChange={(v) => set("aideVisits", v)}
      />
      <RadioGroup
        label="Social Worker Visits"
        hint="A good social worker does more than paperwork — they support family communication, navigate Medicaid, and prepare you for what's ahead."
        options={[
          { value: "monthly", label: "At least once a month", flag: "green" },
          { value: "as-needed", label: '"As needed" only — you have to ask for them', flag: "yellow" },
          { value: "unclear", label: "Unclear / evasive", flag: "red" },
        ]}
        value={d.socialWorker}
        onChange={(v) => set("socialWorker", v)}
      />
      <RadioGroup
        label="Chaplain Visits"
        hint="Ask even if you're not religious — many families find unexpected value in spiritual care during this time. A chaplain is a Medicare-covered benefit."
        options={[
          { value: "monthly", label: "At least once a month", flag: "green" },
          { value: "as-needed", label: '"As needed" only — you have to ask', flag: "yellow" },
          { value: "unclear", label: "Unclear", flag: "red" },
        ]}
        value={d.chaplain}
        onChange={(v) => set("chaplain", v)}
      />

      <View style={ui.divider} />
      <View style={ui.infoBox}>
        <Feather name="moon" size={14} color={Colors.primary} />
        <Text style={ui.infoText}>After-hours is where many hospices fail. The 2 AM call is the real test of care quality — not the sales meeting.</Text>
      </View>

      <RadioGroup
        label="Who Answers the Phone at 2 AM?"
        hint="Ask exactly this: 'If my loved one is in severe pain at 2 in the morning and I call, who answers?' Listen carefully."
        options={[
          { value: "hospice-nurse", label: "A nurse employed by this hospice — they know the patient's care plan", flag: "green" },
          { value: "call-center", label: "A call center or answering service — a stranger reads off a script", flag: "yellow" },
          { value: "unclear", label: "They were vague or changed the subject", flag: "red" },
        ]}
        value={d.afterHours}
        onChange={(v) => set("afterHours", v)}
      />
      <RadioGroup
        label="How Quickly Will a Nurse Physically Arrive?"
        hint="A phone call cannot manage a pain crisis. You need someone at the bedside. Push for a specific time commitment."
        options={[
          { value: "within-1hr", label: "Within 1 hour to the bedside", flag: "green" },
          { value: "1-3hr", label: "1–3 hours", flag: "yellow" },
          { value: "vague", label: '"As soon as possible" / "It depends" / no clear answer', flag: "red" },
        ]}
        value={d.afterHoursResponseTime}
        onChange={(v) => set("afterHoursResponseTime", v)}
      />
      <RadioGroup
        label="Agency / Contract Nurse Usage"
        hint="Ask: 'Do you use agency or contract nurses? How often?' High agency use means the person at your loved one's bedside may change each visit and won't know the care plan."
        options={[
          { value: "rarely", label: "Rarely — mostly their own employed nurses", flag: "green" },
          { value: "often", label: "Often or regularly use agency nurses", flag: "red" },
          { value: "dodged", label: "They avoided or deflected the question", flag: "red" },
        ]}
        value={d.agencyStaff}
        onChange={(v) => set("agencyStaff", v)}
      />
      <RadioGroup
        label="Overall: Does this care plan feel realistic?"
        hint="Your gut check — do the specific promises match what you know about your loved one's needs?"
        options={[
          { value: "yes", label: "Yes — it feels like enough care for our situation", flag: "green" },
          { value: "no", label: "No — it feels like too little", flag: "red" },
          { value: "not-sure", label: "Not sure — I need to ask more questions", flag: "yellow" },
        ]}
        value={d.routineCareRealistic}
        onChange={(v) => set("routineCareRealistic", v)}
      />
    </View>
  );
}

// ─── Section 3 ────────────────────────────────────────────────────────────────

function Section3({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Crisis care — your most important Medicare benefits">
        <TermDef term="CHC (Continuous Home Care)">8 to 24 hours of continuous nursing care, provided at home, during a medical crisis. Designed to prevent an ER visit. Medicare pays 100% — but some hospices rarely use it because it's expensive for them to staff.</TermDef>
        <TermDef term="GIP (General Inpatient Care)">Short-term hospital-level care in a facility when symptoms can't be managed at home. Covered by Medicare. A real facility name should be named — not just 'the hospital.'</TermDef>
        <TermDef term="Respite Care">Up to 5 consecutive days in a facility to give caregivers a break. Medicare-covered. A good hospice will have a facility ready to use — ask for the name and distance.</TermDef>
        <EducLine>🚨 If a hospice says "we almost never do CHC," that is a serious red flag. It means they plan to send you to the ER during a crisis instead of deploying their own nurses. That defeats a core purpose of hospice.</EducLine>
      </SectionIntro>

      <RadioGroup
        label="Continuous Home Care (CHC)"
        hint="Ask: 'Walk me through how a patient qualifies for Continuous Home Care. Can you give me an example of when you've used it?' Watch how they respond."
        options={[
          { value: "clearly-explained", label: "Clearly explained qualifying criteria and process", flag: "green" },
          { value: "gave-example", label: "Gave a real example of a patient who received it", flag: "green" },
          { value: "almost-never", label: 'Said "we almost never do that" or "it rarely happens"', flag: "red" },
          { value: "avoided", label: "Changed the subject, got vague, or acted like it wasn't relevant", flag: "red" },
        ]}
        value={d.chcExplanation}
        onChange={(v) => set("chcExplanation", v)}
      />

      <RadioGroup
        label="General Inpatient (GIP) — Where Would They Send Us?"
        hint="Ask: 'If we needed inpatient-level crisis care, what specific facility would you use? Can you give me the name?' 'The hospital' is not a real answer."
        options={[
          { value: "named-real", label: "Named a specific facility with a real name and unit", flag: "green" },
          { value: "vague", label: 'Said "a hospital" or "wherever has beds" — too vague', flag: "red" },
        ]}
        value={d.gipFacility}
        onChange={(v) => set("gipFacility", v)}
      />
      <RadioGroup
        label="GIP Approval — Who Can Authorize It Same-Day?"
        hint="In a real crisis, you can't wait days for approvals. Ask: 'If we needed GIP tonight, who has the authority to approve it immediately?'"
        options={[
          { value: "named-approver", label: "Named a specific role or person who can approve urgently", flag: "green" },
          { value: "could-not-say", label: "Could not say, was vague, or said 'it goes through a process'", flag: "red" },
        ]}
        value={d.gipApproval}
        onChange={(v) => set("gipApproval", v)}
      />

      <View style={ui.divider} />
      <Text style={ui.groupLabel}>Respite Care</Text>
      <Text style={ui.groupHint}>Respite gives caregivers a break — up to 5 consecutive days in a facility, fully covered by Medicare. A good hospice has a facility already arranged. Ask for the name and how far it is.</Text>

      <Field label="Respite Facility Name" value={d.respiteFacility} onChange={(v) => set("respiteFacility", v)} placeholder="Name of facility (ask for it specifically)" />
      <Field label="Distance from Home (miles)" value={d.respiteDistance} onChange={(v) => set("respiteDistance", v)} placeholder="e.g. 12" />
      <RadioGroup
        label="Is the Respite Facility a Reasonable Distance?"
        options={[
          { value: "reasonable", label: "Yes — we could realistically use it", flag: "green" },
          { value: "too-far", label: "Too far, inconvenient, or they couldn't give a location", flag: "red" },
        ]}
        value={d.respiteDistanceFeel}
        onChange={(v) => set("respiteDistanceFeel", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="Weekend & Night Crisis — How Does It Actually Work?"
        hint="Ask: 'If my loved one has a crisis at 10 PM on a Friday — walk me through exactly what happens, step by step.' Vague answers here mean vague care in a real crisis."
        options={[
          { value: "clearly-described", label: "They described a clear, step-by-step process", flag: "green" },
          { value: "vague", label: "Vague \u2014 \u201cwe handle it,\u201d \u201cit depends,\u201d or no clear process described", flag: "red" },
        ]}
        value={d.weekendCrisis}
        onChange={(v) => set("weekendCrisis", v)}
      />
      <RadioGroup
        label="Your Overall Crisis Confidence"
        options={[
          { value: "believe", label: "I believe this hospice can handle a real crisis", flag: "green" },
          { value: "do-not-believe", label: "I do NOT believe they can handle a real crisis", flag: "red" },
        ]}
        value={d.crisisConfidence}
        onChange={(v) => set("crisisConfidence", v)}
      />
    </View>
  );
}

// ─── Section 4 ────────────────────────────────────────────────────────────────

function Section4({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Admission paperwork — what to watch for">
        <TermDef term="Effective date">The date your Medicare hospice benefit officially starts. This triggers your benefit period. Make sure it reflects today if care starts today — not a future date meant to 'hold your spot.'</TermDef>
        <TermDef term="Revocation">Your legal right to end hospice at any time and return to curative or other care. No penalty. No waiting period. It is YOUR written decision — signed and dated by you, not by the hospice.</TermDef>
        <EducLine>🚨 Some hospices pressure families to "revoke" when a patient improves, or when their care becomes expensive. This is unethical. A good hospice will explain this right proactively and clearly. A bad one will treat it like something that just happens automatically.</EducLine>
        <EducLine>You should never feel rushed to sign documents. You have the right to take the paperwork home and read it first.</EducLine>
      </SectionIntro>

      <Field label="Effective Date They Wrote on the Form" value={d.effectiveDate} onChange={(v) => set("effectiveDate", v)} placeholder="e.g. March 30, 2026" hint="This is the date care officially starts under Medicare. Check that it matches your expectation." />
      <RadioGroup
        label="What Does This Date Actually Mean?"
        options={[
          { value: "real-start", label: "Real start of care today — services begin now", flag: "green" },
          { value: "future-placeholder", label: "Future placeholder — 'holding' a spot for later", flag: "yellow" },
          { value: "unclear", label: "They couldn't or wouldn't explain what the date means", flag: "red" },
        ]}
        value={d.effectiveDateType}
        onChange={(v) => set("effectiveDateType", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="What Did They Say About Revocation?"
        hint="Ask directly: 'What happens if we decide to leave hospice? How does that work?' Listen for whether they frame revocation as your right or as something that just happens."
        options={[
          { value: "clearly-said", label: "Clearly said: revocation is our written choice, with a date we choose", flag: "green" },
          { value: "admitted-suggestion", label: "Acknowledged that nurses sometimes suggest revocation — but said it's still your decision", flag: "yellow" },
          { value: "acted-like-just-happens", label: "Acted like revocation just happens automatically when care gets expensive or status improves", flag: "red" },
        ]}
        value={d.revocationAnswer}
        onChange={(v) => set("revocationAnswer", v)}
      />

      <View style={ui.warningBox}>
        <Feather name="alert-triangle" size={14} color={Colors.warning} />
        <Text style={ui.warningText}>
          Remind yourself: You will not sign a revocation form just because care is getting expensive or someone on staff is impatient. Revocation is always your written, dated choice — and you can always return to hospice after revoking.
        </Text>
      </View>

      <RadioGroup
        label="If You Change Your Mind Before Care Starts, They Said To:"
        hint="You should always have a clear, specific path to cancel before services begin. 'Don't worry about it' is a red flag."
        options={[
          { value: "named-person", label: "Call a specific named person", flag: "green" },
          { value: "in-writing", label: "Send something in writing (email, fax, or portal)", flag: "green" },
          { value: "dont-worry", label: '"Just don\'t worry about it" — no clear process given', flag: "red" },
        ]}
        value={d.changeOfMindInstruction}
        onChange={(v) => set("changeOfMindInstruction", v)}
      />
    </View>
  );
}

// ─── Section 5 ────────────────────────────────────────────────────────────────

function Section5({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Discharge & the financial cap — what you need to know">
        <TermDef term="'No longer eligible' / Discharge">"Discharged" from hospice means the hospice team has determined you no longer meet criteria — usually because a patient improved. This is legal and appropriate when done clinically. It becomes problematic when it's financially motivated.</TermDef>
        <TermDef term="Medicare Cap">Each hospice has an annual Medicare cap — a dollar limit on how much Medicare will pay them per patient across their entire census. When hospices approach this cap, some discharge patients to reduce costs. This financial pressure is real and hospices are not always honest about it.</TermDef>
        <TermDef term="Equipment removal">Hospice provides your medical equipment — the hospital bed, oxygen, suction machine. If you're discharged, they take it back. A good hospice will not remove equipment until you have replacement sources arranged. A bad one might show up and take it immediately.</TermDef>
        <EducLine>A hospice that denies financial pressure ever influences their decisions is not being honest with you. The right answer is: "Yes, the cap is real, but our clinical team makes the call, not finance."</EducLine>
      </SectionIntro>

      <RadioGroup
        label="Did They Bring Up Discharge or Eligibility Criteria at All?"
        hint="A transparent hospice brings this up proactively. If they only focused on the positives and never mentioned eligibility, that's a small yellow flag."
        options={[
          { value: "yes", label: "Yes — they explained it on their own" },
          { value: "no", label: "No — they never mentioned discharge or eligibility", flag: "yellow" },
        ]}
        value={d.discussedDischarge}
        onChange={(v) => set("discussedDischarge", v)}
      />

      {d.discussedDischarge === "yes" && (
        <RadioGroup
          label="How Did They Explain 'No Longer Eligible'?"
          hint="Ask: 'What would cause us to be discharged from hospice?' Clear clinical criteria is the right answer."
          options={[
            { value: "clear-criteria", label: "Gave clear clinical criteria — specific and measurable", flag: "green" },
            { value: "vague", label: '"We\'ll know when we see it" or "the team decides" — no specifics', flag: "red" },
          ]}
          value={d.dischargeCriteria}
          onChange={(v) => set("dischargeCriteria", v)}
        />
      )}

      <RadioGroup
        label="Medications at Discharge — What Happens?"
        hint="Ask: 'If we leave hospice, who handles our medications that day? Will there be a gap in our prescriptions?' Morphine and other comfort meds require prescriptions that can't lapse."
        options={[
          { value: "plan-exists", label: "They described a specific plan for medication continuity", flag: "green" },
          { value: "unclear", label: "Wasn't addressed or gave a vague answer", flag: "red" },
        ]}
        value={d.medicationsOnDischarge}
        onChange={(v) => set("medicationsOnDischarge", v)}
      />
      <RadioGroup
        label="Equipment at Discharge — When Does It Get Removed?"
        hint="Ask: 'If we discharge, when does the hospital bed and oxygen get picked up? Will you wait until we have alternatives?' Equipment removal is a safety issue."
        options={[
          { value: "wont-take-until-replacement", label: "They will not remove equipment until replacement is arranged", flag: "green" },
          { value: "might-take-early", label: "Indicated they might take equipment quickly without waiting for replacements", flag: "red" },
          { value: "unclear", label: "Didn't address it or gave an unclear answer", flag: "red" },
        ]}
        value={d.equipmentOnDischarge}
        onChange={(v) => set("equipmentOnDischarge", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="The Financial Cap — Were They Honest About It?"
        hint="Ask: 'Does your hospice ever factor in the Medicare cap or cost when making discharge decisions?' The answer tells you a lot about their culture of honesty."
        options={[
          { value: "admitted-clinical-first", label: 'Honestly said: "The cap is real, but clinical decisions come first — finance doesn\'t make the call"', flag: "green" },
          { value: "denied-any", label: '"We never factor money into decisions" — sounds good, but may not be honest', flag: "yellow" },
          { value: "dodged", label: "Changed the subject, minimized, or acted like the question was inappropriate", flag: "red" },
        ]}
        value={d.capPressure}
        onChange={(v) => set("capPressure", v)}
      />
      <RadioGroup
        label="Your Gut Feeling After This Section"
        options={[
          { value: "trust", label: "I trust them not to push us out for financial reasons", flag: "green" },
          { value: "dont-trust", label: "I have doubts about their financial honesty", flag: "red" },
        ]}
        value={d.trustOnMoney}
        onChange={(v) => set("trustOnMoney", v)}
      />
    </View>
  );
}

// ─── Section 6 ────────────────────────────────────────────────────────────────

function Section6({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Understanding hospice and money">
        <EducLine>This is the section most families don't think about until it's too late. Hospice is a medical benefit — it is NOT a housing benefit.</EducLine>
        <TermDef term="What hospice DOES pay for">Nursing visits, aide visits, medications related to the hospice diagnosis, medical equipment, social work, chaplaincy, and all care team services.</TermDef>
        <TermDef term="What hospice does NOT pay for">Room and board in a nursing facility, ALF, or memory care. That cost stays with the family. Many families are surprised to learn this.</TermDef>
        <TermDef term="Medicaid">A state-federal program that can cover room and board costs in a facility when Medicare won't. Qualifying involves income and asset rules, and a long application. A good hospice social worker will help you navigate this — not just say "we don't do that."</TermDef>
        <TermDef term="Long-Term Care (LTC) Insurance">Private insurance that may cover facility room and board costs. Check your policy's elimination period, daily benefit amount, and which care settings it covers.</TermDef>
      </SectionIntro>

      <RadioGroup
        label="Where Will the Patient Be Most of the Time?"
        hint="This affects what hospice services look like day-to-day, and who pays for what."
        options={[
          { value: "home", label: "Home (their own or family's)" },
          { value: "assisted-living", label: "Assisted living facility (ALF)" },
          { value: "memory-care", label: "Memory care unit" },
          { value: "nursing", label: "Nursing facility / skilled nursing facility (SNF)" },
          { value: "other", label: "Other" },
        ]}
        value={d.primaryLocation}
        onChange={(v) => set("primaryLocation", v)}
      />
      {d.primaryLocation === "other" && (
        <Field label="Specify Location" value={d.locationOther} onChange={(v) => set("locationOther", v)} />
      )}

      <View style={ui.infoBox}>
        <Feather name="info" size={14} color={Colors.primary} />
        <Text style={ui.infoText}>
          Important: Hospice covers the medical care, NOT the room and board. If your loved one is in a facility, you continue paying the facility separately — hospice is layered on top.
        </Text>
      </View>

      <RadioGroup
        label="If Money Runs Out — What Did They Say?"
        hint="Ask: 'If our savings run out while my loved one is in a facility, what options do we have? Can your social worker help us apply for Medicaid?' This is a test of their social work capabilities."
        options={[
          { value: "realistic-path", label: "Described a realistic Medicaid application path for your state", flag: "green" },
          { value: "named-helper", label: "Named a specific person (social worker) who helps with financial planning", flag: "green" },
          { value: "vague", label: '"We don\'t really handle that" or gave no specific guidance', flag: "red" },
        ]}
        value={d.medicaidPath}
        onChange={(v) => set("medicaidPath", v)}
      />
      <RadioGroup
        label="Long-Term Care (LTC) Insurance"
        hint="If you have LTC insurance, ask the hospice: 'How do you work with LTC policies? Do you help with billing coordination?' A good hospice social worker knows how to navigate this."
        options={[
          { value: "yes", label: "We have an LTC policy and need to coordinate it" },
          { value: "no", label: "We don't have LTC insurance or aren't sure" },
        ]}
        value={d.ltcPolicy}
        onChange={(v) => set("ltcPolicy", v)}
      />
    </View>
  );
}

// ─── Section 7 ────────────────────────────────────────────────────────────────

function Section7({ d, set, setScore }: {
  d: InterviewData;
  set: (k: keyof InterviewData, v: string) => void;
  setScore: (k: keyof InterviewData, v: number) => void;
}) {
  return (
    <View style={ui.sectionBody}>
      <SectionIntro title="Your trust score — why it matters">
        <EducLine>Research on hospice family experience consistently shows that the initial interview predicts overall satisfaction. Your gut feeling right now is valuable clinical data.</EducLine>
        <EducLine>Rate 1–5: 1 = terrible / they failed this area. 3 = acceptable but not great. 5 = excellent / I was genuinely reassured. Ragna will use your scores alongside your specific answers to build a complete picture.</EducLine>
        <EducLine>After you submit, Ragna will add her own analysis, flag what she noticed in your earlier answers, and give you questions to ask before you decide.</EducLine>
      </SectionIntro>

      <View style={ui.scoreCard}>
        <ScoreRow label="Answering hard questions directly" value={d.scoreHardQuestions} onChange={(v) => setScore("scoreHardQuestions", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Ownership & leadership clarity" value={d.scoreOwnershipClarity} onChange={(v) => setScore("scoreOwnershipClarity", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Routine visits felt realistic" value={d.scoreRoutineVisits} onChange={(v) => setScore("scoreRoutineVisits", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Crisis care credibility" value={d.scoreCrisisCredibility} onChange={(v) => setScore("scoreCrisisCredibility", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Honesty about money & cap" value={d.scoreMoneyHonesty} onChange={(v) => setScore("scoreMoneyHonesty", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Overall gut feeling" value={d.scoreGutFeeling} onChange={(v) => setScore("scoreGutFeeling", v)} />
      </View>

      <Field label="Biggest Green Flag" value={d.biggestGreenFlag} onChange={(v) => set("biggestGreenFlag", v)} placeholder="The best or most reassuring thing they said or showed…" multiline />
      <Field label="Biggest Red Flag" value={d.biggestRedFlag} onChange={(v) => set("biggestRedFlag", v)} placeholder="The thing that concerned or unsettled you most…" multiline />

      <RadioGroup
        label="Your Initial Label for This Hospice"
        hint="Go with your gut. You can always revise after seeing Ragna's analysis."
        options={[
          { value: "strong-candidate", label: "Strong candidate — I feel good about this one", flag: "green" },
          { value: "maybe", label: "Maybe — I have questions but it could work", flag: "yellow" },
          { value: "probably-not", label: "Probably not — too many concerns", flag: "yellow" },
          { value: "absolutely-not", label: "Absolutely not — I would not choose this hospice", flag: "red" },
        ]}
        value={d.finalLabel}
        onChange={(v) => set("finalLabel", v)}
      />
    </View>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({ result, hospiceName, onNewInterview, onBack }: {
  result: ScoringResult; hospiceName: string;
  onNewInterview: () => void; onBack: () => void;
}) {
  const scoreColor = result.overallScore >= 80 ? Colors.success : result.overallScore >= 60 ? Colors.warning : result.overallScore >= 40 ? Colors.accent : Colors.error;
  const recColor = result.recommendation === "Strong Candidate" ? Colors.success : result.recommendation === "Maybe" ? Colors.warning : Colors.error;
  const catColor = (c: string) => c === "green" ? Colors.success : c === "yellow" ? Colors.warning : Colors.error;

  return (
    <>
      <View style={ui.scoreHeader}>
        <View style={[ui.scoreBadge, { borderColor: scoreColor }]}>
          <Text style={[ui.scoreBadgeNum, { color: scoreColor }]}>{result.overallScore}</Text>
          <Text style={[ui.scoreBadgeLabel, { color: scoreColor }]}>/ 100</Text>
        </View>
        <View style={ui.scoreHeaderRight}>
          <Text style={ui.scoreHospiceName} numberOfLines={2}>{hospiceName || "This Hospice"}</Text>
          <View style={[ui.recBadge, { backgroundColor: recColor + "22", borderColor: recColor + "55" }]}>
            <Text style={[ui.recBadgeText, { color: recColor }]}>{result.recommendation}</Text>
          </View>
          <Text style={ui.recReason}>{result.recommendationReason}</Text>
        </View>
      </View>

      <View style={ui.narrativeCard}>
        <View style={ui.narrativeHeader}>
          <Feather name="message-circle" size={16} color={Colors.primary} />
          <Text style={ui.narrativeTitle}>Ragna's Assessment</Text>
        </View>
        <Text style={ui.narrativeText}>{result.narrative}</Text>
      </View>

      <Text style={ui.resultsSection}>Category Breakdown</Text>
      <View style={ui.categoryCard}>
        {result.categoryScores.map((cat, i) => (
          <View key={cat.name}>
            {i > 0 && <View style={ui.scoreDivider} />}
            <View style={ui.categoryRow}>
              <View style={[ui.categoryDot, { backgroundColor: catColor(cat.color) }]} />
              <View style={ui.categoryText}>
                <View style={ui.categoryTop}>
                  <Text style={ui.categoryName}>{cat.name}</Text>
                  <Text style={[ui.categoryScore, { color: catColor(cat.color) }]}>{cat.score}/5</Text>
                </View>
                <Text style={ui.categoryFinding}>{cat.finding}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {result.greenFlags.length > 0 && (
        <>
          <Text style={ui.resultsSection}>Green Flags</Text>
          <View style={[ui.flagCard, { borderColor: Colors.success + "44" }]}>
            {result.greenFlags.map((f, i) => (
              <View key={i} style={ui.flagRow}>
                <Feather name="check-circle" size={14} color={Colors.success} />
                <Text style={ui.flagText}>{f}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {result.redFlags.length > 0 && (
        <>
          <Text style={ui.resultsSection}>Red Flags</Text>
          <View style={[ui.flagCard, { borderColor: Colors.error + "44" }]}>
            {result.redFlags.map((f, i) => (
              <View key={i} style={ui.flagRow}>
                <Feather name="alert-circle" size={14} color={Colors.error} />
                <Text style={ui.flagText}>{f}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {result.questionsToAsk.length > 0 && (
        <>
          <Text style={ui.resultsSection}>Questions to Ask Next</Text>
          <View style={ui.questionCard}>
            {result.questionsToAsk.map((q, i) => (
              <View key={i} style={ui.questionRow}>
                <Text style={ui.questionNum}>{i + 1}</Text>
                <Text style={ui.questionText}>{q}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable
        onPress={() => router.push({ pathname: "/(tabs)/help", params: { initialMessage: `I just completed a hospice interview scorecard for ${hospiceName || "a hospice"}. Ragna scored them ${result.overallScore}/100 with a recommendation of "${result.recommendation}". Can you help me think through whether this is the right hospice for us?` } } as any)}
        style={({ pressed }) => [ui.askRagnaBtn, pressed && { opacity: 0.85 }]}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={ui.askRagnaBtnText}>Talk It Through with Ragna</Text>
      </Pressable>

      <Pressable onPress={onNewInterview} style={({ pressed }) => [ui.secondaryBtn, pressed && { opacity: 0.7 }]}>
        <Feather name="plus" size={16} color={Colors.primary} />
        <Text style={ui.secondaryBtnText}>Interview Another Hospice</Text>
      </Pressable>

      <Pressable onPress={onBack} style={({ pressed }) => [ui.retakeBtn, pressed && { opacity: 0.7 }]}>
        <Feather name="list" size={16} color={Colors.textMuted} />
        <Text style={ui.retakeBtnText}>View All Saved Interviews</Text>
      </Pressable>
    </>
  );
}

// ─── Landing / History View ───────────────────────────────────────────────────

function LandingView({ saved, onStart, onView }: {
  saved: SavedInterview[]; onStart: () => void; onView: (s: SavedInterview) => void;
}) {
  const scoreColor = (n: number) => n >= 80 ? Colors.success : n >= 60 ? Colors.warning : n >= 40 ? Colors.accent : Colors.error;
  const recColor = (r: string) => r === "Strong Candidate" ? Colors.success : r === "Maybe" ? Colors.warning : Colors.error;

  return (
    <>
      <View style={ui.landingHero}>
        <View style={ui.landingIconWrap}>
          <Feather name="check-square" size={28} color={Colors.primary} />
        </View>
        <Text style={ui.landingTitle}>Hospice Interview Scorecard</Text>
        <Text style={ui.landingBody}>
          Use this tool while meeting with a hospice — or right after. Answer questions about what they said, and Ragna will score them across 6 clinical categories and tell you if they meet your needs.
        </Text>
      </View>

      <View style={ui.howItWorks}>
        <Text style={ui.howTitle}>How it works</Text>
        {[
          { icon: "edit", text: "Fill in 7 sections covering ownership, routine care, crisis coverage, paperwork, finances, and your gut feeling" },
          { icon: "zap", text: 'Tap \u201cScore with Ragna\u201d \u2014 Ragna reviews your answers and generates a 0\u2013100 score, category ratings, and specific red flags' },
          { icon: "save", text: "Your completed interview is automatically saved here for future reference and comparison" },
        ].map((step, i) => (
          <View key={i} style={ui.howRow}>
            <View style={ui.howNum}><Text style={ui.howNumText}>{i + 1}</Text></View>
            <View style={ui.howIcon}><Feather name={step.icon as any} size={15} color={Colors.primary} /></View>
            <Text style={ui.howText}>{step.text}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={onStart} style={({ pressed }) => [ui.startBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}>
        <Feather name="edit-3" size={18} color="#fff" />
        <Text style={ui.startBtnText}>Start New Interview</Text>
      </Pressable>

      {saved.length > 0 && (
        <>
          <Text style={ui.savedSectionTitle}>Past Interviews ({saved.length})</Text>
          {[...saved].reverse().map((s) => (
            <Pressable key={s.id} onPress={() => onView(s)} style={({ pressed }) => [ui.savedCard, pressed && { opacity: 0.85 }]}>
              <View style={[ui.savedScore, { borderColor: scoreColor(s.overallScore) }]}>
                <Text style={[ui.savedScoreNum, { color: scoreColor(s.overallScore) }]}>{s.overallScore}</Text>
              </View>
              <View style={ui.savedCardBody}>
                <Text style={ui.savedCardName} numberOfLines={1}>{s.hospiceName || "Unnamed Hospice"}</Text>
                <Text style={ui.savedCardDate}>{new Date(s.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                <View style={[ui.savedRecBadge, { backgroundColor: recColor(s.recommendation) + "22" }]}>
                  <Text style={[ui.savedRecText, { color: recColor(s.recommendation) }]}>{s.recommendation}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textSubtle} />
            </Pressable>
          ))}
        </>
      )}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Who Are We Talking To?", subtitle: "Hospice name, ownership, leaders" },
  { title: "Routine Care", subtitle: "Visits, after-hours, agency staff" },
  { title: "Crisis Care", subtitle: "CHC, GIP, Respite, weekends" },
  { title: "Dates & Revocation", subtitle: "Admission paperwork, your rights" },
  { title: "Discharge & Equipment", subtitle: "What happens if care ends" },
  { title: "Place & Money", subtitle: "Location, Medicaid, LTC insurance" },
  { title: "Trust Score", subtitle: "Your gut rating — 1 to 5 per category" },
];

type ScreenMode = "landing" | "interview" | "results";

export default function HospiceInterviewScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [view, setView] = useState<ScreenMode>("landing");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<InterviewData>({ ...DEFAULT });
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [saved, setSaved] = useState<SavedInterview[]>([]);
  const [viewingInterview, setViewingInterview] = useState<SavedInterview | null>(null);

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as SavedInterview[]);
    } catch { /* ignore */ }
  };

  const persistInterview = async (record: SavedInterview) => {
    try {
      const updated = [...saved, record];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaved(updated);
    } catch { /* ignore */ }
  };

  const setField = (k: keyof InterviewData, v: string) => setData((prev) => ({ ...prev, [k]: v }));
  const setScoreField = (k: keyof InterviewData, v: number) => setData((prev) => ({ ...prev, [k]: v }));

  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const goNext = () => {
    scrollTop();
    if (step < 6) setStep(step + 1);
    else handleScore();
  };

  const goPrev = () => {
    scrollTop();
    if (step > 0) setStep(step - 1);
    else { setView("landing"); setStep(0); }
  };

  const handleScore = async () => {
    setIsScoring(true);
    try {
      const resp = await fetch(`${API_BASE}/anthropic/score-hospice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview: data }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json() as ScoringResult;
      setResult(json);

      const record: SavedInterview = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        savedAt: new Date().toISOString(),
        hospiceName: data.hospiceName || "Unnamed Hospice",
        overallScore: json.overallScore,
        recommendation: json.recommendation,
        interviewData: { ...data },
        result: json,
      };
      await persistInterview(record);

      setView("results");
      scrollTop();
    } catch {
      Alert.alert("Scoring Failed", "Couldn't reach Ragna right now. Please check your connection and try again.");
    } finally {
      setIsScoring(false);
    }
  };

  const startNewInterview = () => {
    setData({ ...DEFAULT });
    setResult(null);
    setStep(0);
    setViewingInterview(null);
    setView("interview");
    scrollTop();
  };

  const viewSavedInterview = (s: SavedInterview) => {
    setViewingInterview(s);
    setData(s.interviewData);
    setResult(s.result);
    setView("results");
    scrollTop();
  };

  const renderSection = () => {
    switch (step) {
      case 0: return <Section1 d={data} set={setField} />;
      case 1: return <Section2 d={data} set={setField} />;
      case 2: return <Section3 d={data} set={setField} />;
      case 3: return <Section4 d={data} set={setField} />;
      case 4: return <Section5 d={data} set={setField} />;
      case 5: return <Section6 d={data} set={setField} />;
      case 6: return <Section7 d={data} set={setField} setScore={setScoreField} />;
      default: return null;
    }
  };

  const headerTitle = view === "landing" ? "Hospice Interview" : view === "results" ? "Interview Results" : "Hospice Interview";
  const headerSub = view === "landing" ? `${saved.length} saved` : view === "results" ? (viewingInterview?.hospiceName || data.hospiceName || "AI Scoring Complete") : `Section ${step + 1} of ${STEPS.length}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <CosmicBackground />

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (view === "landing") router.back();
            else if (view === "results") { setViewingInterview(null); setView("landing"); scrollTop(); }
            else goPrev();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSub}>{headerSub}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {view === "interview" && (
        <View style={styles.progressBar}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progressSegment, { backgroundColor: i <= step ? Colors.primary : Colors.divider }]} />
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (view === "interview" ? 100 : 40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "landing" && (
          <LandingView saved={saved} onStart={startNewInterview} onView={viewSavedInterview} />
        )}
        {view === "results" && result && (
          <ResultsView
            result={result}
            hospiceName={viewingInterview?.hospiceName ?? data.hospiceName}
            onNewInterview={startNewInterview}
            onBack={() => { setViewingInterview(null); setView("landing"); scrollTop(); }}
          />
        )}
        {view === "interview" && (
          <>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>{STEPS[step].title}</Text>
              <Text style={styles.sectionSub}>{STEPS[step].subtitle}</Text>
            </View>
            {renderSection()}
          </>
        )}
      </ScrollView>

      {view === "interview" && (
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable onPress={goPrev} style={({ pressed }) => [styles.prevBtn, pressed && { opacity: 0.7 }]}>
            <Feather name="chevron-left" size={18} color={Colors.textMuted} />
            <Text style={styles.prevBtnText}>{step === 0 ? "Cancel" : "Back"}</Text>
          </Pressable>
          <Pressable
            onPress={goNext} disabled={isScoring}
            style={({ pressed }) => [styles.nextBtn, isScoring && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
          >
            {isScoring ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>{step === 6 ? "Score with Ragna" : "Next"}</Text>
                {step === 6 ? <Feather name="zap" size={16} color="#fff" /> : <Feather name="chevron-right" size={16} color="#fff" />}
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

const ui = StyleSheet.create({
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, letterSpacing: -0.1 },
  fieldHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 17 },
  textInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 13, paddingVertical: 11,
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, minHeight: 44,
  },
  radioGroup: { gap: 8 },
  radioOptions: { gap: 7 },
  radioOption: {
    flexDirection: "row", alignItems: "center", gap: 11, padding: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.divider, backgroundColor: Colors.surface,
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  radioLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  subSection: { gap: 10, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.divider },
  subSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  subSectionHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSubtle, lineHeight: 17, marginBottom: 4 },
  sectionBody: { gap: 16 },
  divider: { height: 1, backgroundColor: Colors.divider },
  groupLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  groupHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 19 },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.primaryPale, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.primary + "28",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  warningBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.amberPale, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.warning + "40",
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  scoreCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.divider, overflow: "hidden" },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  scoreLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  scorePips: { flexDirection: "row", gap: 5 },
  scorePip: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
  },
  scorePipText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.textMuted },
  scoreDivider: { height: 1, backgroundColor: Colors.divider },
  // Educational box
  educBox: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider, overflow: "hidden" },
  educHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  educTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.primaryDark },
  educBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  educLine: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  termRow: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  termLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.text, flexShrink: 0 },
  termDef: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  // Results
  scoreHeader: {
    flexDirection: "row", gap: 16, alignItems: "flex-start",
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.divider,
  },
  scoreBadge: {
    width: 80, height: 80, borderRadius: 16, borderWidth: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundSecondary, flexShrink: 0,
  },
  scoreBadgeNum: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  scoreBadgeLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scoreHeaderRight: { flex: 1, gap: 6 },
  scoreHospiceName: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3, lineHeight: 22 },
  recBadge: { alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  recBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: -0.1 },
  recReason: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  narrativeCard: {
    backgroundColor: Colors.primaryPale, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + "30", gap: 10,
  },
  narrativeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  narrativeTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.primaryDark },
  narrativeText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 22 },
  resultsSection: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
  categoryCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.divider, overflow: "hidden" },
  categoryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
  categoryText: { flex: 1, gap: 3 },
  categoryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1 },
  categoryScore: { fontSize: 14, fontFamily: "Inter_700Bold" },
  categoryFinding: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 19 },
  flagCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flagText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  questionCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.divider, padding: 14, gap: 12 },
  questionRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  questionNum: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: Colors.primaryPale,
    textAlign: "center", lineHeight: 24, fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.primary, flexShrink: 0,
  },
  questionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  askRagnaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  askRagnaBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary + "55",
    backgroundColor: Colors.primaryPale,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.primary },
  retakeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  retakeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  // Landing
  landingHero: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.divider, alignItems: "center", gap: 10,
  },
  landingIconWrap: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center",
  },
  landingTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.4, textAlign: "center" },
  landingBody: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 22, textAlign: "center" },
  howItWorks: { backgroundColor: Colors.backgroundSecondary, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.divider },
  howTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howNum: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: Colors.primaryPale,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
  },
  howNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.primary },
  howIcon: { width: 22, alignItems: "center", marginTop: 1 },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  startBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
  savedSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  savedCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.divider,
  },
  savedScore: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 2.5,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.backgroundSecondary, flexShrink: 0,
  },
  savedScoreNum: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  savedCardBody: { flex: 1, gap: 4 },
  savedCardName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  savedCardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  savedRecBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  savedRecText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  progressBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 4, backgroundColor: Colors.background },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  sectionTitleBlock: { gap: 4, paddingBottom: 4 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  bottomNav: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 12, gap: 12,
    borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.background,
  },
  prevBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.divider, justifyContent: "center",
  },
  prevBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  nextBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  nextBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
});
