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
    title: "Acceptance of Terms",
    body: "By downloading, installing, or using the Hospice Roadmap mobile application, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use the application.",
  },
  {
    title: "Not a Medical Service",
    body: "Hospice Roadmap is an educational and navigation platform designed to help users understand the hospice journey. It is NOT a medical service, does NOT constitute medical advice, and does NOT establish a physician-patient relationship.\n\nAlways seek the advice of a qualified healthcare provider with any questions you have regarding a medical condition or treatment. Never disregard professional medical advice or delay seeking it based on information from this app.",
  },
  {
    title: "Eligibility Assessment Tool",
    body: "The eligibility assessment tool within this app is for informational purposes only. Results are educational estimates based on commonly-referenced clinical guidelines and should NOT be interpreted as a clinical determination of hospice eligibility.\n\nActual hospice eligibility is determined by a licensed physician based on complete clinical evaluation.",
  },
  {
    title: "Provider Directory",
    body: "Provider listings are provided for informational purposes only. Hospice Roadmap does not endorse, certify, or recommend any specific provider. We do not verify or guarantee the accuracy, completeness, or currency of provider information.\n\nAlways verify provider credentials, services, insurance acceptance, and current availability directly with each provider.",
  },
  {
    title: "Referral and Information Requests",
    body: "Submitting a referral or information request through this app does not guarantee service, admission, or a response from any specific provider. Requests are informational in nature and do not constitute a binding agreement.",
  },
  {
    title: "User Content and Privacy",
    body: "Information you submit through forms is handled in accordance with our Privacy Policy. You represent that any information you provide is accurate to the best of your knowledge.",
  },
  {
    title: "Limitation of Liability",
    body: "Hospice Roadmap and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the application or its content.\n\nTo the maximum extent permitted by law, our total liability in connection with these terms shall not exceed the amount you paid (if any) for access to the app.",
  },
  {
    title: "Intellectual Property",
    body: "All content, features, and functionality of Hospice Roadmap — including text, graphics, icons, and educational resources — are the exclusive property of Hospice Roadmap and its licensors and are protected by applicable intellectual property laws.",
  },
  {
    title: "Changes to Terms",
    body: "We reserve the right to modify these Terms of Use at any time. Significant changes will be communicated within the app. Your continued use after changes are posted constitutes your acceptance of the updated terms.",
  },
  {
    title: "Governing Law",
    body: "These Terms are governed by the laws of the United States. Any disputes shall be resolved in the appropriate courts of competent jurisdiction.",
  },
  {
    title: "Contact",
    body: "Questions about these Terms of Use should be directed to our support team through the app's Contact Support feature, or via email at legal@hospiceroadmap.com.",
  },
];

export default function TermsScreen() {
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
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          These Terms of Use contain important information about your rights and
          obligations when using Hospice Roadmap. Please read them carefully.
        </Text>
      </View>

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
  warningBox: {
    backgroundColor: Colors.amberPale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight + "60",
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 20,
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
