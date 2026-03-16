import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { PatientProfile } from "@/types";

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
    hint: "Helps Compass address your patient by name.",
  },
  {
    key: "diagnosis",
    label: "Primary diagnosis",
    placeholder: "e.g. end-stage COPD, CHF, dementia",
    hint: "Compass tailors symptom guidance to the specific disease.",
  },
  {
    key: "comfortKitMedications",
    label: "Comfort kit medications in the home",
    placeholder: "e.g. morphine 5mg, lorazepam 1mg, glycopyrrolate",
    hint: "Compass can give you precise guidance on when and how to use these.",
    multiline: true,
  },
  {
    key: "equipmentInHome",
    label: "Medical equipment in the home",
    placeholder: "e.g. hospital bed, oxygen concentrator, suction machine",
    hint: "Helps Compass troubleshoot equipment issues and caregiving tasks.",
    multiline: true,
  },
  {
    key: "hospicePhone",
    label: "Hospice main phone number",
    placeholder: "e.g. (555) 123-4567",
    hint: "Appears on the Call Hospice button in Compass.",
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
    label: "Additional notes for Compass",
    placeholder: "e.g. patient is non-verbal, allergic to morphine, family prefers no discussion of prognosis",
    hint: "Any other context that helps Compass give better guidance.",
    multiline: true,
  },
];

export default function PatientProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updatePatientProfile } = useApp();
  const [profile, setProfile] = useState<PatientProfile>(
    user?.patientProfile ?? {}
  );

  const update = (key: keyof PatientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePatientProfile(profile);
    Alert.alert(
      "Profile Saved",
      "Compass will now use this information to give you personalized guidance.",
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  const handleClear = () => {
    Alert.alert(
      "Clear Profile",
      "Remove all patient information from this device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setProfile({});
            updatePatientProfile({});
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
            <Feather name="compass" size={20} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Personalize Compass</Text>
            <Text style={styles.bannerBody}>
              This information stays on your device and helps Compass give guidance specific to your patient's situation. Every field is optional.
            </Text>
          </View>
        </View>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={[styles.fieldInput, field.multiline && styles.fieldInputMulti]}
              value={profile[field.key] ?? ""}
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
    </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
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
    color: Colors.text,
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
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primary + "20",
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
    color: Colors.text,
  },
  bannerBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
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
    color: Colors.textMuted,
    lineHeight: 17,
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
    color: Colors.textMuted,
  },
});
