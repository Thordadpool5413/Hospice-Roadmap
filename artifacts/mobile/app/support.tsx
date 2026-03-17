import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Colors } from "@/constants/colors";
import { SupportTopic } from "@/types";

const topics: { id: SupportTopic; label: string; icon: string }[] = [
  { id: "general_question", label: "General Question", icon: "help-circle" },
  { id: "provider_search", label: "Provider Search Help", icon: "map-pin" },
  { id: "caregiver_support", label: "Caregiver Support", icon: "heart" },
  { id: "bereavement", label: "Grief & Bereavement", icon: "sun" },
  { id: "eligibility_question", label: "Eligibility Question", icon: "clipboard" },
  { id: "other", label: "Other", icon: "more-horizontal" },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [preferredContact, setPreferredContact] = useState<"email" | "phone">("email");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Required";
    if (!form.email && preferredContact === "email") e.email = "Required";
    if (!form.phone && preferredContact === "phone") e.phone = "Required";
    if (!form.message) e.message = "Please describe how we can help";
    if (!topic) e.topic = "Please select a topic";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const topicLabel = topics.find((t) => t.id === topic)?.label ?? "Support Request";
    const subject = encodeURIComponent(`Hospice Roadmap: ${topicLabel}`);
    const contactInfo = preferredContact === "email" ? `Email: ${form.email}` : `Phone: ${form.phone}`;
    const body = encodeURIComponent(
      `Name: ${form.name}\n${contactInfo}\n\nMessage:\n${form.message}`
    );
    const mailUrl = `mailto:support@hospiceroadmap.app?subject=${subject}&body=${body}`;

    setLoading(true);
    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
      }
    } catch {
      // Silently fail — form still shows confirmation
    }
    setLoading(false);
    setSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (submitted) {
    return (
      <View style={[styles.successContainer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.successIcon}>
          <Feather name="message-circle" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Message Received</Text>
        <Text style={styles.successBody}>
          Thank you for reaching out. Our team will respond within 1 business
          day via your preferred contact method.
        </Text>
        <Button
          title="Return Home"
          onPress={() => router.replace("/(tabs)")}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
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
      {/* Intro */}
      <View style={styles.introBox}>
        <Feather name="message-circle" size={20} color={Colors.primary} />
        <Text style={styles.introText}>
          Our support team is here to help with questions about hospice, providers, referrals, or any other aspect of the journey.
        </Text>
      </View>

      {/* Topic */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How can we help?</Text>
        {errors.topic && <Text style={styles.errorText}>{errors.topic}</Text>}
        <View style={styles.topicGrid}>
          {topics.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTopic(t.id);
              }}
              style={({ pressed }) => [
                styles.topicCard,
                topic === t.id && styles.topicCardActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather
                name={t.icon as any}
                size={18}
                color={topic === t.id ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.topicLabel,
                  topic === t.id && styles.topicLabelActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Information</Text>
        <View style={styles.fieldGroup}>
          <TextInput
            label="Full Name"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Your name"
            error={errors.name}
            required
          />
          <TextInput
            label="Email Address"
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <TextInput
            label="Phone Number"
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>
      </View>

      {/* Preferred Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Contact Method</Text>
        <View style={styles.contactRow}>
          {(["email", "phone"] as const).map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPreferredContact(c);
              }}
              style={({ pressed }) => [
                styles.contactBtn,
                preferredContact === c && styles.contactBtnActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather
                name={c === "email" ? "mail" : "phone"}
                size={16}
                color={preferredContact === c ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.contactBtnText,
                  preferredContact === c && styles.contactBtnTextActive,
                ]}
              >
                {c === "email" ? "Email" : "Phone Call"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Message */}
      <View style={styles.section}>
        <TextInput
          label="Message"
          value={form.message}
          onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
          placeholder="Describe how we can help you..."
          multiline
          numberOfLines={5}
          style={styles.textArea}
          error={errors.message}
          required
        />
      </View>

      <Button
        title="Send Message"
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
  introBox: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C5DDD5",
  },
  introText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
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
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
    marginTop: -6,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  topicCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  topicCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  topicLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    flex: 1,
    flexWrap: "wrap",
  },
  topicLabelActive: {
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
  fieldGroup: {
    gap: 14,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  contactBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  contactBtnTextActive: {
    color: Colors.primaryDark,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 12,
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
