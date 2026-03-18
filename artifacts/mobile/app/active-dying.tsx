import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

const VERA_COLOR = Colors.primary;
const TWILIGHT = "#C0A0E8";
const TWILIGHT_PALE = "#1E1230";
const TWILIGHT_MID = "#9070B8";

interface SignItem {
  icon: string;
  title: string;
  timing: string;
  what: string;
  means: string;
  doThis: string;
}

const SIGNS: SignItem[] = [
  {
    icon: "moon",
    title: "Sleeping much more",
    timing: "Days to weeks before",
    what: "Your loved one sleeps most of the day and is hard to rouse. When awake, they may seem confused or distant.",
    means: "The body is conserving all remaining energy. This is not a coma — they can often still hear you.",
    doThis: "Sit close. Hold their hand. Speak softly. You don't need them to respond for your presence to matter.",
  },
  {
    icon: "coffee",
    title: "Refusing food and water",
    timing: "Days to weeks before",
    what: "They have little or no interest in eating or drinking, and may turn away from food.",
    means: "A dying body no longer needs or can process nutrition. Forcing food or fluids causes discomfort, not comfort.",
    doThis: "Offer small sips of water with a sponge swab for mouth comfort. Do not push food or drink.",
  },
  {
    icon: "users",
    title: "Withdrawing from the world",
    timing: "Days before",
    what: "They speak less, respond less, or seem to be looking at something you can't see. Some speak to people who have already died.",
    means: "This is a well-documented part of the dying process. It is not confusion or a sign of distress — it is transition.",
    doThis: "Don't challenge or dismiss what they say they see. A gentle 'That sounds peaceful' is enough.",
  },
  {
    icon: "droplet",
    title: "Dark or very little urine",
    timing: "Days before",
    what: "Urine becomes dark amber or brown, and the amount decreases significantly. The kidneys are slowing down.",
    means: "The body is conserving fluids and the kidneys are naturally shutting down. This is expected.",
    doThis: "Note and report to the hospice nurse. Keep the patient comfortable and clean.",
  },
  {
    icon: "wind",
    title: "Irregular or changed breathing",
    timing: "Hours to days before",
    what: "Breathing becomes slower, more irregular, or there are long pauses (10–60 seconds) between breaths. You may also notice faster, shallow breathing.",
    means: "The breathing center in the brain is changing. Pauses in breathing are called apnea and are a natural part of dying — not suffocation.",
    doThis: "Stay calm. Count the seconds between breaths if it helps you feel grounded. Call hospice if you are unsure.",
  },
  {
    icon: "alert-triangle",
    title: "Restlessness or agitation",
    timing: "Hours to days before",
    what: "They may pick at sheets, try to get out of bed, moan, or seem unable to settle — even with eyes closed. This is called terminal restlessness.",
    means: "This is a recognized neurological change, not emotional distress or pain in the usual sense.",
    doThis: "Call hospice — there are medications that help. Gentle touch, a calm voice, and soft music can also ease this.",
  },
  {
    icon: "activity",
    title: "Mottling — blotchy skin",
    timing: "Hours before",
    what: "Purplish-blue blotchy patches appear, usually starting in the knees and feet, then spreading upward.",
    means: "Blood is withdrawing from the extremities to protect the vital organs. This is a sign that death is close — hours, not days.",
    doThis: "Keep them comfortable and covered with a light blanket. Alert family who wish to be present.",
  },
  {
    icon: "thermometer",
    title: "Cooling hands and feet",
    timing: "Hours before",
    what: "The arms, legs, hands, and feet feel cool or cold to the touch, while the chest and face may still feel warm.",
    means: "Blood is circulating only to the core. This is painless and expected.",
    doThis: "Warm blankets bring comfort. Do not use electric blankets. Notify close family members.",
  },
  {
    icon: "mic-off",
    title: "Noisy or gurgling breathing",
    timing: "Hours before",
    what: "A rattling or gurgling sound with each breath, caused by secretions pooling in the throat.",
    means: "Your loved one is not choking or struggling. They cannot feel or hear the secretions. This sound is harder on family than it is on the patient.",
    doThis: "Gently turn them on their side. You can use a mouth swab to clear the lips. Call hospice — they may suggest repositioning or medication.",
  },
  {
    icon: "eye-off",
    title: "Eyes partially open, unfocused",
    timing: "Hours before",
    what: "Eyes may be half-open with a glassy or distant look, or they may move slowly without focusing.",
    means: "This is a natural relaxation of the muscles. It does not mean they are in pain or aware of anything distressing.",
    doThis: "You can gently close them with your fingers if it bothers you, but you don't need to.",
  },
];

const WHAT_TO_SAY = [
  { text: "\"I love you. I'm right here.\"", desc: "Simple presence is the most powerful thing you can offer." },
  { text: "\"It's okay to let go.\"", desc: "Many dying people hold on because they worry about those left behind. Permission helps." },
  { text: "\"We'll be okay.\"", desc: "This gives them peace that you will survive and move forward." },
  { text: "\"You've been so loved.\"", desc: "Hearing is believed to be the last sense to fade. They can hear you." },
  { text: "\"Thank you.\"", desc: "For whatever they have meant to you — say it now, plainly." },
  { text: "\"You're not alone.\"", desc: "Don't leave if you can stay. But if death comes when you step away, that is also okay." },
];

const WHEN_TO_CALL = [
  "Breathing changes that concern you — even if you can't explain why",
  "Signs of pain: grimacing, moaning, clenching",
  "Mottling appears or spreads quickly",
  "Terminal restlessness or agitation begins",
  "You believe death has occurred",
  "Anytime you feel unsure — there are no wrong reasons to call",
];

interface SignCardProps { item: SignItem; index: number; }

function SignCard({ item, index }: SignCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded((v) => !v);
      }}
      style={({ pressed }) => [styles.signCard, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.signCardHeader}>
        <View style={styles.signIconWrap}>
          <Feather name={item.icon as any} size={16} color={TWILIGHT} />
        </View>
        <View style={styles.signCardMeta}>
          <Text style={styles.signTiming}>{item.timing}</Text>
          <Text style={styles.signTitle}>{item.title}</Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.textSubtle}
        />
      </View>
      {expanded && (
        <View style={styles.signCardBody}>
          <Text style={styles.signWhat}>{item.what}</Text>
          <View style={styles.signBlock}>
            <View style={styles.signBlockDot} />
            <View style={styles.signBlockText}>
              <Text style={styles.signBlockLabel}>What this means</Text>
              <Text style={styles.signBlockBody}>{item.means}</Text>
            </View>
          </View>
          <View style={[styles.signBlock, { borderLeftColor: Colors.primary }]}>
            <View style={[styles.signBlockDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.signBlockText}>
              <Text style={[styles.signBlockLabel, { color: Colors.primary }]}>What to do</Text>
              <Text style={styles.signBlockBody}>{item.doThis}</Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function ActiveDyingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Active Dying</Text>
          <Text style={styles.headerSub}>What to expect in the final hours</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gentle intro */}
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Feather name="heart" size={22} color={TWILIGHT} />
          </View>
          <Text style={styles.introTitle}>You are not alone in this.</Text>
          <Text style={styles.introBody}>
            This guide is for the final 24–72 hours of life. The changes described here are natural — the body's way of letting go. Understanding what is happening can help you stay calm, stay present, and offer the comfort that matters most.
          </Text>
          <Text style={styles.introNote}>
            Tap any sign below to expand and read what it means and what to do.
          </Text>
        </View>

        {/* Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signs of Active Dying</Text>
          <Text style={styles.sectionSub}>Ordered from earliest to latest — each person's journey is different.</Text>
          <View style={styles.signList}>
            {SIGNS.map((s, i) => <SignCard key={i} item={s} index={i} />)}
          </View>
        </View>

        {/* What this all means */}
        <View style={[styles.meaningCard, { backgroundColor: TWILIGHT_PALE }]}>
          <Feather name="sun" size={20} color={TWILIGHT} style={{ marginBottom: 8 }} />
          <Text style={[styles.meaningTitle, { color: TWILIGHT }]}>What all of this means</Text>
          <Text style={styles.meaningBody}>
            The body is completing a natural process. These signs are not suffering — they are the body peacefully shutting down, redirecting energy away from the outside world and inward. Pain, if present, looks like grimacing, moaning, or muscle tension — which is different from these changes.
          </Text>
          <Text style={[styles.meaningBody, { marginTop: 8 }]}>
            Your presence matters more than anything you say or do. Simply being there — in the room, holding their hand, speaking softly — is the most powerful act of love in this moment.
          </Text>
        </View>

        {/* What to say */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Words to offer</Text>
          <Text style={styles.sectionSub}>Hearing is believed to be the last sense to fade.</Text>
          <View style={styles.sayList}>
            {WHAT_TO_SAY.map((item, i) => (
              <View key={i} style={styles.sayCard}>
                <Text style={styles.sayQuote}>{item.text}</Text>
                <Text style={styles.sayDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* When to call */}
        <View style={[styles.callCard, { borderLeftColor: Colors.amber }]}>
          <View style={styles.callHeader}>
            <Feather name="phone" size={16} color={Colors.amber} />
            <Text style={[styles.callTitle, { color: Colors.amber }]}>When to call hospice</Text>
          </View>
          <Text style={styles.callNote}>Call your hospice nurse any time you are uncertain. That is exactly what they are there for.</Text>
          {WHEN_TO_CALL.map((item, i) => (
            <View key={i} style={styles.callRow}>
              <View style={[styles.callDot, { backgroundColor: Colors.amber }]} />
              <Text style={styles.callText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* After death */}
        <View style={[styles.afterCard, { backgroundColor: Colors.backgroundSecondary }]}>
          <Text style={styles.afterTitle}>After death occurs</Text>
          <Text style={styles.afterBody}>
            You do not need to call 911. Call your hospice nurse first — they will guide you through next steps. There is no rush. You have time to sit with your loved one, say what you need to say, and be together as a family.
          </Text>
        </View>

        {/* Ask Ragna */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: "/(tabs)/help",
              params: { initialMessage: "I'm with my loved one right now and I think they may be actively dying. Can you help me understand what I'm seeing and what to do?" },
            } as any);
          }}
          style={({ pressed }) => [styles.veraBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 36, height: 36, borderRadius: 9 }}
            resizeMode="cover"
          />
          <View style={styles.veraBtnText}>
            <Text style={styles.veraBtnTitle}>Ask Ragna right now</Text>
            <Text style={styles.veraBtnSub}>Describe what you're seeing for personalized guidance</Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17, fontFamily: "Inter_700Bold",
    color: Colors.text, letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    color: Colors.textMuted, marginTop: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },

  introBanner: {
    backgroundColor: TWILIGHT_PALE,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: TWILIGHT_MID + "40",
  },
  introIconWrap: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: TWILIGHT + "18",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold",
    color: TWILIGHT, letterSpacing: -0.3, textAlign: "center",
  },
  introBody: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, textAlign: "center", lineHeight: 22,
  },
  introNote: {
    fontSize: 12, fontFamily: "Inter_500Medium",
    color: TWILIGHT + "99", textAlign: "center",
    marginTop: 4,
  },

  section: { gap: 10 },
  sectionTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold",
    color: Colors.text, letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textMuted, marginTop: -4,
  },
  signList: { gap: 8 },

  signCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  signCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  signIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: TWILIGHT_PALE,
    alignItems: "center", justifyContent: "center",
  },
  signCardMeta: { flex: 1 },
  signTiming: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    color: TWILIGHT, textTransform: "uppercase", letterSpacing: 0.4,
  },
  signTitle: {
    fontSize: 15, fontFamily: "Inter_600SemiBold",
    color: Colors.text, letterSpacing: -0.2, marginTop: 1,
  },
  signCardBody: {
    paddingHorizontal: 14, paddingBottom: 14, gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    paddingTop: 12,
  },
  signWhat: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 20,
  },
  signBlock: {
    flexDirection: "row",
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: TWILIGHT,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  signBlockDot: {
    width: 0,
  },
  signBlockText: { flex: 1, gap: 2 },
  signBlockLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    color: TWILIGHT, textTransform: "uppercase", letterSpacing: 0.3,
  },
  signBlockBody: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 19,
  },

  meaningCard: {
    borderRadius: 16, padding: 20, gap: 4,
    borderWidth: 1, borderColor: TWILIGHT_MID + "30",
  },
  meaningTitle: {
    fontSize: 16, fontFamily: "Inter_700Bold",
    letterSpacing: -0.2, marginBottom: 4,
  },
  meaningBody: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 22,
  },

  sayList: { gap: 8 },
  sayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.divider,
    gap: 4,
  },
  sayQuote: {
    fontSize: 15, fontFamily: "Inter_600SemiBold",
    color: Colors.text, letterSpacing: -0.1,
  },
  sayDesc: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: Colors.textMuted, lineHeight: 18,
  },

  callCard: {
    backgroundColor: Colors.amberPale,
    borderRadius: 14, padding: 16, gap: 8,
    borderLeftWidth: 4,
  },
  callHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  callTitle: {
    fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: -0.2,
  },
  callNote: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 19,
  },
  callRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  callDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  callText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 20,
  },

  afterCard: {
    borderRadius: 14, padding: 16, gap: 6,
  },
  afterTitle: {
    fontSize: 14, fontFamily: "Inter_700Bold",
    color: Colors.text, letterSpacing: -0.2,
  },
  afterBody: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 20,
  },

  veraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: VERA_COLOR,
    borderRadius: 16, padding: 16,
    shadowColor: VERA_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  veraBtnIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  veraBtnText: { flex: 1 },
  veraBtnTitle: {
    fontSize: 15, fontFamily: "Inter_700Bold",
    color: "#fff", letterSpacing: -0.2,
  },
  veraBtnSub: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)", marginTop: 2,
  },
});
