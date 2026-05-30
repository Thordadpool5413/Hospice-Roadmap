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

interface Myth {
  icon: string;
  myth: string;
  truth: string;
}

const MYTHS: Myth[] = [
  {
    icon: "x-circle",
    myth: "Myth: Choosing hospice means giving up",
    truth:
      "Hospice is a shift in focus — from trying to cure an illness to ensuring the very best quality of life. Studies show hospice patients often live as long or longer than those who continue aggressive treatment, and consistently report better comfort and satisfaction with care.",
  },
  {
    icon: "refresh-cw",
    myth: "Myth: Hospice is a one-way door",
    truth:
      "You can leave hospice and re-enroll at any time, with no penalty. If a patient's condition improves or stabilizes, the care plan simply changes. Families revoke hospice, pursue a treatment, and return to hospice all the time — it is your choice, always.",
  },
  {
    icon: "home",
    myth: "Myth: Hospice means going to a facility",
    truth:
      "Most hospice care happens at home — your home, a family member's home, or an assisted living facility. A skilled team comes to you. Inpatient hospice is available for short-term crisis care, but home is where the majority of hospice journeys unfold.",
  },
  {
    icon: "trending-up",
    myth: "Myth: Hospice hastens death",
    truth:
      "Hospice neither hastens nor delays the natural progression of illness. Comfort-focused care relieves the physical and emotional burden on the body. Patients on hospice often eat better, rest better, and feel more at peace — which supports their own strength.",
  },
  {
    icon: "dollar-sign",
    myth: "Myth: Hospice is expensive",
    truth:
      "For most patients, hospice is fully covered by Medicare Part A, Medicaid, and the majority of private insurance plans. The Medicare Hospice Benefit covers physician services, nursing, medications for comfort, equipment, and family counseling — at no additional cost.",
  },
];

export default function HospiceMythsScreen() {
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
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Feather name="shield" size={26} color={Colors.journeyBefore} />
        </View>
        <Text style={styles.heroTitle}>Why Hospice?</Text>
        <Text style={styles.heroSubtitle}>
          Many families hesitate because of fears that turn out not to be true.
          Here are the most common misconceptions — and what the evidence
          actually shows.
        </Text>
      </View>

      {/* Reassurance banner */}
      <View style={styles.banner}>
        <Feather name="info" size={17} color={Colors.journeyBefore} />
        <Text style={styles.bannerText}>
          These are real concerns, and you're not alone in having them. Every
          question is worth asking — that's what this page is for.
        </Text>
      </View>

      {/* Myth cards */}
      <View style={styles.cards}>
        {MYTHS.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardIcon}>
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={Colors.journeyBefore}
                />
              </View>
              <Text style={styles.mythLabel}>{item.myth}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.truthText}>{item.truth}</Text>
          </View>
        ))}
      </View>

      {/* Assessment CTA */}
      <Pressable
        onPress={() => router.push("/evaluation")}
        style={({ pressed }) => [
          styles.assessCta,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View style={styles.assessCtaIcon}>
          <Feather name="clipboard" size={19} color="#FFFFFF" />
        </View>
        <View style={styles.assessCtaText}>
          <Text style={styles.assessCtaTitle}>Ready to Check Eligibility?</Text>
          <Text style={styles.assessCtaSub}>
            Take the guided assessment to understand your options
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
      </Pressable>

      {/* Ragna CTA */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(tabs)/help",
            params: {
              initialMessage:
                "I have questions and concerns about choosing hospice. Can you help me understand whether it's the right time?",
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
            Ask questions, get guidance, process your feelings
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(238,244,255,0.60)" />
      </Pressable>

      <Text style={styles.disclaimer}>
        This page is educational and does not constitute medical advice. Speak
        with the hospice team or your physician for guidance specific to your
        situation.
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
    backgroundColor: Colors.journeyBefore + "18",
    borderWidth: 1,
    borderColor: Colors.journeyBefore + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  banner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: Colors.journeyBefore + "15",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.journeyBefore + "28",
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.journeyBefore + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  mythLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 0,
  },
  truthText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },

  assessCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.journeyBefore,
    borderRadius: 16,
    padding: 16,
  },
  assessCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  assessCtaText: {
    flex: 1,
    gap: 3,
  },
  assessCtaTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  assessCtaSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
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
