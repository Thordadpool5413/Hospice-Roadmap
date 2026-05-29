import { useClerk, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { PlanBadge } from "@/components/PlanBadge";
import { Colors } from "@/constants/colors";
import { ENTITLEMENT_IDENTIFIER, getPlanName } from "@/constants/subscriptionProducts";
import { useSubscription } from "@/context/SubscriptionContext";
import { usePaywall } from "@/hooks/usePaywall";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    if (parts[0]) return parts[0][0]!.toUpperCase();
  }
  if (email) return email[0]!.toUpperCase();
  return "U";
}

const MANAGE_URL: string =
  Platform.OS === "ios"
    ? "itms-apps://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions";

async function openManageSubscription(): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(MANAGE_URL);
    if (canOpen) {
      await Linking.openURL(MANAGE_URL);
    } else {
      Alert.alert(
        "Manage Subscription",
        Platform.OS === "ios"
          ? "Open the Settings app → tap your name → Subscriptions to manage your plan."
          : "Open the Play Store → tap your profile icon → Payments & subscriptions → Subscriptions.",
      );
    }
  } catch {
    Alert.alert(
      "Manage Subscription",
      "Unable to open subscription management. Please manage your subscription directly through the App Store or Google Play.",
    );
  }
}

// ─── Plan descriptions ────────────────────────────────────────────────────────

const PLAN_DESCRIPTIONS: Record<string, string> = {
  Free: "Access the emergency card, journey map, situation finder, and hospice provider search — always free.",
  Caregiver:
    "Full access to symptom tracking, the caregiver journal, goals of care, and Ragna AI.",
  Companion:
    "Complete access to all Hospice Roadmap features, including Ragna AI and priority support.",
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const {
    isPremium,
    isLoading,
    customerInfo,
    restorePurchases,
    isRestoring,
  } = useSubscription();
  const { openPaywall } = usePaywall();

  const productId =
    customerInfo?.entitlements.active?.[ENTITLEMENT_IDENTIFIER]?.productIdentifier;
  const planName = getPlanName(isPremium, productId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const fullName = clerkUser?.fullName ?? null;
  const initials = getInitials(fullName, email);
  const planDesc = PLAN_DESCRIPTIONS[planName] ?? PLAN_DESCRIPTIONS["Companion"]!;

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () =>
          signOut().then(() => router.replace("/(auth)/sign-in" as any)),
      },
    ]);
  };

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const info = await restorePurchases();
      const restored =
        info?.entitlements.active?.[ENTITLEMENT_IDENTIFIER] !== undefined;
      Alert.alert(
        "Purchases Restored",
        restored
          ? "Your subscription has been restored successfully."
          : "No active subscription was found for this Apple ID or Google account.",
      );
    } catch {
      Alert.alert(
        "Restore Failed",
        "We couldn't restore your purchases. Please try again or contact support.",
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
    >
      <CosmicBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.65 }]}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            {fullName ? (
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName}
              </Text>
            ) : null}
            <Text style={styles.profileEmail} numberOfLines={1}>
              {email ?? "No email on file"}
            </Text>
          </View>
        </View>

        {/* ── Subscription ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
          <View style={styles.card}>
            <View style={styles.planRow}>
              <View style={styles.planLeft}>
                <Text style={styles.planTitle}>Current Plan</Text>
                <Text style={styles.planDesc}>{planDesc}</Text>
              </View>
              <PlanBadge plan={planName} size="md" />
            </View>

            <View style={styles.divider} />

            {isPremium ? (
              <>
                <Pressable
                  onPress={() => {
                    void openManageSubscription();
                  }}
                  style={({ pressed }) => [
                    styles.actionRow,
                    planName === "Caregiver" && styles.actionRowBorder,
                    pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "20" }]}>
                    <Feather name="credit-card" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Manage Subscription</Text>
                  <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
                </Pressable>
                {planName === "Caregiver" && (
                  <Pressable
                    onPress={() => openPaywall({ fromPlan: "caregiver" })}
                    style={({ pressed }) => [
                      styles.upgradeCompanionBtn,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Feather name="zap" size={15} color={Colors.primary} />
                    <Text style={styles.upgradeCompanionText}>Upgrade to Companion</Text>
                    <Feather name="chevron-right" size={15} color={Colors.primary + "99"} />
                  </Pressable>
                )}
              </>
            ) : (
              <Pressable
                onPress={() => openPaywall()}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Feather name="star" size={16} color="#fff" />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Account Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
          <View style={styles.card}>
            {/* Restore Purchases */}
            <Pressable
              onPress={() => {
                void handleRestorePurchases();
              }}
              disabled={isRestoring || isLoading}
              style={({ pressed }) => [
                styles.actionRow,
                styles.actionRowBorder,
                pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name="refresh-cw" size={16} color={Colors.primary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text
                  style={[
                    styles.actionLabel,
                    (isRestoring || isLoading) && { color: Colors.textMuted },
                  ]}
                >
                  {isRestoring ? "Restoring…" : "Restore Purchases"}
                </Text>
                <Text style={styles.actionHint}>
                  Reinstalled? Recover your subscription here
                </Text>
              </View>
              <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
            </Pressable>

            {/* Data Controls */}
            <Pressable
              onPress={() => router.push("/data-controls" as any)}
              style={({ pressed }) => [
                styles.actionRow,
                styles.actionRowBorder,
                pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.textMuted + "20" }]}>
                <Feather name="database" size={16} color={Colors.textMuted} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>Manage Saved Data</Text>
                <Text style={styles.actionHint}>Backup status, export, and clear data</Text>
              </View>
              <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
            </Pressable>

            {/* Sign Out */}
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.error + "18" }]}>
                <Feather name="log-out" size={16} color={Colors.error} />
              </View>
              <Text style={[styles.actionLabel, { color: Colors.error, flex: 1 }]}>
                Sign Out
              </Text>
              <Feather name="chevron-right" size={15} color="rgba(100,130,200,0.45)" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionNote}>Hospice Roadmap v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030A18" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },

  // Profile card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(14, 22, 58, 0.92)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 200, 0.25)",
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: Colors.primary + "22",
    borderWidth: 1.5,
    borderColor: Colors.primary + "44",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  profileText: { flex: 1, gap: 5 },
  profileName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  // Sections
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.textSubtle,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: "rgba(12, 20, 55, 0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.22)",
    overflow: "hidden",
  },

  // Plan row inside subscription card
  planRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    padding: 18,
  },
  planLeft: { flex: 1, gap: 6 },
  planTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  planDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(40, 60, 130, 0.35)",
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40, 60, 130, 0.35)",
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  actionTextWrap: { flex: 1, gap: 2 },
  actionHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  // Upgrade button (free users)
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Colors.primary,
    margin: 14,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 5,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },

  // Upgrade to Companion row (shown for Caregiver subscribers)
  upgradeCompanionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  upgradeCompanionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    letterSpacing: -0.1,
  },

  versionNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#2A3A60",
    textAlign: "center",
    paddingBottom: 8,
  },
});
