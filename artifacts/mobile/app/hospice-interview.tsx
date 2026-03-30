import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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

// ─── Data Model ──────────────────────────────────────────────────────────────

interface InterviewData {
  // Section 1
  hospiceName: string;
  branch: string;
  date: string;
  contactPerson: string;
  ownershipType: string;
  ownershipOther: string;
  adminName: string;
  adminPhone: string;
  clinicalManagerName: string;
  clinicalManagerPhone: string;
  medicalDirectorName: string;
  medicalDirectorPhone: string;
  firstImpression: string;
  firstImpressionNotes: string;
  // Section 2
  rnVisits: string;
  aideVisits: string;
  socialWorker: string;
  chaplain: string;
  afterHours: string;
  afterHoursResponseTime: string;
  agencyStaff: string;
  routineCareRealistic: string;
  // Section 3
  chcExplanation: string;
  gipFacility: string;
  gipApproval: string;
  respiteFacility: string;
  respiteDistance: string;
  respiteDistanceFeel: string;
  weekendCrisis: string;
  crisisConfidence: string;
  // Section 4
  effectiveDate: string;
  effectiveDateType: string;
  revocationAnswer: string;
  changeOfMindInstruction: string;
  // Section 5
  discussedDischarge: string;
  dischargeCriteria: string;
  medicationsOnDischarge: string;
  equipmentOnDischarge: string;
  capPressure: string;
  trustOnMoney: string;
  // Section 6
  primaryLocation: string;
  locationOther: string;
  medicaidPath: string;
  ltcPolicy: string;
  // Section 7
  scoreHardQuestions: number;
  scoreOwnershipClarity: number;
  scoreRoutineVisits: number;
  scoreCrisisCredibility: number;
  scoreMoneyHonesty: number;
  scoreGutFeeling: number;
  biggestGreenFlag: string;
  biggestRedFlag: string;
  finalLabel: string;
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

// ─── Scoring Result Type ──────────────────────────────────────────────────────

interface CategoryScore { name: string; score: number; color: string; finding: string; }
interface ScoringResult {
  overallScore: number;
  recommendation: string;
  recommendationReason: string;
  categoryScores: CategoryScore[];
  greenFlags: string[];
  redFlags: string[];
  questionsToAsk: string[];
  narrative: string;
}

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

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
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor={Colors.textSubtle}
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
          const flagColor = opt.flag === "green" ? Colors.success
            : opt.flag === "red" ? Colors.error
            : opt.flag === "yellow" ? Colors.warning : Colors.primary;
          return (
            <Pressable
              key={opt.value}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(selected ? "" : opt.value); }}
              style={({ pressed }) => [
                ui.radioOption,
                selected && { borderColor: flagColor, backgroundColor: flagColor + "14" },
                pressed && { opacity: 0.8 },
              ]}
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
          <Pressable
            key={n}
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

// ─── Section Components ───────────────────────────────────────────────────────

function Section1({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <Field label="Hospice Legal Name" value={d.hospiceName} onChange={(v) => set("hospiceName", v)} placeholder="e.g. Sunrise Hospice LLC" />
      <Field label="Branch / Location" value={d.branch} onChange={(v) => set("branch", v)} placeholder="City or office name" />
      <Field label="Date of Interview" value={d.date} onChange={(v) => set("date", v)} placeholder="e.g. March 30, 2026" />
      <Field label="Person We Met (Name & Title)" value={d.contactPerson} onChange={(v) => set("contactPerson", v)} placeholder="e.g. Jane Smith, Intake RN" />

      <RadioGroup
        label="Ownership Type"
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
        <Field label="Administrator Name" value={d.adminName} onChange={(v) => set("adminName", v)} />
        <Field label="Administrator Phone" value={d.adminPhone} onChange={(v) => set("adminPhone", v)} placeholder="(___) ___-____" />
        <Field label="Clinical Manager Name" value={d.clinicalManagerName} onChange={(v) => set("clinicalManagerName", v)} />
        <Field label="Clinical Manager Phone" value={d.clinicalManagerPhone} onChange={(v) => set("clinicalManagerPhone", v)} placeholder="(___) ___-____" />
        <Field label="Medical Director Name" value={d.medicalDirectorName} onChange={(v) => set("medicalDirectorName", v)} />
        <Field label="Medical Director Phone" value={d.medicalDirectorPhone} onChange={(v) => set("medicalDirectorPhone", v)} placeholder="(___) ___-____" />
      </View>

      <RadioGroup
        label="First Impression"
        options={[
          { value: "clear-direct", label: "Clear and direct", flag: "green" },
          { value: "warm-vague", label: "Warm but vague", flag: "yellow" },
          { value: "salesy-rushed", label: "Salesy / rushed", flag: "red" },
        ]}
        value={d.firstImpression}
        onChange={(v) => set("firstImpression", v)}
      />
      <Field label="Notes" value={d.firstImpressionNotes} onChange={(v) => set("firstImpressionNotes", v)} multiline placeholder="Anything else about your first impression…" />
    </View>
  );
}

function Section2({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <RadioGroup
        label="RN Visits per Week"
        hint="How many registered nurse visits did they commit to?"
        options={[
          { value: "1-2", label: "1–2 per week" },
          { value: "3-4", label: "3–4 per week", flag: "green" },
          { value: "5plus", label: "5+ per week", flag: "green" },
          { value: "unclear", label: "Wouldn't say / unclear", flag: "red" },
        ]}
        value={d.rnVisits}
        onChange={(v) => set("rnVisits", v)}
      />
      <RadioGroup
        label="Aide Visits per Week"
        options={[
          { value: "1-2", label: "1–2 per week" },
          { value: "3-4", label: "3–4 per week", flag: "green" },
          { value: "5plus", label: "5+ per week", flag: "green" },
          { value: "unclear", label: "Wouldn't say / unclear", flag: "red" },
        ]}
        value={d.aideVisits}
        onChange={(v) => set("aideVisits", v)}
      />
      <RadioGroup
        label="Social Worker Visits"
        options={[
          { value: "monthly", label: "At least monthly", flag: "green" },
          { value: "as-needed", label: '"As needed" only', flag: "yellow" },
          { value: "unclear", label: "Unclear", flag: "red" },
        ]}
        value={d.socialWorker}
        onChange={(v) => set("socialWorker", v)}
      />
      <RadioGroup
        label="Chaplain Visits"
        options={[
          { value: "monthly", label: "At least monthly", flag: "green" },
          { value: "as-needed", label: '"As needed" only', flag: "yellow" },
          { value: "unclear", label: "Unclear", flag: "red" },
        ]}
        value={d.chaplain}
        onChange={(v) => set("chaplain", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="After Hours — Who Answers at 2 AM?"
        options={[
          { value: "hospice-nurse", label: "A nurse from this hospice", flag: "green" },
          { value: "call-center", label: "Call center / answering service", flag: "yellow" },
          { value: "unclear", label: "Not clear", flag: "red" },
        ]}
        value={d.afterHours}
        onChange={(v) => set("afterHours", v)}
      />
      <RadioGroup
        label="Nurse Response Time (After Hours)"
        options={[
          { value: "within-1hr", label: "Within 1 hour", flag: "green" },
          { value: "1-3hr", label: "1–3 hours", flag: "yellow" },
          { value: "vague", label: '"As soon as possible" / vague', flag: "red" },
        ]}
        value={d.afterHoursResponseTime}
        onChange={(v) => set("afterHoursResponseTime", v)}
      />
      <RadioGroup
        label="Agency / Contract Staff Usage"
        hint="Do they use contract nurses who aren't their own employees?"
        options={[
          { value: "rarely", label: "They rarely use agency nurses", flag: "green" },
          { value: "often", label: "They use agency often", flag: "red" },
          { value: "dodged", label: "They dodged the question", flag: "red" },
        ]}
        value={d.agencyStaff}
        onChange={(v) => set("agencyStaff", v)}
      />
      <RadioGroup
        label="Does the routine care plan feel realistic?"
        options={[
          { value: "yes", label: "Yes", flag: "green" },
          { value: "no", label: "No", flag: "red" },
          { value: "not-sure", label: "Not sure", flag: "yellow" },
        ]}
        value={d.routineCareRealistic}
        onChange={(v) => set("routineCareRealistic", v)}
      />
    </View>
  );
}

function Section3({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <View style={ui.infoBox}>
        <Feather name="info" size={14} color={Colors.primary} />
        <Text style={ui.infoText}>
          Crisis care (CHC, GIP, Respite) is a Medicare benefit. A good hospice knows these tools and uses them. Be wary if they minimize or avoid these topics.
        </Text>
      </View>

      <RadioGroup
        label="Continuous Home Care (CHC)"
        hint="This is 8–24 hrs of nursing during a crisis. Did they explain it clearly?"
        options={[
          { value: "clearly-explained", label: "They clearly explained how someone qualifies", flag: "green" },
          { value: "gave-example", label: "They gave a real example", flag: "green" },
          { value: "almost-never", label: 'They said "we almost never do that"', flag: "red" },
          { value: "avoided", label: "They avoided or blurred the question", flag: "red" },
        ]}
        value={d.chcExplanation}
        onChange={(v) => set("chcExplanation", v)}
      />

      <RadioGroup
        label="General Inpatient (GIP) Facility"
        hint="Where would they send you for inpatient crisis management?"
        options={[
          { value: "named-real", label: "Named a real unit / facility", flag: "green" },
          { value: "vague", label: 'Just said "hospital" / vague', flag: "red" },
        ]}
        value={d.gipFacility}
        onChange={(v) => set("gipFacility", v)}
      />
      <RadioGroup
        label="GIP Same-Day Approval"
        hint="Who has authority to approve a GIP admission urgently?"
        options={[
          { value: "named-approver", label: "Named who can approve (role or person)", flag: "green" },
          { value: "could-not-say", label: "Could not say who approves", flag: "red" },
        ]}
        value={d.gipApproval}
        onChange={(v) => set("gipApproval", v)}
      />

      <View style={ui.divider} />

      <Field label="Respite Facility Name" value={d.respiteFacility} onChange={(v) => set("respiteFacility", v)} placeholder="Name of facility" />
      <Field label="Respite Distance (miles)" value={d.respiteDistance} onChange={(v) => set("respiteDistance", v)} placeholder="e.g. 12" />
      <RadioGroup
        label="Respite Distance Feel"
        options={[
          { value: "reasonable", label: "Driving distance feels reasonable", flag: "green" },
          { value: "too-far", label: "Too far / unclear", flag: "red" },
        ]}
        value={d.respiteDistanceFeel}
        onChange={(v) => set("respiteDistanceFeel", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="Weekend & Night Crisis Handling"
        hint="How would a Friday night medical crisis be handled?"
        options={[
          { value: "clearly-described", label: "They clearly described the process", flag: "green" },
          { value: "vague", label: 'Answer was vague ("we\'ll see," "depends")', flag: "red" },
        ]}
        value={d.weekendCrisis}
        onChange={(v) => set("weekendCrisis", v)}
      />
      <RadioGroup
        label="Overall Crisis Confidence"
        options={[
          { value: "believe", label: "I believe they can staff crisis care", flag: "green" },
          { value: "do-not-believe", label: "I do NOT believe they can staff crisis care", flag: "red" },
        ]}
        value={d.crisisConfidence}
        onChange={(v) => set("crisisConfidence", v)}
      />
    </View>
  );
}

function Section4({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <Field label="Effective Date They Wrote" value={d.effectiveDate} onChange={(v) => set("effectiveDate", v)} placeholder="e.g. March 30, 2026" />
      <RadioGroup
        label="What This Date Represents"
        options={[
          { value: "real-start", label: "Real start of care today", flag: "green" },
          { value: "future-placeholder", label: "Future placeholder date", flag: "yellow" },
          { value: "unclear", label: "Not clear", flag: "red" },
        ]}
        value={d.effectiveDateType}
        onChange={(v) => set("effectiveDateType", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="Revocation — What Did They Say?"
        hint="Revocation = your right to end hospice and return to curative care."
        options={[
          { value: "clearly-said", label: "Clearly said revocation is our written choice, with a date", flag: "green" },
          { value: "admitted-suggestion", label: "Admitted nurses/managers sometimes suggest revocation", flag: "yellow" },
          { value: "acted-like-just-happens", label: "Acted like revocation is just what happens when care gets expensive", flag: "red" },
        ]}
        value={d.revocationAnswer}
        onChange={(v) => set("revocationAnswer", v)}
      />

      <View style={ui.warningBox}>
        <Feather name="alert-triangle" size={14} color={Colors.warning} />
        <Text style={ui.warningText}>
          Remember: You will not sign revocation just because care is expensive or someone is impatient. Revocation is always your written choice.
        </Text>
      </View>

      <RadioGroup
        label="If We Change Our Mind Before Care Starts, They Said:"
        options={[
          { value: "named-person", label: "Call a specific person", flag: "green" },
          { value: "in-writing", label: "Send something in writing (email / fax / portal)", flag: "green" },
          { value: "dont-worry", label: '"Just don\'t worry about it" — red flag', flag: "red" },
        ]}
        value={d.changeOfMindInstruction}
        onChange={(v) => set("changeOfMindInstruction", v)}
      />
    </View>
  );
}

function Section5({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <RadioGroup
        label="Did They Talk About Discharge at All?"
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No — they never brought it up", flag: "yellow" },
        ]}
        value={d.discussedDischarge}
        onChange={(v) => set("discussedDischarge", v)}
      />

      {d.discussedDischarge === "yes" && (
        <RadioGroup
          label="How They Explained 'No Longer Eligible'"
          options={[
            { value: "clear-criteria", label: "Explained clear criteria for no longer eligible", flag: "green" },
            { value: "vague", label: 'Stayed vague ("we\'ll know when we see it")', flag: "red" },
          ]}
          value={d.dischargeCriteria}
          onChange={(v) => set("dischargeCriteria", v)}
        />
      )}

      <RadioGroup
        label="Medications at Discharge"
        hint="If care ends, how do you get medications?"
        options={[
          { value: "plan-exists", label: "There will be a plan for how you get them", flag: "green" },
          { value: "unclear", label: "Not clear", flag: "red" },
        ]}
        value={d.medicationsOnDischarge}
        onChange={(v) => set("medicationsOnDischarge", v)}
      />
      <RadioGroup
        label="Equipment (Bed, Oxygen, etc.) at Discharge"
        options={[
          { value: "wont-take-until-replacement", label: "They will not take equipment until replacements are in place", flag: "green" },
          { value: "might-take-early", label: "They might take equipment before replacements arrive", flag: "red" },
          { value: "unclear", label: "Answer was unclear", flag: "red" },
        ]}
        value={d.equipmentOnDischarge}
        onChange={(v) => set("equipmentOnDischarge", v)}
      />

      <View style={ui.divider} />

      <RadioGroup
        label="Cap / Financial Pressure Honesty"
        hint="Medicare hospice has a cap. Did they acknowledge it?"
        options={[
          { value: "admitted-clinical-first", label: 'Admitted cap is real but "clinical decisions come first"', flag: "green" },
          { value: "denied-any", label: "Denied any financial pressure ever exists", flag: "yellow" },
          { value: "dodged", label: "Dodged or minimized the question", flag: "red" },
        ]}
        value={d.capPressure}
        onChange={(v) => set("capPressure", v)}
      />
      <RadioGroup
        label="My Feeling After This Section"
        options={[
          { value: "trust", label: "I trust them not to discharge us for financial reasons", flag: "green" },
          { value: "dont-trust", label: "I don't trust them on this", flag: "red" },
        ]}
        value={d.trustOnMoney}
        onChange={(v) => set("trustOnMoney", v)}
      />
    </View>
  );
}

function Section6({ d, set }: { d: InterviewData; set: (k: keyof InterviewData, v: string) => void }) {
  return (
    <View style={ui.sectionBody}>
      <RadioGroup
        label="Where Will the Patient Be Most of the Time?"
        options={[
          { value: "home", label: "Home" },
          { value: "assisted-living", label: "Assisted living" },
          { value: "memory-care", label: "Memory care" },
          { value: "nursing", label: "Nursing facility" },
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
          Hospice does NOT pay rent or facility room and board. You still pay for caregivers or facility costs even while on hospice.
        </Text>
      </View>

      <RadioGroup
        label="Medicaid / Financial Help"
        hint="Did they explain what happens if money runs out?"
        options={[
          { value: "realistic-path", label: "Described a realistic Medicaid path for your state", flag: "green" },
          { value: "named-helper", label: "Named who can help with paperwork", flag: "green" },
          { value: "vague", label: "Were vague or said \"we don't really do that\"", flag: "red" },
        ]}
        value={d.medicaidPath}
        onChange={(v) => set("medicaidPath", v)}
      />
      <RadioGroup
        label="Long-Term Care Insurance"
        options={[
          { value: "yes", label: "We have an LTC policy" },
          { value: "no", label: "We don't have one / don't know" },
        ]}
        value={d.ltcPolicy}
        onChange={(v) => set("ltcPolicy", v)}
      />
    </View>
  );
}

function Section7({ d, set, setScore }: {
  d: InterviewData;
  set: (k: keyof InterviewData, v: string) => void;
  setScore: (k: keyof InterviewData, v: number) => void;
}) {
  return (
    <View style={ui.sectionBody}>
      <View style={ui.infoBox}>
        <Feather name="star" size={14} color={Colors.warning} />
        <Text style={ui.infoText}>
          Score each category 1–5 based on your gut feeling right after the meeting. 1 = terrible, 5 = excellent.
        </Text>
      </View>

      <View style={ui.scoreCard}>
        <ScoreRow label="Answering hard questions" value={d.scoreHardQuestions} onChange={(v) => setScore("scoreHardQuestions", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Ownership & leadership clarity" value={d.scoreOwnershipClarity} onChange={(v) => setScore("scoreOwnershipClarity", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Routine visits realism" value={d.scoreRoutineVisits} onChange={(v) => setScore("scoreRoutineVisits", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Crisis care credibility" value={d.scoreCrisisCredibility} onChange={(v) => setScore("scoreCrisisCredibility", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Honesty about money & cap" value={d.scoreMoneyHonesty} onChange={(v) => setScore("scoreMoneyHonesty", v)} />
        <View style={ui.scoreDivider} />
        <ScoreRow label="Overall gut feeling" value={d.scoreGutFeeling} onChange={(v) => setScore("scoreGutFeeling", v)} />
      </View>

      <Field
        label="Biggest Green Flag"
        value={d.biggestGreenFlag}
        onChange={(v) => set("biggestGreenFlag", v)}
        placeholder="The best thing they said or showed…"
        multiline
      />
      <Field
        label="Biggest Red Flag"
        value={d.biggestRedFlag}
        onChange={(v) => set("biggestRedFlag", v)}
        placeholder="The thing that concerned you most…"
        multiline
      />

      <RadioGroup
        label="Your Initial Label for This Hospice"
        options={[
          { value: "strong-candidate", label: "Strong candidate", flag: "green" },
          { value: "maybe", label: "Maybe", flag: "yellow" },
          { value: "probably-not", label: "Probably not", flag: "yellow" },
          { value: "absolutely-not", label: "Absolutely not", flag: "red" },
        ]}
        value={d.finalLabel}
        onChange={(v) => set("finalLabel", v)}
      />
    </View>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({ result, hospiceName, onRetake }: {
  result: ScoringResult; hospiceName: string; onRetake: () => void;
}) {
  const scoreColor = result.overallScore >= 80 ? Colors.success
    : result.overallScore >= 60 ? Colors.warning
    : result.overallScore >= 40 ? Colors.accent
    : Colors.error;

  const recColor = result.recommendation === "Strong Candidate" ? Colors.success
    : result.recommendation === "Maybe" ? Colors.warning
    : Colors.error;

  const catColor = (c: string) => c === "green" ? Colors.success : c === "yellow" ? Colors.warning : Colors.error;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={ui.resultsContent} showsVerticalScrollIndicator={false}>
      {/* Score header */}
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

      {/* Ragna's narrative */}
      <View style={ui.narrativeCard}>
        <View style={ui.narrativeHeader}>
          <Feather name="message-circle" size={16} color={Colors.primary} />
          <Text style={ui.narrativeTitle}>Ragna's Assessment</Text>
        </View>
        <Text style={ui.narrativeText}>{result.narrative}</Text>
      </View>

      {/* Category breakdown */}
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

      {/* Green / Red flags */}
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

      {/* Follow-up questions */}
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

      {/* Actions */}
      <Pressable
        onPress={() => {
          router.push({
            pathname: "/(tabs)/help",
            params: { initialMessage: `I just finished interviewing ${hospiceName || "a hospice"}. Ragna scored them ${result.overallScore}/100 and labeled them "${result.recommendation}". Can you help me think through this decision?` },
          } as any);
        }}
        style={({ pressed }) => [ui.askRagnaBtn, pressed && { opacity: 0.85 }]}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={ui.askRagnaBtnText}>Talk It Through with Ragna</Text>
      </Pressable>

      <Pressable
        onPress={onRetake}
        style={({ pressed }) => [ui.retakeBtn, pressed && { opacity: 0.7 }]}
      >
        <Feather name="refresh-cw" size={16} color={Colors.textMuted} />
        <Text style={ui.retakeBtnText}>Start New Interview</Text>
      </Pressable>
    </ScrollView>
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

export default function HospiceInterviewScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0); // 0-6 = sections, 7 = results
  const [data, setData] = useState<InterviewData>({ ...DEFAULT });
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);

  const setField = (k: keyof InterviewData, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));
  const setScoreField = (k: keyof InterviewData, v: number) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const goNext = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (step < 6) { setStep(step + 1); }
    else { handleScore(); }
  };

  const goPrev = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (step > 0) setStep(step - 1);
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
      setStep(7);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (err) {
      Alert.alert("Scoring Failed", "Couldn't reach Ragna right now. Please check your connection and try again.");
    } finally {
      setIsScoring(false);
    }
  };

  const handleRetake = () => {
    setData({ ...DEFAULT });
    setResult(null);
    setStep(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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

  const isResultsView = step === 7 && result !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <CosmicBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { if (step === 0 || isResultsView) router.back(); else goPrev(); }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isResultsView ? "Interview Results" : "Hospice Interview"}
          </Text>
          <Text style={styles.headerSub}>
            {isResultsView ? data.hospiceName || "AI Scoring Complete" : `Section ${step + 1} of ${STEPS.length}`}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar (hidden on results) */}
      {!isResultsView && (
        <View style={styles.progressBar}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: i <= step ? Colors.primary : Colors.divider },
              ]}
            />
          ))}
        </View>
      )}

      {/* Body */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (isResultsView ? 40 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isResultsView ? (
          <ResultsView result={result!} hospiceName={data.hospiceName} onRetake={handleRetake} />
        ) : (
          <>
            {/* Section title */}
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>{STEPS[step].title}</Text>
              <Text style={styles.sectionSub}>{STEPS[step].subtitle}</Text>
            </View>
            {renderSection()}
          </>
        )}
      </ScrollView>

      {/* Bottom nav (hidden on results) */}
      {!isResultsView && (
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
          {step > 0 ? (
            <Pressable onPress={goPrev} style={({ pressed }) => [styles.prevBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="chevron-left" size={18} color={Colors.textMuted} />
              <Text style={styles.prevBtnText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <Pressable
            onPress={goNext}
            disabled={isScoring}
            style={({ pressed }) => [styles.nextBtn, isScoring && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
          >
            {isScoring ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>
                  {step === 6 ? "Score with Ragna" : "Next"}
                </Text>
                {step === 6
                  ? <Feather name="zap" size={16} color="#fff" />
                  : <Feather name="chevron-right" size={16} color="#fff" />}
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

const ui = StyleSheet.create({
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, letterSpacing: -0.1 },
  fieldHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 17 },
  textInput: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 13, paddingVertical: 11,
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.text, minHeight: 44,
  },
  radioGroup: { gap: 8 },
  radioOptions: { gap: 7 },
  radioOption: {
    flexDirection: "row", alignItems: "center", gap: 11,
    padding: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  radioLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  subSection: { gap: 10, backgroundColor: Colors.backgroundSecondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.divider },
  subSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  sectionBody: { gap: 16 },
  divider: { height: 1, backgroundColor: Colors.divider },
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
  scoreCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider, overflow: "hidden",
  },
  scoreRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  scoreLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text, letterSpacing: -0.1 },
  scorePips: { flexDirection: "row", gap: 5 },
  scorePip: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
  },
  scorePipText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.textMuted },
  scoreDivider: { height: 1, backgroundColor: Colors.divider },
  // Results
  resultsContent: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  scoreHeader: {
    flexDirection: "row", gap: 16, alignItems: "flex-start",
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.divider,
  },
  scoreBadge: {
    width: 80, height: 80, borderRadius: 16,
    borderWidth: 3, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.backgroundSecondary,
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
  resultsSection: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4,
  },
  categoryCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider, overflow: "hidden",
  },
  categoryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  categoryText: { flex: 1, gap: 3 },
  categoryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1 },
  categoryScore: { fontSize: 14, fontFamily: "Inter_700Bold" },
  categoryFinding: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 19 },
  flagCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, padding: 14, gap: 10,
  },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flagText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  questionCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider, padding: 14, gap: 12,
  },
  questionRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  questionNum: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: Colors.primaryPale,
    textAlign: "center", lineHeight: 24,
    fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.primary,
    flexShrink: 0,
  },
  questionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  askRagnaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  askRagnaBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
  retakeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
  },
  retakeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textMuted },
});

// ─── Screen-level styles ──────────────────────────────────────────────────────

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
  progressBar: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 4,
    backgroundColor: Colors.background,
  },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  sectionTitleBlock: { gap: 4, paddingBottom: 4 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  bottomNav: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 12, gap: 12,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  prevBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.divider,
    justifyContent: "center",
  },
  prevBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  nextBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  nextBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
});
