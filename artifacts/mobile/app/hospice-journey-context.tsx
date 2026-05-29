import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

interface Section {
  icon: string;
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    icon: "check-circle",
    title: "How the Eligibility Decision Was Made",
    body: "A physician certified — based on their clinical judgment — that the patient's illness followed a course where a prognosis of six months or less was reasonable. This is a medical determination made by qualified professionals who know the patient's full picture.",
  },
  {
    icon: "heart",
    title: "You Made a Thoughtful Choice",
    body: "Choosing hospice is an act of love and courage. It means prioritizing comfort, dignity, and quality of life — values that research consistently shows matter most to patients and families at this stage. There is nothing to second-guess.",
  },
  {
    icon: "refresh-cw",
    title: "Eligibility Can Be Revisited",
    body: "If a patient's condition stabilizes or improves, hospice can be revoked at any time with no penalty. The care team regularly re-certifies eligibility. Hospice is not a one-way door — it is flexible support that can be adjusted as the situation evolves.",
  },
  {
    icon: "users",
    title: "The Care Team Supports Your Decision",
    body: "Your hospice team — nurses, physicians, social workers, and chaplains — is there specifically because this path was chosen thoughtfully. They are partners in this journey, not evaluators. You are in the right place.",
  },
];

export default function HospiceJourneyContextScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 48 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Feather name="book-open" size={26} color={Colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Understanding Your{"\n"}Hospice Journey</Text>
        <Text style={styles.heroSubtitle}>
          You're exactly where you need to be. This is for families who want to
          understand how the hospice eligibility decision works — framed as
          context and validation, not re-evaluation.
        </Text>
      </View>

      {/* ── Validating banner ── */}
      <View style={styles.validationBanner}>
        <Feather name="shield" size={18} color="#59D0D5" />
        <Text style={styles.validationText}>
          The decision to choose hospice was made with care and clinical expertise.
          This page is context — not a question about whether you made the right call.
        </Text>
      </View>

      {/* ── Info sections ── */}
      <View style={styles.sections}>
        {SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Feather name={section.icon as any} size={19} color={Colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardBody}>{section.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Ragna CTA ── */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(tabs)/help",
            params: {
              initialMessage:
                "I have questions about how hospice eligibility works and whether we made the right decision.",
            },
          } as any)
        }
        style={({ pressed }) => [
          styles.ragnaCta,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(35, 70, 165, 0.92)", "rgba(25, 55, 140, 0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Feather name="message-circle" size={19} color="#EEF4FF" />
        <View style={styles.ragnaCtaText}>
          <Text style={styles.ragnaCtaTitle}>Talk with Ragna</Text>
          <Text style={styles.ragnaCtaSub}>
            Ask questions, process feelings, get guidance
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(238,244,255,0.60)" />
      </Pressable>

      <Text style={styles.disclaimer}>
        This page is educational and does not constitute medical advice. If you
        have questions about the current care plan, speak with your hospice team.
      </Text>
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
    gap: 20,
  },

  hero: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primary + "18",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
    textAlign: "center",
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  validationBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "rgba(89, 208, 213, 0.10)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(89, 208, 213, 0.25)",
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  sections: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "flex-start",
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  ragnaCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 255, 0.30)",
  },
  ragnaCtaText: {
    flex: 1,
    gap: 3,
  },
  ragnaCtaTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.2,
  },
  ragnaCtaSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(238,244,255,0.55)",
  },

  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
