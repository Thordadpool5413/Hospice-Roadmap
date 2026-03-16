import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Colors } from "@/constants/colors";

type RequestType = "information" | "referral";
type Urgency = "routine" | "urgent" | "emergent";

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("information");
  const [urgency, setUrgency] = useState<Urgency>("routine");

  const [form, setForm] = useState({
    patientName: "",
    patientDOB: "",
    diagnosis: "",
    contactName: "",
    contactPhone: "",
    contactRelationship: "",
    physicianName: "",
    additionalNotes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.contactName) newErrors.contactName = "Required";
    if (!form.contactPhone) newErrors.contactPhone = "Required";
    if (requestType === "referral") {
      if (!form.patientName) newErrors.patientName = "Required";
      if (!form.diagnosis) newErrors.diagnosis = "Required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (submitted) {
    return (
      <View style={[styles.successContainer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.successIcon}>
          <Feather name="check" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Request Submitted</Text>
        <Text style={styles.successBody}>
          Your{" "}
          {requestType === "referral" ? "referral request" : "information request"} has
          been received. Our team will reach out within 1 business day to
          follow up.
        </Text>
        <Button
          title="Return Home"
          onPress={() => router.replace("/(tabs)")}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
        <Button
          title="Submit Another"
          onPress={() => {
            setSubmitted(false);
            setForm({
              patientName: "",
              patientDOB: "",
              diagnosis: "",
              contactName: "",
              contactPhone: "",
              contactRelationship: "",
              physicianName: "",
              additionalNotes: "",
            });
          }}
          variant="ghost"
          fullWidth
          size="md"
        />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      {/* Request Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Type</Text>
        <View style={styles.typeRow}>
          {(["information", "referral"] as RequestType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRequestType(type);
              }}
              style={({ pressed }) => [
                styles.typeBtn,
                requestType === type && styles.typeBtnActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather
                name={type === "information" ? "info" : "send"}
                size={16}
                color={requestType === type ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  requestType === type && styles.typeBtnTextActive,
                ]}
              >
                {type === "information" ? "Information Request" : "Hospice Referral"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.typeDesc}>
          {requestType === "information"
            ? "Request general information about hospice services — no patient details required."
            : "Submit a formal referral request for a patient who may be hospice-eligible."}
        </Text>
      </View>

      {/* Patient Info (Referral only) */}
      {requestType === "referral" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.fieldGroup}>
            <TextInput
              label="Patient Full Name"
              value={form.patientName}
              onChangeText={(v) => setForm((f) => ({ ...f, patientName: v }))}
              placeholder="First and last name"
              error={errors.patientName}
              required
            />
            <TextInput
              label="Date of Birth"
              value={form.patientDOB}
              onChangeText={(v) => setForm((f) => ({ ...f, patientDOB: v }))}
              placeholder="MM/DD/YYYY"
              keyboardType="numeric"
            />
            <TextInput
              label="Primary Diagnosis"
              value={form.diagnosis}
              onChangeText={(v) => setForm((f) => ({ ...f, diagnosis: v }))}
              placeholder="e.g., COPD, Congestive Heart Failure"
              error={errors.diagnosis}
              required
            />
            <TextInput
              label="Referring Physician"
              value={form.physicianName}
              onChangeText={(v) => setForm((f) => ({ ...f, physicianName: v }))}
              placeholder="Physician name"
            />
          </View>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.sectionSubtitle}>
          Who should we contact to follow up?
        </Text>
        <View style={styles.fieldGroup}>
          <TextInput
            label="Contact Name"
            value={form.contactName}
            onChangeText={(v) => setForm((f) => ({ ...f, contactName: v }))}
            placeholder="Your full name"
            error={errors.contactName}
            required
          />
          <TextInput
            label="Phone Number"
            value={form.contactPhone}
            onChangeText={(v) => setForm((f) => ({ ...f, contactPhone: v }))}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
            error={errors.contactPhone}
            required
          />
          <TextInput
            label="Relationship to Patient"
            value={form.contactRelationship}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, contactRelationship: v }))
            }
            placeholder="e.g., Daughter, Social Worker, Physician"
          />
        </View>
      </View>

      {/* Urgency (Referral only) */}
      {requestType === "referral" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency</Text>
          <View style={styles.urgencyRow}>
            {(["routine", "urgent", "emergent"] as Urgency[]).map((u) => (
              <Pressable
                key={u}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUrgency(u);
                }}
                style={({ pressed }) => [
                  styles.urgencyBtn,
                  urgency === u && styles.urgencyBtnActive,
                  u === "emergent" && urgency === u && styles.urgencyBtnEmergent,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyBtnText,
                    urgency === u && styles.urgencyBtnTextActive,
                    u === "emergent" && urgency === u && styles.urgencyBtnTextEmergent,
                  ]}
                >
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Additional Notes */}
      <View style={styles.section}>
        <TextInput
          label="Additional Notes"
          value={form.additionalNotes}
          onChangeText={(v) => setForm((f) => ({ ...f, additionalNotes: v }))}
          placeholder="Any additional context, questions, or details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Feather name="lock" size={13} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          Your information is kept confidential and used only to process your
          request. We do not share personal information with third parties.
        </Text>
      </View>

      <Button
        title={requestType === "referral" ? "Submit Referral" : "Submit Request"}
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        size="lg"
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: -6,
  },
  typeRow: {
    gap: 8,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  typeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
  typeDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
  },
  fieldGroup: {
    gap: 14,
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  urgencyBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary,
  },
  urgencyBtnEmergent: {
    backgroundColor: Colors.errorPale,
    borderColor: Colors.error,
  },
  urgencyBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  urgencyBtnTextActive: {
    color: Colors.primaryDark,
  },
  urgencyBtnTextEmergent: {
    color: Colors.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  successBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 23,
  },
});
