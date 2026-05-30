import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface ContactRowProps {
  label: string;
  value?: string;
  icon: string;
  callable?: boolean;
}

function ContactRow({ label, value, icon, callable = true }: ContactRowProps) {
  const hasValue = !!value && value.trim().length > 0;

  const handlePress = () => {
    if (callable && hasValue) {
      Linking.openURL(`tel:${value!.replace(/\D/g, "")}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!callable || !hasValue}
      style={({ pressed }) => [
        styles.contactRow,
        callable && hasValue && pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[styles.contactIcon, { backgroundColor: hasValue ? Colors.errorPale : Colors.backgroundSecondary }]}>
        <Feather name={icon as any} size={18} color={hasValue ? Colors.error : Colors.textSubtle} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, !hasValue && styles.contactValueEmpty]}>
          {hasValue ? value : "Not set — add in Patient Profile"}
        </Text>
      </View>
      {callable && hasValue && (
        <View style={styles.callChip}>
          <Feather name="phone" size={13} color={Colors.error} />
          <Text style={styles.callChipText}>Call</Text>
        </View>
      )}
    </Pressable>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string; icon: string }) {
  const hasValue = !!value && value.trim().length > 0;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: Colors.primaryPale }]}>
        <Feather name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, !hasValue && styles.infoValueEmpty]}>
          {hasValue ? value : "Not set"}
        </Text>
      </View>
    </View>
  );
}

const PATIENT_RIGHTS = [
  {
    icon: "moon",
    title: "24/7 nurse access",
    body: "Federal law requires your hospice to have a registered nurse available by phone around the clock, every day of the year.",
  },
  {
    icon: "users",
    title: "Care conference at any time",
    body: "You can request a formal meeting with your hospice team whenever you want to discuss the care plan, concerns, or next steps.",
  },
  {
    icon: "log-out",
    title: "Revoke hospice at any time",
    body: "You may leave hospice care at any time — no explanation required. Simply notify your hospice in writing. Your Medicare benefits immediately return.",
  },
  {
    icon: "repeat",
    title: "Switch hospice agencies",
    body: "You have the right to transfer to a different Medicare-certified hospice at the start of any new benefit period without losing coverage.",
  },
  {
    icon: "flag",
    title: "File a complaint with Medicare",
    body: "Call 1-800-MEDICARE (1-800-633-4227) or contact your state's Quality Improvement Organization (QIO) if you believe a right has been violated.",
  },
];

export default function EmergencyCardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [rightsExpanded, setRightsExpanded] = useState(false);
  const profile = user?.patientProfile;

  const hasAnyContact =
    profile?.hospicePhone ||
    profile?.hospiceAfterHoursPhone ||
    profile?.equipmentProviderPhone ||
    profile?.pharmacyPhone;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Emergency Card</Text>
          <Text style={styles.headerSubtitle}>Key contacts and information</Text>
        </View>
        <Pressable
          onPress={() => router.push("/patient-profile")}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="edit-2" size={16} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Setup banner if no data */}
        {!hasAnyContact && (
          <Pressable
            onPress={() => router.push("/patient-profile")}
            style={({ pressed }) => [styles.setupBanner, pressed && { opacity: 0.85 }]}
          >
            <Feather name="alert-circle" size={20} color={Colors.amber} />
            <View style={styles.setupBannerText}>
              <Text style={styles.setupBannerTitle}>Set up your emergency contacts</Text>
              <Text style={styles.setupBannerBody}>
                Add your hospice phone numbers and patient information so this card is ready when you need it most.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.amber} />
          </Pressable>
        )}

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="phone-call" size={15} color={Colors.error} />
            <Text style={[styles.sectionTitle, { color: Colors.error }]}>Emergency Contacts</Text>
          </View>
          <View style={styles.card}>
            <ContactRow
              label="Hospice — Main Line"
              value={profile?.hospicePhone}
              icon="phone"
            />
            <View style={styles.rowDivider} />
            <ContactRow
              label="Hospice — After Hours"
              value={profile?.hospiceAfterHoursPhone}
              icon="moon"
            />
            <View style={styles.rowDivider} />
            <ContactRow
              label="Equipment Provider"
              value={profile?.equipmentProviderPhone}
              icon="tool"
            />
            <View style={styles.rowDivider} />
            <ContactRow
              label="Pharmacy"
              value={profile?.pharmacyPhone}
              icon="package"
            />
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={15} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Patient Information</Text>
          </View>
          <View style={styles.card}>
            <InfoRow
              label="Patient Name"
              value={profile?.patientName}
              icon="user"
            />
            <View style={styles.rowDivider} />
            <InfoRow
              label="Primary Diagnosis"
              value={profile?.diagnosis}
              icon="activity"
            />
          </View>
        </View>

        {/* Comfort Kit Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="package" size={15} color={Colors.info} />
            <Text style={[styles.sectionTitle, { color: Colors.info }]}>Comfort Kit Medications</Text>
          </View>
          <View style={styles.card}>
            {profile?.comfortKitMedications && profile.comfortKitMedications.trim().length > 0 ? (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockContent}>{profile.comfortKitMedications}</Text>
              </View>
            ) : (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>Not set — add in Patient Profile</Text>
              </View>
            )}
          </View>
        </View>

        {/* Equipment in the Home */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="monitor" size={15} color={Colors.amber} />
            <Text style={[styles.sectionTitle, { color: Colors.amber }]}>Equipment in the Home</Text>
          </View>
          <View style={styles.card}>
            {profile?.equipmentInHome && profile.equipmentInHome.trim().length > 0 ? (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockContent}>{profile.equipmentInHome}</Text>
              </View>
            ) : (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>Not set — add in Patient Profile</Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Notes */}
        {profile?.additionalNotes && profile.additionalNotes.trim().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={15} color={Colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Additional Notes</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.textBlock}>
                <Text style={styles.textBlockContent}>{profile.additionalNotes}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Crisis Care Guide */}
        <Pressable
          onPress={() => router.push("/crisis-care-guide" as any)}
          style={({ pressed }) => [
            styles.crisisBanner,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.crisisLeft}>
            <View style={styles.crisisIconWrap}>
              <Feather name="alert-triangle" size={18} color="#E85040" />
            </View>
            <View style={styles.crisisText}>
              <Text style={styles.crisisTitle}>Need Crisis-Level Care?</Text>
              <Text style={styles.crisisSub}>
                Check if you qualify for intensive nursing or inpatient hospice
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={"#E8504099"} />
        </Pressable>

        {/* Call Scripts */}
        <Pressable
          onPress={() => router.push("/call-scripts" as any)}
          style={({ pressed }) => [
            styles.callScriptsBanner,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.callScriptsLeft}>
            <View style={styles.callScriptsIconWrap}>
              <Feather name="phone-call" size={18} color={Colors.error} />
            </View>
            <View style={styles.callScriptsText}>
              <Text style={styles.callScriptsTitle}>Know What to Say</Text>
              <Text style={styles.callScriptsSub}>
                Pre-filled call scripts for the hospice team
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.error + "99"} />
        </Pressable>

        {/* Patient Rights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="shield" size={15} color={Colors.info} />
            <Text style={[styles.sectionTitle, { color: Colors.info }]}>Your Rights as a Hospice Patient</Text>
          </View>
          <View style={[styles.card, styles.rightsCard]}>
            <Pressable
              onPress={() => setRightsExpanded((v) => !v)}
              style={({ pressed }) => [styles.rightsHeader, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel={rightsExpanded ? "Collapse patient rights" : "Expand patient rights"}
            >
              <View style={styles.rightsHeaderLeft}>
                <View style={styles.rightsIconWrap}>
                  <Feather name="shield" size={18} color={Colors.info} />
                </View>
                <View style={styles.rightsHeaderText}>
                  <Text style={styles.rightsHeaderTitle}>Medicare Hospice Patient Rights</Text>
                  <Text style={styles.rightsHeaderSub}>
                    {rightsExpanded ? "Tap to collapse" : "5 federally protected rights — tap to expand"}
                  </Text>
                </View>
              </View>
              <Feather
                name={rightsExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.info}
              />
            </Pressable>

            {rightsExpanded && (
              <>
                <View style={styles.rowDivider} />
                {PATIENT_RIGHTS.map((right, i) => (
                  <React.Fragment key={right.title}>
                    <View style={styles.rightItem}>
                      <View style={styles.rightItemIcon}>
                        <Feather name={right.icon as any} size={15} color={Colors.info} />
                      </View>
                      <View style={styles.rightItemText}>
                        <Text style={styles.rightItemTitle}>{right.title}</Text>
                        <Text style={styles.rightItemBody}>{right.body}</Text>
                      </View>
                    </View>
                    {i < PATIENT_RIGHTS.length - 1 && <View style={styles.rowDivider} />}
                  </React.Fragment>
                ))}
                <View style={styles.rowDivider} />
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/situation-finder",
                      params: { category: "advocacy" },
                    } as any)
                  }
                  style={({ pressed }) => [
                    styles.rightsFooterLink,
                    pressed && { backgroundColor: "rgba(26,144,144,0.15)" },
                  ]}
                >
                  <Text style={styles.rightsFooterLinkText}>
                    Full guidance — Advocacy &amp; Rights
                  </Text>
                  <Feather name="arrow-right" size={14} color={Colors.info} />
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Guidance Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={15} color={Colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Quick Guidance</Text>
          </View>
          <View style={styles.card}>
            {[
              { label: "Breathing changes", id: "breathing-changes" },
              { label: "Worsening pain", id: "pain-worsening" },
              { label: "When to ask for hospital-level care", id: "crisis-care-gip" },
              { label: "Signs of dying", id: "approaching-death" },
              { label: "After death — what to do", id: "after-death-guidance" },
              { label: "Not sure what's happening", id: "not-sure-whats-happening" },
            ].map((item, i, arr) => (
              <React.Fragment key={item.id}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/guidance/[id]", params: { id: item.id } } as any)
                  }
                  style={({ pressed }) => [
                    styles.guidanceLink,
                    pressed && { backgroundColor: Colors.backgroundSecondary },
                  ]}
                >
                  <Text style={styles.guidanceLinkText}>{item.label}</Text>
                  <Feather name="chevron-right" size={14} color={Colors.textSubtle} />
                </Pressable>
                {i < arr.length - 1 && <View style={styles.rowDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Feather name="lock" size={12} color={Colors.textSubtle} />
          <Text style={styles.privacyText}>
            Information on this card is stored on this device for quick access. It is not automatically shared. If you use Ragna, relevant profile details may be included with your request.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(3,10,24,0.97)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(60,120,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  setupBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(200,150,50,0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.amber + "30",
  },
  setupBannerText: {
    flex: 1,
  },
  setupBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.amber,
    marginBottom: 3,
  },
  setupBannerBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#5A78A8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EEF4FF",
  },
  contactValueEmpty: {
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    fontSize: 13,
  },
  callChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(235,80,80,0.12)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  callChipText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.error,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(55,85,170,0.15)",
    marginHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#5A78A8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#EEF4FF",
  },
  infoValueEmpty: {
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    fontSize: 13,
  },
  textBlock: {
    padding: 14,
  },
  textBlockContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 21,
  },
  emptyBlock: {
    padding: 14,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    fontStyle: "italic",
  },
  crisisBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(232,80,64,0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(232,80,64,0.30)",
  },
  crisisLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  crisisIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(232,80,64,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crisisText: {
    flex: 1,
    gap: 2,
  },
  crisisTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
  },
  crisisSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  callScriptsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(192,48,64,0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(192,48,64,0.25)",
  },
  callScriptsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  callScriptsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(192,48,64,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  callScriptsText: {
    flex: 1,
    gap: 2,
  },
  callScriptsTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
  },
  callScriptsSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  guidanceLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  guidanceLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#EEF4FF",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    lineHeight: 16,
  },
  rightsCard: {
    borderColor: "rgba(26,144,144,0.30)",
  },
  rightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rightsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rightsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(26,144,144,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightsHeaderText: {
    flex: 1,
    gap: 2,
  },
  rightsHeaderTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
  },
  rightsHeaderSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  rightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  rightItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(26,144,144,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  rightItemText: {
    flex: 1,
    gap: 3,
  },
  rightItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#EEF4FF",
  },
  rightItemBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 18,
  },
  rightsFooterLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 8,
  },
  rightsFooterLinkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
    flex: 1,
  },
});
