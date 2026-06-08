import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { JOURNAL_TYPE_META, useJournal } from "@/context/JournalContext";
import { JournalEntry } from "@/types";
import { PremiumGate } from "@/components/PremiumGate";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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

function buildExportText(entries: JournalEntry[], tagFilter: string | null): string {
  const filtered = tagFilter
    ? entries.filter((e) => e.tags?.includes(tagFilter))
    : entries;

  const header = [
    "Hospice Roadmap — Caregiver Journal",
    tagFilter ? `Tag: ${tagFilter}` : "All Entries",
    `Exported: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    `Total: ${filtered.length} entr${filtered.length !== 1 ? "ies" : "y"}`,
    "─".repeat(40),
  ].join("\n");

  if (filtered.length === 0) return header + "\n\nNo entries to export.";

  const body = filtered
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((e) => {
      const meta = JOURNAL_TYPE_META[e.type];
      const lines = [
        `[${meta.label}] ${formatDate(e.date)} at ${formatTime(e.timestamp)}`,
        e.title,
      ];
      if (e.body) lines.push("", e.body);
      if (e.tags && e.tags.length > 0) lines.push("", `Tags: ${e.tags.join(", ")}`);
      return lines.join("\n");
    })
    .join("\n\n" + "─".repeat(30) + "\n\n");

  return header + "\n\n" + body;
}

// ─── Mood chart ───────────────────────────────────────────────────────────────

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

  const levelColors = [Colors.error, Colors.accent, Colors.warning, Colors.success, Colors.journeyBefore];
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
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(55, 85, 170, 0.25)",
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.3 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4A6090" },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 74 },
  barWrap: { flex: 1, alignItems: "center", gap: 4 },
  barContainer: { flex: 1, justifyContent: "flex-end", width: "100%" },
  bar: { borderRadius: 4, width: "100%", minHeight: 4 },
  barEmpty: { backgroundColor: "rgba(40, 60, 130, 0.40)", borderRadius: 2, width: "100%" },
  dayLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#2A3A60" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#4A6090" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { entries, deleteEntry } = useJournal();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all tags that appear in at least one entry.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(
    () => (activeTag ? entries.filter((e) => e.tags?.includes(activeTag)) : entries),
    [entries, activeTag]
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

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

  const handleExport = () => {
    const text = buildExportText(entries, activeTag);
    const title = activeTag ? `Journal — ${activeTag}` : "Caregiver Journal";
    Share.share({ message: text, title }).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <PremiumGate
      featureName="Caregiver Journal"
      showBackButton
      description="Write and review care events, moods, and milestones. Ragna can reference your journal for richer, more personalized guidance."
    >
    <View style={styles.container}>
      <CosmicBackground />
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Caregiver Journal</Text>
        <View style={styles.headerRight}>
          {entries.length > 0 && (
            <Pressable
              onPress={handleExport}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Export journal"
            >
              <Feather name="share" size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/journal-entry" as any)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagBar}
          contentContainerStyle={styles.tagBarContent}
          keyboardShouldPersistTaps="always"
        >
          <Pressable
            style={({ pressed }) => [
              styles.tagChip,
              activeTag === null && styles.tagChipActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTag(null);
            }}
          >
            <Text style={[styles.tagChipText, activeTag === null && styles.tagChipTextActive]}>
              All
            </Text>
          </Pressable>
          {allTags.map((tag) => (
            <Pressable
              key={tag}
              style={({ pressed }) => [
                styles.tagChip,
                activeTag === tag && styles.tagChipActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTag(activeTag === tag ? null : tag);
              }}
            >
              <Text style={[styles.tagChipText, activeTag === tag && styles.tagChipTextActive]}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Empty state */}
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="edit-3" size={32} color={Colors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyBody}>
            Track symptoms, medications, observations, and notes to share with your hospice team.
          </Text>
          <Pressable
            onPress={() => router.push("/journal-entry" as any)}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add First Entry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="tag" size={28} color={Colors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No entries tagged "{activeTag}"</Text>
          <Pressable
            onPress={() => setActiveTag(null)}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider }]}
          >
            <Text style={[styles.emptyBtnText, { color: Colors.textSecondary }]}>Show all entries</Text>
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
                        <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                      </View>
                      <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                      {entry.body ? (
                        <Text style={styles.entryBody} numberOfLines={2}>{entry.body}</Text>
                      ) : null}
                      {entry.tags && entry.tags.length > 0 && (
                        <View style={styles.entryTags}>
                          {entry.tags.slice(0, 4).map((tag) => (
                            <View key={tag} style={styles.entryTagPill}>
                              <Text style={styles.entryTagText}>{tag}</Text>
                            </View>
                          ))}
                          {entry.tags.length > 4 && (
                            <Text style={styles.entryTagMore}>+{entry.tags.length - 4}</Text>
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1730",
  },
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 6,
    elevation: 4,
  },
  tagBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40, 65, 140, 0.30)",
    backgroundColor: "rgba(3, 10, 24, 0.97)",
  },
  tagBarContent: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.28)",
  },
  tagChipActive: {
    backgroundColor: Colors.primary + "25",
    borderColor: Colors.primary,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6A85AE",
  },
  tagChipTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 24,
  },
  group: { gap: 10 },
  groupDate: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#3A5080",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    paddingLeft: 2,
  },
  groupCards: { gap: 8 },
  entryCard: {
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(55, 85, 170, 0.22)",
    borderLeftWidth: 3.5,
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
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
    color: "#3A5080",
  },
  entryTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#DDE8FF",
    letterSpacing: -0.25,
  },
  entryBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 20,
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  entryTagPill: {
    backgroundColor: "rgba(20, 32, 80, 0.90)",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.30)",
  },
  entryTagText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#5A78A8",
  },
  entryTagMore: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    alignSelf: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#DDE8FF",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.1,
  },
});

