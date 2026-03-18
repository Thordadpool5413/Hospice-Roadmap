import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
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

const TOTAL_STEPS = 4;

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

const APP_FEATURES = [
  { icon: "map", color: Colors.journeyBefore, label: "Journey Guide", desc: "Step-by-step roadmap for every stage" },
  { icon: "compass", color: Colors.primary, label: "Ragna AI", desc: "24/7 answers to your questions" },
  { icon: "book-open", color: "#7A8A6A", label: "60+ Scenarios", desc: "Practical guidance for real situations" },
  { icon: "map-pin", color: Colors.journeyAfter, label: "Provider Search", desc: "Find hospice providers near you" },
];

const TAB_TOUR = [
  {
    icon: "home",
    label: "Home",
    color: Colors.journeyBefore,
    bg: Colors.journeyBeforePale,
    desc: "Your personalized dashboard. Quick access to the most relevant guidance for where you are right now.",
  },
  {
    icon: "map",
    label: "Guide",
    color: Colors.journeyDuring,
    bg: Colors.journeyDuringPale,
    desc: "Navigate hospice step by step — before, during, and after care. Articles, resources, and education.",
  },
  {
    icon: "compass",
    label: "Ragna",
    color: Colors.primary,
    bg: Colors.primaryPale,
    desc: "Your AI companion. Ask Ragna anything about symptoms, medications, caregiving tasks, or what to expect.",
  },
  {
    icon: "map-pin",
    label: "Providers",
    color: Colors.journeyAfter,
    bg: Colors.journeyAfterPale,
    desc: "Search hospice providers by state or ZIP code. View quality ratings, reviews, and contact info.",
  },
  {
    icon: "more-horizontal",
    label: "More",
    color: "#7A8A6A",
    bg: "#F0F4EB",
    desc: "Emergency card, journal, reminders, situation finder, accessibility settings, and your profile.",
  },
];

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateStep = (next: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setTimeout(next, 120);
  };

  const goTo = (s: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStep(() => setStep(s));
  };

  const handleGetStarted = () => {
    if (selectedRole && selectedStage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding(selectedRole, selectedStage);
      router.replace("/(tabs)");
    }
  };

  const canContinue =
    step === 0 ? true :
    step === 1 ? !!selectedRole :
    step === 2 ? !!selectedStage :
    true;

  const handleNext = () => {
    if (!canContinue) return;
    if (step === TOTAL_STEPS - 1) {
      handleGetStarted();
    } else {
      goTo(step + 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      {/* Header with progress */}
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={() => goTo(step - 1)} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <ProgressDots step={step} />
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.animBody, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <RoleStep
              selectedRole={selectedRole}
              onSelect={(r) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRole(r);
              }}
            />
          )}
          {step === 2 && (
            <StageStep
              selectedStage={selectedStage}
              onSelect={(s) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedStage(s);
              }}
            />
          )}
          {step === 3 && <TourStep />}
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title={step === TOTAL_STEPS - 1 ? "Let's Get Started" : "Continue"}
          onPress={handleNext}
          disabled={!canContinue}
          fullWidth
          size="lg"
        />
        {step === 0 && (
          <Text style={styles.footerNote}>
            Your information is private and never shared.
          </Text>
        )}
      </View>
    </View>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.welcomeContainer}>
      <View style={[styles.logoMark, { overflow: "hidden", backgroundColor: "transparent", shadowColor: "#C8541A" }]}>
        <Image
          source={require("@/assets/images/app-icon.png")}
          style={{ width: 76, height: 76, borderRadius: 22 }}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.appName}>Hospice Roadmap</Text>
      <Text style={styles.tagline}>
        Guidance before, during, and{"\n"}after hospice.
      </Text>

      <View style={styles.featureGrid}>
        {APP_FEATURES.map((f) => (
          <View key={f.label} style={styles.featureCard}>
            {f.label === "Ragna AI" ? (
              <View style={[styles.featureIcon, { overflow: "hidden", backgroundColor: "transparent" }]}>
                <Image
                  source={require("@/assets/images/ragna-icon.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="cover"
                />
              </View>
            ) : f.label === "Journey Guide" ? (
              <View style={[styles.featureIcon, { overflow: "hidden", backgroundColor: "transparent" }]}>
                <Image
                  source={require("@/assets/images/app-icon.png")}
                  style={{ width: 40, height: 40, borderRadius: 11 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                <Feather name={f.icon as any} size={20} color={f.color} />
              </View>
            )}
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.trustRow}>
        <Feather name="shield" size={13} color={Colors.primary} />
        <Text style={styles.trustText}>Trusted guidance · No account required</Text>
      </View>
    </View>
  );
}

function RoleStep({
  selectedRole,
  onSelect,
}: {
  selectedRole: UserRole | null;
  onSelect: (r: UserRole) => void;
}) {
  return (
    <View style={styles.stepContainer}>
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
              onPress={() => onSelect(role.id)}
              style={({ pressed }) => [
                styles.primaryRoleCard,
                selected && styles.primaryRoleCardSelected,
                pressed && { opacity: 0.88 },
              ]}
            >
              <View style={styles.primaryRoleTop}>
                <View style={[styles.primaryRoleIcon, selected && styles.primaryRoleIconSelected]}>
                  <Feather name={role.icon as any} size={22} color={selected ? "#FFFFFF" : Colors.primary} />
                </View>
                {selected && (
                  <View style={styles.primaryRoleCheck}>
                    <Feather name="check-circle" size={18} color={Colors.primary} />
                  </View>
                )}
              </View>
              <Text style={[styles.primaryRoleLabel, selected && styles.primaryRoleLabelSelected]}>
                {role.label}
              </Text>
              <Text style={styles.primaryRoleDesc}>{role.description}</Text>
              <Text style={styles.primaryRoleDetail}>{role.detail}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onSelect("other")}
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
        <Text style={[styles.otherBtnText, selectedRole === "other" && styles.otherBtnTextSelected]}>
          {selectedRole === "other"
            ? "Other selected"
            : "I'm a family member, clinician, or someone else"}
        </Text>
      </Pressable>
    </View>
  );
}

function StageStep({
  selectedStage,
  onSelect,
}: {
  selectedStage: JourneyStage | null;
  onSelect: (s: JourneyStage) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepLabel}>Where are you in the journey?</Text>
      <Text style={styles.stepSubtitle}>
        We'll personalize your home screen to match where you are right now.
      </Text>

      <View style={styles.stageList}>
        {stages.map((stage) => (
          <Pressable
            key={stage.id}
            onPress={() => onSelect(stage.id)}
            style={({ pressed }) => [
              styles.stageCard,
              {
                backgroundColor: stage.bg,
                borderColor: selectedStage === stage.id ? stage.color : "transparent",
                borderWidth: selectedStage === stage.id ? 2 : 1,
              },
              pressed && { opacity: 0.88 },
            ]}
          >
            <View style={styles.stageContent}>
              <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
              <View style={styles.stageText}>
                <Text style={[styles.stageLabel, { color: stage.color }]}>{stage.label}</Text>
                <Text style={styles.stageDesc}>{stage.description}</Text>
              </View>
            </View>
            {selectedStage === stage.id && <Feather name="check" size={18} color={stage.color} />}
          </Pressable>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Feather name="shield" size={14} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          You can always change this in settings. Nothing you select here is permanent.
        </Text>
      </View>
    </View>
  );
}

function TourStep() {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepLabel}>Here's what's inside</Text>
      <Text style={styles.stepSubtitle}>
        Five tools to guide you through every part of the journey.
      </Text>

      <View style={styles.tourList}>
        {TAB_TOUR.map((tab) => (
          <View key={tab.label} style={[styles.tourCard, { borderLeftColor: tab.color }]}>
            {tab.label === "Ragna" ? (
              <View style={[styles.tourIcon, { overflow: "hidden", backgroundColor: "transparent" }]}>
                <Image
                  source={require("@/assets/images/ragna-icon.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.tourIcon, { backgroundColor: tab.bg }]}>
                <Feather name={tab.icon as any} size={20} color={tab.color} />
              </View>
            )}
            <View style={styles.tourText}>
              <Text style={[styles.tourLabel, { color: tab.color }]}>{tab.label}</Text>
              <Text style={styles.tourDesc}>{tab.desc}</Text>
            </View>
          </View>
        ))}
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  dotDone: {
    backgroundColor: Colors.primaryLight,
  },
  animBody: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 24,
  },
  // Welcome step
  welcomeContainer: {
    alignItems: "center",
    paddingTop: 20,
    gap: 20,
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#C8541A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 7,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginTop: -8,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  featureCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 16,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  trustText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  // Shared step layout
  stepContainer: {
    gap: 18,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 21,
    marginTop: -10,
  },
  // Role step
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
  // Stage step
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
  // Tour step
  tourList: {
    gap: 10,
  },
  tourCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderLeftWidth: 4,
  },
  tourIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tourText: {
    flex: 1,
    gap: 3,
  },
  tourLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  tourDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
    gap: 10,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "center",
  },
});
