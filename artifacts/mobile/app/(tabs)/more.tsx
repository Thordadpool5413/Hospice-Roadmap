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
import { LockTimeout, useAppLock } from "@/context/AppLockContext";
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

const TIMEOUT_OPTIONS: { label: string; value: LockTimeout }[] = [
  { label: "Immediately", value: 0  },
  { label: "1 min",       value: 1  },
  { label: "5 min",       value: 5  },
  { label: "15 min",      value: 15 },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateJourneyStage, updateRole } = useApp();
  const { fontScale, highContrast, setFontScale, setHighContrast } = useA11y();
  const { isLockEnabled, lockTimeout, setLockEnabled, setLockTimeout } = useAppLock();
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
      title: "Daily Care",
      subtitle: isPatient ? "Track your day and keep notes" : "Journal, reminders, and symptom tracking",
      accent: Colors.accentSymptom,
      icon: "activity",
      items: [
        { label: isPatient ? "Journal" : "Caregiver Journal", icon: "edit-3", route: "/journal", color: Colors.accentJournal },
        { label: "Reminders", icon: "bell", route: "/reminders", color: Colors.accentReminders },
        { label: "Symptom Tracker", icon: "activity", route: "/symptom-tracker", color: Colors.accentSymptom },
        ...(!isPatient ? [
          { label: "Family Updates", icon: "message-square", route: "/family-updates", color: Colors.success } as MenuItem,
        ] : []),
      ],
    },
    {
      title: "Essentials",
      subtitle: "Profile, privacy, and personalization",
      accent: Colors.accentGoals,
      icon: "user",
      items: [
        { label: isPatient ? "My Profile" : "Patient Profile", icon: "user", route: "/patient-profile", color: Colors.primary },
        { label: "Goals of Care", icon: "heart", route: "/goals-of-care", color: Colors.accentGoals },
        { label: "Ragna Privacy Controls", icon: "shield", route: "/ragna-privacy", color: Colors.accentReminders },
      ],
    },
    {
      title: "Guidance",
      subtitle: "Step-by-step support for the moments that matter",
      accent: Colors.accentSituation,
      icon: "clipboard",
      items: [
        { label: "Situation Finder", icon: "compass", route: "/situation-finder", color: Colors.accentSituation },
        { label: "Call Scripts", icon: "phone-call", route: "/call-scripts", color: Colors.error },
        { label: "Medication Lookup", icon: "package", route: "/medication-lookup", color: Colors.primary },
        ...(!isPatient ? [
          { label: "Active Dying — What to Expect", icon: "heart", route: "/active-dying", color: Colors.journeyDuring } as MenuItem,
          { label: "Pain Assessment Tool (PAINAD)", icon: "activity", route: "/painad", color: Colors.amber } as MenuItem,
        ] : []),
        { label: "Hospice Interview Scorecard", icon: "check-square", route: "/hospice-interview", color: Colors.accentGoals },
        { label: "Advance Directives & State Forms", icon: "file-text", route: "/legal", color: Colors.accentJourney },
        { label: "Resource Library", icon: "book-open", route: "/resources", color: Colors.textMuted },
      ],
    },
    {
      title: "Coverage & Rights",
      subtitle: "Financial guidance and patient rights",
      accent: Colors.accentJourney,
      icon: "file-text",
      items: [
        { label: "Hospice & Medicare: What's Covered", icon: "file-text", route: "/benefits-guide", color: Colors.accentJourney },
        { label: "Crisis Care Guide", icon: "alert-circle", route: "/crisis-care-guide", color: Colors.error },
      ],
    },
    {
      title: "Support & Legal",
      subtitle: "Help, policies, and account actions",
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
          <Text style={s.pageTitle}>More</Text>
          <Text style={s.pageSubtitle}>Profile, settings, and care tools</Text>
        </View>

        {/* ── Emergency Card Banner ── */}
        <Pressable
          onPress={() => router.push("/situation-finder" as any)}
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
              <Text style={s.emergencyTitle}>Get help now</Text>
              <Text style={s.emergencySub}>Breathing, pain, confusion, equipment, or a situation that feels urgent</Text>
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

        {/* ── Security ── */}
        <View style={s.menuSection}>
          <View style={s.sectionHeaderRow}>
            <View style={[s.sectionIcon, { backgroundColor: Colors.accentReminders + "20" }]}>
              <Feather name="lock" size={14} color={Colors.accentReminders} />
            </View>
            <Text style={s.sectionTitle}>Security</Text>
          </View>
          <View style={s.menuCard}>
            {/* App Lock toggle */}
            <View style={[s.menuRow, isLockEnabled && s.menuRowBorder]}>
              <View style={[s.menuIconWrap, { backgroundColor: Colors.accentReminders + "20" }]}>
                <Feather name="shield" size={16} color={Colors.accentReminders} />
              </View>
              <View style={s.menuTextWrap}>
                <Text style={s.menuLabel}>App Lock</Text>
                <Text style={s.menuHint}>
                  {isLockEnabled ? "Locks on background" : "Require Face ID, Touch ID, or passcode"}
                </Text>
              </View>
              <Switch
                value={isLockEnabled}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLockEnabled(val);
                }}
                trackColor={{ false: Colors.divider, true: Colors.accentReminders + "80" }}
                thumbColor={isLockEnabled ? Colors.accentReminders : "#AAB8D0"}
              />
            </View>

            {/* Lock-after timeout — shown only when lock is enabled */}
            {isLockEnabled && (
              <View style={s.menuRow}>
                <View style={[s.menuIconWrap, { backgroundColor: Colors.accentReminders + "15" }]}>
                  <Feather name="clock" size={16} color={Colors.accentReminders} />
                </View>
                <View style={s.menuTextWrap}>
                  <Text style={s.menuLabel}>Lock after</Text>
                </View>
                <View style={s.fontBtnGroup}>
                  {TIMEOUT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setLockTimeout(opt.value);
                      }}
                      style={[
                        s.fontBtn,
                        lockTimeout === opt.value && {
                          backgroundColor: Colors.accentReminders + "22",
                          borderColor: Colors.accentReminders,
                        },
                      ]}
                      accessibilityLabel={opt.label}
                    >
                      <Text
                        style={[
                          s.fontBtnText,
                          lockTimeout === opt.value && { color: Colors.accentReminders },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, gap: 16 },

  pageHeader: { gap: 3 },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.7,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
  },

  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.errorMid + "50",
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    gap: 12,
  },
  emergencyLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.error + "20",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  emergencyText: { flex: 1, gap: 2 },
  emergencyTitle: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2,
  },
  emergencySub: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 16,
  },
  emergencyChevron: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: Colors.error + "18",
    alignItems: "center", justifyContent: "center",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  profileInfo: { flex: 1, gap: 3, minWidth: 0 },
  profileRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileRole: {
    fontSize: 16, fontFamily: "Inter_700Bold",
    color: Colors.text, letterSpacing: -0.3,
  },
  profileStage: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted,
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
    fontSize: 10, fontFamily: "Inter_700Bold",
    color: Colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2,
    paddingLeft: 2,
  },
  switchRow: { flexDirection: "row", gap: 7 },
  switchBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 11, borderRadius: 12,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  switchDot: { width: 6, height: 6, borderRadius: 3 },
  switchBtnText: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted,
  },

  menuSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIcon: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitleWrap: { gap: 1 },
  sectionTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold",
    color: Colors.textSecondary, letterSpacing: -0.15,
  },
  sectionSubtitle: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSubtle,
  },

  menuCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  menuTextWrap: { flex: 1, gap: 1 },
  menuLabel: {
    fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text, letterSpacing: -0.15,
  },
  menuHint: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },

  fontBtnGroup: { flexDirection: "row", gap: 5 },
  fontBtn: {
    minWidth: 38, height: 32, borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingHorizontal: 8,
  },
  fontBtnText: {
    fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.textMuted,
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceMid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statNum: {
    fontSize: 26, fontFamily: "Inter_700Bold",
    color: Colors.primary, letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },
  statDivider: {
    width: 1, height: 40, backgroundColor: Colors.cardBorder,
    marginHorizontal: 12,
  },

  versionText: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    color: Colors.textSubtle, textAlign: "center", paddingBottom: 8,
  },
});
