import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import {
  CALL_SCRIPTS,
  CallScript,
  ScriptUrgency,
  URGENCY_COLORS,
  URGENCY_LABELS,
  interpolateScript,
} from "@/constants/callScripts";

import { useApp } from "@/context/AppContext";
import { useSymptoms } from "@/context/SymptomContext";
import { PatientProfile, SymptomEntry } from "@/types";

const TABS: { key: ScriptUrgency; label: string; icon: string }[] = [
  { key: "urgent", label: "Urgent", icon: "alert-circle" },
  { key: "routine", label: "Routine", icon: "clipboard" },
  { key: "emotional", label: "Support", icon: "heart" },
];

export default function CallScriptsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { getTodayEntry, getRecentEntries } = useSymptoms();
  const profile = user?.patientProfile;

  const { initialScriptId } = useLocalSearchParams<{ initialScriptId?: string }>();

  const [activeTab, setActiveTab] = useState<ScriptUrgency>("urgent");
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const latestSymptom = getTodayEntry() ?? getRecentEntries(7)[0] ?? null;

  useEffect(() => {
    if (!initialScriptId) return;
    const match = CALL_SCRIPTS.find((s) => s.id === initialScriptId);
    if (match) {
      setActiveTab(match.urgency);
      setSelectedScript(match);
    }
  }, [initialScriptId]);

  const filteredScripts = CALL_SCRIPTS.filter((s) => s.urgency === activeTab);

  const hospicePhone = profile?.hospicePhone?.trim() || "";
  const hospiceAfterHours = profile?.hospiceAfterHoursPhone?.trim() || "";

  function handleSelectScript(script: CallScript) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedScript(script);
    setCopySuccess(false);
  }

  function handleBack() {
    if (selectedScript) {
      setSelectedScript(null);
    } else {
      router.back();
    }
  }

  async function handleCopy(script: CallScript) {
    const text = interpolateScript(script.template, profile, latestSymptom);
    try {
      await Clipboard.setStringAsync(text);
      setCopySuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      Alert.alert("Could not copy", "Please select and copy the text manually.");
    }
  }

  function handleCallNow(script: CallScript) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneNumber =
      script.urgency === "urgent" && hospiceAfterHours
        ? hospiceAfterHours
        : hospicePhone;

    if (!phoneNumber) {
      Alert.alert(
        "No Hospice Number Saved",
        "Add your hospice phone number in the Patient Profile so you can call directly from here.",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Go to Profile",
            onPress: () => router.push("/patient-profile" as any),
          },
        ]
      );
      return;
    }
    Linking.openURL(`tel:${phoneNumber.replace(/\D/g, "")}`);
  }

  function handleRefineWithRagna(script: CallScript) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const filledScript = interpolateScript(script.template, profile, latestSymptom);
    const message = `I need to call hospice about: "${script.title}". Can you help me refine this call script for our specific situation?\n\nDraft script:\n${filledScript}`;
    router.push({ pathname: "/(tabs)/help", params: { initialMessage: message } } as any);
  }

  const urgencyColor = URGENCY_COLORS[activeTab];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {selectedScript ? selectedScript.title : "Call Scripts"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedScript
              ? "Know exactly what to say"
              : "Know exactly what to say to the nurse"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* List view — category tabs + scripts */}
      {!selectedScript && (
        <>
          {/* Intro banner */}
          <View style={styles.introBanner}>
            <Feather name="phone" size={16} color={Colors.primary} />
            <Text style={styles.introText}>
              Scripts are pre-filled with {profile?.patientName?.trim() ? profile.patientName.trim() + "'s" : "your"} profile and latest symptoms. Fill in{" "}
              <Text style={styles.introHighlight}>[bracketed fields]</Text> before calling.
            </Text>
          </View>

          {/* Category tabs */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => {
              const active = tab.key === activeTab;
              const color = URGENCY_COLORS[tab.key];
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.key);
                    setSelectedScript(null);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    active && { borderBottomColor: color, borderBottomWidth: 2 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Feather
                    name={tab.icon as any}
                    size={14}
                    color={active ? color : Colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, active && { color }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {filteredScripts.map((script) => (
              <ScriptListRow
                key={script.id}
                script={script}
                onPress={() => handleSelectScript(script)}
              />
            ))}

            {/* Call reminder */}
            <View style={styles.reminderCard}>
              <Feather name="phone-call" size={16} color={Colors.error} />
              <Text style={styles.reminderText}>
                Hospice is available 24 hours a day. There is no such thing as an unnecessary call.
              </Text>
            </View>
          </ScrollView>
        </>
      )}

      {/* Detail view — filled script */}
      {selectedScript && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Urgency badge */}
          <View style={styles.detailMeta}>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: URGENCY_COLORS[selectedScript.urgency] + "22" },
              ]}
            >
              <Feather
                name={
                  selectedScript.urgency === "urgent"
                    ? "alert-circle"
                    : selectedScript.urgency === "emotional"
                    ? "heart"
                    : "clipboard"
                }
                size={12}
                color={URGENCY_COLORS[selectedScript.urgency]}
              />
              <Text
                style={[
                  styles.urgencyBadgeText,
                  { color: URGENCY_COLORS[selectedScript.urgency] },
                ]}
              >
                {URGENCY_LABELS[selectedScript.urgency]}
              </Text>
            </View>
            {selectedScript.guidanceScenarioId && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/guidance/[id]",
                    params: { id: selectedScript.guidanceScenarioId! },
                  } as any)
                }
                style={({ pressed }) => [styles.guidanceLink, pressed && { opacity: 0.7 }]}
              >
                <Feather name="book-open" size={11} color={Colors.primary} />
                <Text style={styles.guidanceLinkText}>See guidance</Text>
              </Pressable>
            )}
          </View>

          {/* Script subtitle */}
          <Text style={styles.detailSubtitle}>{selectedScript.subtitle}</Text>

          {/* Profile data note */}
          {(!profile?.patientName || !profile?.diagnosis) && (
            <Pressable
              onPress={() => router.push("/patient-profile" as any)}
              style={({ pressed }) => [styles.profileNudge, pressed && { opacity: 0.8 }]}
            >
              <Feather name="alert-circle" size={14} color={Colors.amber} />
              <Text style={styles.profileNudgeText}>
                Add patient name & diagnosis to get a fully personalized script.
              </Text>
              <Feather name="chevron-right" size={14} color={Colors.amber} />
            </Pressable>
          )}

          {/* The script itself */}
          <View style={styles.scriptCard}>
            <View style={styles.scriptCardHeader}>
              <Feather name="message-circle" size={14} color={Colors.textMuted} />
              <Text style={styles.scriptCardHeaderText}>Your Script</Text>
            </View>
            <FilledScript
              template={selectedScript.template}
              profile={profile}
              latestSymptom={latestSymptom}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleCopy(selectedScript)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnPrimary,
                pressed && { opacity: 0.8 },
                copySuccess && { backgroundColor: Colors.success + "30" },
              ]}
            >
              <Feather
                name={copySuccess ? "check" : "copy"}
                size={16}
                color={copySuccess ? Colors.success : Colors.primary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  copySuccess && { color: Colors.success },
                ]}
              >
                {copySuccess ? "Copied!" : "Copy Script"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleCallNow(selectedScript)}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnCall,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="phone" size={16} color={Colors.error} />
              <Text style={styles.actionBtnCallText}>Call Now</Text>
            </Pressable>
          </View>

          {hospicePhone ? (
            <Text style={styles.phoneNote}>
              Calls{" "}
              {selectedScript.urgency === "urgent" && hospiceAfterHours
                ? `after-hours line: ${hospiceAfterHours}`
                : `main line: ${hospicePhone}`}
            </Text>
          ) : null}

          {/* Ragna refinement CTA */}
          <Pressable
            onPress={() => handleRefineWithRagna(selectedScript)}
            style={({ pressed }) => [styles.ragnaBtn, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.ragnaBtnLeft}>
              <View style={styles.ragnaDot} />
              <View>
                <Text style={styles.ragnaBtnTitle}>Refine with Ragna</Text>
                <Text style={styles.ragnaBtnSub}>
                  Get a conversational version adapted to your situation
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.accentGoals} />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function FilledScript({
  template,
  profile,
  latestSymptom,
}: {
  template: string;
  profile: PatientProfile | undefined;
  latestSymptom: SymptomEntry | null;
}) {
  const filled = interpolateScript(template, profile, latestSymptom);

  const parts = filled.split(/(\[[^\]]+\])/g);

  return (
    <Text style={styles.scriptBody}>
      {parts.map((part, i) => {
        const isBracket = /^\[[^\]]+\]$/.test(part);
        return (
          <Text
            key={i}
            style={isBracket ? styles.scriptFillIn : styles.scriptText}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function ScriptListRow({
  script,
  onPress,
}: {
  script: CallScript;
  onPress: () => void;
}) {
  const color = URGENCY_COLORS[script.urgency];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.listIcon, { backgroundColor: color + "20" }]}>
        <Feather name={script.icon as any} size={18} color={color} />
      </View>
      <View style={styles.listText}>
        <Text style={styles.listTitle}>{script.title}</Text>
        <Text style={styles.listSubtitle} numberOfLines={2}>
          {script.subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
    </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  introBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  introText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  introHighlight: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.amber,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  listSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.errorPale,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.error + "25",
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  guidanceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  guidanceLinkText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  detailSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  profileNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.amberPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.amber + "30",
  },
  profileNudgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
    lineHeight: 17,
  },
  scriptCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  scriptCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  scriptCardHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scriptBody: {
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  scriptText: {
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  scriptFillIn: {
    color: Colors.amber,
    fontFamily: "Inter_600SemiBold",
    backgroundColor: Colors.amberPale,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary + "40",
  },
  actionBtnCall: {
    backgroundColor: Colors.errorPale,
    borderColor: Colors.error + "40",
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  actionBtnCallText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.error,
  },
  phoneNote: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    marginBottom: 16,
  },
  ragnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.accentGoals + "14",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentGoals + "30",
    marginTop: 4,
  },
  ragnaBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ragnaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentGoals,
  },
  ragnaBtnTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.accentGoals,
    marginBottom: 2,
  },
  ragnaBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
