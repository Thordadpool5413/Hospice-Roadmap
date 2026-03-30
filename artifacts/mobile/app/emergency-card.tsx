import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

export default function EmergencyCardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const profile = user?.patientProfile;

  const hasAnyContact =
    profile?.hospicePhone ||
    profile?.hospiceAfterHoursPhone ||
    profile?.equipmentProviderPhone ||
    profile?.pharmacyPhone;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryPale,
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
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
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
    backgroundColor: Colors.amberPale,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  contactValueEmpty: {
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    fontSize: 13,
  },
  callChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.errorPale,
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
    backgroundColor: Colors.divider,
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
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  infoValueEmpty: {
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    fontSize: 13,
  },
  textBlock: {
    padding: 14,
  },
  textBlockContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  emptyBlock: {
    padding: 14,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    fontStyle: "italic",
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
    color: Colors.text,
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
    color: Colors.textSubtle,
    lineHeight: 16,
  },
});
