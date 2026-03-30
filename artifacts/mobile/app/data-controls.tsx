import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useJournal } from "@/context/JournalContext";
import { useReminders } from "@/context/RemindersContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useVeraMemory } from "@/context/VeraMemoryContext";

// ─── Helpers to determine empty states ───────────────────────────────────────

function derivePatientProfileStatus(user: ReturnType<typeof useApp>["user"]): string {
  const p = user?.patientProfile;
  if (!p) return "Empty";
  const hasContent =
    !!p.patientName ||
    !!p.diagnosis ||
    !!p.comfortKitMedications ||
    (p.medications && p.medications.length > 0) ||
    !!p.equipmentInHome ||
    !!p.hospicePhone ||
    !!p.hospiceAfterHoursPhone ||
    !!p.equipmentProviderPhone ||
    !!p.pharmacyPhone ||
    !!p.additionalNotes;
  return hasContent ? "Saved" : "Empty";
}

function deriveGoalsOfCareStatus(user: ReturnType<typeof useApp>["user"]): string {
  const g = user?.patientProfile?.goalsOfCare;
  if (!g) return "Empty";
  const hasContent =
    !!g.whatMattersMost ||
    !!g.goodDayLooksLike ||
    !!g.thingsToAvoid ||
    (!!g.dnrStatus && g.dnrStatus !== "not-discussed") ||
    !!g.additionalDirectives;
  return hasContent ? "Saved" : "Empty";
}

function deriveRagnaMemoryStatus(
  memoryCount: number,
  livingProfile: string,
  recentTilesLength: number
): string {
  if (memoryCount === 0 && !livingProfile && recentTilesLength === 0) return "Empty";
  if (memoryCount === 1) return "1 memory";
  if (memoryCount > 1) return `${memoryCount} memories`;
  return livingProfile ? "Profile saved" : "Topic history only";
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function DataControlsScreen() {
  const insets = useSafeAreaInsets();
  const { user, clearPatientProfile, clearGoalsOfCare, clearSavedResources, clearSavedProviders } = useApp();
  const { entries: journalEntries, clearEntries: clearJournal } = useJournal();
  const { entries: symptomEntries, clearEntries: clearSymptoms } = useSymptoms();
  const { reminders, clearReminders } = useReminders();
  const { memories, livingProfile, recentTiles, clearMemories } = useVeraMemory();

  // Derived statuses
  const profileStatus = derivePatientProfileStatus(user);
  const goalsStatus = deriveGoalsOfCareStatus(user);
  const providersCount = user?.savedProviders.length ?? 0;
  const resourcesCount = user?.savedResources.length ?? 0;
  const ragnaStatus = deriveRagnaMemoryStatus(memories.length, livingProfile, recentTiles.length);

  const isEmpty = {
    profile: profileStatus === "Empty",
    goals: goalsStatus === "Empty",
    providers: providersCount === 0,
    resources: resourcesCount === 0,
    journal: journalEntries.length === 0,
    symptoms: symptomEntries.length === 0,
    reminders: reminders.length === 0,
    ragna: ragnaStatus === "Empty",
  };

  const confirm = (
    title: string,
    body: string,
    onConfirm: () => Promise<void>
  ) => {
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await onConfirm();
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Cleared", `${title.replace("Clear ", "")} cleared.`);
        },
      },
    ]);
  };

  const categories: {
    title: string;
    description: string;
    status: string;
    empty: boolean;
    onClear: () => void;
  }[] = [
    {
      title: "Patient Profile",
      description: "Name, diagnosis, medications, phones, and equipment notes",
      status: profileStatus,
      empty: isEmpty.profile,
      onClear: () =>
        confirm(
          "Clear Patient Profile",
          "Remove saved patient profile details from this device? Goals of care will be kept unless you clear them separately.",
          clearPatientProfile
        ),
    },
    {
      title: "Goals of Care",
      description: "What matters most, good day, avoidances, and resuscitation preference",
      status: goalsStatus,
      empty: isEmpty.goals,
      onClear: () =>
        confirm(
          "Clear Goals of Care",
          "Remove saved goals of care from this device? Other patient profile details will stay in place.",
          clearGoalsOfCare
        ),
    },
    {
      title: "Saved Providers",
      description: "Hospice providers bookmarked from search results",
      status: providersCount === 0 ? "None saved" : `${providersCount} saved`,
      empty: isEmpty.providers,
      onClear: () =>
        confirm(
          "Clear Saved Providers",
          "Remove all saved provider bookmarks from this device?",
          clearSavedProviders
        ),
    },
    {
      title: "Saved Resources",
      description: "Articles and resources bookmarked from the library",
      status: resourcesCount === 0 ? "None saved" : `${resourcesCount} saved`,
      empty: isEmpty.resources,
      onClear: () =>
        confirm(
          "Clear Saved Resources",
          "Remove all saved resource bookmarks from this device?",
          clearSavedResources
        ),
    },
    {
      title: "Journal Entries",
      description: "Caregiver journal entries stored on this device",
      status:
        journalEntries.length === 0
          ? "No entries"
          : `${journalEntries.length} ${journalEntries.length === 1 ? "entry" : "entries"}`,
      empty: isEmpty.journal,
      onClear: () =>
        confirm(
          "Clear Journal Entries",
          "Delete all journal entries stored on this device? This cannot be undone.",
          clearJournal
        ),
    },
    {
      title: "Symptom Check-Ins",
      description: "Daily symptom tracking entries stored on this device",
      status:
        symptomEntries.length === 0
          ? "No entries"
          : `${symptomEntries.length} ${symptomEntries.length === 1 ? "entry" : "entries"}`,
      empty: isEmpty.symptoms,
      onClear: () =>
        confirm(
          "Clear Symptom Check-Ins",
          "Delete all symptom tracking entries stored on this device? This cannot be undone.",
          clearSymptoms
        ),
    },
    {
      title: "Reminders",
      description: "Scheduled medication and appointment reminders",
      status:
        reminders.length === 0
          ? "None set"
          : `${reminders.length} ${reminders.length === 1 ? "reminder" : "reminders"}`,
      empty: isEmpty.reminders,
      onClear: () =>
        confirm(
          "Clear Reminders",
          "Delete all reminders stored on this device? Scheduled reminder notifications will also be cancelled.",
          clearReminders
        ),
    },
    {
      title: "Ragna Memory",
      description: "Saved local memory, living profile, and recent topic history",
      status: ragnaStatus,
      empty: isEmpty.ragna,
      onClear: () =>
        confirm(
          "Clear Ragna Memory",
          "Clear Ragna's saved local memory, living profile, and recent topic history on this device? This does not automatically delete a conversation currently open on the server.",
          clearMemories
        ),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Saved Data</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBanner}>
          <Feather name="hard-drive" size={18} color={Colors.primary} style={styles.introIcon} />
          <Text style={styles.introText}>
            Review what is stored on this device and clear categories individually. These actions do not remove server-backed records such as submitted support requests, and they do not automatically delete an active Ragna conversation on the server.
          </Text>
        </View>

        {/* Category list */}
        <View style={styles.categoryList}>
          {categories.map((cat, idx) => (
            <View key={cat.title}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: cat.empty ? Colors.textSubtle : Colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        cat.empty && styles.statusTextEmpty,
                      ]}
                    >
                      {cat.status}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={cat.empty ? undefined : cat.onClear}
                  disabled={cat.empty}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    cat.empty && styles.clearBtnDisabled,
                    !cat.empty && pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.clearBtnText,
                      cat.empty && styles.clearBtnTextDisabled,
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
              {idx < categories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Reset note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Need a full reset?</Text>
          <Text style={styles.noteBody}>
            Category controls above only clear saved data for that category. Your app setup, accessibility settings, and journey stage are kept in place.
          </Text>
        </View>

        {/* Back link */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.backLinkText}>Back to More</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  introBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  introIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  categoryList: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  categoryMeta: {
    flex: 1,
    gap: 3,
  },
  categoryTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  categoryDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 17,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  statusTextEmpty: {
    color: Colors.textSubtle,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.errorPale,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  clearBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.divider,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.error,
  },
  clearBtnTextDisabled: {
    color: Colors.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  noteTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  noteBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
  },
  backLink: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
});
