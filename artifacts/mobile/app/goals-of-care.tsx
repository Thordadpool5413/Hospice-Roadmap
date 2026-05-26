import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { GoalsOfCare } from "@/types";

const DNR_OPTIONS: { value: GoalsOfCare["dnrStatus"]; label: string; desc: string; color: string }[] = [
  { value: "dnr", label: "DNR / Allow Natural Death", desc: "If the heart stops, we let it stop peacefully. No CPR.", color: "#7A5C8A" },
  { value: "full-code", label: "Full Code (CPR)", desc: "Attempt resuscitation if the heart stops.", color: Colors.amber },
  { value: "unknown", label: "Not sure / Need to ask", desc: "We haven't had this conversation yet.", color: Colors.textMuted },
  { value: "not-discussed", label: "Prefer not to record", desc: "Keep this conversation private.", color: Colors.textSubtle },
];

interface QuestionFieldProps {
  label: string;
  hint: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  why: string;
}

function QuestionField({ label, hint, icon, value, onChange, placeholder, why }: QuestionFieldProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionIconWrap}>
          <Feather name={icon as any} size={16} color={Colors.primary} />
        </View>
        <View style={styles.questionMeta}>
          <Text style={styles.questionLabel}>{label}</Text>
          <Text style={styles.questionHint}>{hint}</Text>
        </View>
      </View>
      <TextInput
        style={styles.questionInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSubtle}
        multiline
        textAlignVertical="top"
        maxLength={500}
      />
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.whyRow}
      >
        <Feather name="help-circle" size={12} color={Colors.primary} />
        <Text style={styles.whyToggle}>Why does Ragna need this?</Text>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color={Colors.textMuted} />
      </Pressable>
      {expanded && <Text style={styles.whyText}>{why}</Text>}
    </View>
  );
}

export default function GoalsOfCareScreen() {
  const insets = useSafeAreaInsets();
  const { user, updatePatientProfile } = useApp();
  const { addObservation } = useRagnaLearning();
  const existing = user?.patientProfile?.goalsOfCare;

  const [whatMattersMost, setWhatMattersMost] = useState(existing?.whatMattersMost ?? "");
  const [goodDayLooksLike, setGoodDayLooksLike] = useState(existing?.goodDayLooksLike ?? "");
  const [thingsToAvoid, setThingsToAvoid] = useState(existing?.thingsToAvoid ?? "");
  const [dnrStatus, setDnrStatus] = useState<GoalsOfCare["dnrStatus"]>(existing?.dnrStatus ?? undefined);
  const [additionalDirectives, setAdditionalDirectives] = useState(existing?.additionalDirectives ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const hasAnyContent = Boolean(
    whatMattersMost || goodDayLooksLike || thingsToAvoid || dnrStatus || additionalDirectives,
  );

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const goals: GoalsOfCare = {
      whatMattersMost: whatMattersMost.trim() || undefined,
      goodDayLooksLike: goodDayLooksLike.trim() || undefined,
      thingsToAvoid: thingsToAvoid.trim() || undefined,
      dnrStatus: dnrStatus || undefined,
      additionalDirectives: additionalDirectives.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    await updatePatientProfile({ ...user?.patientProfile, goalsOfCare: goals });
    setIsSaving(false);

    // Tell Ragna about this Goals of Care update
    const isFirstTime = !existing?.whatMattersMost && !!goals.whatMattersMost;
    await addObservation(
      "goals_updated",
      isFirstTime
        ? "Goals of Care filled in for the first time"
        : "Goals of Care updated",
      {
        detail: goals.whatMattersMost
          ? `What matters most: "${goals.whatMattersMost.slice(0, 100)}"`
          : undefined,
        significant: true,
      }
    );

    Alert.alert(
      "Goals Saved",
      "This information is stored on your device and may be used to personalize Ragna when you chat with her.",
      [{ text: "Great", onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <CosmicBackground />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Goals of Care</Text>
          <Text style={styles.headerSub}>What matters most to your loved one</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={!hasAnyContent || isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            (!hasAnyContent || isSaving) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={styles.introBanner}>
          <View style={styles.introIconWrap}>
            <Feather name="heart" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.introTitle}>Help Ragna know your loved one</Text>
          <Text style={styles.introBody}>
            These answers are stored on your device and can be used to personalize Ragna. If you chat with Ragna, relevant goals of care details may be included with your request. Answer as much or as little as you want.
          </Text>
        </View>

        {/* Questions */}
        <QuestionField
          label="What matters most right now?"
          hint="To your loved one — or to you as their caregiver"
          icon="star"
          value={whatMattersMost}
          onChange={setWhatMattersMost}
          placeholder="e.g. Being at home. Seeing grandchildren. No pain. Being heard."
          why="Ragna uses this to prioritize guidance. If being at home matters most, she'll always factor that into her advice."
        />

        <QuestionField
          label="What does a good day look like?"
          hint="Describe comfort, function, or moments that feel meaningful"
          icon="sun"
          value={goodDayLooksLike}
          onChange={setGoodDayLooksLike}
          placeholder="e.g. Waking up without pain. Watching the birds. Talking with family."
          why="When Ragna helps you make care decisions, she can ask: 'Would this lead to more days like the good ones?'"
        />

        <QuestionField
          label="What would you most want to avoid?"
          hint="For your loved one's care and final experience"
          icon="shield"
          value={thingsToAvoid}
          onChange={setThingsToAvoid}
          placeholder="e.g. Being in the hospital. Being alone. Dying in pain. Tubes and machines."
          why="This helps Ragna flag when a plan of care is moving toward something that conflicts with what matters most."
        />

        {/* DNR/POLST */}
        <View style={styles.dnrSection}>
          <View style={styles.dnrHeader}>
            <View style={styles.questionIconWrap}>
              <Feather name="file-text" size={16} color={Colors.primary} />
            </View>
            <View style={styles.questionMeta}>
              <Text style={styles.questionLabel}>Resuscitation preference</Text>
              <Text style={styles.questionHint}>DNR status or code status, if known</Text>
            </View>
          </View>
          <View style={styles.dnrOptions}>
            {DNR_OPTIONS.map((opt) => {
              const selected = dnrStatus === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDnrStatus(selected ? undefined : opt.value);
                  }}
                  style={({ pressed }) => [
                    styles.dnrOption,
                    selected && { borderColor: opt.color, backgroundColor: opt.color + "10" },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={[
                    styles.dnrRadio,
                    selected && { borderColor: opt.color, backgroundColor: opt.color },
                  ]}>
                    {selected && <View style={styles.dnrRadioInner} />}
                  </View>
                  <View style={styles.dnrOptionText}>
                    <Text style={[styles.dnrOptionLabel, selected && { color: opt.color, fontFamily: "Inter_700Bold" }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.dnrOptionDesc}>{opt.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.dnrNote}>
            <Feather name="info" size={12} color={Colors.textMuted} />
            <Text style={styles.dnrNoteText}>
              Ragna will use this to guide conversations about end-of-life decisions. This does not replace your legal POLST or advance directive.
            </Text>
          </View>
        </View>

        <QuestionField
          label="Advance directives or other notes"
          hint="Optional — anything else Ragna should know"
          icon="edit"
          value={additionalDirectives}
          onChange={setAdditionalDirectives}
          placeholder="e.g. POLST on file with hospice. Patient has living will. Family agreed on comfort measures only."
          why="Ragna can reference this in conversations about what the patient has already decided."
        />

        {/* Vera context preview */}
        {hasAnyContent && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Image
                source={require("@/assets/images/ragna-icon.png")}
                style={{ width: 20, height: 20, borderRadius: 5 }}
                resizeMode="cover"
              />
              <Text style={styles.previewTitle}>How Ragna may use this</Text>
            </View>
            <Text style={styles.previewBody}>
              Ragna may use these goals to personalize guidance, reference what matters most, and highlight when a decision may conflict with the values you recorded.
            </Text>
          </View>
        )}

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={!hasAnyContent || isSaving}
          style={({ pressed }) => [
            styles.savePrimaryBtn,
            (!hasAnyContent || isSaving) && { opacity: 0.4 },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.savePrimaryBtnText}>
            {isSaving ? "Saving…" : "Save Goals of Care"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            router.push({
              pathname: "/(tabs)/help",
              params: { initialMessage: "I want to talk through goals of care for my loved one. Can you help me think through what matters most to them and how to communicate that to the hospice team?" },
            } as any);
          }}
          style={({ pressed }) => [styles.veraLink, pressed && { opacity: 0.7 }]}
        >
          <Image
            source={require("@/assets/images/ragna-icon.png")}
            style={{ width: 18, height: 18, borderRadius: 4 }}
            resizeMode="cover"
          />
          <Text style={styles.veraLinkText}>Need help with these questions? Ask Ragna</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030A18" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(40, 65, 140, 0.40)",
    backgroundColor: "rgba(3, 10, 24, 0.97)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#EEF4FF", letterSpacing: -0.4 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090", marginTop: 1 },
  saveBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.primary, borderRadius: 11,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, gap: 16 },

  introBanner: {
    backgroundColor: "rgba(18, 30, 90, 0.85)", borderRadius: 18, padding: 20,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "rgba(80, 120, 220, 0.30)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20, shadowRadius: 12, elevation: 3,
  },
  introIconWrap: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: Colors.primary + "22",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  introTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#C8D8FF", letterSpacing: -0.4, textAlign: "center" },
  introBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7A90B8", textAlign: "center", lineHeight: 21 },

  questionCard: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)",
    padding: 15, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  questionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  questionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + "22",
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  questionMeta: { flex: 1 },
  questionLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.25 },
  questionHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#5A78A8", marginTop: 3, lineHeight: 17 },
  questionInput: {
    backgroundColor: "rgba(8, 14, 40, 0.90)", borderRadius: 11,
    padding: 13, fontSize: 14, fontFamily: "Inter_400Regular",
    color: "#DDE8FF", lineHeight: 21, minHeight: 84,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.30)",
  },
  whyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  whyToggle: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.primary },
  whyText: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "#7A90B8", lineHeight: 18,
    backgroundColor: "rgba(30, 50, 120, 0.35)", borderRadius: 10,
    padding: 11, borderWidth: 1, borderColor: "rgba(60, 90, 170, 0.25)",
  },

  dnrSection: {
    backgroundColor: "rgba(12, 20, 55, 0.90)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)", gap: 12, padding: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  dnrHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  dnrOptions: { gap: 9 },
  dnrOption: {
    flexDirection: "row", alignItems: "flex-start", gap: 11,
    padding: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: "rgba(55, 85, 170, 0.28)",
    backgroundColor: "rgba(8, 14, 40, 0.60)",
  },
  dnrRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "rgba(55, 85, 170, 0.40)",
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  dnrRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  dnrOptionText: { flex: 1 },
  dnrOptionLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#DDE8FF", letterSpacing: -0.15 },
  dnrOptionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#5A78A8", marginTop: 3, lineHeight: 17 },
  dnrNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 7,
    backgroundColor: "rgba(14, 22, 55, 0.90)", borderRadius: 10, padding: 11,
    borderWidth: 1, borderColor: "rgba(55, 85, 170, 0.22)",
  },
  dnrNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: "#4A6090", lineHeight: 16 },

  previewCard: {
    backgroundColor: "rgba(18, 30, 90, 0.85)", borderRadius: 15, padding: 15, gap: 9,
    borderWidth: 1, borderColor: Colors.primary + "35",
  },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  previewTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.primary },
  previewBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7A90B8", lineHeight: 20 },

  savePrimaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 6,
  },
  savePrimaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.2 },
  veraLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 8,
  },
  veraLinkText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.primary },
});
