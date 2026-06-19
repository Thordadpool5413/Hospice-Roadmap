import { Linking } from "react-native";

import { PatientProfile } from "@/types";

export function getHospicePhone(profile?: PatientProfile): string | undefined {
  const afterHours = profile?.hospiceAfterHoursPhone?.trim();
  const main = profile?.hospicePhone?.trim();
  return afterHours || main || undefined;
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function callHospice(profile?: PatientProfile): boolean {
  const phone = getHospicePhone(profile);
  if (!phone) return false;
  void Linking.openURL(`tel:${normalizePhoneDigits(phone)}`);
  return true;
}

export function formatDnrStatus(
  status?: string,
): string | undefined {
  if (!status || status === "not-discussed") return undefined;
  const labels: Record<string, string> = {
    dnr: "DNR / Allow natural death",
    "full-code": "Full code — CPR if heart stops",
    polst: "POLST on file",
    unknown: "Code status not confirmed",
  };
  return labels[status] ?? status;
}