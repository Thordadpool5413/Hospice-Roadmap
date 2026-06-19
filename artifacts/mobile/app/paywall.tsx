import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

import { Colors } from "@/constants/colors";
import { PRIMARY_PACKAGE_IDENTIFIER } from "@/constants/subscriptionProducts";
import { useApp } from "@/context/AppContext";
import { useSubscription } from "@/context/SubscriptionContext";

interface PlanFeature {
  text: string;
  included: boolean;
}

const PREMIUM_FEATURES: PlanFeature[] = [
  { text: "Structured guidance for 60 scenarios", included: true },
  { text: "Symptom tracker with 7-day trends", included: true },
  { text: "Caregiver journal", included: true },
  { text: "Goals of care planner", included: true },
  { text: "Cloud sync across devices", included: true },
  { text: "Ragna AI companion (unlimited)", included: true },
  { text: "AI-powered personalized guidance", included: true },
  { text: "Cross-session AI memory", included: true },
  { text: "Smart follow-up suggestions", included: true },
  { text: "Priority support", included: true },
];

const ROLE_HERO_COPY: Record<string, { title: string; sub: string }> = {
  caregiver: {
    title: "Support your loved one every step of the way",
    sub: "One plan with every tool plus Ragna AI.",
  },
  patient: {
    title: "Navigate your journey with confidence",
    sub: "Guidance, answers, and support — made for you.",
  },
};

const DEFAULT_HERO_COPY = {
  title: "Hospice Roadmap Premium",
  sub: "One plan with every tool plus Ragna AI for personalized guidance.",
};

function RagnaCallout() {
  return (
    <View style={styles.ragnaCallout}>
      <View style={styles.ragnaCalloutIcon}>
        <Feather name="message-circle" size={18} color={Colors.primary} />
      </View>
      <View style={styles.ragnaCalloutBody}>
        <Text style={styles.ragnaCalloutTitle}>Ragna AI</Text>
        <Text style={styles.ragnaCalloutDesc}>
          A conversational AI companion that remembers your caregiving journey and delivers personalized guidance.
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <View style={styles.featureRow}>
      <Feather
        name={feature.included ? "check" : "x"}
        size={15}
        color={feature.included ? Colors.success : Colors.textMuted}
        style={styles.featureIcon}
      />
      <Text
        style={[
          styles.featureText,
          !feature.included && styles.featureTextMuted,
        ]}
      >
        {feature.text}
      </Text>
    </View>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  packageItem: PurchasesPackage | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ visible, packageItem, onConfirm, onCancel }: ConfirmModalProps) {
  if (!packageItem) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Test Store Purchase</Text>
          <Text style={styles.modalBody}>
            You are in <Text style={{ color: Colors.amber }}>test mode</Text>. No real
            payment will be charged. Confirm the test purchase of{" "}
            <Text style={{ color: Colors.primary }}>
              {packageItem.product.title}
            </Text>{" "}
            for{" "}
            <Text style={{ color: Colors.primary }}>
              {packageItem.product.priceString}
            </Text>
            ?
          </Text>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalConfirm} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, purchase, restorePurchases, isPurchasing, isRestoring } =
    useSubscription();
  const { user } = useApp();
  const userRole = user?.role;
  const [pendingPackage, setPendingPackage] = useState<PurchasesPackage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentOffering = offerings?.current;
  const primaryPkg =
    currentOffering?.availablePackages.find(
      (p: PurchasesPackage) => p.identifier === PRIMARY_PACKAGE_IDENTIFIER,
    ) ?? currentOffering?.availablePackages[0];

  function handleSelectPlan(pkg: PurchasesPackage) {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (__DEV__) {
      setPendingPackage(pkg);
    } else {
      void executePurchase(pkg);
    }
  }

  async function executePurchase(pkg: PurchasesPackage) {
    try {
      setErrorMsg(null);
      await purchase(pkg);
      setSuccessMsg("Purchase successful! You now have premium access.");
      setTimeout(() => router.back(), 1500);
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (e?.userCancelled) return;
      setErrorMsg(e?.message ?? "Purchase failed. Please try again.");
    }
  }

  async function handleRestore() {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const info = await restorePurchases();
      const hasPremium =
        Object.keys(info.entitlements.active ?? {}).length > 0;
      if (hasPremium) {
        setSuccessMsg("Purchases restored! Premium access is now active.");
        setTimeout(() => router.back(), 1500);
      } else {
        setSuccessMsg("No previous purchases found on this account.");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e?.message ?? "Restore failed. Please try again.");
    }
  }

  const isBusy = isPurchasing || isRestoring;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Feather name="x" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Upgrade</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroTitle}>
          {(ROLE_HERO_COPY[userRole ?? ""] ?? DEFAULT_HERO_COPY).title}
        </Text>
        <Text style={styles.heroSub}>
          {(ROLE_HERO_COPY[userRole ?? ""] ?? DEFAULT_HERO_COPY).sub}
        </Text>

        {isPremium && (
          <View style={styles.alreadyPremium}>
            <Feather name="check-circle" size={18} color={Colors.success} />
            <Text style={styles.alreadyPremiumText}>
              You already have premium access.
            </Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.messageBanner}>
            <Feather name="alert-circle" size={15} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {successMsg && (
          <View style={[styles.messageBanner, styles.successBanner]}>
            <Feather name="check-circle" size={15} color={Colors.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        <RagnaCallout />

        <View style={[styles.card, styles.companionCard]}>
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>Full Access</Text>
          </View>
          <View style={styles.cardHeader}>
            <Text style={[styles.planName, styles.companionPlanName]}>Hospice Roadmap Premium</Text>
            <Text style={[styles.planPrice, styles.companionPrice]}>
              {primaryPkg?.product.priceString ?? "$9.99"}
              <Text style={styles.planPeriod}>/wk</Text>
            </Text>
          </View>
          <Text style={styles.planDesc}>
            One plan with every tool plus Ragna AI for personalized guidance.
          </Text>
          {Platform.OS !== "web" && (
            <Text style={styles.trialNote}>
              7-day free trial available on App Store &amp; Play Store.
            </Text>
          )}
          <View style={styles.divider} />
          {PREMIUM_FEATURES.map((f) => (
            <FeatureRow key={f.text} feature={f} />
          ))}
          <Pressable
            style={[styles.ctaBtn, styles.companionBtn, (isBusy || !primaryPkg) && styles.ctaBtnDisabled]}
            onPress={() => primaryPkg && handleSelectPlan(primaryPkg)}
            disabled={isBusy || !primaryPkg || isPremium}
          >
            {isPurchasing && pendingPackage?.identifier === primaryPkg?.identifier ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <Text style={styles.ctaBtnText}>
                {isPremium ? "Premium Active" : "Start Premium"}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={handleRestore}
          disabled={isBusy}
          style={styles.restoreBtn}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={Colors.textMuted} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>

        <Text style={styles.legalNote}>
          Billed weekly. Subscriptions renew automatically. Cancel anytime in your{" "}
          {Platform.OS === "ios" ? "App Store" : "Play Store"} account settings.
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={pendingPackage !== null}
        packageItem={pendingPackage}
        onConfirm={async () => {
          const pkg = pendingPackage;
          setPendingPackage(null);
          if (pkg) await executePurchase(pkg);
        }}
        onCancel={() => setPendingPackage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  alreadyPremium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.successPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  alreadyPremiumText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.success,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successBanner: {
    backgroundColor: Colors.successPale,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.success,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  companionCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    position: "relative",
    overflow: "visible",
  },
  bestValueBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bestValueText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.background,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  planName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  companionPlanName: {
    color: Colors.primary,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  companionPrice: {
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  planDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  trialNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  featureIcon: {
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 19,
  },
  featureTextMuted: {
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  ctaBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    minHeight: 50,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  companionBtn: {
    backgroundColor: Colors.primary,
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  legalNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  ragnaCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.primary + "12",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: 12,
    marginBottom: 10,
  },
  ragnaCalloutIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  ragnaCalloutBody: {
    flex: 1,
  },
  ragnaCalloutTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    marginBottom: 3,
  },
  ragnaCalloutDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.background,
  },
});