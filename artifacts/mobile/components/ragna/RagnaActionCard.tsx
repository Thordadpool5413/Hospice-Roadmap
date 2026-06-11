import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { RagnaAction } from "@/types";

import { RagnaActionState } from "./RagnaMessageBubble";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface ActionPresentation {
  icon: FeatherName;
  accent: string;
  accentPale: string;
  title: string;
  detail: string;
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

function symptomSummary(action: Extract<RagnaAction, { action: "log_symptom" }>): string {
  const parts: string[] = [];
  if (action.pain !== undefined) parts.push(`Pain ${action.pain}`);
  if (action.breathlessness !== undefined)
    parts.push(`Breathlessness ${action.breathlessness}`);
  if (action.nausea !== undefined) parts.push(`Nausea ${action.nausea}`);
  return parts.length > 0 ? `${parts.join(", ")} · today` : "Today";
}

function getPresentation(action: RagnaAction): ActionPresentation {
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
        accentPale: Colors.surfaceLight,
        title: "Add reminder",
        detail: `${action.label} · ${formatReminderTime(action.datetime)}${recurrenceSuffix}`,
        confirmLabel: "Add",
        doneLabel: "Reminder added",
      };
    }
    case "log_symptom":
      return {
        icon: "activity",
        accent: Colors.accentSymptom,
        accentPale: Colors.surfaceLight,
        title: "Log symptoms",
        detail: symptomSummary(action),
        confirmLabel: "Log It",
        doneLabel: "Symptoms logged",
      };
    case "add_journal_entry":
      return {
        icon: "book-open",
        accent: Colors.accentJournal,
        accentPale: Colors.surfaceLight,
        title: "Add journal entry",
        detail: action.title,
        confirmLabel: "Add",
        doneLabel: "Journal entry added",
      };
  }
}

export function RagnaActionCard({
  action,
  state,
  onConfirm,
  onSkip,
}: {
  action: RagnaAction;
  state: RagnaActionState;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  if (state === "skipped") return null;

  const p = getPresentation(action);

  if (state === "done") {
    return (
      <View style={styles.doneRow}>
        <Feather name="check-circle" size={14} color={Colors.success} />
        <Text style={styles.doneText}>{p.doneLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: p.accent + "55" }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: p.accent + "22" }]}>
          <Feather name={p.icon} size={16} color={p.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{p.title}</Text>
          <Text style={styles.detail} numberOfLines={3}>
            {p.detail}
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
            { backgroundColor: p.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="check" size={14} color={Colors.background} />
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
