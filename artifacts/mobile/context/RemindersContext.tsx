import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { Reminder, ReminderRecurrence, ReminderType } from "@/types";

const STORAGE_KEY = "@hospice_roadmap_reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface RemindersContextValue {
  reminders: Reminder[];
  isLoading: boolean;
  permissionStatus: "granted" | "denied" | "undetermined" | "unavailable";
  requestPermissions: () => Promise<boolean>;
  addReminder: (data: {
    type: ReminderType;
    label: string;
    datetime: string;
    recurrence: ReminderRecurrence;
  }) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Pick<Reminder, "label" | "datetime" | "recurrence" | "type">>) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

async function scheduleNotification(reminder: Reminder): Promise<string | undefined> {
  if (Platform.OS === "web") return undefined;
  try {
    const dt = new Date(reminder.datetime);
    if (isNaN(dt.getTime())) return undefined;

    const trigger: Notifications.NotificationTriggerInput =
      reminder.recurrence === "daily"
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: dt.getHours(), minute: dt.getMinutes() }
        : reminder.recurrence === "weekly"
        ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: dt.getDay() + 1, hour: dt.getHours(), minute: dt.getMinutes() }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dt };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.type === "medication" ? "Medication Reminder" : "Appointment Reminder",
        body: reminder.label,
        sound: true,
      },
      trigger,
    });
    return id;
  } catch {
    return undefined;
  }
}

async function cancelNotification(notificationId?: string) {
  if (Platform.OS === "web" || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<RemindersContextValue["permissionStatus"]>("undetermined");

  useEffect(() => {
    if (Platform.OS !== "web") {
      Notifications.getPermissionsAsync()
        .then((s) => setPermissionStatus(s.status as any))
        .catch(() => setPermissionStatus("unavailable"));
    } else {
      setPermissionStatus("unavailable");
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setReminders(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const save = useCallback(async (list: Reminder[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") { setPermissionStatus("unavailable"); return false; }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status as any);
      return status === "granted";
    } catch {
      setPermissionStatus("unavailable");
      return false;
    }
  }, []);

  const addReminder = useCallback(async (data: {
    type: ReminderType; label: string; datetime: string; recurrence: ReminderRecurrence;
  }) => {
    const reminder: Reminder = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...data,
      enabled: true,
    };
    if (permissionStatus === "granted") {
      reminder.notificationId = await scheduleNotification(reminder);
    }
    const updated = [reminder, ...reminders];
    setReminders(updated);
    await save(updated);
  }, [reminders, save, permissionStatus]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Pick<Reminder, "label" | "datetime" | "recurrence" | "type">>) => {
    let updated = reminders.map((r) => r.id === id ? { ...r, ...updates } : r);
    const r = updated.find((r) => r.id === id);
    if (r && r.enabled) {
      await cancelNotification(r.notificationId);
      if (permissionStatus === "granted") {
        const newNotifId = await scheduleNotification(r);
        updated = updated.map((rem) => rem.id === id ? { ...rem, notificationId: newNotifId } : rem);
      }
    }
    setReminders(updated);
    await save(updated);
  }, [reminders, save, permissionStatus]);

  const toggleReminder = useCallback(async (id: string) => {
    let updated = reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    const toggled = updated.find((r) => r.id === id);
    if (toggled) {
      if (!toggled.enabled) {
        await cancelNotification(toggled.notificationId);
        updated = updated.map((r) => r.id === id ? { ...r, notificationId: undefined } : r);
      } else if (permissionStatus === "granted") {
        const newNotifId = await scheduleNotification(toggled);
        updated = updated.map((r) => r.id === id ? { ...r, notificationId: newNotifId } : r);
      }
    }
    setReminders(updated);
    await save(updated);
  }, [reminders, save, permissionStatus]);

  const deleteReminder = useCallback(async (id: string) => {
    const r = reminders.find((r) => r.id === id);
    if (r?.notificationId) await cancelNotification(r.notificationId);
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await save(updated);
  }, [reminders, save]);

  return (
    <RemindersContext.Provider value={{
      reminders, isLoading, permissionStatus,
      requestPermissions, addReminder, updateReminder,
      toggleReminder, deleteReminder,
    }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders(): RemindersContextValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
}
