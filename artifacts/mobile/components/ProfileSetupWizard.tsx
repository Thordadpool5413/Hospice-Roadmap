import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MedicationPicker } from "@/components/MedicationPicker";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { MedicationEntry } from "@/types";

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4;

const STEPS: Array<{
  id: StepId;
  icon: string;
  label: string;
  placeholder: string;
  why: string;
  inputType: "text" | "phone" | "medications";
}> = [
  {
    id: 1,
    icon: "user",
    label: "Patient's first name",
    placeholder: "e.g. Margaret",
    why: "This helps Ragna address your patient by name and give personalized guidance.",
    inputType: "text",
  },
  {
    id: 2,
    icon: "activity",
    label: "Primary diagnosis",
    placeholder: "e.g. end-stage COPD, CHF, dementia",
    why: "Ragna tailors symptom guidance and comfort measures to the specific disease.",
    inputType: "text",
  },
  {
    id: 3,
    icon: "package",
    label: "Comfort kit medications",
    placeholder: "",
    why: "Ragna can give precise guidance on when and how to use each medication in the home.",
    inputType: "medications",
  },
  {
    id: 4,
    icon: "phone",
    label: "Hospice phone number",
    placeholder: "e.g. (555) 123-4567",
    why: "Appears on the Emergency Card so the right number is always one tap away.",
    inputType: "phone",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileSetupWizardProps {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileSetupWizard({ visible, onComplete, onDismiss }: ProfileSetupWizardProps) {
  const insets = useSafeAreaInsets();
  const { user, updatePatientProfile } = useApp();
  const { addObservation } = useRagnaLearning();

  const [step, setStep] = useState<StepId>(1);
  const [localName, setLocalName] = useState("");
  const [localDiagnosis, setLocalDiagnosis] = useState("");
  const [localMedications, setLocalMedications] = useState<MedicationEntry[]>([]);
  const [localPhone, setLocalPhone] = useState("");

  // Seed from existing profile on open
  useEffect(() => {
    if (!visible) return;
    const p = user?.patientProfile;
    setLocalName(p?.patientName ?? "");
    setLocalDiagnosis(p?.diagnosis ?? "");
    setLocalMedications(p?.medications ?? []);
    setLocalPhone(p?.hospicePhone ?? "");
    setStep(1);
  }, [visible]);

  const currentStepDef = STEPS[step - 1];

  const saveCurrentFields = useCallback(() => {
    const existing = user?.patientProfile ?? {};
    const comfortKitMedications =
      localMedications.length > 0
        ? localMedications.map((m) => (m.doseNote ? `${m.name} ${m.doseNote}` : m.name)).join(", ")
        : existing.comfortKitMedications;
    updatePatientProfile({
      ...existing,
      ...(localName.trim() ? { patientName: localName.trim() } : {}),
      ...(localDiagnosis.trim() ? { diagnosis: localDiagnosis.trim() } : {}),
      ...(localMedications.length > 0 ? { medications: localMedications, comfortKitMedications } : {}),
      ...(localPhone.trim() ? { hospicePhone: localPhone.trim() } : {}),
    });
  }, [user, localName, localDiagnosis, localMedications, localPhone, updatePatientProfile]);

  // Not memoized — all handlers depend on local field state that changes
  // on every keystroke. Memoizing with a subset of deps creates stale closures.

  const handleAdvance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 4) {
      setStep((s) => (s + 1) as StepId);
    } else {
      handleFinishStep();
    }
  };

  const handleSkipStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 4) {
      setStep((s) => (s + 1) as StepId);
    } else {
      // Last step skipped — save partial data and enter dismiss/re-prompt track.
      saveCurrentFields();
      onDismiss();
    }
  };

  // Called when the user taps the primary CTA on the last step.
  // Only marks the wizard permanently complete if all 4 foundational fields
  // are filled; otherwise saves partial data and enters the dismiss track so
  // the re-prompt logic can fire after 7 days.
  const handleFinishStep = () => {
    saveCurrentFields();

    const nameFilled   = localName.trim().length > 0;
    const diagFilled   = localDiagnosis.trim().length > 0;
    const medsFilled   = localMedications.length > 0;
    const phoneFilled  = localPhone.trim().length > 0;
    const allFilled    = nameFilled && diagFilled && medsFilled && phoneFilled;

    if (allFilled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const name = localName.trim();
      const diag = localDiagnosis.trim();

      addObservation(
        "profile_updated",
        "Patient profile set up via setup wizard",
        { detail: [name && `patient: ${name}`, diag && `diagnosis: ${diag}`].filter(Boolean).join(", ") || undefined, significant: true }
      ).catch(() => {});

      onComplete();

      // Navigate to Ragna with a personalized opening message
      let msg = "Hi Ragna! I just finished setting up the care profile. What can you help me with?";
      if (name && diag) {
        msg = `Hi Ragna! I've set up ${name}'s care profile — they have ${diag}. What should I know right now?`;
      } else if (name) {
        msg = `Hi Ragna! I've just set up ${name}'s care profile. What can you help me with?`;
      } else if (diag) {
        msg = `Hi Ragna! I've set up a care profile for a patient with ${diag}. What's most important for me to know?`;
      }
      setTimeout(() => {
        router.push({ pathname: "/(tabs)/help", params: { initialMessage: msg } } as any);
      }, 300);
    } else {
      // Some fields still blank — treat as "finish later" so the wizard
      // re-prompts after 7 days (or stops after a second dismissal).
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss();
    }
  };

  const handleFinishLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveCurrentFields();
    onDismiss();
  };

  const currentValue =
    step === 1 ? localName :
    step === 2 ? localDiagnosis :
    step === 3 ? (localMedications.length > 0 ? "filled" : "") :
    localPhone;

  const isLastStep = step === 4;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleFinishLater}
    >
      <View style={[wz.root, { backgroundColor: "#030A18" }]}>
        <LinearGradient
          colors={["rgba(14, 28, 80, 0.90)", "rgba(6, 12, 40, 0.95)"]}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              wz.content,
              { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={wz.header}>
              <View style={wz.headerLeft}>
                <Text style={wz.superTitle}>Care profile setup</Text>
                <Text style={wz.stepCount}>Step {step} of {STEPS.length}</Text>
              </View>
              <Pressable
                onPress={handleFinishLater}
                hitSlop={8}
                style={({ pressed }) => [wz.closeBtn, pressed && { opacity: 0.55 }]}
              >
                <Feather name="x" size={18} color="#4A6090" />
              </Pressable>
            </View>

            {/* ── Progress bar ── */}
            <View style={wz.progressRow}>
              {STEPS.map((s) => (
                <View
                  key={s.id}
                  style={[
                    wz.progressSeg,
                    s.id <= step
                      ? { backgroundColor: Colors.primary }
                      : { backgroundColor: "rgba(80, 120, 200, 0.20)" },
                  ]}
                />
              ))}
            </View>

            {/* ── Step card ── */}
            <View style={wz.card}>
              <LinearGradient
                colors={["rgba(18, 32, 85, 0.80)", "rgba(12, 22, 65, 0.85)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={wz.cardIconWrap}>
                <Feather name={currentStepDef.icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={wz.cardLabel}>{currentStepDef.label}</Text>
              <View style={wz.whyRow}>
                <Feather name="info" size={12} color="#4A6090" style={{ marginTop: 1, flexShrink: 0 }} />
                <Text style={wz.whyText}>{currentStepDef.why}</Text>
              </View>

              {/* ── Input area ── */}
              {currentStepDef.inputType === "medications" ? (
                <View style={wz.medWrap}>
                  <MedicationPicker medications={localMedications} onChange={setLocalMedications} />
                </View>
              ) : (
                <TextInput
                  style={wz.input}
                  value={currentStepDef.inputType === "phone" ? localPhone : step === 1 ? localName : localDiagnosis}
                  onChangeText={
                    currentStepDef.inputType === "phone"
                      ? setLocalPhone
                      : step === 1
                      ? setLocalName
                      : setLocalDiagnosis
                  }
                  placeholder={currentStepDef.placeholder}
                  placeholderTextColor="rgba(140, 160, 200, 0.45)"
                  keyboardType={currentStepDef.inputType === "phone" ? "phone-pad" : "default"}
                  returnKeyType="done"
                  autoFocus={currentStepDef.inputType !== "phone"}
                  autoCapitalize={step === 2 ? "none" : "words"}
                  onSubmitEditing={currentValue.trim() ? handleAdvance : undefined}
                />
              )}
            </View>

            {/* ── Action buttons ── */}
            <View style={wz.actions}>
              <Pressable
                onPress={handleAdvance}
                style={({ pressed }) => [
                  wz.nextBtn,
                  !currentValue.trim() && { opacity: 0.45 },
                  pressed && { opacity: 0.80, transform: [{ scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={["rgba(40, 80, 180, 0.90)", "rgba(30, 60, 150, 0.95)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={wz.nextBtnText}>
                  {isLastStep ? "Finish setup" : "Save & continue"}
                </Text>
                <Feather name={isLastStep ? "check" : "arrow-right"} size={16} color="#EEF4FF" />
              </Pressable>

              <Pressable
                onPress={handleSkipStep}
                style={({ pressed }) => [wz.skipBtn, pressed && { opacity: 0.55 }]}
              >
                <Text style={wz.skipBtnText}>
                  {isLastStep ? "Skip & finish later" : "Skip this step"}
                </Text>
              </Pressable>
            </View>

            {/* ── Finish later ── */}
            <Pressable
              onPress={handleFinishLater}
              style={({ pressed }) => [wz.finishLaterBtn, pressed && { opacity: 0.55 }]}
            >
              <Text style={wz.finishLaterText}>Finish later</Text>
              <Text style={wz.finishLaterHint}>
                {" · "}Any info entered will be saved
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wz = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    gap: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 3 },
  superTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#4A6090",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stepCount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.15)",
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },

  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 210, 0.22)",
    padding: 20,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#1040A0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
  cardIconWrap: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: Colors.primary + "20",
    alignItems: "center", justifyContent: "center",
    alignSelf: "flex-start",
  },
  cardLabel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  whyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    lineHeight: 19,
  },

  input: {
    backgroundColor: "rgba(8, 16, 48, 0.90)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(60, 90, 180, 0.30)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: "#EEF4FF",
    minHeight: 52,
  },
  medWrap: {
    marginTop: 4,
  },

  actions: {
    gap: 10,
  },
  nextBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 255, 0.30)",
    shadowColor: "#2060C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.2,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
  },

  finishLaterBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  finishLaterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#4A7090",
    textDecorationLine: "underline",
  },
  finishLaterHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#344060",
  },
});
