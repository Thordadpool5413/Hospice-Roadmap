import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { JOURNAL_TYPE_META, useJournal } from "@/context/JournalContext";
import { JournalEntryType } from "@/types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Predefined tags ──────────────────────────────────────────────────────────

const PRESET_TAGS = [
  "Pain", "Breathing", "Sleep", "Nausea", "Appetite",
  "Anxiety", "Agitation", "Confusion", "Medication",
  "Nurse Visit", "Doctor Visit", "Family", "Spiritual",
  "Equipment", "Side Effect", "Comfort Care", "Goals of Care",
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function JournalEntryScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { entries, addEntry, updateEntry, deleteEntry } = useJournal();

  const existing = id ? entries.find((e) => e.id === id) : null;

  const [type, setType] = useState<JournalEntryType>(existing?.type ?? "general");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [moodLevel, setMoodLevel] = useState<1 | 2 | 3 | 4 | 5 | undefined>(
    (existing as any)?.moodLevel ?? undefined
  );
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [isSaving, setIsSaving] = useState(false);

  // Keep tags in sync if loading an existing entry after initial render.
  useEffect(() => {
    if (existing?.tags) setTags(existing.tags);
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEditing = !!existing;
  const canSave = title.trim().length > 0;

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const moodData = type === "mood" && moodLevel ? { moodLevel } : {};
    const tagData = tags.length > 0 ? { tags } : { tags: undefined };
    if (isEditing) {
      await updateEntry(id!, { type, title: title.trim(), body: body.trim(), ...moodData, ...tagData });
    } else {
      await addEntry({ type, title: title.trim(), body: body.trim(), date: todayIsoDate(), ...moodData, ...tagData });
    }
    setIsSaving(false);
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert("Delete Entry", `Delete "${existing.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteEntry(existing.id);
          router.back();
        },
      },
    ]);
  };

  const handleShare = () => {
    const tagLine = tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";
    const text = `${title}\n\nType: ${JOURNAL_TYPE_META[type].label}\nDate: ${existing?.date ?? todayIsoDate()}\n\n${body}${tagLine}`;
    Share.share({ message: text }).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="x" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? "Edit Entry" : "New Entry"}</Text>
        <View style={styles.headerRight}>
          {isEditing && (
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            >
              <Feather name="share" size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            >
              <Feather name="trash-2" size={18} color={Colors.error} />
            </Pressable>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave || isSaving}
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              {isSaving ? "Saving…" : isEditing ? "Update" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Entry type picker */}
        <View style={styles.typePicker}>
          <Text style={styles.sectionLabel}>Entry Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {(Object.keys(JOURNAL_TYPE_META) as JournalEntryType[]).map((t) => {
              const meta = JOURNAL_TYPE_META[t];
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setType(t);
                  }}
                  style={({ pressed }) => [
                    styles.typeChip,
                    active && { backgroundColor: meta.bg, borderColor: meta.color },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Feather name={meta.icon as any} size={13} color={active ? meta.color : Colors.textMuted} />
                  <Text style={[styles.typeChipText, active && { color: meta.color, fontFamily: "Inter_600SemiBold" }]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Mood level selector — only visible for "mood" type entries */}
        {type === "mood" && (
          <View style={styles.moodSection}>
            <Text style={styles.sectionLabel}>How are you feeling today?</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const emoji = ["😞", "😟", "😐", "🙂", "😊"][level - 1];
                const label = ["Very Low", "Low", "Neutral", "Good", "Great"][level - 1];
                const colors = [Colors.error, Colors.accent, Colors.warning, Colors.success, Colors.journeyBefore];
                const selected = moodLevel === level;
                return (
                  <Pressable
                    key={level}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMoodLevel(selected ? undefined : level);
                    }}
                    style={({ pressed }) => [
                      styles.moodBtn,
                      selected && { borderColor: colors[level - 1], backgroundColor: colors[level - 1] + "18" },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                    <Text style={[styles.moodLabel, selected && { color: colors[level - 1], fontFamily: "Inter_600SemiBold" }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Pain level this morning"
            placeholderTextColor={Colors.textSubtle}
            returnKeyType="next"
            maxLength={120}
          />
        </View>

        {/* Body */}
        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Write your observations here…"
            placeholderTextColor={Colors.textSubtle}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{body.length}/2000</Text>
        </View>

        {/* Tag picker */}
        <View style={styles.tagSection}>
          <View style={styles.tagHeader}>
            <Text style={styles.sectionLabel}>Tags</Text>
            {tags.length > 0 && (
              <Pressable
                onPress={() => setTags([])}
                hitSlop={8}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.tagClearText}>Clear all</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.tagHint}>
            Tap to add. Tags help you filter entries later.
          </Text>
          <View style={styles.tagGrid}>
            {PRESET_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={({ pressed }) => [
                    styles.tagChip,
                    active && styles.tagChipActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {active && <Feather name="check" size={11} color={Colors.primary} />}
                  <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>What to track</Text>
          {[
            "Pain or discomfort levels (0–10 scale)",
            "Medications given and any side effects",
            "Mood, restlessness, or confusion changes",
            "Appetite, hydration, and sleep patterns",
            "Any questions for the hospice team",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Feather name="check" size={12} color={Colors.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.divider,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  saveBtnTextDisabled: {
    color: Colors.textSubtle,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typePicker: { gap: 10 },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  field: { gap: 8 },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  bodyInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    minHeight: 160,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "right",
  },
  // ── Tag picker ──
  tagSection: { gap: 10 },
  tagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: -4,
  },
  tagClearText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  tagChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  tagChipTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  // ── Mood ──
  moodSection: { gap: 8 },
  moodRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  moodBtn: {
    flex: 1, minWidth: 56, alignItems: "center", paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.divider,
    backgroundColor: Colors.surface, gap: 4,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    fontSize: 10, fontFamily: "Inter_500Medium",
    color: Colors.textMuted, textAlign: "center",
  },
  // ── Tips ──
  tipsBox: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "25",
  },
  tipsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
});
