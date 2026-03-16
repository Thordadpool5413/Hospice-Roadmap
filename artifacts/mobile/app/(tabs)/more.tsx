import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { JourneyStage, UserRole } from "@/types";

const roleLabels: Record<UserRole, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  other: "Other",
};

const stageLabels: Record<JourneyStage, string> = {
  before: "Before Hospice",
  during: "During Hospice",
  after: "After Hospice",
};

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateJourneyStage } = useApp();

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Tools",
      items: [
        { label: "Eligibility Assessment", icon: "clipboard", route: "/evaluation" },
        { label: "Contact Support", icon: "message-circle", route: "/support" },
      ],
    },
    {
      title: "Legal & Privacy",
      items: [
        { label: "Privacy Policy", icon: "shield", route: "/privacy" },
        { label: "Terms of Use", icon: "file-text", route: "/terms" },
      ],
    },
    {
      title: "About",
      items: [
        {
          label: "About Hospice Roadmap",
          icon: "info",
          onPress: () =>
            Alert.alert(
              "About Hospice Roadmap",
              "Hospice Roadmap is an educational and navigation platform for people navigating the full hospice journey — before, during, and after care.\n\nThis app provides general information and does not constitute medical advice.\n\nVersion 1.0.0"
            ),
        },
        {
          label: "Medical Disclaimer",
          icon: "alert-circle",
          onPress: () =>
            Alert.alert(
              "Medical Disclaimer",
              "The content provided in this app is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.\n\nAlways seek the advice of a qualified health provider with any questions you may have regarding a medical condition."
            ),
        },
      ],
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) {
      router.push(item.route as any);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>More</Text>

      {/* Profile Card */}
      {user && (
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileRole}>
              {roleLabels[user.role] ?? "User"}
            </Text>
            <Text style={styles.profileStage}>
              {stageLabels[user.journeyStage]}
            </Text>
          </View>
          <View style={styles.profileStageTag}>
            <View
              style={[
                styles.stageDot,
                {
                  backgroundColor:
                    user.journeyStage === "before"
                      ? Colors.journeyBefore
                      : user.journeyStage === "during"
                      ? Colors.journeyDuring
                      : Colors.journeyAfter,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Journey Stage Switcher */}
      <View style={styles.stageSection}>
        <Text style={styles.stageSectionTitle}>Journey Stage</Text>
        <View style={styles.stageRow}>
          {(["before", "during", "after"] as JourneyStage[]).map((stage) => (
            <Pressable
              key={stage}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateJourneyStage(stage);
              }}
              style={({ pressed }) => [
                styles.stageBtn,
                user?.journeyStage === stage && styles.stageBtnActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.stageBtnText,
                  user?.journeyStage === stage && styles.stageBtnTextActive,
                ]}
              >
                {stage === "before"
                  ? "Before"
                  : stage === "during"
                  ? "During"
                  : "After"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionList}>
            {section.items.map((item, idx) => (
              <Pressable
                key={item.label}
                onPress={() => handleMenuPress(item)}
                style={({ pressed }) => [
                  styles.menuItem,
                  idx < section.items.length - 1 && styles.menuItemBorder,
                  pressed && { backgroundColor: Colors.backgroundSecondary },
                ]}
              >
                <View style={styles.menuIcon}>
                  <Feather
                    name={item.icon as any}
                    size={18}
                    color={item.destructive ? Colors.error : Colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}
                >
                  {item.label}
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Saved Count */}
      <View style={styles.savedSection}>
        <View style={styles.savedRow}>
          <View style={styles.savedItem}>
            <Text style={styles.savedCount}>{user?.savedResources.length ?? 0}</Text>
            <Text style={styles.savedLabel}>Saved Articles</Text>
          </View>
          <View style={styles.savedDivider} />
          <View style={styles.savedItem}>
            <Text style={styles.savedCount}>{user?.savedProviders.length ?? 0}</Text>
            <Text style={styles.savedLabel}>Saved Providers</Text>
          </View>
        </View>
      </View>

      <Text style={styles.versionText}>Hospice Roadmap v1.0.0</Text>
    </ScrollView>
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
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileRole: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  profileStage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  profileStageTag: {
    alignItems: "center",
    justifyContent: "center",
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stageSection: {
    gap: 10,
  },
  stageSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stageRow: {
    flexDirection: "row",
    gap: 8,
  },
  stageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  stageBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  stageBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  stageBtnTextActive: {
    color: Colors.primaryDark,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  savedSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  savedItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  savedCount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  savedLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  savedDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.divider,
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "center",
    paddingBottom: 8,
  },
});
