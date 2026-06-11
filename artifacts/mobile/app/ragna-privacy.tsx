import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useCaregiverWellness } from "@/context/CaregiverWellnessContext";
import { useJournal } from "@/context/JournalContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useRagnaMemory } from "@/context/RagnaMemoryContext";
import {
  getHideReplyPreview,
  setHideReplyPreview,
} from "@/services/ragnaPreviewPreference";
import { deleteServerRagnaMemory } from "@/services/syncService";
import { RagnaPrivacySettings } from "@/types";

export default function RagnaPrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { ragnaPrivacy, updateRagnaPrivacy, resetRagnaPrivacy, buildPatientContext, user } = useApp();
  const { getRecentSummary } = useSymptoms();
  const { entries: journalEntries } = useJournal();
  const { getMemorySummary, clearMemories } = useRagnaMemory();
  const { getWellnessSummary } = useCaregiverWellness();

  const isCaregiverRole = user?.role === "caregiver" || user?.role === "other";

  const masterOn = ragnaPrivacy.personalizationEnabled;

  const toggleMaster = (val: boolean) => updateRagnaPrivacy({ personalizationEnabled: val });
  const toggle = (key: keyof RagnaPrivacySettings) => (val: boolean) =>
    updateRagnaPrivacy({ [key]: val });

  const [hideReplyPreview, setHideReplyPreviewState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getHideReplyPreview();
      if (!cancelled) {
        setHideReplyPreviewState(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleHideReplyPreview = (val: boolean) => {
    setHideReplyPreviewState(val);
    void setHideReplyPreview(val);
  };

  const handleClearMemory = () => {
    Alert.alert(
      "Clear Ragna Memory",
      "This clears Ragna's saved local memory and living profile on this device and removes it from your account so it won't be restored on other devices. It does not automatically delete a conversation that is currently open.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Memory",
          style: "destructive",
          onPress: () => {
            void clearMemories();
            // Delete from server so the next sync doesn't rehydrate cleared data.
            void deleteServerRagnaMemory();
          },
        },
      ]
    );
  };

  const previewText = useMemo(() => {
    if (!masterOn) return "";

    const baseContext = buildPatientContext();

    const symptomSummary = ragnaPrivacy.includeRecentSymptoms ? getRecentSummary(7) : "";

    const memorySummary = ragnaPrivacy.includeConversationMemory ? getMemorySummary() : "";

    const now = new Date();
    const timeContext = ragnaPrivacy.includeTimeContext
      ? `Current date/time: ${now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })} at ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
      : "";

    const journalContext = ragnaPrivacy.includeRecentJournal
      ? (() => {
          const recentJournal = journalEntries.slice(0, 3);
          if (recentJournal.length === 0) return "";
          return `--- Recent Caregiver Journal Entries ---\n${recentJournal
            .map((e) => {
              const dateStr =
                e.date ||
                new Date(e.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              return `[${dateStr} · ${e.type}] ${e.title}: ${e.body.slice(0, 200)}${
                e.body.length > 200 ? "…" : ""
              }`;
            })
            .join("\n")}`;
        })()
      : "";

    const wellnessContext =
      isCaregiverRole && ragnaPrivacy.includeCaregiverWellness
        ? getWellnessSummary(7)
        : "";

    return [
      baseContext,
      symptomSummary ? `--- Recent Symptom Tracking ---\n${symptomSummary}` : "",
      journalContext,
      wellnessContext,
      memorySummary,
      timeContext,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    masterOn,
    ragnaPrivacy,
    buildPatientContext,
    getRecentSummary,
    getMemorySummary,
    getWellnessSummary,
    isCaregiverRole,
    journalEntries,
  ]);

  return (
    <View style={styles.container}>
    <CosmicBackground />
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
      >
        <Feather name="chevron-left" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Ragna Privacy Controls</Text>
      <Text style={styles.intro}>
        Choose what Ragna can use to personalize responses. Anything turned off stays on your
        device and is not included with your chat request.
      </Text>

      {/* Master switch */}
      <View style={styles.section}>
        <View style={styles.sectionList}>
          <SwitchRow
            label="Use saved context to personalize Ragna"
            sublabel="When off, Ragna responds only to what you type"
            value={masterOn}
            onChange={toggleMaster}
            prominent
          />
        </View>
      </View>

      {/* Child switches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to include</Text>
        <View style={[styles.sectionList, !masterOn && styles.sectionListDisabled]}>
          <SwitchRow
            label="Patient profile details"
            sublabel="Name, diagnosis, and notes"
            value={ragnaPrivacy.includeProfileDetails}
            onChange={toggle("includeProfileDetails")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Medications and equipment"
            sublabel="Comfort kit and medical equipment in home"
            value={ragnaPrivacy.includeMedicationAndEquipment}
            onChange={toggle("includeMedicationAndEquipment")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Care contact numbers"
            sublabel="Hospice, pharmacy, and equipment provider phones"
            value={ragnaPrivacy.includeCareContacts}
            onChange={toggle("includeCareContacts")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Goals of care"
            sublabel="What matters most, good day, and directives"
            value={ragnaPrivacy.includeGoalsOfCare}
            onChange={toggle("includeGoalsOfCare")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Recent symptom summary"
            sublabel="Last 7 days from Symptom Tracker"
            value={ragnaPrivacy.includeRecentSymptoms}
            onChange={toggle("includeRecentSymptoms")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Recent journal entries"
            sublabel="Up to 3 most recent caregiver journal entries"
            value={ragnaPrivacy.includeRecentJournal}
            onChange={toggle("includeRecentJournal")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Conversation memory"
            sublabel="Ragna's summary of your previous conversations"
            value={ragnaPrivacy.includeConversationMemory}
            onChange={toggle("includeConversationMemory")}
            disabled={!masterOn}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Time context"
            sublabel="Current date and time of day"
            value={ragnaPrivacy.includeTimeContext}
            onChange={toggle("includeTimeContext")}
            disabled={!masterOn}
          />
          {isCaregiverRole && (
            <>
              <View style={styles.divider} />
              <SwitchRow
                label="Caregiver wellness mood"
                sublabel="Recent daily mood check-ins from your Home screen"
                value={ragnaPrivacy.includeCaregiverWellness}
                onChange={toggle("includeCaregiverWellness")}
                disabled={!masterOn}
              />
            </>
          )}
        </View>
      </View>

      {/* Display preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.sectionList}>
          <SwitchRow
            label="Hide live reply preview"
            sublabel="Stops Ragna's in-progress reply from appearing above the message box. Helpful during sensitive conversations near the patient. Voice playback is not affected."
            value={hideReplyPreview}
            onChange={toggleHideReplyPreview}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.sectionList}>
          <Pressable
            onPress={resetRagnaPrivacy}
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.75 }]}
          >
            <View style={styles.actionIcon}>
              <Feather name="refresh-cw" size={17} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Reset to Recommended Defaults</Text>
            <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            onPress={handleClearMemory}
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.actionIcon, styles.actionIconDestructive]}>
              <Feather name="trash-2" size={17} color={Colors.error} />
            </View>
            <Text style={[styles.actionLabel, styles.actionLabelDestructive]}>
              Clear Ragna Memory
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
          </Pressable>
        </View>
      </View>

      {/* Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What would be included right now</Text>
        <View style={styles.previewCard}>
          {previewText ? (
            <Text style={styles.previewText} selectable>
              {previewText}
            </Text>
          ) : (
            <Text style={styles.previewEmpty}>
              No saved context would be included right now. Ragna will respond based only on what
              you type in the chat.
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.footerNote}>
        These controls affect what is included with future chat requests from this device.
      </Text>
    </ScrollView>
    </View>
  );
}

interface SwitchRowProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  prominent?: boolean;
}

function SwitchRow({ label, sublabel, value, onChange, disabled, prominent }: SwitchRowProps) {
  return (
    <View style={[styles.switchRow, disabled && styles.switchRowDisabled]}>
      <View style={styles.switchLabelCol}>
        <Text style={[styles.switchLabel, prominent && styles.switchLabelProminent, disabled && styles.switchLabelDimmed]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.switchSublabel, disabled && styles.switchSublabelDimmed]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: Colors.divider, true: Colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  backText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  intro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionList: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  sectionListDisabled: {
    opacity: 0.55,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  switchRowDisabled: {},
  switchLabelCol: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  switchLabelProminent: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  switchLabelDimmed: {
    color: Colors.textMuted,
  },
  switchSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 17,
  },
  switchSublabelDimmed: {
    color: Colors.textSubtle,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconDestructive: {
    backgroundColor: Colors.errorPale,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  actionLabelDestructive: {
    color: Colors.error,
  },
  previewCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  previewText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  previewEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
    fontStyle: "italic",
  },
  footerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "center",
    lineHeight: 18,
    paddingBottom: 8,
  },
});
