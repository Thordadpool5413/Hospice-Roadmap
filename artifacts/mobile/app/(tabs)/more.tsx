import { useClerk, useUser } from "@clerk/expo";
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
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { FontScale, useA11y } from "@/context/AccessibilityContext";
import { useApp } from "@/context/AppContext";
import { JourneyStage, UserRole } from "@/types";

import { PlanBadge } from "@/components/PlanBadge";
import { ENTITLEMENT_IDENTIFIER, getPlanName } from "@/constants/subscriptionProducts";
import { useSubscription } from "@/context/SubscriptionContext";

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

const stageColors: Record<JourneyStage, string> = {
  before: Colors.journeyBefore,
  during: Colors.journeyDuring,
  after: Colors.journeyAfter,
};

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  onPress?: () => void;
  destructive?: boolean;
  color?: string;
}

interface MenuSection {
  title: string;
  subtitle?: string;
  accent: string;
  icon: string;
  items: MenuItem[];
}

const FONT_SCALE_OPTIONS: { label: string; value: FontScale; display: string }[] = [
  { label: "Normal",  value: 1,   display: "A"   },
  { label: "Large",   value: 1.2, display: "A+"  },
  { label: "X-Large", value: 1.4, display: "A++" },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateJourneyStage, updateRole } = useApp();
  const { fontScale, highContrast, setFontScale, setHighContrast } = useA11y();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { isPremium, customerInfo } = useSubscription();
  const productId =
    customerInfo?.entitlements.active?.[ENTITLEMENT_IDENTIFIER]?.productIdentifier;
  const planName = getPlanName(isPremium, productId);

  const isPatient = user?.role === "patient";

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => signOut().then(() => router.replace("/(auth)/sign-in" as any)),
        },
      ]
    );
  };

  const menuSections: MenuSection[] = [
    {
      title: "Your Profile",
      subtitle: "Personalizes Ragna for your situation",
      accent: Colors.accentGoals,
      icon: "user",
      items: [
        { label: isPatient ? "My Profile" : "Patient Profile", icon: "user", route: "/patient-profile", color: Colors.primary },
        { label: "Goals of Care", icon: "heart", route: "/goals-of-care", color: Colors.accentGoals },
        { label: "Ragna Privacy Controls", icon: "shield", route: "/ragna-privacy", color: Colors.accentReminders },
      ],
    },
    {
      title: "Daily Care",
      subtitle: isPatient ? "Tools for your daily wellbeing" : "Tools for everyday caregiving",
      accent: Colors.accentSymptom,
      icon: "activity",
      items: [
        { label: isPatient ? "Journal" : "Caregiver Journal", icon: "edit-3", route: "/journal", color: Colors.accentJournal },
        { label: "Reminders", icon: "bell", route: "/reminders", color: Colors.accentReminders },
        { label: "Symptom Tracker", icon: "activity", route: "/symptom-tracker", color: Colors.accentSymptom },
      ],
    },
    {
      title: "Clinical Reference",
      subtitle: "Tools for specific care situations",
      accent: Colors.accentSituation,
      icon: "clipboard",
      items: [
        { label: "Situation Finder", icon: "compass", route: "/situation-finder", color: Colors.accentSituation },
        { label: "Medication Lookup", icon: "package", route: "/medication-lookup", color: Colors.primary },
        ...(!isPatient ? [
          { label: "Active Dying — What to Expect", icon: "heart", route: "/active-dying", color: Colors.journeyDuring } as MenuItem,
          { label: "Pain Assessment Tool (PAINAD)", icon: "activity", route: "/painad", color: Colors.amber } as MenuItem,
        ] : []),
        { label: "Hospice Interview Scorecard", icon: "check-square", route: "/hospice-interview", color: Colors.accentGoals },
        { label: "Hospice Eligibility Check", icon: "clipboard", route: "/evaluation", color: Colors.accentCareWishes },
        { label: "Advance Directives & State Forms", icon: "file-text", route: "/legal", color: Colors.accentJourney },
        { label: "Resource Library", icon: "book-open", route: "/resources", color: Colors.textMuted },
      ],
    },
    {
      title: "Help & Support",
      subtitle: "App settings and information",
      accent: Colors.textMuted,
      icon: "info",
      items: [
        { label: "Manage Saved Data", icon: "database", route: "/data-controls", color: Colors.textMuted },
        { label: "Contact Support", icon: "message-circle", route: "/support", color: Colors.primary },
        { label: "Privacy Policy", icon: "shield", route: "/privacy", color: Colors.textMuted },
        { label: "Terms of Use", icon: "file-text", route: "/terms", color: Colors.textMuted },
        {
          label: "About Hospice Roadmap",
          icon: "info",
          color: Colors.textMuted,
          onPress: () =>
            Alert.alert(
              "About Hospice Roadmap",
              "Hospice Roadmap is an educational and navigation platform for people navigating the full hospice journey — before, during, and after care.\n\nThis app provides general information and does not constitute medical advice.\n\nVersion 1.0.0"
            ),
        },
        {
          label: "Medical Disclaimer",
          icon: "alert-circle",
          color: Colors.error,
          onPress: () =>
            Alert.alert(
              "Medical Disclaimer",
              "The content provided in this app is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.\n\nAlways seek the advice of a qualified health provider with any questions you may have regarding a medical condition."
            ),
        },
        {
          label: "Sign Out",
          icon: "log-out",
          color: Colors.error,
          destructive: true,
          onPress: handleSignOut,
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

  const currentStage = user?.journeyStage ?? "during";

  return (
    <View style={s.container}>
      <CosmicBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 72 : 22),
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Your Tools</Text>
          <Text style={s.pageSubtitle}>Everything you need, in one place</Text>
        </View>

        {/* ── Emergency Card Banner ── */}
        <Pressable
          onPress={() => router.push("/emergency-card" as any)}
          style={({ pressed }) => [
            s.emergencyCard,
            pressed && { opacity: 0.87, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={s.emergencyLeft}>
            <View style={s.emergencyIconWrap}>
              <Feather name="phone-call" size={20} color="#FF6B6B" />
            </View>
            <View style={s.emergencyText}>
              <Text style={s.emergencyTitle}>Emergency Information Card</Text>
              <Text style={s.emergencySub}>Hospice contacts, medications & equipment</Text>
            </View>
          </View>
          <View style={s.emergencyChevron}>
            <Feather name="chevron-right" size={17} color="rgba(255,107,107,0.70)" />
          </View>
        </Pressable>

        {/* ── Account Row ── */}
        {user && (
          <Pressable
            onPress={() => router.push("/account" as any)}
            style={({ pressed }) => [
              s.profileCard,
              pressed && { opacity: 0.87, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[s.profileAvatar, { backgroundColor: Colors.primary + "28" }]}>
              <Feather name="user" size={22} color={Colors.primary} />
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileRole} numberOfLines={1}>
                {clerkUser?.fullName ?? roleLabels[user.role] ?? "User"}
              </Text>
              <Text style={s.profileStage} numberOfLines={1}>
                {clerkUser?.primaryEmailAddress?.emailAddress ??
                  stageLabels[user.journeyStage]}
              </Text>
            </View>
            <View style={s.profileRight}>
              <PlanBadge plan={planName} />
              <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
            </View>
          </Pressable>
        )}

        {/* ── Journey Stage ── */}
        <View style={s.switchSection}>
          <Text style={s.switchLabel}>Journey Stage</Text>
          <View style={s.switchRow}>
            {(["before", "during", "after"] as JourneyStage[]).map((stage) => {
              const active = user?.journeyStage === stage;
              const color = stageColors[stage];
              return (
                <Pressable
                  key={stage}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateJourneyStage(stage);
                  }}
                  style={({ pressed }) => [
                    s.switchBtn,
                    active && { borderColor: color, backgroundColor: color + "18" },
                    pressed && { opacity: 0.80 },
                  ]}
                >
                  <View style={[s.switchDot, { backgroundColor: active ? color : "transparent" }]} />
                  <Text style={[s.switchBtnText, active && { color }]}>
                    {stage === "before" ? "Before" : stage === "during" ? "During" : "After"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Role Switcher ── */}
        <View style={s.switchSection}>
          <Text style={s.switchLabel}>I am a</Text>
          <View style={s.switchRow}>
            {(["patient", "caregiver", "other"] as UserRole[]).map((role) => {
              const active = user?.role === role;
              return (
                <Pressable
                  key={role}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateRole(role);
                  }}
                  style={({ pressed }) => [
                    s.switchBtn,
                    active && { borderColor: Colors.primary, backgroundColor: Colors.primary + "18" },
                    pressed && { opacity: 0.80 },
                  ]}
                >
                  <Text style={[s.switchBtnText, active && { color: Colors.primary }]}>
                    {roleLabels[role]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Accessibility ── */}
        <View style={s.menuSection}>
          <View style={s.sectionHeaderRow}>
            <View style={[s.sectionIcon, { backgroundColor: Colors.primary + "20" }]}>
              <Feather name="eye" size={14} color={Colors.primary} />
            </View>
            <Text style={s.sectionTitle}>Accessibility</Text>
          </View>
          <View style={s.menuCard}>
            {/* Text Size */}
            <View style={[s.menuRow, s.menuRowBorder]}>
              <View style={[s.menuIconWrap, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name="type" size={16} color={Colors.primary} />
              </View>
              <View style={s.menuTextWrap}>
                <Text style={s.menuLabel}>Text Size</Text>
                <Text style={s.menuHint}>Affects guidance content</Text>
              </View>
              <View style={s.fontBtnGroup}>
                {FONT_SCALE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFontScale(opt.value);
                    }}
                    style={[
                      s.fontBtn,
                      fontScale === opt.value && { backgroundColor: Colors.primary + "25", borderColor: Colors.primary },
                    ]}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[
                      s.fontBtnText,
                      fontScale === opt.value && { color: Colors.primary },
                    ]}>{opt.display}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {/* High Contrast */}
            <View style={s.menuRow}>
              <View style={[s.menuIconWrap, { backgroundColor: Colors.amber + "20" }]}>
                <Feather name="sun" size={16} color={Colors.amber} />
              </View>
              <View style={s.menuTextWrap}>
                <Text style={s.menuLabel}>High Contrast</Text>
                <Text style={s.menuHint}>Stronger text and borders</Text>
              </View>
              <Switch
                value={highContrast}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHighContrast(val);
                }}
                trackColor={{ false: Colors.divider, true: Colors.primary + "80" }}
                thumbColor={highContrast ? Colors.primary : "#AAB8D0"}
              />
            </View>
          </View>
        </View>

        {/* ── Menu Sections ── */}
        {menuSections.map((section) => (
          <View key={section.title} style={s.menuSection}>
            <View style={s.sectionHeaderRow}>
              <View style={[s.sectionIcon, { backgroundColor: section.accent + "20" }]}>
                <Feather name={section.icon as any} size={14} color={section.accent} />
              </View>
              <View style={s.sectionTitleWrap}>
                <Text style={s.sectionTitle}>{section.title}</Text>
                {section.subtitle && <Text style={s.sectionSubtitle}>{section.subtitle}</Text>}
              </View>
            </View>
            <View style={s.menuCard}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => handleMenuPress(item)}
                  style={({ pressed }) => [
                    s.menuRow,
                    idx < section.items.length - 1 && s.menuRowBorder,
                    pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                >
                  <View style={[s.menuIconWrap, { backgroundColor: (item.color || Colors.primary) + "20" }]}>
                    <Feather
                      name={item.icon as any}
                      size={16}
                      color={item.destructive ? Colors.error : (item.color || Colors.primary)}
                    />
                  </View>
                  <Text
                    style={[
                      s.menuLabel,
                      { flex: 1 },
                      item.destructive && { color: Colors.error },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.savedResources.length ?? 0}</Text>
            <Text style={s.statLabel}>Saved Articles</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{user?.savedProviders.length ?? 0}</Text>
            <Text style={s.statLabel}>Saved Providers</Text>
          </View>
        </View>

        <Text style={s.versionText}>Hospice Roadmap v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030A18" },
  content: { paddingHorizontal: 18, gap: 18 },

  pageHeader: { gap: 4 },
  pageTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    lineHeight: 20,
  },

  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(80, 10, 10, 0.55)",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(220, 60, 60, 0.35)",
    borderLeftWidth: 3,
    borderLeftColor: "#C03040",
    gap: 12,
  },
  emergencyLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.18)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  emergencyText: { flex: 1, gap: 2 },
  emergencyTitle: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: "#F0F4FF", letterSpacing: -0.2,
  },
  emergencySub: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#AA8890", lineHeight: 16,
  },
  emergencyChevron: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    alignItems: "center", justifyContent: "center",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(14, 22, 58, 0.90)",
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 200, 0.22)",
  },
  profileAvatar: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  profileInfo: { flex: 1, gap: 3, minWidth: 0 },
  profileRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileRole: {
    fontSize: 17, fontFamily: "Inter_700Bold",
    color: "#EEF4FF", letterSpacing: -0.3,
  },
  profileStage: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: "#6A85AE",
  },
  stageIndicator: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageIndicatorText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  switchSection: { gap: 8 },
  switchLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    color: "#4A6090", textTransform: "uppercase", letterSpacing: 1.1,
    paddingLeft: 2,
  },
  switchRow: { flexDirection: "row", gap: 8 },
  switchBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 11, borderRadius: 13,
    backgroundColor: "rgba(14, 22, 58, 0.88)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.28)",
  },
  switchDot: { width: 6, height: 6, borderRadius: 3 },
  switchBtnText: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6A85AE",
  },

  menuSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitleWrap: { gap: 1 },
  sectionTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold",
    color: "#B0C0E0", letterSpacing: -0.1,
  },
  sectionSubtitle: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090",
  },

  menuCard: {
    backgroundColor: "rgba(12, 20, 55, 0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.22)",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40, 60, 130, 0.35)",
  },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  menuTextWrap: { flex: 1, gap: 1 },
  menuLabel: {
    fontSize: 14, fontFamily: "Inter_500Medium", color: "#D8E4FF", letterSpacing: -0.1,
  },
  menuHint: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090",
  },

  fontBtnGroup: { flexDirection: "row", gap: 5 },
  fontBtn: {
    minWidth: 38, height: 34, borderRadius: 9,
    backgroundColor: "rgba(20, 32, 80, 0.90)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.30)",
    paddingHorizontal: 8,
  },
  fontBtnText: {
    fontSize: 12, fontFamily: "Inter_700Bold", color: "#6A85AE",
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(12, 20, 55, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.22)",
    padding: 18,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statNum: {
    fontSize: 28, fontFamily: "Inter_700Bold",
    color: Colors.primary, letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: "#4A6090",
  },
  statDivider: {
    width: 1, height: 44, backgroundColor: "rgba(60, 90, 170, 0.30)",
    marginHorizontal: 12,
  },

  versionText: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    color: "#2A3A60", textAlign: "center", paddingBottom: 8,
  },
});
