import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { SymptomEntry } from "@/types";
import { EscalationAlert, evaluateEscalation } from "@/utils/escalationRules";

const PER_SYMPTOM_KEY = "@escalation_alert_timestamps_v1";
const GLOBAL_KEY = "@escalation_alert_global_last_v1";
const SETTINGS_KEY = "@escalation_alerts_enabled_v1";
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

const isExpoGo = Constants.executionEnvironment === "storeClient";
const notificationsAvailable = Platform.OS !== "web" && !isExpoGo;

let Notifications: typeof import("expo-notifications") | null = null;
if (notificationsAvailable) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    Notifications = null;
  }
}

export async function getEscalationAlertsEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored === null) return true;
    return stored === "true";
  } catch {
    return true;
  }
}

export async function setEscalationAlertsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}

async function getPerSymptomTimestamps(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(PER_SYMPTOM_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getGlobalLastSent(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(GLOBAL_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function recordAlertSent(symptomKey: string): Promise<void> {
  const now = Date.now();
  try {
    const existing = await getPerSymptomTimestamps();
    existing[symptomKey] = now;
    await Promise.all([
      AsyncStorage.setItem(PER_SYMPTOM_KEY, JSON.stringify(existing)),
      AsyncStorage.setItem(GLOBAL_KEY, String(now)),
    ]);
  } catch {
    // ignore
  }
}

function isRateLimited(timestamps: Record<string, number>, symptomKey: string): boolean {
  const last = timestamps[symptomKey];
  if (!last) return false;
  return Date.now() - last < RATE_LIMIT_MS;
}

/**
 * Builds the opening Ragna message for a given escalation alert.
 * This is used both as notification data and as the pre-loaded chat message.
 */
export function buildEscalationPrompt(alert: EscalationAlert, patientName?: string): string {
  const name = patientName?.trim() || "your loved one";
  const firstName = name.split(" ")[0];

  switch (alert.pattern) {
    case "consecutive_high_pain":
      return `${firstName}'s pain has been ${alert.severityLevel}/10 or higher for ${alert.daysAffected ?? 2} consecutive days. This is clinically significant. What steps should I be taking right now, and what should I say when I call the hospice nurse about this?`;

    case "rapid_increase":
      return `${firstName}'s ${alert.symptomName.toLowerCase()} just jumped to ${alert.severityLevel}/10 — a large increase since the last check-in. Can you help me understand what this might mean and whether I need to contact the hospice team right away?`;

    case "new_high_severity":
      return `${firstName} is now experiencing ${alert.symptomName.toLowerCase()} at ${alert.severityLevel}/10. This is a new high-severity symptom that wasn't present before. What should I do, and is this something I should call the hospice nurse about immediately?`;
  }
}

function buildNotificationTitle(alert: EscalationAlert, patientName?: string): string {
  const name = patientName?.trim() || "Your loved one";
  const firstName = name.split(" ")[0];

  switch (alert.pattern) {
    case "consecutive_high_pain":
      return `${firstName}'s pain has been high for ${alert.daysAffected ?? 2} days`;
    case "rapid_increase":
      return `${firstName}'s ${alert.symptomName.toLowerCase()} increased sharply`;
    case "new_high_severity":
      return `New high ${alert.symptomName.toLowerCase()} for ${firstName}`;
  }
}

function buildNotificationBody(): string {
  return "Tap to get guidance from Ragna";
}

/**
 * Checks escalation rules and schedules at most one local notification per
 * 24-hour window across all symptoms (global cap), while also suppressing
 * per-symptom re-fires within 24 hours.
 *
 * Returns the alert that was fired, or an empty array if none.
 */
export async function checkAndScheduleEscalationAlerts(
  entries: SymptomEntry[],
  patientName?: string,
): Promise<EscalationAlert[]> {
  if (!notificationsAvailable || !Notifications) return [];

  const enabled = await getEscalationAlertsEnabled();
  if (!enabled) return [];

  let permStatus: string;
  try {
    const perm = await Notifications.getPermissionsAsync();
    permStatus = perm.status;
  } catch {
    return [];
  }
  if (permStatus !== "granted") return [];

  // Global 24h cap — if any escalation was sent in the last 24h, skip entirely
  const globalLast = await getGlobalLastSent();
  if (Date.now() - globalLast < RATE_LIMIT_MS) return [];

  const alerts = evaluateEscalation(entries);
  if (alerts.length === 0) return [];

  const perSymptomTimestamps = await getPerSymptomTimestamps();

  // Find the first alert that is not per-symptom rate-limited
  for (const alert of alerts) {
    const rateKey = `${alert.symptomKey}:${alert.pattern}`;
    if (isRateLimited(perSymptomTimestamps, rateKey)) continue;

    const initialMessage = buildEscalationPrompt(alert, patientName);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: buildNotificationTitle(alert, patientName),
          body: buildNotificationBody(),
          sound: true,
          data: {
            type: "escalation",
            symptomKey: alert.symptomKey,
            pattern: alert.pattern,
            initialMessage,
          },
        },
        trigger: null,
      });

      // Record the send for both global and per-symptom rate limiting.
      // Always record the attempt even if something else fails afterward,
      // to prevent a retry loop from flooding the user with notifications.
      await recordAlertSent(rateKey);

      // Global cap: only one notification per 24h window — stop after the first
      return [alert];
    } catch {
      // Notification scheduling failed — record the attempt to prevent looping
      await recordAlertSent(rateKey);
    }
  }

  return [];
}
