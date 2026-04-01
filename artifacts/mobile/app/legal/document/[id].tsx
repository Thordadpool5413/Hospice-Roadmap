import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { CategoryChip } from "@/components/legal/CategoryChip";
import { LegalDisclaimerCard } from "@/components/legal/LegalDisclaimerCard";
import { LegalMetadataCard } from "@/components/legal/LegalMetadataCard";
import { LegalRequirementsCard } from "@/components/legal/LegalRequirementsCard";
import { OfficialLinkButton } from "@/components/legal/OfficialLinkButton";
import { ReviewBadge } from "@/components/legal/ReviewBadge";
import { SavedItemButton } from "@/components/legal/SavedItemButton";
import { Colors } from "@/constants/colors";
import { getLegalDocument, getStateRegistry } from "@/content/legal";
import { LegalDocumentEntry, StateCode } from "@/content/legal/types";
import { useLegalBookmarks } from "@/hooks/useLegalBookmarks";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ds.section}>
      <Text style={ds.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <View style={ds.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={ds.bulletRow}>
          <View style={[ds.bulletDot, { backgroundColor: color ?? Colors.primary }]} />
          <Text style={ds.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function InfoCard({ content }: { content: string }) {
  return (
    <View style={ds.infoCard}>
      <Text style={ds.infoText}>{content}</Text>
    </View>
  );
}

function ExpandableSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={ds.expandWrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [ds.expandHeader, pressed && { opacity: 0.8 }]}
      >
        <Feather name={icon as any} size={14} color={Colors.primary} />
        <Text style={ds.expandTitle}>{title}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color={Colors.textMuted} />
      </Pressable>
      {open && <View style={ds.expandContent}>{children}</View>}
    </View>
  );
}

export default function LegalDocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleDoc, isDocSaved } = useLegalBookmarks();

  const stateCode = id ? (id.slice(0, 2).toUpperCase() as StateCode) : undefined;
  const doc: LegalDocumentEntry | undefined =
    stateCode && id ? getLegalDocument(stateCode, id) : undefined;
  const stateName = doc ? getStateRegistry(doc.stateCode)?.stateName : undefined;

  if (!doc) {
    return (
      <View style={ds.notFound}>
        <CosmicBackground />
        <Feather name="alert-circle" size={32} color={Colors.textSubtle} />
        <Text style={ds.notFoundText}>Document not found</Text>
        <Pressable onPress={() => router.back()} style={ds.backLink}>
          <Text style={ds.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={ds.container}>
      <CosmicBackground />

      {/* Header */}
      <View style={[ds.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [ds.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={ds.headerCenter}>
          <Text style={ds.headerTitle} numberOfLines={1}>{doc.title}</Text>
          {stateName && <Text style={ds.headerSub}>{stateName}</Text>}
        </View>
        <SavedItemButton
          saved={isDocSaved(doc.id)}
          onToggle={() => toggleDoc(doc.id)}
          size={20}
        />
      </View>

      <ScrollView
        style={ds.scroll}
        contentContainerStyle={[ds.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={ds.titleBlock}>
          <Text style={ds.docTitle}>{doc.title}</Text>
          {doc.commonNames.length > 0 && (
            <Text style={ds.commonNames}>
              Also known as: {doc.commonNames.join(", ")}
            </Text>
          )}
          <View style={ds.chipsRow}>
            <CategoryChip category={doc.category} />
            <ReviewBadge status={doc.review.reviewStatus} />
          </View>
        </View>

        {/* Summary */}
        <InfoCard content={doc.summary} />

        {/* Key fields */}
        <SectionCard title="What It Does">
          <Text style={ds.bodyText}>{doc.whatItDoes}</Text>
        </SectionCard>

        <SectionCard title="Who It's For">
          <Text style={ds.bodyText}>{doc.whoItsFor}</Text>
        </SectionCard>

        {/* Who Signs */}
        <SectionCard title="Who Signs">
          <BulletList items={doc.whoSigns} color={Colors.primary} />
        </SectionCard>

        {/* Requirements */}
        <SectionCard title="Execution Requirements">
          <LegalRequirementsCard
            witnessReq={doc.witnessRequirement}
            notaryReq={doc.notaryRequirement}
            specialReqs={doc.specialRequirements}
          />
        </SectionCard>

        {/* Honored by */}
        <SectionCard title="Honored By">
          <Text style={ds.bodyText}>{doc.honoredBySummary}</Text>
          {doc.honoredBy.length > 0 && (
            <BulletList items={doc.honoredBy} color="#58B6FF" />
          )}
        </SectionCard>

        {/* Out of state */}
        {doc.outOfStateRecognition ? (
          <SectionCard title="Out-of-State Recognition">
            <Text style={ds.bodyText}>{doc.outOfStateRecognition}</Text>
          </SectionCard>
        ) : null}

        {/* How to complete */}
        {doc.howToCompleteSteps.length > 0 && (
          <SectionCard title="How to Complete">
            <View style={ds.stepList}>
              {doc.howToCompleteSteps.map((step, i) => (
                <View key={i} style={ds.stepRow}>
                  <View style={ds.stepNum}>
                    <Text style={ds.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={ds.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Storage guidance */}
        {doc.storageGuidance.length > 0 && (
          <SectionCard title="Where to Store It">
            <BulletList items={doc.storageGuidance} color="#D59A32" />
          </SectionCard>
        )}

        {/* Official links */}
        <SectionCard title="Official Sources">
          <View style={ds.linksRow}>
            <OfficialLinkButton
              label="Official Form"
              url={doc.officialFormUrl}
              icon="file-text"
            />
            <OfficialLinkButton
              label="State Page"
              url={doc.officialInfoUrl}
              icon="globe"
              variant="secondary"
            />
          </View>
          {doc.additionalOfficialUrls.length > 0 && (
            <View style={ds.additionalLinksSection}>
              <Text style={ds.additionalLinksTitle}>Additional Official Resources</Text>
              <View style={ds.linksRow}>
                {doc.additionalOfficialUrls.map((link, i) => (
                  <OfficialLinkButton
                    key={i}
                    label={link.label}
                    url={link.url}
                    icon="external-link"
                    variant="secondary"
                  />
                ))}
              </View>
            </View>
          )}
        </SectionCard>

        {/* Education expandables */}
        <SectionCard title="Learn More">
          <ExpandableSection title="Why it matters" icon="heart">
            <Text style={ds.bodyText}>{doc.educationContent.whyItMatters}</Text>
          </ExpandableSection>
          <ExpandableSection title="When to use it" icon="clock">
            <Text style={ds.bodyText}>{doc.educationContent.whenToUseIt}</Text>
          </ExpandableSection>
          {doc.educationContent.commonMistakes.length > 0 && (
            <ExpandableSection title="Common mistakes to avoid" icon="alert-triangle">
              <BulletList items={doc.educationContent.commonMistakes} color="#F09A7A" />
            </ExpandableSection>
          )}
          {doc.educationContent.questionsToAsk.length > 0 && (
            <ExpandableSection title="Questions to ask" icon="help-circle">
              <BulletList items={doc.educationContent.questionsToAsk} color="#B97DFF" />
            </ExpandableSection>
          )}
        </SectionCard>

        {/* Metadata */}
        <SectionCard title="Source & Review Status">
          <LegalMetadataCard review={doc.review} />
        </SectionCard>

        <LegalDisclaimerCard />
      </ScrollView>
    </View>
  );
}

const ds = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  backLink: { paddingHorizontal: 16, paddingVertical: 8 },
  backLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2, textAlign: "center" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  titleBlock: { gap: 8 },
  docTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#F3F6FF", letterSpacing: -0.5 },
  commonNames: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8F9AB8", lineHeight: 18 },
  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  infoCard: {
    backgroundColor: "rgba(20,40,88,0.78)",
    borderWidth: 1, borderColor: "rgba(53,94,159,0.40)",
    borderRadius: 14, padding: 14,
  },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: "#8F9AB8", textTransform: "uppercase", letterSpacing: 0.6,
  },
  bodyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 20 },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 7, flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 19 },
  stepList: { gap: 10 },
  stepRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(103,183,255,0.15)",
    borderWidth: 1, borderColor: "rgba(103,183,255,0.35)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#67B7FF" },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#B6C0DA", lineHeight: 19 },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  additionalLinksSection: { gap: 8, marginTop: 4 },
  additionalLinksTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    color: "#8F9AB8", textTransform: "uppercase", letterSpacing: 0.5,
  },
  expandWrap: {
    backgroundColor: "rgba(20,40,88,0.65)",
    borderWidth: 1, borderColor: "rgba(53,94,159,0.30)",
    borderRadius: 12, overflow: "hidden",
  },
  expandHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12,
  },
  expandTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#B6C0DA" },
  expandContent: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
});
