import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MedicationPicker } from "@/components/MedicationPicker";
import { CosmicBackground } from "@/components/CosmicBackground";
import { InteractionModal } from "@/components/InteractionModal";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { MedicationEntry, PatientProfile } from "@/types";

interface FieldConfig {
  key: keyof PatientProfile;
  label: string;
  placeholder: string;
  hint: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad";
}

const FIELDS: FieldConfig[] = [
  {
    key: "patientName",
    label: "Patient's first name",
    placeholder: "e.g. Margaret",
    hint: "Helps Ragna address your patient by name.",
  },
  {
    key: "diagnosis",
    label: "Primary diagnosis",
    placeholder: "e.g. end-stage COPD, CHF, dementia",
    hint: "Ragna tailors symptom guidance to the specific disease.",
  },
  {
    key: "equipmentInHome",
    label: "Medical equipment in the home",
    placeholder: "e.g. hospital bed, oxygen concentrator, suction machine",
    hint: "Helps Ragna troubleshoot equipment issues and caregiving tasks.",
    multiline: true,
  },
  {
    key: "hospicePhone",
    label: "Hospice main phone number",
    placeholder: "e.g. (555) 123-4567",
    hint: "Appears on the Call Hospice button.",
    keyboardType: "phone-pad",
  },
  {
    key: "hospiceAfterHoursPhone",
    label: "Hospice after-hours / on-call number",
    placeholder: "e.g. (555) 987-6543",
    hint: "The number to call nights, weekends, and holidays.",
    keyboardType: "phone-pad",
  },
  {
    key: "equipmentProviderPhone",
    label: "Equipment provider phone",
    placeholder: "e.g. (555) 246-8101",
    hint: "For oxygen, hospital bed, and equipment issues.",
    keyboardType: "phone-pad",
  },
  {
    key: "pharmacyPhone",
    label: "Pharmacy phone number",
    placeholder: "e.g. (555) 135-7911",
    hint: "For medication questions and refills.",
    keyboardType: "phone-pad",
  },
  {
    key: "additionalNotes",
    label: "Additional notes for Ragna",
    placeholder: "e.g. patient is non-verbal, allergic to morphine, family prefers no discussion of prognosis",
    hint: "Any other context that helps Ragna give better guidance.",
    multiline: true,
  },
];

export default function PatientProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updatePatientProfile, clearPatientProfile } = useApp();
  const { addObservation } = useRagnaLearning();
  const [profile, setProfile] = useState<PatientProfile>(
    user?.patientProfile ?? {}
  );
  const [medications, setMedications] = useState<MedicationEntry[]>(
    user?.patientProfile?.medications ?? []
  );
  const [interactionModalVisible, setInteractionModalVisible] = useState(false);

  const medicationNames = medications.map((m) => m.name);

  const update = (key: keyof PatientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const comfortKitMedications =
      medications.length > 0
        ? medications.map((m) => (m.doseNote ? `${m.name} ${m.doseNote}` : m.name)).join(", ")
        : undefined;
    updatePatientProfile({ ...profile, medications, comfortKitMedications });

    // Tell Ragna about the profile update
    const hadProfile = !!(user?.patientProfile?.patientName || user?.patientProfile?.diagnosis);
    const detail = [
      profile.patientName ? `patient: ${profile.patientName}` : "",
      profile.diagnosis ? `diagnosis: ${profile.diagnosis}` : "",
      medications.length > 0 ? `${medications.length} medication(s) listed` : "",
    ].filter(Boolean).join(", ");
    addObservation(
      "profile_updated",
      hadProfile ? "Patient profile updated" : "Patient profile set up for the first time",
      { detail: detail || undefined, significant: !hadProfile }
    ).catch(() => {});

    Alert.alert(
      "Profile Saved",
      "This information can now be used to personalize Ragna. It is stored on this device and may be included when you chat with Ragna.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  const handleClear = () => {
    Alert.alert(
      "Clear Patient Profile",
      "Remove saved patient profile details from this device? Goals of care will be kept unless you clear them separately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setProfile({});
            setMedications([]);
            await clearPatientProfile();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CosmicBackground />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Image
              source={require("@/assets/images/ragna-icon.png")}
              style={{ width: 32, height: 32, borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Personalize Ragna</Text>
            <Text style={styles.bannerBody}>
              This information is stored on your device and can be used to personalize Ragna. If you chat with Ragna, relevant details may be sent with your request. Every field is optional.
            </Text>
          </View>
        </View>

        {FIELDS.slice(0, 2).map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={[styles.fieldInput, field.multiline && styles.fieldInputMulti]}
              value={(profile[field.key] as string) ?? ""}
              onChangeText={(text) => update(field.key, text)}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.textMuted}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 3 : 1}
              keyboardType={field.keyboardType ?? "default"}
              returnKeyType={field.multiline ? "default" : "next"}
            />
            <Text style={styles.fieldHint}>{field.hint}</Text>
          </View>
        ))}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Comfort kit medications in the home</Text>
          <MedicationPicker medications={medications} onChange={setMedications} />
          <Text style={styles.fieldHint}>
            Search for medications by name — Ragna can give precise guidance on when and how to use each one. Tap any added medication to record its dose and route.
          </Text>
          {medicationNames.length >= 2 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInteractionModalVisible(true);
              }}
              style={({ pressed }) => [styles.interactionBtn, pressed && { opacity: 0.80 }]}
            >
              <Feather name="shield" size={15} color={Colors.primary} />
              <Text style={styles.interactionBtnText}>Check Interactions</Text>
              <View style={styles.interactionBtnBadge}>
                <Text style={styles.interactionBtnBadgeText}>{medicationNames.length} meds</Text>
              </View>
            </Pressable>
          )}
        </View>

        {FIELDS.slice(2).map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={[styles.fieldInput, field.multiline && styles.fieldInputMulti]}
              value={(profile[field.key] as string) ?? ""}
              onChangeText={(text) => update(field.key, text)}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.textMuted}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 3 : 1}
              keyboardType={field.keyboardType ?? "default"}
              returnKeyType={field.multiline ? "default" : "next"}
            />
            <Text style={styles.fieldHint}>{field.hint}</Text>
          </View>
        ))}

        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="trash-2" size={15} color={Colors.textMuted} />
          <Text style={styles.clearBtnText}>Clear all profile data</Text>
        </Pressable>
      </ScrollView>

      <InteractionModal
        visible={interactionModalVisible}
        onClose={() => setInteractionModalVisible(false)}
        medicationNames={medicationNames}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1730",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(11,23,48,0.97)",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(60,120,255,0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(60,120,255,0.22)",
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(60,120,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
  },
  bannerBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 19,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#EEF4FF",
    letterSpacing: -0.1,
  },
  fieldInput: {
    backgroundColor: "rgba(8,16,45,0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(50,75,160,0.30)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#EEF4FF",
    minHeight: 48,
  },
  fieldInputMulti: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    lineHeight: 17,
  },
  interactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(60,120,255,0.10)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(60,120,255,0.30)",
  },
  interactionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  interactionBtnBadge: {
    backgroundColor: "rgba(60,120,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  interactionBtnBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 8,
    padding: 12,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
});

