import * as Speech from "expo-speech";

import { PatientProfile } from "@/types";
import { formatDnrStatus } from "@/utils/hospiceCall";

export function buildEmergencyCardSpeech(profile?: PatientProfile): string {
  const p = profile ?? {};
  const parts: string[] = ["Hospice emergency information."];

  if (p.patientName?.trim()) {
    parts.push(`Patient name: ${p.patientName.trim()}.`);
  }
  if (p.diagnosis?.trim()) {
    parts.push(`Diagnosis: ${p.diagnosis.trim()}.`);
  }

  const dnr = formatDnrStatus(p.goalsOfCare?.dnrStatus);
  if (dnr) {
    parts.push(`Code status: ${dnr}.`);
  }

  const meds = p.comfortKitMedications?.trim()
    || p.medications?.map((m) => m.name).join(", ");
  if (meds) {
    parts.push(`Medications: ${meds}.`);
  }

  if (p.additionalNotes?.trim()) {
    parts.push(`Important notes: ${p.additionalNotes.trim()}.`);
  }

  const hospice = p.hospiceAfterHoursPhone?.trim() || p.hospicePhone?.trim();
  if (hospice) {
    parts.push(`Call hospice at ${hospice}.`);
  } else {
    parts.push("Hospice phone not set in profile.");
  }

  return parts.join(" ");
}

let speaking = false;

export function speakEmergencyCard(profile?: PatientProfile): void {
  const text = buildEmergencyCardSpeech(profile);
  Speech.stop();
  speaking = true;
  Speech.speak(text, {
    language: "en-US",
    rate: 0.92,
    onDone: () => { speaking = false; },
    onStopped: () => { speaking = false; },
    onError: () => { speaking = false; },
  });
}

export function stopEmergencyCardSpeech(): void {
  Speech.stop();
  speaking = false;
}

export function isEmergencyCardSpeaking(): boolean {
  return speaking;
}