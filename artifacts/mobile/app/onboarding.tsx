import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { JourneyStage, UserRole } from "@/types";

const primaryRoles: { id: UserRole; label: string; description: string; icon: string; detail: string }[] = [
  {
    id: "patient",
    label: "Patient",
    description: "I'm exploring or receiving hospice care for myself",
    icon: "user",
    detail: "Get personalized guidance, provider search, and resources tailored to your care journey.",
  },
  {
    id: "caregiver",
    label: "Caregiver",
    description: "I'm caring for someone in or approaching hospice",
    icon: "heart",
    detail: "Find support, connect with providers, and navigate every step alongside your loved one.",
  },
];

const stages: { id: JourneyStage; label: string; description: string; color: string; bg: string }[] = [
  { id: "before", label: "Before Hospice", description: "Researching, planning, or considering hospice", color: Colors.journeyBefore, bg: Colors.journeyBeforePale },
  { id: "during", label: "During Hospice", description: "Currently receiving hospice services", color: Colors.journeyDuring, bg: Colors.journeyDuringPale },
  { id: "after", label: "After Hospice", description: "Seeking support after a loved one's passing", color: Colors.journeyAfter, bg: Colors.journeyAfterPale },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(role);
  };

  const handleStageSelect = (stage: JourneyStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStage(stage);
  };

  const handleNext = () => {
    if (step === 0 && selectedRole) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(1);
    }
  };

  const handleGetStarted = () => {
    if (selectedRole && selectedStage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding(selectedRole, selectedStage);
      router.replace("/(tabs)");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <>
            <View style={styles.brandSection}>
              <View style={styles.logoMark}>
                <Feather name="map" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>Hospice Roadmap</Text>
              <Text style={styles.tagline}>
                Guidance before, during, and after hospice.
              </Text>
            </View>

            <View style={styles.introBox}>
              <Text style={styles.introText}>
                This app provides trusted educational resources and navigation
                tools for people at every stage of the hospice journey. Your
                information is private and never shared.
              </Text>
            </View>

            <Text style={styles.stepLabel}>Who are you?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us show the most relevant content for your needs.
            </Text>

            <View style={styles.primaryRoleList}>
              {primaryRoles.map((role) => {
                const selected = selectedRole === role.id;
                return (
                  <Pressable
                    key={role.id}
                    onPress={() => handleRoleSelect(role.id)}
                    style={({ pressed }) => [
                      styles.primaryRoleCard,
                      selected && styles.primaryRoleCardSelected,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <View style={styles.primaryRoleTop}>
                      <View
                        style={[
                          styles.primaryRoleIcon,
                          selected && styles.primaryRoleIconSelected,
                        ]}
                      >
                        <Feather
                          name={role.icon as any}
                          size={22}
                          color={selected ? "#FFFFFF" : Colors.primary}
                        />
                      </View>
                      {selected && (
                        <View style={styles.primaryRoleCheck}>
                          <Feather name="check-circle" size={18} color={Colors.primary} />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.primaryRoleLabel,
                        selected && styles.primaryRoleLabelSelected,
                      ]}
                    >
                      {role.label}
                    </Text>
                    <Text style={styles.primaryRoleDesc}>{role.description}</Text>
                    <Text style={styles.primaryRoleDetail}>{role.detail}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => handleRoleSelect("other")}
              style={({ pressed }) => [
                styles.otherBtn,
                selectedRole === "other" && styles.otherBtnSelected,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Feather
                name="more-horizontal"
                size={15}
                color={selectedRole === "other" ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.otherBtnText,
                  selectedRole === "other" && styles.otherBtnTextSelected,
                ]}
              >
                {selectedRole === "other"
                  ? "Other selected"
                  : "I'm a family member, clinician, or someone else"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.stepHeader}>
              <Pressable onPress={() => setStep(0)} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={Colors.text} />
              </Pressable>
              <Text style={styles.stepNum}>Step 2 of 2</Text>
            </View>

            <Text style={styles.stepLabel}>Where are you in the journey?</Text>
            <Text style={styles.stepSubtitle}>
              We'll personalize your home screen to match where you are right
              now.
            </Text>

            <View style={styles.stageList}>
              {stages.map((stage) => (
                <Pressable
                  key={stage.id}
                  onPress={() => handleStageSelect(stage.id)}
                  style={({ pressed }) => [
                    styles.stageCard,
                    {
                      backgroundColor: stage.bg,
                      borderColor:
                        selectedStage === stage.id
                          ? stage.color
                          : "transparent",
                      borderWidth: selectedStage === stage.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <View style={styles.stageContent}>
                    <View
                      style={[
                        styles.stageDot,
                        { backgroundColor: stage.color },
                      ]}
                    />
                    <View style={styles.stageText}>
                      <Text style={[styles.stageLabel, { color: stage.color }]}>
                        {stage.label}
                      </Text>
                      <Text style={styles.stageDesc}>{stage.description}</Text>
                    </View>
                  </View>
                  {selectedStage === stage.id && (
                    <Feather name="check" size={18} color={stage.color} />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.disclaimer}>
              <Feather name="shield" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>
                You can always change this in settings. Nothing you select here
                is permanent.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {step === 0 ? (
          <Button
            title="Continue"
            onPress={handleNext}
            disabled={!selectedRole}
            fullWidth
            size="lg"
          />
        ) : (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            disabled={!selectedStage}
            fullWidth
            size="lg"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 20,
  },
  brandSection: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  introBox: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C5DDD5",
  },
  introText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
    marginTop: -10,
  },
  primaryRoleList: {
    gap: 12,
  },
  primaryRoleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    gap: 6,
  },
  primaryRoleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  primaryRoleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  primaryRoleIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryRoleIconSelected: {
    backgroundColor: Colors.primary,
  },
  primaryRoleCheck: {
    opacity: 0.85,
  },
  primaryRoleLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  primaryRoleLabelSelected: {
    color: Colors.primaryDark,
  },
  primaryRoleDesc: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  primaryRoleDetail: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
  otherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  otherBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  otherBtnText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  otherBtnTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  stageList: {
    gap: 10,
  },
  stageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
  },
  stageContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stageText: {
    gap: 2,
    flex: 1,
  },
  stageLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  stageDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});
