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
    body: "Hospice Roadmap collects only the information you choose to provide, such as your role, journey stage, and any information submitted through our forms. We do not collect or store personal health information beyond what you directly submit.\n\nWe may collect anonymized usage data to improve the app experience, such as feature usage frequency. This data cannot be used to identify individual users.",
  },
  {
    title: "How We Use Your Information",
    body: "Information you provide is used solely to:\n\n• Process referral and information requests\n• Personalize your app experience based on your selected role and journey stage\n• Respond to support inquiries\n\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.",
  },
  {
    title: "Data Storage and Security",
    body: "Your preferences and saved items are stored locally on your device using secure storage. Form submissions are transmitted over encrypted connections (TLS/SSL).\n\nWe implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.",
  },
  {
    title: "Medical Information Disclaimer",
    body: "Hospice Roadmap is an educational and navigation platform. Any health-related information you provide through forms is used only for processing your request and is not stored as part of a medical record.\n\nThis app is not a covered entity under HIPAA and is not a substitute for professional medical care.",
  },
  {
    title: "Third-Party Services",
    body: "This app may use third-party analytics and infrastructure services. These services are bound by their own privacy policies and are used solely to support app functionality and improvement.\n\nWe do not integrate with advertising networks or sell data to data brokers.",
  },
  {
    title: "Children's Privacy",
    body: "Hospice Roadmap is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided personal information, please contact us immediately.",
  },
  {
    title: "Your Rights",
    body: "You may request deletion of any personal information you have submitted to us by contacting our support team. You may also opt out of anonymized data collection at any time through app settings.",
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
