import { Share } from "react-native";

import { PatientProfile } from "@/types";
import { formatDnrStatus } from "@/utils/hospiceCall";

export function buildEmergencyCardText(profile?: PatientProfile): string {
  const p = profile ?? {};
  const lines: string[] = [
    "═══ HOSPICE EMERGENCY CARD ═══",
    "Hospice Roadmap — for ER, new nurses, or family",
    "",
    "PATIENT",
    `Name: ${p.patientName?.trim() || "Not set"}`,
    `Diagnosis: ${p.diagnosis?.trim() || "Not set"}`,
    "",
    "CODE STATUS",
    formatDnrStatus(p.goalsOfCare?.dnrStatus) ?? "Not documented in app",
    "",
    "COMFORT KIT / MEDICATIONS",
    p.comfortKitMedications?.trim() || p.medications?.map((m) => m.name).join(", ") || "Not set",
    "",
    "ALLERGIES / NOTES",
    p.additionalNotes?.trim() || "None documented",
    "",
    "EQUIPMENT IN HOME",
    p.equipmentInHome?.trim() || "Not set",
    "",
    "CONTACTS — CALL HOSPICE FIRST",
    `Hospice main: ${p.hospicePhone?.trim() || "Not set"}`,
    `After hours: ${p.hospiceAfterHoursPhone?.trim() || "Not set"}`,
    `Equipment: ${p.equipmentProviderPhone?.trim() || "Not set"}`,
    `Pharmacy: ${p.pharmacyPhone?.trim() || "Not set"}`,
    "",
    "Generated from Hospice Roadmap app",
  ];
  return lines.join("\n");
}

export async function shareEmergencyCard(profile?: PatientProfile): Promise<void> {
  const message = buildEmergencyCardText(profile);
  await Share.share({
    message,
    title: "Hospice Emergency Card",
  });
}