import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface VisibleTile {
  label: string;
  icon: string;
  color: string;
  activePrompt: string;
}

interface GuidancePrompt {
  label: string;
  activePrompt: string;
}

interface RagnaEmptyStateProps {
  memoryCount: number;
  isPatient: boolean;
  proactiveOpener: { display: string; sendPrompt: string } | null;
  symptomAlert: { text: string; prompt: string } | null;
  visibleTiles: VisibleTile[];
  guidancePrompts: GuidancePrompt[];
  livingProfile: string | null;
  knowsExpanded: boolean;
  personalizationEnabled: boolean;
  onToggleKnowsExpanded: () => void;
  onTilePress: (tile: VisibleTile) => void;
  onGuidancePromptPress: (prompt: string) => void;
  onPressProactiveOpener: (sendPrompt: string) => void;
  onPressSymptomAlert: (prompt: string) => void;
}

export function RagnaEmptyState({
  memoryCount,
  isPatient,
  proactiveOpener,
  symptomAlert,
  visibleTiles,
  guidancePrompts,
  livingProfile,
  knowsExpanded,
  personalizationEnabled,
  onToggleKnowsExpanded,
  onTilePress,
  onGuidancePromptPress,
  onPressProactiveOpener,
  onPressSymptomAlert,
}: RagnaEmptyStateProps) {
  const primaryTiles = visibleTiles.slice(0, 4);
  const moreTileCount = Math.max(0, visibleTiles.length - primaryTiles.length);

  return (
    <>
      <View style={styles.welcomeSection}>
        <View style={styles.compassLarge}>
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 80, height: 80 }}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.welcomeTitle}>
          {memoryCount > 0 ? "Welcome back." : "Hi, I'm Ragna."}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {memoryCount > 0
            ? "I remember our previous conversations. Start with what feels urgent, then we can slow it down together."
            : isPatient
            ? "Ask me anything about your symptoms, medications, comfort, or what to expect."
            : "Ask me about symptoms, medications, caregiving tasks, equipment, or what to expect."}
        </Text>
      </View>

      {proactiveOpener && (
        <Pressable
          onPress={() => onPressProactiveOpener(proactiveOpener.sendPrompt)}
          style={({ pressed }) => [
            styles.veraOpenerCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.veraOpenerAvatar}>
            <Image
              source={require("@/assets/images/ragna-icon.png")}
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
          </View>
          <View style={styles.veraOpenerContent}>
            <Text style={styles.veraOpenerName}>Ragna</Text>
            <Text style={styles.veraOpenerText}>{proactiveOpener.display}</Text>
          </View>
          <Feather name="arrow-right" size={16} color={Colors.primary} />
        </Pressable>
      )}

      {symptomAlert && (
        <Pressable
          onPress={() => onPressSymptomAlert(symptomAlert.prompt)}
          style={({ pressed }) => [
            styles.symptomAlertCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.symptomAlertIcon}>
            <Feather name="bar-chart-2" size={15} color={Colors.accentLight} />
          </View>
          <Text style={styles.symptomAlertText}>{symptomAlert.text}</Text>
          <Feather name="chevron-right" size={14} color={Colors.accentLight} />
        </Pressable>
      )}

      <Text style={styles.tilesLabel}>Start here</Text>
      <View style={styles.tilesGrid}>
        {primaryTiles.map((tile) => (
          <Pressable
            key={tile.label}
            onPress={() => onTilePress(tile)}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: Colors.surfaceMid, borderColor: tile.color + "28" },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIcon, { backgroundColor: tile.color + "20" }]}>
              <Feather name={tile.icon as any} size={18} color={tile.color} />
            </View>
            <Text style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</Text>
          </Pressable>
        ))}
      </View>

      {moreTileCount > 0 && (
        <Pressable
          onPress={() => router.push("/(tabs)/more" as any)}
          style={({ pressed }) => [
            styles.moreTopicsCard,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="grid" size={14} color={Colors.primaryLight} />
          <Text style={styles.moreTopicsText}>
            Browse {moreTileCount} more situation{moreTileCount === 1 ? "" : "s"} in More
          </Text>
          <Feather name="chevron-right" size={14} color={Colors.primaryLight} />
        </Pressable>
      )}

      {guidancePrompts.length > 0 && (
        <View style={styles.guidanceSection}>
          <Text style={styles.guidanceLabel}>Follow-up questions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guidanceRow}
          >
            {guidancePrompts.map((gp) => (
              <Pressable
                key={gp.label}
                onPress={() => onGuidancePromptPress(gp.activePrompt)}
                style={({ pressed }) => [
                  styles.guidanceChip,
                  pressed && { opacity: 0.78, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={styles.guidanceChipText}>{gp.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!personalizationEnabled && (
        <View style={styles.chatOnlyBanner}>
          <Feather name="eye-off" size={13} color={Colors.textMuted} />
          <Text style={styles.chatOnlyBannerText}>
            Ragna is currently in chat-only mode. Saved profile details are not being included with your messages.
          </Text>
        </View>
      )}

      {livingProfile ? (
        <Pressable
          onPress={onToggleKnowsExpanded}
          style={({ pressed }) => [
            styles.knowsCard,
            pressed && { opacity: 0.9 },
          ]}
        >
          <View style={styles.knowsHeader}>
            <Feather name="zap" size={13} color={Colors.accent} />
            <Text style={styles.knowsTitle}>What Ragna may use</Text>
            <Pressable
              onPress={(e) => { e.stopPropagation(); router.push("/ragna-privacy" as any); }}
              hitSlop={8}
            >
              <Text style={styles.knowsManageLink}>Manage</Text>
            </Pressable>
            <Feather
              name={knowsExpanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={Colors.textMuted}
            />
          </View>
          {knowsExpanded && (
            <Text style={styles.knowsBody}>{livingProfile}</Text>
          )}
        </Pressable>
      ) : null}

      <View style={styles.profileNudge}>
        <Feather name="user" size={14} color={Colors.primary} />
        <Text style={styles.profileNudgeText}>
          Add the patient profile to tailor Ragna, and{" "}
          <Text
            style={styles.profileNudgeLink}
            onPress={() => router.push("/patient-profile" as any)}
          >
            update it here
          </Text>{" "}
          or{" "}
          <Text
            style={styles.profileNudgeLink}
            onPress={() => router.push("/ragna-privacy" as any)}
          >
            review privacy
          </Text>{" "}
          anytime.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  welcomeSection: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  compassLarge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 23,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.45,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 330,
  },
  tilesLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.15,
    marginBottom: -4,
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    width: "47.5%",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  chatOnlyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
  },
  chatOnlyBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
  },
  knowsCard: {
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
  },
  knowsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  knowsTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.1,
  },
  knowsManageLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  knowsBody: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  profileNudge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "32",
  },
  profileNudgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  profileNudgeLink: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  veraOpenerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "20",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  veraOpenerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  veraOpenerContent: {
    flex: 1,
    gap: 2,
  },
  veraOpenerName: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  veraOpenerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  guidanceSection: {
    gap: 8,
    marginHorizontal: -16,
  },
  guidanceLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#788AAE",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 16,
  },
  guidanceRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  guidanceChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
  },
  guidanceChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  symptomAlertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.accentPale,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  symptomAlertIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.accent + "25",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symptomAlertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.accentLight,
    lineHeight: 19,
  },
  moreTopicsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "rgba(15, 24, 54, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  moreTopicsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primaryLight,
    lineHeight: 17,
  },
});
