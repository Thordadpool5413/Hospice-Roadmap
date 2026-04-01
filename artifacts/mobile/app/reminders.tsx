import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useReminders } from "@/context/RemindersContext";
import { Reminder, ReminderRecurrence, ReminderType } from "@/types";

const TYPE_META: Record<ReminderType, { label: string; icon: string; color: string; bg: string }> = {
  medication: { label: "Medication", icon: "package", color: Colors.info, bg: Colors.infoPale },
  appointment: { label: "Appointment", icon: "calendar", color: Colors.accent, bg: Colors.accentPale },
};

const RECURRENCE_OPTIONS: { value: ReminderRecurrence; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function formatDatetime(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  editing?: Reminder;
}

function AddReminderModal({ visible, onClose, editing }: AddModalProps) {
  const { addReminder, updateReminder, requestPermissions, permissionStatus } = useReminders();
  const [type, setType] = useState<ReminderType>(editing?.type ?? "medication");
  const [label, setLabel] = useState(editing?.label ?? "");
  const [datetime, setDatetime] = useState(editing ? new Date(editing.datetime) : (() => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return d; })());
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>(editing?.recurrence ?? "none");
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const canSave = label.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (permissionStatus !== "granted" && permissionStatus !== "unavailable") {
      const granted = await requestPermissions();
      if (!granted && Platform.OS !== "web") {
        Alert.alert(
          "Notifications Disabled",
          "Reminders will be saved but you won't receive push notifications. Enable notifications in Settings to receive alerts.",
          [{ text: "OK" }]
        );
      }
    }

    if (editing) {
      await updateReminder(editing.id, { type, label: label.trim(), datetime: datetime.toISOString(), recurrence });
    } else {
      await addReminder({ type, label: label.trim(), datetime: datetime.toISOString(), recurrence });
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.modalBtnText}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>{editing ? "Edit Reminder" : "New Reminder"}</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || isSaving}
            style={({ pressed }) => [styles.modalSaveBtn, !canSave && styles.modalSaveBtnDisabled, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.modalSaveBtnText, !canSave && styles.modalSaveBtnTextDisabled]}>
              {isSaving ? "Saving…" : editing ? "Update" : "Add"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Type */}
          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(["medication", "appointment"] as ReminderType[]).map((t) => {
                const meta = TYPE_META[t];
                const active = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={[styles.typeChip, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                  >
                    <Feather name={meta.icon as any} size={14} color={active ? meta.color : Colors.textMuted} />
                    <Text style={[styles.typeChipText, active && { color: meta.color, fontFamily: "Inter_600SemiBold" }]}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Label */}
          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>Label</Text>
            <TextInput
              style={styles.modalInput}
              value={label}
              onChangeText={setLabel}
              placeholder={type === "medication" ? "e.g. Morphine 5mg" : "e.g. Nurse visit"}
              placeholderTextColor={Colors.textSubtle}
              returnKeyType="done"
              maxLength={80}
            />
          </View>

          {/* Date/Time */}
          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>Date & Time</Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => [styles.datetimeBtn, pressed && { opacity: 0.8 }]}
            >
              <Feather name="clock" size={16} color={Colors.primary} />
              <Text style={styles.datetimeBtnText}>{formatDatetime(datetime.toISOString())}</Text>
              <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
            </Pressable>
            {Platform.OS !== "web" && showPicker && (
              <DateTimePicker
                value={datetime}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  setShowPicker(Platform.OS === "ios");
                  if (d) setDatetime(d);
                }}
              />
            )}
          </View>

          {/* Recurrence */}
          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>Repeat</Text>
            <View style={styles.recurrenceRow}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setRecurrence(opt.value)}
                  style={[
                    styles.recurrenceChip,
                    recurrence === opt.value && styles.recurrenceChipActive,
                  ]}
                >
                  <Text style={[
                    styles.recurrenceChipText,
                    recurrence === opt.value && styles.recurrenceChipTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {Platform.OS === "web" && (
            <View style={styles.webNote}>
              <Feather name="info" size={13} color={Colors.info} />
              <Text style={styles.webNoteText}>
                Push notifications are only available on iOS and Android devices.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const { reminders, toggleReminder, deleteReminder } = useReminders();
  const [showAdd, setShowAdd] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>();

  const handleDelete = (r: Reminder) => {
    Alert.alert("Delete Reminder", `Delete "${r.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteReminder(r.id);
        },
      },
    ]);
  };

  const medications = reminders.filter((r) => r.type === "medication");
  const appointments = reminders.filter((r) => r.type === "appointment");

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Reminders</Text>
        <Pressable
          onPress={() => { setEditingReminder(undefined); setShowAdd(true); }}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="bell" size={32} color={Colors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptyBody}>
            Set medication reminders and appointment alerts to stay on schedule.
          </Text>
          <Pressable
            onPress={() => setShowAdd(true)}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add Reminder</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {[
            { title: "Medications", items: medications },
            { title: "Appointments", items: appointments },
          ].filter((g) => g.items.length > 0).map(({ title: groupTitle, items }) => (
            <View key={groupTitle} style={styles.group}>
              <Text style={styles.groupTitle}>{groupTitle}</Text>
              <View style={styles.groupCards}>
                {items.map((r) => {
                  const meta = TYPE_META[r.type];
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => { setEditingReminder(r); setShowAdd(true); }}
                      onLongPress={() => handleDelete(r)}
                      delayLongPress={500}
                      style={({ pressed }) => [styles.reminderCard, !r.enabled && styles.reminderCardDisabled, pressed && { opacity: 0.88 }]}
                    >
                      <View style={[styles.reminderIcon, { backgroundColor: meta.bg }]}>
                        <Feather name={meta.icon as any} size={18} color={r.enabled ? meta.color : Colors.textSubtle} />
                      </View>
                      <View style={styles.reminderInfo}>
                        <Text style={[styles.reminderLabel, !r.enabled && styles.textDisabled]}>{r.label}</Text>
                        <Text style={styles.reminderTime}>{formatDatetime(r.datetime)}</Text>
                        {r.recurrence !== "none" && (
                          <View style={styles.recurrenceBadge}>
                            <Feather name="repeat" size={10} color={meta.color} />
                            <Text style={[styles.recurrenceBadgeText, { color: meta.color }]}>
                              {r.recurrence === "daily" ? "Daily" : "Weekly"}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={r.enabled}
                        onValueChange={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleReminder(r.id);
                        }}
                        trackColor={{ false: Colors.divider, true: meta.color }}
                        thumbColor="#fff"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Feather name="info" size={14} color={Colors.info} />
            <Text style={styles.infoText}>
              Long-press any reminder to delete it. Tap to edit.
            </Text>
          </View>
        </ScrollView>
      )}

      <AddReminderModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditingReminder(undefined); }}
        editing={editingReminder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030A18" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40, 65, 140, 0.40)",
    backgroundColor: "rgba(3, 10, 24, 0.97)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.5 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40, shadowRadius: 6, elevation: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, gap: 24 },
  group: { gap: 10 },
  groupTitle: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    color: "#3A5080", textTransform: "uppercase", letterSpacing: 1.1, paddingLeft: 2,
  },
  groupCards: { gap: 8 },
  reminderCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 16,
    padding: 15, gap: 13,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 3,
  },
  reminderCardDisabled: { opacity: 0.50 },
  reminderIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  reminderInfo: { flex: 1, gap: 3 },
  reminderLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#DDE8FF", letterSpacing: -0.25 },
  reminderTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4A6090" },
  textDisabled: { color: "#2A3A60" },
  recurrenceBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    alignSelf: "flex-start", marginTop: 2,
  },
  recurrenceBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(18, 80, 100, 0.30)",
    borderRadius: 13, padding: 13,
    borderWidth: 1, borderColor: "rgba(26, 144, 144, 0.25)",
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#6A90A8", lineHeight: 18 },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 16,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.4, textAlign: "center" },
  emptyBody: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: "#5A78A8", textAlign: "center", lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40, shadowRadius: 10, elevation: 6,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.1 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: "#030A18" },
  modalHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(40, 65, 140, 0.40)", gap: 8,
    backgroundColor: "rgba(3, 10, 24, 0.97)",
  },
  modalBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  modalBtnText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#6A85AE" },
  modalTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", color: "#EEF4FF", textAlign: "center", letterSpacing: -0.35 },
  modalSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: 11,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  modalSaveBtnDisabled: { backgroundColor: "rgba(40, 55, 100, 0.60)" },
  modalSaveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  modalSaveBtnTextDisabled: { color: "#3A5080" },
  modalContent: { padding: 20, gap: 22, paddingBottom: 60 },
  modalField: { gap: 10 },
  modalFieldLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    color: "#3A5080", textTransform: "uppercase", letterSpacing: 1.1,
  },
  modalInput: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.28)",
    padding: 14, fontSize: 16, fontFamily: "Inter_500Medium", color: "#DDE8FF",
  },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 13, backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderWidth: 1.5, borderColor: "rgba(55, 85, 170, 0.30)",
  },
  typeChipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6A85AE" },
  datetimeBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.28)", padding: 14,
  },
  datetimeBtnText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#DDE8FF" },
  recurrenceRow: { flexDirection: "row", gap: 8 },
  recurrenceChip: {
    flex: 1, alignItems: "center",
    paddingVertical: 11, borderRadius: 13,
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderWidth: 1.5, borderColor: "rgba(55, 85, 170, 0.30)",
  },
  recurrenceChipActive: { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
  recurrenceChipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6A85AE" },
  recurrenceChipTextActive: { color: Colors.primary, fontFamily: "Inter_700Bold" },
  webNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(18, 80, 100, 0.30)", borderRadius: 13, padding: 13,
    borderWidth: 1, borderColor: "rgba(26, 144, 144, 0.25)",
  },
  webNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#6A90A8", lineHeight: 18 },
});
