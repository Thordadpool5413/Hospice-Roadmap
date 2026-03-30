import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const sections = [
  {
    title: "Information We Collect",
    body: "Hospice Roadmap collects the information you choose to enter, such as your role, journey stage, patient profile details, goals of care, symptom tracking, reminders, journal entries, support messages, and conversations with Ragna. Some of this information is stored locally on your device to support app features. When you use server-backed features such as Ragna or provider search, information needed for those features may be transmitted to our server.",
  },
  {
    title: "How We Use Your Information",
    body: "Information you provide is used to:\n\n• Personalize your app experience\n• Generate guidance when you use Ragna\n• Power provider search and related app features\n• Help you contact support when you choose to do so\n\nWe do not sell or rent your personal information for marketing purposes.",
  },
  {
    title: "Data Storage and Security",
    body: "Many saved items in Hospice Roadmap are stored locally on your device using standard app storage. When you use server-backed features, information needed for those features is transmitted over encrypted connections when available. No method of electronic storage or transmission is completely secure.",
  },
  {
    title: "Medical Information Disclaimer",
    body: "Hospice Roadmap is an educational and navigation platform. Information entered into the app is used to support app features and personalization. It is not part of a medical record created by a healthcare provider.\n\nThis app is not a substitute for professional medical care.",
  },
  {
    title: "Third-Party Services",
    body: "We use third-party infrastructure to support app functionality, which may include AI-generated responses and public provider data services. We do not use advertising networks or sell data to data brokers.",
  },
  {
    title: "Children's Privacy",
    body: "Hospice Roadmap is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided personal information, please contact us immediately.",
  },
  {
    title: "Your Rights",
    body: "You can edit or remove much of your locally stored information directly in the app. If you have questions about deleting information associated with support or other server-backed features, contact our support team. This version of the app does not currently include an in-app analytics opt-out control.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Significant changes will be communicated through the app. Your continued use of Hospice Roadmap after changes are posted constitutes your acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    body: "If you have questions about this Privacy Policy or our data practices, please contact us through the Support section of this app or email privacy@hospiceroadmap.com.",
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.lastUpdated}>Last updated: January 1, 2026</Text>
      <Text style={styles.intro}>
        Hospice Roadmap ("we," "us," or "our") is committed to protecting your
        privacy. This Privacy Policy explains how we collect, use, and safeguard
        your information when you use our mobile application.
      </Text>

      {sections.map((section, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    gap: 24,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  intro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
