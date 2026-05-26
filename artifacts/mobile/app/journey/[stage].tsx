import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResourceCard } from "@/components/ResourceCard";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { resources as mockResources } from "@/data/resources";
import { bereavementResources } from "@/data/mockBereavementResources";
import { JourneyStage } from "@/types";

const stageInfo: Record<
  JourneyStage,
  {
    title: string;
    subtitle: string;
    color: string;
    bg: string;
    sections: { title: string; body: string; icon: string }[];
  }
> = {
  before: {
    title: "Before Hospice",
    subtitle: "Research, eligibility guidance, and planning tools",
    color: Colors.journeyBefore,
    bg: Colors.journeyBeforePale,
    sections: [
      {
        icon: "help-circle",
        title: "What Is Hospice?",
        body: "Hospice is specialized comfort care for people nearing end of life. The focus shifts from curing illness to maximizing quality of life, managing symptoms, and supporting the entire family.",
      },
      {
        icon: "check-circle",
        title: "How Eligibility Works",
        body: "To qualify for the Medicare Hospice Benefit, a physician must certify that a patient's life expectancy is six months or less if the illness follows its expected course. Many diagnoses may qualify.",
      },
      {
        icon: "alert-circle",
        title: "Common Misconceptions",
        body: "Hospice doesn't mean giving up. Research shows patients in hospice often live as long or longer than those who continue aggressive treatment, with measurably better comfort.",
      },
      {
        icon: "clipboard",
        title: "Readiness Assessment",
        body: "Wondering if a patient may be ready for hospice? Our informational assessment helps you identify clinical characteristics associated with hospice eligibility.",
      },
    ],
  },
  during: {
    title: "During Hospice",
    subtitle: "Navigating care, symptoms, and caregiver support",
    color: Colors.journeyDuring,
    bg: Colors.journeyDuringPale,
    sections: [
      {
        icon: "users",
        title: "Your Care Team",
        body: "Your hospice team includes physicians, nurses, social workers, chaplains, home health aides, and volunteers — each with a specific role in supporting you and your family.",
      },
      {
        icon: "activity",
        title: "Managing Symptoms",
        body: "Hospice excels at managing pain, breathlessness, nausea, anxiety, and other symptoms. Your team can explain your options and ensure your loved one is comfortable.",
      },
      {
        icon: "heart",
        title: "Caregiver Support",
        body: "Caregivers are the unsung heroes of hospice. Respite care, education, and emotional support are available for you — not just the patient.",
      },
      {
        icon: "clock",
        title: "What to Expect",
        body: "Hospice unfolds over time. In early weeks, the team establishes care routines. As illness progresses, visits increase. The team prepares you every step of the way.",
      },
    ],
  },
  after: {
    title: "After Hospice",
    subtitle: "Grief support, bereavement, and practical next steps",
    color: Colors.journeyAfter,
    bg: Colors.journeyAfterPale,
    sections: [
      {
        icon: "sun",
        title: "Understanding Grief",
        body: "Grief after hospice is different for everyone. There is no timeline, no right way to feel. The hospice team's bereavement support continues for at least 13 months after a death.",
      },
      {
        icon: "list",
        title: "Practical Next Steps",
        body: "The days after a death involve both deep emotion and practical obligations. Obtaining death certificates, contacting Social Security, and notifying institutions are common early tasks.",
      },
      {
        icon: "book-open",
        title: "Bereavement Resources",
        body: "Support groups, grief counselors, hotlines, and educational programs are available to help families navigate the weeks and months ahead.",
      },
      {
        icon: "heart",
        title: "Honoring Your Loved One",
        body: "Memorial services, charitable donations, and other acts of remembrance can be a meaningful part of the grieving process and a lasting tribute.",
      },
    ],
  },
};

export default function JourneyStageScreen() {
  const { stage } = useLocalSearchParams<{ stage: string }>();
  const insets = useSafeAreaInsets();
  const { toggleSavedResource, isSavedResource } = useApp();

  if (!stage || !["before", "during", "after"].includes(stage)) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Invalid stage</Text>
      </View>
    );
  }

  const info = stageInfo[stage as JourneyStage];
  const stageResources = mockResources
    .filter((r) => r.journeyStage.includes(stage as JourneyStage))
    .slice(0, 4);

  const isAfter = stage === "after";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[styles.hero, { borderLeftColor: info.color }]}>
        <Text style={[styles.stageLabel, { color: info.color }]}>
          {info.title}
        </Text>
        <Text style={styles.heroSubtitle}>{info.subtitle}</Text>
      </View>

      {/* Info Sections */}
      <View style={styles.infoSections}>
        {info.sections.map((section, idx) => (
          <View key={idx} style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: info.color + "20" }]}>
              <Feather name={section.icon as any} size={18} color={info.color} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>{section.title}</Text>
              <Text style={styles.infoBody}>{section.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Tool CTA (Before stage) */}
      {stage === "before" && (
        <Pressable
          onPress={() => router.push("/evaluation")}
          style={({ pressed }) => [styles.toolBanner, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.toolBannerIcon}>
            <Feather name="clipboard" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.toolBannerText}>
            <Text style={styles.toolBannerTitle}>Eligibility Assessment</Text>
            <Text style={styles.toolBannerSubtitle}>
              Get informational guidance on hospice readiness
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#FFFFFF" />
        </Pressable>
      )}

      {/* After stage — Bereavement Resources */}
      {isAfter && (
        <View style={styles.bereavementSection}>
          <Text style={styles.sectionTitle}>Bereavement Resources</Text>
          <View style={styles.bereavementList}>
            {bereavementResources.slice(0, 4).map((resource) => (
              <View key={resource.id} style={styles.bereavementCard}>
                <View style={styles.bereavementHeader}>
                  <View
                    style={[
                      styles.bereavementTypeTag,
                      { backgroundColor: info.color + "20" },
                    ]}
                  >
                    <Text style={[styles.bereavementType, { color: info.color }]}>
                      {resource.type}
                    </Text>
                  </View>
                  {resource.isFree && (
                    <View style={styles.freeTag}>
                      <Text style={styles.freeTagText}>Free</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.bereavementTitle}>{resource.title}</Text>
                <Text style={styles.bereavementDesc}>{resource.description}</Text>
                {resource.phone && (
                  <View style={styles.contactRow}>
                    <Feather name="phone" size={13} color={info.color} />
                    <Text style={[styles.contactText, { color: info.color }]}>
                      {resource.phone}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Related Resources */}
      {stageResources.length > 0 && (
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>
            {isAfter ? "More Support" : "Related Articles"}
          </Text>
          <View style={styles.resourceList}>
            {stageResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPress={() =>
                  router.push({
                    pathname: "/resource/[id]",
                    params: { id: resource.id },
                  })
                }
                onSave={() => toggleSavedResource(resource.id)}
                isSaved={isSavedResource(resource.id)}
                compact
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: 20,
    gap: 24,
  },
  notFound: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  hero: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
  },
  stageLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  infoSections: {
    gap: 14,
  },
  infoCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "flex-start",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    gap: 5,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  infoBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toolBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.journeyBefore,
    borderRadius: 16,
    padding: 16,
  },
  toolBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBannerText: {
    flex: 1,
    gap: 3,
  },
  toolBannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  toolBannerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
  },
  bereavementSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  bereavementList: {
    gap: 12,
  },
  bereavementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 8,
  },
  bereavementHeader: {
    flexDirection: "row",
    gap: 8,
  },
  bereavementTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bereavementType: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  freeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.successPale,
  },
  freeTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
  bereavementTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  bereavementDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  resourcesSection: {
    gap: 12,
  },
  resourceList: {
    gap: 10,
  },
});
