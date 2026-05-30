import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { BENEFITS_GUIDE_SECTIONS, type BenefitsSection } from "@/data/benefitsGuideContent";

const GUIDE_COLOR = "#63C8FF";
const GUIDE_PALE = "#071830";

function AccordionCard({ section, isOpen, onToggle }: {
  section: BenefitsSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={({ pressed }) => [
          styles.cardHeader,
          isOpen && styles.cardHeaderOpen,
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={section.title}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, isOpen && styles.cardIconOpen]}>
            <Feather
              name={section.icon as any}
              size={17}
              color={isOpen ? "#FFFFFF" : GUIDE_COLOR}
            />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardTitle, isOpen && styles.cardTitleOpen]}>
              {section.title}
            </Text>
            {!isOpen && (
              <Text style={styles.cardSummary} numberOfLines={2}>
                {section.summary}
              </Text>
            )}
          </View>
        </View>
        <Feather
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={17}
          color={isOpen ? GUIDE_COLOR : Colors.textSubtle}
        />
      </Pressable>

      {isOpen && (
        <View style={styles.cardBody}>
          <Text style={styles.bodySummary}>{section.summary}</Text>

          {section.body.map((paragraph, i) => (
            <View key={i} style={styles.paragraphRow}>
              <View style={styles.paragraphDot} />
              <Text style={styles.paragraph}>{paragraph}</Text>
            </View>
          ))}

          {section.tips && section.tips.length > 0 && (
            <View style={styles.tipBlock}>
              {section.tips.map((tip, i) => (
                <View key={i} style={styles.tip}>
                  <View style={styles.tipHeader}>
                    <Feather name="zap" size={12} color={Colors.amber} />
                    <Text style={styles.tipLabel}>{tip.label}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function BenefitsGuideScreen() {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<string | null>(null);

  function toggleSection(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
    >
      <CosmicBackground />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hospice & Medicare</Text>
          <Text style={styles.headerSub}>What's Covered — Plain Language Guide</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Feather name="file-text" size={24} color={GUIDE_COLOR} />
          </View>
          <Text style={styles.introTitle}>
            Most families pay nothing out of pocket for hospice care.
          </Text>
          <Text style={styles.introBody}>
            Medicare Part A covers an extensive package — medications, equipment,
            nursing, aides, social work, chaplain, and bereavement support. This
            guide explains what's covered, what's not, and what rights you have.
          </Text>
          <Text style={styles.introNote}>
            Tap any section to expand it. Works offline — no internet needed.
          </Text>
        </View>

        <View style={styles.accordionList}>
          {BENEFITS_GUIDE_SECTIONS.map((section) => (
            <AccordionCard
              key={section.id}
              section={section}
              isOpen={openId === section.id}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </View>

        <View style={styles.sourceNote}>
          <Feather name="info" size={13} color={Colors.textSubtle} />
          <Text style={styles.sourceText}>
            Based on the Medicare Hospice Benefit (42 CFR Part 418) and CMS
            Publication 02154. For Medicaid or private insurance coverage, contact
            your social worker — benefits vary significantly by state and plan.
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/help",
              params: {
                initialMessage:
                  "I have a question about what Medicare covers for hospice. Can you help me understand the financial side of hospice care?",
              },
            } as any)
          }
          style={({ pressed }) => [
            styles.ragnaBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.ragnaBtnIcon}>
            <Feather name="message-circle" size={20} color={GUIDE_COLOR} />
          </View>
          <View style={styles.ragnaBtnText}>
            <Text style={styles.ragnaBtnTitle}>Ask Ragna a benefits question</Text>
            <Text style={styles.ragnaBtnSub}>
              Get a personalized answer about your specific situation
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={GUIDE_COLOR + "80"} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(3,10,24,0.97)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    marginTop: 1,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 20,
  },

  introBanner: {
    backgroundColor: GUIDE_PALE,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: GUIDE_COLOR + "28",
  },
  introIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: GUIDE_COLOR + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  introTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
    textAlign: "center",
    lineHeight: 24,
  },
  introBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    textAlign: "center",
    lineHeight: 22,
  },
  introNote: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#4A6090",
    textAlign: "center",
    marginTop: 2,
  },

  accordionList: { gap: 10 },

  card: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.22)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    gap: 12,
  },
  cardHeaderOpen: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(60,90,170,0.22)",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: GUIDE_COLOR + "15",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconOpen: {
    backgroundColor: GUIDE_COLOR,
  },
  cardTitleWrap: { flex: 1, gap: 3 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#D8E4FF",
    letterSpacing: -0.2,
  },
  cardTitleOpen: {
    color: "#EEF4FF",
  },
  cardSummary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
    lineHeight: 17,
  },

  cardBody: {
    padding: 16,
    gap: 14,
  },
  bodySummary: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: GUIDE_COLOR,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  paragraphRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  paragraphDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GUIDE_COLOR + "60",
    marginTop: 7,
    flexShrink: 0,
  },
  paragraph: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8A9DC0",
    lineHeight: 21,
  },

  tipBlock: { gap: 10 },
  tip: {
    backgroundColor: "rgba(213,154,50,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(213,154,50,0.22)",
    gap: 6,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.amber,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#A8906A",
    lineHeight: 20,
  },

  sourceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  sourceText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5070",
    lineHeight: 17,
  },

  ragnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "rgba(14,22,58,0.90)",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: GUIDE_COLOR + "30",
  },
  ragnaBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: GUIDE_COLOR + "15",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ragnaBtnText: { flex: 1, gap: 3 },
  ragnaBtnTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#D8E4FF",
    letterSpacing: -0.2,
  },
  ragnaBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
  },
});
