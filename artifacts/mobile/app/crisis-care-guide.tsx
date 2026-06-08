import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
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
import { useApp } from "@/context/AppContext";

const CRISIS_COLOR = "#E85040";
const CRISIS_PALE = "#1A0C0C";
const AMBER = Colors.amber;

interface CheckItem {
  id: string;
  label: string;
  detail: string;
}

const CRISIS_SYMPTOMS: CheckItem[] = [
  {
    id: "pain",
    label: "Uncontrolled pain",
    detail: "Pain that does not improve after giving comfort kit medications as directed",
  },
  {
    id: "breathing",
    label: "Severe breathing distress",
    detail: "Gasping, rapid breathing, or air hunger that does not ease with repositioning or medications",
  },
  {
    id: "agitation",
    label: "Extreme agitation or restlessness",
    detail: "Constant thrashing, calling out, or inability to settle even after trying comfort measures",
  },
  {
    id: "nausea",
    label: "Severe nausea or vomiting",
    detail: "Vomiting that prevents medications from being kept down or that continues for more than an hour",
  },
  {
    id: "unsafe",
    label: "You cannot safely manage alone",
    detail: "The situation at home feels out of control and you need hands-on nursing support",
  },
];

function CheckRow({
  item,
  checked,
  onToggle,
}: {
  item: CheckItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={({ pressed }) => [
        styles.checkRow,
        checked && styles.checkRowChecked,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Feather name="check" size={13} color="#fff" />}
      </View>
      <View style={styles.checkContent}>
        <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
          {item.label}
        </Text>
        <Text style={styles.checkDetail}>{item.detail}</Text>
      </View>
    </Pressable>
  );
}

export default function CrisisCareGuideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const profile = user?.patientProfile;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const anyChecked = Object.values(checked).some(Boolean);
  const hospicePhone = profile?.hospicePhone || profile?.hospiceAfterHoursPhone;

  const callScript = `Hi, my name is [your name] and I'm calling about ${profile?.patientName || "my loved one"}${profile?.diagnosis ? `, who has ${profile.diagnosis}` : ""}. I am calling because symptoms are not controlled and I cannot manage this safely at home. I need to request continuous care or crisis-level care — can you initiate an assessment? Specifically I am seeing: ${CRISIS_SYMPTOMS.filter((s) => checked[s.id]).map((s) => s.label.toLowerCase()).join(", ") || "uncontrolled symptoms"}. Please send a nurse or advise on next steps right now.`;

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
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
          <Text style={styles.headerTitle}>Crisis Care Guide</Text>
          <Text style={styles.headerSub}>Know when to ask for more support</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Feather name="alert-triangle" size={22} color={CRISIS_COLOR} />
          </View>
          <Text style={styles.introTitle}>
            You can ask for more help — most families don't know this.
          </Text>
          <Text style={styles.introBody}>
            If symptoms cannot be controlled at home, Medicare's hospice benefit
            includes two higher levels of care: a nurse who stays in your home
            for hours at a time, or a short stay at an inpatient facility.
            Either way, it's covered — and you can request it right now.
          </Text>
          <Text style={styles.introNote}>
            Check any symptoms happening right now to see your options.
          </Text>
        </View>

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Is any of this happening?</Text>
          <View style={styles.checkList}>
            {CRISIS_SYMPTOMS.map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                checked={!!checked[item.id]}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </View>
        </View>

        {/* Result — shown when anything is checked */}
        {anyChecked && (
          <View style={styles.resultSection}>
            <View style={styles.resultBanner}>
              <Feather name="alert-circle" size={18} color={CRISIS_COLOR} />
              <Text style={styles.resultTitle}>
                Your loved one may qualify for crisis-level hospice care.
              </Text>
            </View>

            <Text style={styles.resultBody}>
              Call your hospice nurse now and use the words{" "}
              <Text style={styles.resultEmphasis}>
                "I need to request continuous care."
              </Text>{" "}
              This signals that you know this level of support exists and
              triggers a formal assessment.
            </Text>

            {/* Call CTA */}
            {hospicePhone ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  Linking.openURL(`tel:${hospicePhone.replace(/\D/g, "")}`);
                }}
                style={({ pressed }) => [
                  styles.callBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Feather name="phone" size={20} color="#fff" />
                <View style={styles.callBtnText}>
                  <Text style={styles.callBtnTitle}>
                    Call Hospice — Request Crisis Care
                  </Text>
                  <Text style={styles.callBtnSub}>{hospicePhone}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push("/patient-profile")}
                style={({ pressed }) => [
                  styles.callBtn,
                  styles.callBtnSetup,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Feather name="phone" size={20} color={CRISIS_COLOR} />
                <View style={styles.callBtnText}>
                  <Text style={[styles.callBtnTitle, { color: CRISIS_COLOR }]}>
                    Add hospice number first
                  </Text>
                  <Text style={[styles.callBtnSub, { color: "#7A4040" }]}>
                    Tap to set up in Patient Profile
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={CRISIS_COLOR + "80"} />
              </Pressable>
            )}

            {/* Call Script */}
            <View style={styles.scriptCard}>
              <View style={styles.scriptHeader}>
                <Feather name="message-square" size={14} color={AMBER} />
                <Text style={styles.scriptLabel}>What to say</Text>
              </View>
              <Text style={styles.scriptText}>{callScript}</Text>
            </View>

            {/* Denial rights */}
            <View style={styles.denialCard}>
              <View style={styles.denialHeader}>
                <Feather name="shield" size={14} color={Colors.primary} />
                <Text style={styles.denialTitle}>If hospice says no</Text>
              </View>
              <Text style={styles.denialBody}>
                Ask the nurse to explain in writing why crisis-level care
                criteria are not met, and what would need to change. You also
                have the right to a fast appeal through your Medicare Quality
                Improvement Organization (QIO) — hospice is required to inform
                you of this right.
              </Text>
            </View>
          </View>
        )}

        {/* What these levels of care look like */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The two higher levels explained</Text>

          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={[styles.levelBadge, { backgroundColor: "rgba(99,200,255,0.15)" }]}>
                <Feather name="home" size={16} color={Colors.primary} />
              </View>
              <View style={styles.levelMeta}>
                <Text style={[styles.levelName, { color: Colors.primary }]}>
                  Intensive Nursing at Home
                </Text>
                <Text style={styles.levelAlias}>
                  Medicare calls this: Continuous Home Care
                </Text>
              </View>
            </View>
            <Text style={styles.levelDesc}>
              A registered nurse or licensed practical nurse comes to your home
              and stays for 8 or more hours a day — administering medications,
              adjusting doses, and monitoring your loved one until the crisis
              resolves. Once stable, care returns to the regular level.
            </Text>
            <View style={styles.levelTriggers}>
              <Text style={styles.levelTriggersLabel}>Typically used for:</Text>
              <Text style={styles.levelTriggerItem}>
                • Uncontrolled pain or breathlessness
              </Text>
              <Text style={styles.levelTriggerItem}>
                • Severe agitation not responding to medications
              </Text>
              <Text style={styles.levelTriggerItem}>
                • When you need skilled hands present, not just phone guidance
              </Text>
            </View>
          </View>

          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: "rgba(232,80,64,0.15)" },
                ]}
              >
                <Feather name="activity" size={16} color={CRISIS_COLOR} />
              </View>
              <View style={styles.levelMeta}>
                <Text style={[styles.levelName, { color: CRISIS_COLOR }]}>
                  Inpatient Hospice Facility Stay
                </Text>
                <Text style={styles.levelAlias}>
                  Medicare calls this: General Inpatient Care (GIP)
                </Text>
              </View>
            </View>
            <Text style={styles.levelDesc}>
              Your loved one moves temporarily to an inpatient hospice unit or
              designated hospital unit with around-the-clock nursing. Once
              symptoms are controlled — usually 1 to 3 days — they return home.
              This is not giving up on home care. It is a temporary move to
              control what cannot be controlled at home.
            </Text>
            <View style={styles.levelTriggers}>
              <Text style={styles.levelTriggersLabel}>Typically used for:</Text>
              <Text style={styles.levelTriggerItem}>
                • Severe refractory pain or respiratory distress
              </Text>
              <Text style={styles.levelTriggerItem}>
                • Terminal agitation requiring IV or subcutaneous medications
              </Text>
              <Text style={styles.levelTriggerItem}>
                • When home management is no longer safe or effective
              </Text>
            </View>
          </View>
        </View>

        {/* Important: Don't call 911 */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Feather name="phone-off" size={15} color={AMBER} />
            <Text style={[styles.warningTitle, { color: AMBER }]}>
              Call hospice first — not 911
            </Text>
          </View>
          <Text style={styles.warningBody}>
            Calling 911 during a hospice crisis typically sends paramedics who
            are legally required to attempt resuscitation unless a DNR is
            immediately visible. This often breaks the hospice plan and results
            in hospital admission, removing your loved one from comfort-focused
            care. Call your hospice line first — they can arrange the right
            level of support far faster than you might expect.
          </Text>
        </View>

        {/* Deep dive guidance scenario */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/guidance/[id]",
              params: { id: "crisis-care-gip" },
            } as any)
          }
          style={({ pressed }) => [
            styles.guideLink,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.guideLinkLeft}>
            <View style={styles.guideLinkIcon}>
              <Feather name="book-open" size={18} color={Colors.primary} />
            </View>
            <View style={styles.guideLinkText}>
              <Text style={styles.guideLinkTitle}>
                Full guidance: Hospital-Level Care
              </Text>
              <Text style={styles.guideLinkSub}>
                Detailed scenario including what to expect and denial rights
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.primary + "99"} />
        </Pressable>

        {/* Ask Ragna */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: "/(tabs)/help",
              params: {
                initialMessage:
                  "I think we may need crisis-level hospice care. Symptoms are not being controlled at home. Can you help me understand my options and what to say to the hospice nurse?",
              },
            } as any);
          }}
          style={({ pressed }) => [
            styles.ragnaBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 36, height: 36, borderRadius: 9 }}
            resizeMode="cover"
          />
          <View style={styles.ragnaBtnText}>
            <Text style={styles.ragnaBtnTitle}>Ask Ragna for guidance</Text>
            <Text style={styles.ragnaBtnSub}>
              Describe what you're seeing for personalized next steps
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1730" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(11,23,48,0.97)",
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },

  introBanner: {
    backgroundColor: CRISIS_PALE,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: CRISIS_COLOR + "35",
  },
  introIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: CRISIS_COLOR + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
    color: "#5A78A8",
    textAlign: "center",
    marginTop: 2,
  },

  section: { gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#DDE8FF",
    letterSpacing: -0.3,
  },

  checkList: { gap: 8 },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
  },
  checkRowChecked: {
    backgroundColor: "rgba(35,10,10,0.95)",
    borderColor: CRISIS_COLOR + "50",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(55,85,170,0.50)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: CRISIS_COLOR,
    borderColor: CRISIS_COLOR,
  },
  checkContent: { flex: 1, gap: 4 },
  checkLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#DDE8FF",
    letterSpacing: -0.2,
  },
  checkLabelChecked: { color: "#FFD0CC" },
  checkDetail: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    lineHeight: 18,
  },

  resultSection: { gap: 14 },
  resultBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(232,80,64,0.12)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CRISIS_COLOR + "40",
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFD0CC",
    lineHeight: 20,
  },
  resultBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 22,
  },
  resultEmphasis: {
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
  },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CRISIS_COLOR,
    borderRadius: 16,
    padding: 16,
    shadowColor: CRISIS_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 5,
  },
  callBtnSetup: {
    backgroundColor: "rgba(232,80,64,0.12)",
    borderWidth: 1,
    borderColor: CRISIS_COLOR + "40",
    shadowOpacity: 0,
    elevation: 0,
  },
  callBtnText: { flex: 1 },
  callBtnTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  callBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  scriptCard: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    gap: 10,
  },
  scriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scriptLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: AMBER,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scriptText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#B0C8E8",
    lineHeight: 21,
    fontStyle: "italic",
  },

  denialCard: {
    backgroundColor: "rgba(10,30,58,0.90)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: "rgba(55,85,170,0.22)",
    borderLeftColor: Colors.primary,
    gap: 8,
  },
  denialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  denialTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  denialBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 20,
  },

  levelCard: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    gap: 12,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  levelMeta: { flex: 1, gap: 3 },
  levelName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  levelAlias: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  levelDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 20,
  },
  levelTriggers: {
    backgroundColor: "rgba(20,30,70,0.60)",
    borderRadius: 10,
    padding: 12,
    gap: 5,
  },
  levelTriggersLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#5A78A8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  levelTriggerItem: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 19,
  },

  warningCard: {
    backgroundColor: "rgba(80,52,5,0.55)",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "rgba(200,140,30,0.30)",
    borderLeftColor: AMBER,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  warningBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#C8A870",
    lineHeight: 20,
  },

  guideLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(10,30,58,0.90)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.30)",
  },
  guideLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  guideLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(99,200,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  guideLinkText: { flex: 1, gap: 3 },
  guideLinkTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#DDE8FF",
    letterSpacing: -0.2,
  },
  guideLinkSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },

  ragnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  ragnaBtnText: { flex: 1 },
  ragnaBtnTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  ragnaBtnSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});

