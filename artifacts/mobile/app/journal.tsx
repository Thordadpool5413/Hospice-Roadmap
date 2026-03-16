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
