import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JourneyStageCard } from "@/components/JourneyStageCard";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { JourneyStage } from "@/types";

const stageDescriptions: Record<
  JourneyStage,
  { intro: string; topics: string[] }
> = {
  before: {
    intro:
      "Understanding hospice before enrollment helps families make informed, confident decisions. Explore eligibility guidance, common myths, and questions to ask.",
    topics: [
      "What is hospice care?",
      "Eligibility and prognosis criteria",
      "Common myths about hospice",
      "Questions to ask providers",
      "Planning and documentation",
      "Hospice vs. palliative care",
      "Decision support for families",
      "Physician referral readiness",
    ],
  },
  during: {
    intro:
      "Navigating active hospice care is both meaningful and demanding. Find guidance on what to expect, how to manage symptoms, and how to support your loved one.",
    topics: [
      "What to expect week by week",
      "Managing pain and symptoms",
      "Caregiver education and tips",
      "Understanding the care team",
      "Respite care options",
      "Signs of progression",
      "Emotional support resources",
      "When to call the hospice team",
    ],
  },
  after: {
    intro:
      "The journey doesn't end with death. Find support for grief, practical guidance on next steps, and resources to help you and your family find your way forward.",
    topics: [
      "Understanding grief after hospice",
      "Practical next steps after loss",
      "Bereavement support resources",
      "Supporting grieving children",
      "Estate and legal tasks",
      "When grief becomes complicated",
      "Honoring your loved one",
      "Finding your way forward",
    ],
  },
};

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateJourneyStage } = useApp();

  const handleStagePress = (stage: JourneyStage) => {
    router.push({ pathname: "/journey/[stage]", params: { stage } });
  };

  const handleSetStage = (stage: JourneyStage) => {
    updateJourneyStage(stage);
  };

  const activeStage = user?.journeyStage ?? "before";
  const activeDesc = stageDescriptions[activeStage];

  return (
    <View style={styles.container}>
    <CosmicBackground />
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Journey Navigator</Text>
      <Text style={styles.subtitle}>
        Hospice Roadmap supports you through every phase of the hospice
        experience.
      </Text>

      {/* Stage Selector */}
      <View style={styles.stageList}>
        {(["before", "during", "after"] as JourneyStage[]).map((stage) => (
          <JourneyStageCard
            key={stage}
            stage={stage}
            isActive={activeStage === stage}
            onPress={() => handleStagePress(stage)}
          />
        ))}
      </View>

      {/* Active Stage Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>
            Your Current Focus
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/more" as any)}
            style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </Pressable>
        </View>

        <Text style={styles.overviewBody}>{activeDesc.intro}</Text>

        <View style={styles.topicList}>
          {activeDesc.topics.map((topic, i) => (
            <Pressable
              key={i}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/help",
                  params: { initialMessage: `Tell me about: ${topic}` },
                } as any)
              }
              style={({ pressed }) => [styles.topicRow, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.topicDot} />
              <Text style={[styles.topicText, { flex: 1 }]}>{topic}</Text>
              <Feather name="chevron-right" size={13} color={Colors.textSubtle} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => handleStagePress(activeStage)}
          style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.exploreBtnText}>Explore {activeStage === "before" ? "Before Hospice" : activeStage === "during" ? "During Hospice" : "After Hospice"}</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Additional Options */}
      <View style={styles.actionsSection}>
        <Text style={styles.actionsSectionTitle}>Tools & Resources</Text>
        <View style={styles.actionsList}>
          {[
            // During/After users see a validating context page instead of the
            // eligibility assessment, which is only relevant before enrollment.
            ...(activeStage !== "before" ? [
              { label: "Understanding Your Hospice Journey", icon: "book-open", route: "/hospice-journey-context", desc: "How eligibility decisions are made" },
            ] : []),
            { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", desc: "Search in your area" },
            { label: "Contact Support", icon: "message-circle", route: "/support", desc: "Talk with our team" },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.actionIcon}>
                <Feather name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionDesc}>{item.desc}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
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
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 21,
    marginTop: -16,
  },
  stageList: {
    gap: 10,
  },
  overviewCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  overviewBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  topicList: {
    gap: 8,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  topicText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  exploreBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  actionsSection: {
    gap: 12,
  },
  actionsSectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  actionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  actionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
