import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { JOURNAL_TYPE_META, useJournal } from "@/context/JournalContext";
import { JournalEntry } from "@/types";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function groupByDate(entries: JournalEntry[]): { date: string; items: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

function MoodChart({ entries }: { entries: JournalEntry[] }) {
  const moodEntries = useMemo(() => {
    const today = new Date();
    const days: { date: string; level: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const match = entries
        .filter((e) => e.type === "mood" && e.date === ds && (e as any).moodLevel)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      days.push({ date: ds, level: match ? (match as any).moodLevel : null });
    }
    return days;
  }, [entries]);

  const hasMoodData = moodEntries.some((d) => d.level !== null);
  if (!hasMoodData) return null;

  const levelColors = ["#D9534F", "#E8843A", "#D4881A", "#5A9A6A", "#C85A1C"];
  const levelLabels = ["Very Low", "Low", "Neutral", "Good", "Great"];

  return (
    <View style={moodStyles.container}>
      <View style={moodStyles.header}>
        <Text style={moodStyles.title}>Mood Trend</Text>
        <Text style={moodStyles.sub}>Last 14 days</Text>
      </View>
      <View style={moodStyles.chart}>
        {moodEntries.map((d, i) => {
          const barHeight = d.level ? (d.level / 5) * 60 : 0;
          const barColor = d.level ? levelColors[d.level - 1] : Colors.divider;
          const isToday = i === 13;
          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
          return (
            <View key={d.date} style={moodStyles.barWrap}>
              <View style={moodStyles.barContainer}>
                {d.level ? (
                  <View style={[moodStyles.bar, { height: barHeight, backgroundColor: barColor }]} />
                ) : (
                  <View style={[moodStyles.barEmpty, { height: 4 }]} />
                )}
              </View>
              <Text style={[moodStyles.dayLabel, isToday && { fontFamily: "Inter_700Bold", color: Colors.primary }]}>
                {isToday ? "•" : dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={moodStyles.legend}>
        {levelColors.map((c, i) => (
          <View key={i} style={moodStyles.legendItem}>
            <View style={[moodStyles.legendDot, { backgroundColor: c }]} />
            <Text style={moodStyles.legendLabel}>{levelLabels[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const moodStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 74 },
  barWrap: { flex: 1, alignItems: "center", gap: 4 },
  barContainer: { flex: 1, justifyContent: "flex-end", width: "100%" },
  bar: { borderRadius: 3, width: "100%", minHeight: 4 },
  barEmpty: { backgroundColor: Colors.divider + "80", borderRadius: 2, width: "100%" },
  dayLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: Colors.textSubtle },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { entries, deleteEntry } = useJournal();

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Entry", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteEntry(id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Caregiver Journal</Text>
        <Pressable
          onPress={() => router.push("/journal-entry" as any)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="edit-3" size={32} color={Colors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyBody}>
            Track symptoms, medications, observations, and notes to share with
            your hospice team.
          </Text>
          <Pressable
            onPress={() => router.push("/journal-entry" as any)}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add First Entry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <MoodChart entries={entries} />
          {grouped.map(({ date, items }) => (
            <View key={date} style={styles.group}>
              <Text style={styles.groupDate}>{formatDate(date)}</Text>
              <View style={styles.groupCards}>
                {items.map((entry) => {
                  const meta = JOURNAL_TYPE_META[entry.type];
                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() =>
                        router.push({ pathname: "/journal-entry", params: { id: entry.id } } as any)
                      }
                      onLongPress={() => handleDelete(entry.id, entry.title)}
                      delayLongPress={500}
                      style={({ pressed }) => [
                        styles.entryCard,
                        { borderLeftColor: meta.color },
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <View style={styles.entryTop}>
                        <View style={[styles.entryTypePill, { backgroundColor: meta.bg }]}>
                          <Feather name={meta.icon as any} size={11} color={meta.color} />
                          <Text style={[styles.entryTypeText, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text style={styles.entryTime}>
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      {entry.body ? (
                        <Text style={styles.entryBody} numberOfLines={2}>
                          {entry.body}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  group: {
    gap: 10,
  },
  groupDate: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  groupCards: {
    gap: 8,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderLeftWidth: 4,
    gap: 6,
  },
  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  entryTypeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  entryTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  entryTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  entryBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 6,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
