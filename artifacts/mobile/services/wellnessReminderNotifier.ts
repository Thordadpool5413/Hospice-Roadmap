import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { CaregiverWellnessEntry } from "@/types";

const NOTIF_ID_KEY = "@wellness_reminder_notif_id_v1";

const MISSED_DAYS_THRESHOLD = 3;
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

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

async function getStoredNotifId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(NOTIF_ID_KEY);
  } catch {
    return null;
  }
}

async function storeNotifId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  } catch {
    // ignore
  }
}

async function clearStoredNotifId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIF_ID_KEY);
  } catch {
    // ignore
  }
}

async function hasPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

const NOTIFICATION_CONTENT = {
  title: "Checking in on you",
  body: "We haven't heard from you in a few days — how are you holding up?",
  sound: true as const,
  data: { type: "wellness_reminder" },
};

/**
 * Cancels the currently scheduled wellness reminder notification, if any.
 * Safe to call when no notification is scheduled.
 */
export async function cancelWellnessReminder(): Promise<void> {
  if (!Notifications) return;
  const id = await getStoredNotifId();
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already fired or removed — safe to ignore
    }
    await clearStoredNotifId();
  }
}

/**
 * Schedules a one-time notification at 7 PM on (fromDate + 3 days).
 * This fires even if the app is never reopened.
 * Cancels any existing reminder first.
 *
 * @param fromDate - ISO date string (YYYY-MM-DD) of the most recent check-in.
 */
export async function scheduleForwardReminder(fromDate: string): Promise<void> {
  if (!Notifications) return;
  if (!(await hasPermission())) return;

  await cancelWellnessReminder();

  // Parse the ISO date string as LOCAL calendar components to avoid UTC-offset
  // skew. `new Date("YYYY-MM-DD")` is parsed as UTC midnight, which in negative
  // UTC-offset zones resolves to the prior local calendar day — causing the
  // reminder to fire one day too early. Using Date constructor with explicit
  // year/month/day args creates the date in local time instead.
  const [year, month, day] = fromDate.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day + MISSED_DAYS_THRESHOLD, REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

  // Only schedule if the target time is still in the future
  if (targetDate.getTime() <= Date.now()) return;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: NOTIFICATION_CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      } as any,
    });
    await storeNotifId(id);
  } catch {
    // Scheduling unavailable — fail silently
  }
}

/**
 * Schedules a daily repeating 7 PM reminder.
 * Used as a fallback when the app is opened after the threshold has
 * already been exceeded (no forward-scheduled notification was set).
 * Cancels any existing reminder first.
 */
async function scheduleFallbackDailyReminder(): Promise<void> {
  if (!Notifications) return;
  if (!(await hasPermission())) return;

  await cancelWellnessReminder();

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: NOTIFICATION_CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
      } as any,
    });
    await storeNotifId(id);
  } catch {
    // Scheduling unavailable — fail silently
  }
}

function computeDaysMissed(entries: CaregiverWellnessEntry[]): { missed: number; lastDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = entries.reduce(
    (latest, e) => (e.date > latest ? e.date : latest),
    entries[0].date,
  );
  const a = new Date(lastDate).getTime();
  const b = new Date(today).getTime();
  const missed = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return { missed, lastDate };
}

/**
 * Ensures the correct wellness reminder is scheduled based on the current
 * entries array. Called on app load and after server hydration.
 *
 * Scheduling model:
 * - 0–2 days missed and no notification stored → schedule a one-time
 *   forward notification at 7 PM on (lastEntryDate + 3 days). This fires
 *   even if the app is never reopened before the threshold.
 * - 3+ days missed and no notification stored → schedule a daily repeating
 *   fallback (user has already exceeded the threshold; we can only notify
 *   going forward from now).
 * - A notification is already stored → leave it; cancellation on check-in
 *   and fresh scheduling via addEntry keep it accurate.
 */
export async function syncWellnessReminder(entries: CaregiverWellnessEntry[]): Promise<void> {
  if (!notificationsAvailable || !Notifications) return;
  if (entries.length === 0) return;

  const existingId = await getStoredNotifId();
  if (existingId) {
    // A notification is already scheduled — leave it alone.
    // Stale-ID detection is handled as a separate improvement (see follow-up).
    return;
  }

  const { missed, lastDate } = computeDaysMissed(entries);

  if (missed >= MISSED_DAYS_THRESHOLD) {
    // Already past threshold — start a daily repeating fallback now.
    await scheduleFallbackDailyReminder();
  } else {
    // Still within the window — forward-schedule for the threshold date.
    await scheduleForwardReminder(lastDate);
  }
}
