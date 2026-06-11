import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import {
  JournalEntryType,
  RagnaAction,
  RagnaActionTarget,
  Reminder,
  ReminderRecurrence,
  ReminderType,
} from "@/types";

import { RagnaActionState } from "./RagnaMessageBubble";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/** One field being changed by an update_* action, shown as before → after. */
interface ChangeRow {
  label: string;
  before?: string;
  after: string;
}

interface ActionPresentation {
  icon: FeatherName;
  accent: string;
  title: string;
  /** Primary subtitle — the record name / summary. */
  detail?: string;
  /** Before → after rows for update actions. */
  changes?: ChangeRow[];
  /** True for cancel actions (shows a removal warning + danger button). */
  destructive?: boolean;
  confirmLabel: string;
  doneLabel: string;
}

function formatReminderTime(datetime: string): string {
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return datetime;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function recurrenceText(recurrence: ReminderRecurrence): string {
  switch (recurrence) {
    case "daily":
      return "Repeats daily";
    case "weekly":
      return "Repeats weekly";
    default:
      return "Does not repeat";
  }
}

function reminderTypeText(type: ReminderType): string {
  return type === "appointment" ? "Appointment" : "Medication";
}

function journalTypeText(type: JournalEntryType): string {
  switch (type) {
    case "symptom":
      return "Symptom";
    case "medication":
      return "Medication";
    case "mood":
      return "Mood";
    case "general":
      return "General";
    default:
      return "Observation";
  }
}

function reminderWhen(r: Reminder): string {
  const suffix =
    r.recurrence && r.recurrence !== "none"
      ? ` · ${recurrenceText(r.recurrence).toLowerCase()}`
      : "";
  return `${formatReminderTime(r.datetime)}${suffix}`;
}

function symptomScores(e: {
  pain?: number;
  breathlessness?: number;
  nausea?: number;
}): string {
  const parts: string[] = [];
  if (e.pain !== undefined) parts.push(`Pain ${e.pain}`);
  if (e.breathlessness !== undefined) parts.push(`Breathlessness ${e.breathlessness}`);
  if (e.nausea !== undefined) parts.push(`Nausea ${e.nausea}`);
  return parts.join(", ");
}

function excerpt(text: string, max = 80): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Update/cancel actions need a resolved target record to be applied safely. */
function actionRequiresTarget(action: RagnaAction): boolean {
  switch (action.action) {
    case "update_reminder":
    case "cancel_reminder":
    case "update_symptom":
    case "cancel_symptom":
    case "update_journal_entry":
    case "cancel_journal_entry":
      return true;
    default:
      return false;
  }
}

function getPresentation(
  action: RagnaAction,
  target: RagnaActionTarget | undefined,
): ActionPresentation {
  switch (action.action) {
    case "create_reminder": {
      const recurrenceSuffix =
        action.recurrence === "daily"
          ? " · repeats daily"
          : action.recurrence === "weekly"
            ? " · repeats weekly"
            : "";
      return {
        icon: "bell",
        accent: Colors.accentReminders,
        title: "Add reminder",
        detail: `${action.label} · ${formatReminderTime(action.datetime)}${recurrenceSuffix}`,
        confirmLabel: "Add",
        doneLabel: "Reminder added",
      };
    }
    case "log_symptom": {
      const scores = symptomScores(action);
      return {
        icon: "activity",
        accent: Colors.accentSymptom,
        title: "Log symptoms",
        detail: scores ? `${scores} · today` : "Today",
        confirmLabel: "Log It",
        doneLabel: "Symptoms logged",
      };
    }
    case "add_journal_entry":
      return {
        icon: "book-open",
        accent: Colors.accentJournal,
        title: "Add journal entry",
        detail: action.title,
        confirmLabel: "Add",
        doneLabel: "Journal entry added",
      };
    case "update_reminder": {
      const r = target?.kind === "reminder" ? target.reminder : undefined;
      const changes: ChangeRow[] = [];
      if (action.label !== undefined)
        changes.push({ label: "Label", before: r?.label, after: action.label });
      if (action.datetime !== undefined)
        changes.push({
          label: "Time",
          before: r ? formatReminderTime(r.datetime) : undefined,
          after: formatReminderTime(action.datetime),
        });
      if (action.reminderType !== undefined)
        changes.push({
          label: "Type",
          before: r ? reminderTypeText(r.type) : undefined,
          after: reminderTypeText(action.reminderType),
        });
      if (action.recurrence !== undefined)
        changes.push({
          label: "Repeat",
          before: r ? recurrenceText(r.recurrence) : undefined,
          after: recurrenceText(action.recurrence),
        });
      return {
        icon: "bell",
        accent: Colors.accentReminders,
        title: "Update reminder",
        detail: r?.label,
        changes,
        confirmLabel: "Update",
        doneLabel: "Reminder updated",
      };
    }
    case "cancel_reminder": {
      const r = target?.kind === "reminder" ? target.reminder : undefined;
      return {
        icon: "bell-off",
        accent: Colors.accentReminders,
        title: "Cancel reminder",
        detail: r ? `${r.label} · ${reminderWhen(r)}` : undefined,
        destructive: true,
        confirmLabel: "Remove",
        doneLabel: "Reminder removed",
      };
    }
    case "update_symptom": {
      const s = target?.kind === "symptom" ? target.symptom : undefined;
      const changes: ChangeRow[] = [];
      if (action.pain !== undefined)
        changes.push({
          label: "Pain",
          before: s ? String(s.pain) : undefined,
          after: String(action.pain),
        });
      if (action.breathlessness !== undefined)
        changes.push({
          label: "Breathlessness",
          before: s ? String(s.breathlessness) : undefined,
          after: String(action.breathlessness),
        });
      if (action.nausea !== undefined)
        changes.push({
          label: "Nausea",
          before: s ? String(s.nausea) : undefined,
          after: String(action.nausea),
        });
      if (action.notes !== undefined)
        changes.push({
          label: "Notes",
          before: s?.notes ? excerpt(s.notes) : undefined,
          after: excerpt(action.notes),
        });
      return {
        icon: "activity",
        accent: Colors.accentSymptom,
        title: "Update symptom log",
        detail: s ? `Logged ${s.date}` : undefined,
        changes,
        confirmLabel: "Update",
        doneLabel: "Symptom log updated",
      };
    }
    case "cancel_symptom": {
      const s = target?.kind === "symptom" ? target.symptom : undefined;
      const summary = s
        ? [symptomScores(s), s.date].filter(Boolean).join(" · ")
        : undefined;
      return {
        icon: "activity",
        accent: Colors.accentSymptom,
        title: "Delete symptom log",
        detail: summary,
        destructive: true,
        confirmLabel: "Delete",
        doneLabel: "Symptom log deleted",
      };
    }
    case "update_journal_entry": {
      const j = target?.kind === "journal" ? target.journal : undefined;
      const changes: ChangeRow[] = [];
      if (action.title !== undefined)
        changes.push({ label: "Title", before: j?.title, after: action.title });
      if (action.body !== undefined)
        changes.push({
          label: "Entry",
          before: j ? excerpt(j.body) : undefined,
          after: excerpt(action.body),
        });
      if (action.journalType !== undefined)
        changes.push({
          label: "Type",
          before: j ? journalTypeText(j.type) : undefined,
          after: journalTypeText(action.journalType),
        });
      return {
        icon: "book-open",
        accent: Colors.accentJournal,
        title: "Update journal entry",
        detail: j?.title,
        changes,
        confirmLabel: "Update",
        doneLabel: "Journal entry updated",
      };
    }
    case "cancel_journal_entry": {
      const j = target?.kind === "journal" ? target.journal : undefined;
      return {
        icon: "book-open",
        accent: Colors.accentJournal,
        title: "Delete journal entry",
        detail: j ? `${j.title}${j.date ? ` · ${j.date}` : ""}` : undefined,
        destructive: true,
        confirmLabel: "Delete",
        doneLabel: "Journal entry deleted",
      };
    }
  }
}

export function RagnaActionCard({
  action,
  state,
  target,
  onConfirm,
  onSkip,
}: {
  action: RagnaAction;
  state: RagnaActionState;
  /** Existing record for update/cancel actions; null when not found (stale id). */
  target?: RagnaActionTarget | null;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  if (state === "skipped") return null;

  const p = getPresentation(action, target ?? undefined);

  if (state === "done") {
    return (
      <View style={styles.doneRow}>
        <Feather name="check-circle" size={14} color={Colors.success} />
        <Text style={styles.doneText}>{p.doneLabel}</Text>
      </View>
    );
  }

  // An update/cancel whose target record no longer exists can't be applied.
  if (actionRequiresTarget(action) && !target) {
    return (
      <View style={[styles.card, { borderColor: Colors.divider }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: Colors.textMuted + "22" }]}>
            <Feather name="alert-circle" size={16} color={Colors.textMuted} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Item not found</Text>
            <Text style={styles.detail} numberOfLines={3}>
              That record is no longer available, so this change can&rsquo;t be applied.
            </Text>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSkip();
            }}
            style={({ pressed }) => [
              styles.button,
              styles.skipButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.skipButtonText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const confirmColor = p.destructive ? Colors.error : p.accent;

  return (
    <View style={[styles.card, { borderColor: confirmColor + "55" }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: p.accent + "22" }]}>
          <Feather name={p.icon} size={16} color={p.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{p.title}</Text>
          {p.detail ? (
            <Text style={styles.detail} numberOfLines={3}>
              {p.detail}
            </Text>
          ) : null}
        </View>
      </View>

      {p.changes && p.changes.length > 0 ? (
        <View style={styles.changes}>
          {p.changes.map((c, i) => (
            <View key={`${c.label}-${i}`} style={styles.changeRow}>
              <Text style={styles.changeLabel}>{c.label}</Text>
              <View style={styles.changeValues}>
                {c.before ? (
                  <>
                    <Text style={styles.changeBefore} numberOfLines={2}>
                      {c.before}
                    </Text>
                    <Feather name="arrow-right" size={12} color={Colors.textMuted} />
                  </>
                ) : null}
                <Text style={styles.changeAfter} numberOfLines={2}>
                  {c.after}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {p.destructive ? (
        <Text style={styles.destructiveNote}>This will be permanently removed.</Text>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSkip();
          }}
          style={({ pressed }) => [
            styles.button,
            styles.skipButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConfirm();
          }}
          style={({ pressed }) => [
            styles.button,
            styles.confirmButton,
            { backgroundColor: confirmColor },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather
            name={p.destructive ? "trash-2" : "check"}
            size={14}
            color={Colors.background}
          />
          <Text style={styles.confirmButtonText}>{p.confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginLeft: 34,
    marginTop: 8,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  detail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  changes: {
    gap: 8,
    paddingLeft: 42,
  },
  changeRow: {
    gap: 2,
  },
  changeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  changeValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  changeBefore: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  changeAfter: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    flexShrink: 1,
  },
  destructiveNote: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.error,
    paddingLeft: 42,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  skipButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  skipButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
  },
  confirmButton: {
    minWidth: 84,
  },
  confirmButtonText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.background,
  },
  doneRow: {
    marginLeft: 34,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.successPale,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + "66",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  doneText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
});
