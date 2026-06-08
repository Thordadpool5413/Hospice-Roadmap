import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import { LegalDisclaimerCard } from "@/components/legal/LegalDisclaimerCard";
import { Colors } from "@/constants/colors";

const SECTIONS = [
  {
    icon: "file-text",
    title: "What are advance directives?",
    body: "Advance directives are legal documents that record your wishes about medical treatment if you become unable to make decisions yourself. They typically include a Living Will (your specific wishes) and a Healthcare Proxy or Power of Attorney (who makes decisions for you).",
  },
  {
    icon: "activity",
    title: "What is a POLST / MOLST?",
    body: "POLST (Physician Orders for Life-Sustaining Treatment) and MOLST (Medical Orders for Life-Sustaining Treatment) are portable physician-signed medical orders — not just statements of wishes. They travel with the patient across all care settings and are immediately actionable by EMS. They are different from an advance directive.",
  },
  {
    icon: "heart",
    title: "What is a DNR / EMS DNR?",
    body: "A DNR (Do Not Resuscitate) order tells healthcare providers not to perform CPR if the heart stops. An EMS DNR specifically applies to paramedics and emergency responders outside the hospital. In some states (like Florida), the EMS DNR must be on specific colored paper to be valid.",
  },
  {
    icon: "user",
    title: "What is a Healthcare Proxy / Surrogate?",
    body: "A Healthcare Proxy or Surrogate is a person you legally authorize to make medical decisions on your behalf when you cannot make them yourself. Different states use different names: Health Care Proxy (Massachusetts), Health Care Surrogate (Florida), Healthcare Agent (California), and others.",
  },
  {
    icon: "star",
    title: "Why do forms vary by state?",
    body: "Each U.S. state has its own laws governing advance care planning documents. Forms, witness requirements, notary requirements, and what documents are legally recognized vary significantly. Always use your state's official form to ensure legal validity.",
  },
  {
    icon: "check-circle",
    title: "Do these travel across state lines?",
    body: "Most states have provisions to honor out-of-state advance directives, but this is not guaranteed. If you spend significant time in another state — especially if you have a terminal illness — consider completing that state's forms as well. A POLST may have limited recognition across state borders.",
  },
  {
    icon: "database",
    title: "What is an advance directive registry?",
    body: "Some states maintain a centralized registry where you can register your advance directive. Healthcare providers can access it electronically. Registration is typically optional but helps ensure your documents are accessible in a crisis. Not all states have a registry.",
  },
  {
    icon: "shield",
    title: "About the content in this feature",
    body: "States with a 'Reviewed' badge have been verified against official state sources. States marked 'Pending Review' contain educational scaffolding only — not verified against current state law. State laws change. Always verify with official state sources, your hospice team, or legal counsel before relying on any document.",
  },
];

export default function LegalInfoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.container}>
      <CosmicBackground />

      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Understanding Legal Documents</Text>
          <Text style={s.headerSub}>A quick reference guide</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Medical and legal planning documents help ensure your healthcare wishes are known and honored, especially when you cannot speak for yourself. Here's what each type of document means.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.iconWrap}>
                <Feather name={section.icon as any} size={16} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>{section.title}</Text>
            </View>
            <Text style={s.cardBody}>{section.body}</Text>
          </View>
        ))}

        <LegalDisclaimerCard compact={false} />

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtnBottom, pressed && { opacity: 0.8 }]}
        >
          <Feather name="arrow-left" size={15} color={Colors.primary} />
          <Text style={s.backBtnText}>Back to State Directory</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1730" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(11,23,48,0.97)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#5A78A8", marginTop: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },
  intro: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: "#5A78A8", lineHeight: 20,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(55,85,170,0.22)",
    padding: 14, gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "rgba(60,120,255,0.12)",
    alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.2 },
  cardBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7A90B8", lineHeight: 19 },
  backBtnBottom: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center", paddingVertical: 10,
  },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});

