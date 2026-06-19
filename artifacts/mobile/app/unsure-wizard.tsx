import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { callHospice } from "@/utils/hospiceCall";

type WizardStep = "assess" | "comfort" | "call";

interface AssessOption {
  id: string;
  label: string;
  icon: string;
  guidanceId: string;
  comfort: string[];
}

const ASSESS_OPTIONS: AssessOption[] = [
  {
    id: "breathing",
    label: "Breathing looks or sounds different",
    icon: "wind",
    guidanceId: "breathing-changes",
    comfort: [
      "Reposition onto their side or elevate the head slightly.",
      "Keep the room calm — soft light, quiet voices.",
      "Moisten lips with a damp swab if mouth is dry.",
    ],
  },
  {
    id: "pain",
    label: "They seem uncomfortable or in pain",
    icon: "zap",
    guidanceId: "pain-worsening",
    comfort: [
      "Note when pain started and last medication time.",
      "Try gentle repositioning and a calm environment.",
      "Do not give comfort kit meds without hospice guidance unless already instructed.",
    ],
  },
  {
    id: "responsive",
    label: "Harder to wake / more sleepy",
    icon: "moon",
    guidanceId: "approaching-death",
    comfort: [
      "Sleeping more is common — speak softly when you need their attention.",
      "Continue mouth care and gentle touch.",
      "Let hospice know what you're seeing.",
    ],
  },
  {
    id: "agitated",
    label: "Restless, agitated, or calling out",
    icon: "alert-triangle",
    guidanceId: "agitation-restlessness",
    comfort: [
      "Reduce noise and bright lights.",
      "Speak in a calm, reassuring voice.",
      "Keep the area safe — do not restrain.",
    ],
  },
  {
    id: "unknown",
    label: "Something feels wrong but I can't name it",
    icon: "help-circle",
    guidanceId: "not-sure-whats-happening",
    comfort: [
      "Trust your instinct — families often notice before symptoms are obvious.",
      "Check breathing, color, and whether they respond to your voice.",
      "Stay present; you do not need the perfect words to call hospice.",
    ],
  },
];

export default function UnsureWizardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [step, setStep] = useState<WizardStep>("assess");
  const [selected, setSelected] = useState<AssessOption | null>(null);

  const goComfort = (opt: AssessOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(opt);
    setStep("comfort");
  };

  const handleCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ok = callHospice(user?.patientProfile);
    if (!ok) {
      Alert.alert(
        "Add hospice phone",
        "Set your hospice number in Patient Profile for one-tap calling.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Set up", onPress: () => router.push("/patient-profile") },
        ],
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === "assess") router.back();
            else if (step === "comfort") setStep("assess");
            else setStep("comfort");
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Not sure what's happening</Text>
          <Text style={styles.headerSub}>
            {step === "assess" && "Step 1: Quick assess"}
            {step === "comfort" && "Step 2: Comfort measures"}
            {step === "call" && "Step 3: Call hospice"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progress}>
        {(["assess", "comfort", "call"] as WizardStep[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              (step === s || (step === "comfort" && s === "assess") || step === "call") &&
                styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === "assess" && (
          <>
            <Text style={styles.lead}>
              Pick the closest match. You can always call hospice even if none fit perfectly.
            </Text>
            {ASSESS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => goComfort(opt)}
                style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.82 }]}
              >
                <Feather name={opt.icon as any} size={20} color={Colors.primary} />
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
              </Pressable>
            ))}
          </>
        )}

        {step === "comfort" && selected && (
          <>
            <Text style={styles.lead}>While you decide whether to call, try these comfort steps:</Text>
            {selected.comfort.map((line, i) => (
              <View key={line} style={styles.comfortRow}>
                <View style={styles.comfortNum}>
                  <Text style={styles.comfortNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.comfortText}>{line}</Text>
              </View>
            ))}

            <Pressable
              onPress={() =>
                router.push({ pathname: "/guidance/[id]", params: { id: selected.guidanceId } } as any)
              }
              style={({ pressed }) => [styles.guidanceLink, pressed && { opacity: 0.85 }]}
            >
              <Feather name="book-open" size={16} color={Colors.primary} />
              <Text style={styles.guidanceLinkText}>Read full guidance</Text>
            </Pressable>

            <Pressable
              onPress={() => setStep("call")}
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.nextBtnText}>Ready — call or Ask Ragna</Text>
            </Pressable>
          </>
        )}

        {step === "call" && selected && (
          <>
            <Text style={styles.lead}>
              When in doubt, call hospice. Say: "Something feels different and I'm not sure what's happening."
            </Text>

            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.88 }]}
            >
              <Feather name="phone-call" size={22} color="#fff" />
              <Text style={styles.callBtnText}>Call hospice now</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/help",
                  params: {
                    initialMessage:
                      "I'm not sure what's happening with my loved one right now. Something feels different. Can you help me assess and know whether I should call the hospice nurse?",
                    offlineScenarioId: selected.guidanceId,
                  },
                } as any)
              }
              style={({ pressed }) => [styles.ragnaBtn, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.ragnaBtnTitle}>Ask Ragna to help assess</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/emergency-card" as any)}
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
            >
              <Feather name="credit-card" size={16} color={Colors.error} />
              <Text style={styles.linkText}>Open emergency card</Text>
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  content: { padding: 16, gap: 12 },
  lead: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  optionLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  comfortRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  comfortNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  comfortNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  comfortText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  guidanceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  guidanceLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.error,
    borderRadius: 16,
    padding: 18,
  },
  callBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  ragnaBtn: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    alignItems: "center",
  },
  ragnaBtnTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  linkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.error },
});