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
import { HospiceTeamMatrix } from "@/components/crisis/HospiceTeamMatrix";
import { Colors } from "@/constants/colors";
import { CRISIS_SHORTCUTS, CrisisShortcut, getCrisisShortcut } from "@/constants/crisisFlow";
import { useApp } from "@/context/AppContext";
import { callHospice } from "@/utils/hospiceCall";

type Step = "pick" | "guidance" | "action";

export default function NeedHelpNowScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const params = useLocalSearchParams<{ situation?: string }>();
  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<CrisisShortcut | null>(null);

  useEffect(() => {
    if (params.situation) {
      const match = getCrisisShortcut(params.situation);
      if (match) {
        setSelected(match);
        setStep("guidance");
      }
    }
  }, [params.situation]);

  const handlePick = (shortcut: CrisisShortcut) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(shortcut);
    setStep("guidance");
  };

  const handleCallHospice = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ok = callHospice(user?.patientProfile);
    if (!ok) {
      Alert.alert(
        "Add hospice phone",
        "Set your hospice number in Patient Profile so one-tap calling works.",
        [
          { text: "Later", style: "cancel" },
          { text: "Set up", onPress: () => router.push("/patient-profile") },
        ],
      );
    }
  };

  const handleAskRagna = () => {
    if (!selected) return;
    router.push({
      pathname: "/(tabs)/help",
      params: { initialMessage: selected.ragnaPrompt, offlineScenarioId: selected.guidanceId },
    } as any);
  };

  const handleOpenGuidance = () => {
    if (!selected) return;
    router.push({ pathname: "/guidance/[id]", params: { id: selected.guidanceId } } as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === "pick") router.back();
            else if (step === "guidance") setStep("pick");
            else setStep("guidance");
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>I need help now</Text>
          <Text style={styles.headerSub}>
            {step === "pick" && "Tap 1: What's happening?"}
            {step === "guidance" && "Tap 2: Read quick guidance"}
            {step === "action" && "Tap 3: Call or Ask Ragna"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/emergency-card" as any)}
          style={({ pressed }) => [styles.emergencyBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="credit-card" size={16} color={Colors.error} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === "pick" && (
          <>
            <Pressable
              onPress={() => router.push("/unsure-wizard" as any)}
              style={({ pressed }) => [styles.unsureCard, pressed && { opacity: 0.85 }]}
            >
              <Feather name="help-circle" size={22} color={Colors.primary} />
              <View style={styles.unsureText}>
                <Text style={styles.unsureTitle}>I'm not sure what's happening</Text>
                <Text style={styles.unsureSub}>Short wizard: assess → comfort → call</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.primary} />
            </Pressable>

            <Text style={styles.sectionLabel}>What do you need help with?</Text>
            {CRISIS_SHORTCUTS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handlePick(item)}
                style={({ pressed }) => [styles.situationRow, pressed && { opacity: 0.82 }]}
              >
                <View style={[styles.situationIcon, { backgroundColor: item.color + "22" }]}>
                  <Feather name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.situationText}>
                  <Text style={styles.situationTitle}>{item.label}</Text>
                  <Text style={styles.situationSub}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
              </Pressable>
            ))}

            <HospiceTeamMatrix compact />
          </>
        )}

        {step === "guidance" && selected && (
          <>
            <View style={[styles.guidanceHero, { borderColor: selected.color + "40" }]}>
              <View style={[styles.guidanceIcon, { backgroundColor: selected.color + "22" }]}>
                <Feather name={selected.icon as any} size={24} color={selected.color} />
              </View>
              <Text style={styles.guidanceTitle}>{selected.label}</Text>
              <Text style={styles.guidanceSub}>{selected.subtitle}</Text>
            </View>

            <Text style={styles.instruction}>
              Open the step-by-step guide for what to do right now. When you're ready, choose call hospice or Ask Ragna.
            </Text>

            <Pressable
              onPress={handleOpenGuidance}
              style={({ pressed }) => [styles.primaryCta, pressed && { opacity: 0.88 }]}
            >
              <Feather name="book-open" size={20} color="#fff" />
              <Text style={styles.primaryCtaText}>Open guidance</Text>
              <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.8)" />
            </Pressable>

            <Pressable
              onPress={() => setStep("action")}
              style={({ pressed }) => [styles.secondaryCta, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.secondaryCtaText}>I've read it — next step</Text>
              <Feather name="chevron-right" size={16} color={Colors.primary} />
            </Pressable>
          </>
        )}

        {step === "action" && selected && (
          <>
            <Text style={styles.actionIntro}>
              You're handling "{selected.label}". Hospice is available 24/7 — there is no wrong time to call.
            </Text>

            <Pressable
              onPress={handleCallHospice}
              style={({ pressed }) => [styles.callCta, pressed && { opacity: 0.88 }]}
            >
              <Feather name="phone-call" size={22} color="#fff" />
              <View style={styles.callText}>
                <Text style={styles.callTitle}>Call hospice</Text>
                <Text style={styles.callSub}>One tap — uses your saved number</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleAskRagna}
              style={({ pressed }) => [styles.ragnaCta, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.ragnaTitle}>Ask Ragna about this</Text>
              <Text style={styles.ragnaSub}>Scenario pre-loaded with your situation</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/call-scripts" as any)}
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
            >
              <Feather name="file-text" size={16} color={Colors.error} />
              <Text style={styles.linkText}>Know what to say — call scripts</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  emergencyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.errorPale,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  content: { padding: 16, gap: 12 },
  unsureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginBottom: 4,
  },
  unsureText: { flex: 1, gap: 2 },
  unsureTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  unsureSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  situationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  situationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  situationText: { flex: 1, gap: 2 },
  situationTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  situationSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  guidanceHero: {
    alignItems: "center",
    gap: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  guidanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  guidanceTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, textAlign: "center" },
  guidanceSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },
  instruction: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  primaryCtaText: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  secondaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  secondaryCtaText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  actionIntro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  callCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.error,
    borderRadius: 16,
    padding: 18,
  },
  callText: { flex: 1, gap: 2 },
  callTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  callSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  ragnaCta: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    gap: 4,
  },
  ragnaTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  ragnaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  linkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.error },
});