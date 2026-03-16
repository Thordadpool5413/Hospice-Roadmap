import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JourneyStageCard } from "@/components/JourneyStageCard";
import { ResourceCard } from "@/components/ResourceCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { mockResources } from "@/data/mockResources";

const roleLabels: Record<string, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  other: "User",
};

const quickActions = [
  { label: "Evaluate Readiness", icon: "clipboard", route: "/evaluation", color: Colors.journeyBefore, bg: Colors.journeyBeforePale },
  { label: "Find Providers", icon: "map-pin", route: "/(tabs)/providers", color: Colors.journeyDuring, bg: Colors.journeyDuringPale },
  { label: "Get Support", icon: "message-circle", route: "/support", color: Colors.amber, bg: Colors.amberPale },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, toggleSavedResource, isSavedResource } = useApp();

  const featuredResources = mockResources.filter((r) => r.isFeatured).slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Feather name="map" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            {user?.role && (
              <Text style={styles.roleLabel}>
                {roleLabels[user.role] ?? ""}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/more")}
          style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="settings" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Hospice Roadmap</Text>
        <Text style={styles.heroTagline}>
          Guidance before, during, and after hospice.
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroDescription}>
          Trusted information and tools for every step of the hospice journey —
          for patients, families, and care teams.
        </Text>
      </View>

      {/* Quick Actions */}
      <View>
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: action.bg },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color }]}>
                <Feather name={action.icon as any} size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Journey Stages */}
      <View>
        <SectionHeader
          title="Journey Navigator"
          subtitle="Where are you in the hospice journey?"
          onSeeAll={() => router.push("/(tabs)/journey")}
        />
        <View style={styles.journeyList}>
          {(["before", "during", "after"] as const).map((stage) => (
            <JourneyStageCard
              key={stage}
              stage={stage}
              isActive={user?.journeyStage === stage}
              onPress={() => router.push({ pathname: "/journey/[stage]", params: { stage } })}
            />
          ))}
        </View>
      </View>

      {/* Featured Resources */}
      <View>
        <SectionHeader
          title="Featured Resources"
          onSeeAll={() => router.push("/(tabs)/resources")}
        />
        <View style={styles.resourceList}>
          {featuredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onPress={() =>
                router.push({
                  pathname: "/resource/[id]",
                  params: { id: resource.id },
                })
              }
              onSave={() => toggleSavedResource(resource.id)}
              isSaved={isSavedResource(resource.id)}
            />
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Feather name="info" size={13} color={Colors.textSubtle} />
        <Text style={styles.disclaimerText}>
          Content on Hospice Roadmap is for educational purposes only and does
          not constitute medical advice. Consult a qualified healthcare provider
          for clinical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  roleLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.1,
  },
  journeyList: {
    gap: 10,
  },
  resourceList: {
    gap: 12,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
