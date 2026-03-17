import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useJournal } from "@/context/JournalContext";

interface Category {
  key: string;
  title: string;
  icon: string;
  options: { score: 0 | 1 | 2; label: string; desc: string }[];
}

const CATEGORIES: Category[] = [
  {
    key: "breathing",
    title: "Breathing",
    icon: "wind",
    options: [
      { score: 0, label: "Normal", desc: "Normal breathing, no distress" },
      { score: 1, label: "Occasional labored", desc: "Short period of labored breathing or occasional hyperventilation" },
      { score: 2, label: "Noisy / distressed", desc: "Noisy labored breathing, long hyperventilation, or Cheyne-Stokes breathing" },
    ],
  },
  {
    key: "vocalization",
    title: "Vocalization",
    icon: "mic",
    options: [
      { score: 0, label: "None", desc: "No negative sounds" },
      { score: 1, label: "Occasional moaning", desc: "Occasional moan or groan, low-level speech with negative quality" },
      { score: 2, label: "Repeated distress sounds", desc: "Repeated troubled calling out, loud moaning or groaning, crying" },
    ],
  },
  {
    key: "facial",
    title: "Facial Expression",
    icon: "circle",
    options: [
      { score: 0, label: "Relaxed / neutral", desc: "Smiling or inexpressive, appears at ease" },
      { score: 1, label: "Sad / worried", desc: "Sad, frightened, or frowning expression" },
      { score: 2, label: "Grimacing", desc: "Facial grimacing, clenched teeth, or clear signs of pain" },
    ],
  },
  {
    key: "body",
    title: "Body Language",
    icon: "user",
    options: [
      { score: 0, label: "Relaxed", desc: "Body appears relaxed, no tension" },
      { score: 1, label: "Tense / fidgeting", desc: "Tense, distressed pacing, or fidgeting" },
      { score: 2, label: "Rigid / pulling away", desc: "Rigid, fists clenched, knees pulled up, or striking out" },
    ],
  },
  {
    key: "consolability",
    title: "Consolability",
    icon: "heart",
    options: [
      { score: 0, label: "Content", desc: "No need to console, appears at rest" },
      { score: 1, label: "Can be consoled", desc: "Distracted or reassured by voice or gentle touch" },
      { score: 2, label: "Unable to console", desc: "Unable to be consoled, distracted, or diverted" },
    ],
  },
];

function scoreColor(total: number): string {
  if (total <= 3) return Colors.primary;
  if (total <= 6) return Colors.amber;
  return Colors.error;
}

function scoreLabel(total: number): string {
  if (total === 0) return "No Pain Detected";
  if (total <= 3) return "Mild Discomfort";
  if (total <= 6) return "Moderate Pain";
  return "Severe Pain";
}

function scoreDesc(total: number): string {
  if (total === 0) return "No observable signs of pain or discomfort at this time.";
  if (total <= 3) return "Some signs of discomfort. Consider repositioning, gentle touch, or comfort measures.";
  if (total <= 6) return "Moderate pain likely. Contact your hospice nurse and consider comfort kit medications.";
  return "Significant pain. Call your hospice nurse now to discuss immediate comfort measures or medication adjustment.";
}

export default function PainAdScreen() {
  const insets = useSafeAreaInsets();
  const { addEntry } = useJournal();
  const [scores, setScores] = useState<Record<string, 0 | 1 | 2>>({});

  const total = CATEGORIES.reduce((sum, cat) => sum + (scores[cat.key] ?? 0), 0);
  const allAnswered = CATEGORIES.every((c) => scores[c.key] !== undefined);
  const color = scoreColor(total);

  const handleScore = (key: string, score: 0 | 1 | 2) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScores((prev) => ({ ...prev, [key]: score }));
  };

  const handleSaveToJournal = async () => {
    if (!allAnswered) {
      Alert.alert("Complete Assessment", "Please answer all 5 categories before saving.");
      return;
    }
    const lines = CATEGORIES.map((c) => {
      const opt = c.options.find((o) => o.score === scores[c.key]);
      return `${c.title}: ${opt?.label ?? ""} (${scores[c.key]}/2)`;
    });
    const body = lines.join("\n") + `\n\nTotal Score: ${total}/10 — ${scoreLabel(total)}`;
    await addEntry({
      type: "symptom",
      title: `PAINAD Score: ${total}/10 — ${scoreLabel(total)}`,
      body,
      date: new Date().toISOString().slice(0, 10),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Assessment saved to your Caregiver Journal.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleAskVera = () => {
    if (!allAnswered) {
      Alert.alert("Complete Assessment", "Please answer all 5 categories before asking Vera.");
      return;
    }
    const prompt = `I just completed a PAINAD pain assessment on my non-verbal patient and got a total score of ${total} out of 10, which indicates ${scoreLabel(total).toLowerCase()}. The breakdown is: ${CATEGORIES.map((c) => {
      const opt = c.options.find((o) => o.score === scores[c.key]);
      return `${c.title} = ${opt?.label}`;
    }).join(", ")}. What does this mean and what should I do to make them more comfortable?`;
    router.push({ pathname: "/(tabs)/help", params: { initialMessage: prompt } } as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PAINAD Scale</Text>
          <Text style={styles.headerSub}>Pain assessment for non-verbal patients</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* About */}
        <View style={styles.aboutCard}>
          <Feather name="info" size={14} color={Colors.primary} />
          <Text style={styles.aboutText}>
            The PAINAD scale assesses pain in patients who cannot speak. Score each of the 5 categories (0–2) then share the result with your hospice nurse.
          </Text>
        </View>

        {/* Score summary (sticky-ish at top) */}
        <View style={[styles.scoreSummary, { borderColor: color + "40", backgroundColor: color + "10" }]}>
          <View style={styles.scoreLeft}>
            <Text style={[styles.scoreTotal, { color }]}>{total}</Text>
            <Text style={styles.scoreOutOf}>/10</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreLabel, { color }]}>{scoreLabel(total)}</Text>
            <Text style={styles.scoreDesc}>{allAnswered ? scoreDesc(total) : "Complete all 5 categories to see result."}</Text>
          </View>
        </View>

        {/* Categories */}
        {CATEGORIES.map((cat, ci) => (
          <View key={cat.key} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconWrap}>
                <Feather name={cat.icon as any} size={16} color={Colors.primary} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
              {scores[cat.key] !== undefined && (
                <View style={[styles.categoryScore, { backgroundColor: scoreColor(scores[cat.key]) + "20" }]}>
                  <Text style={[styles.categoryScoreText, { color: scoreColor(scores[cat.key]) }]}>
                    {scores[cat.key]}/2
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.optionList}>
              {cat.options.map((opt) => {
                const selected = scores[cat.key] === opt.score;
                return (
                  <Pressable
                    key={opt.score}
                    onPress={() => handleScore(cat.key, opt.score)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && { borderColor: scoreColor(opt.score), backgroundColor: scoreColor(opt.score) + "10" },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.optionRadio,
                        selected && { borderColor: scoreColor(opt.score), backgroundColor: scoreColor(opt.score) },
                      ]}>
                        {selected && <View style={styles.optionRadioInner} />}
                      </View>
                      <View style={styles.optionTextWrap}>
                        <View style={styles.optionTitleRow}>
                          <Text style={[styles.optionScore, { color: selected ? scoreColor(opt.score) : Colors.textMuted }]}>
                            {opt.score}
                          </Text>
                          <Text style={[styles.optionLabel, selected && { color: Colors.text, fontFamily: "Inter_600SemiBold" }]}>
                            {opt.label}
                          </Text>
                        </View>
                        <Text style={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleSaveToJournal}
            style={({ pressed }) => [
              styles.saveBtn,
              !allAnswered && styles.btnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="save" size={17} color="#fff" />
            <Text style={styles.saveBtnText}>Save to Journal</Text>
          </Pressable>

          <Pressable
            onPress={handleAskVera}
            style={({ pressed }) => [
              styles.veraBtn,
              !allAnswered && styles.btnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="compass" size={17} color="#fff" />
            <Text style={styles.veraBtnText}>Ask Vera About This Score</Text>
          </Pressable>
        </View>

        <View style={styles.disclaimer}>
          <Feather name="info" size={12} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            The PAINAD scale is a clinical tool to assist observation. It is not a diagnosis. Always share results with your hospice nurse.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  aboutCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.primaryPale, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.primary + "28",
  },
  aboutText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, lineHeight: 19,
  },

  scoreSummary: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, padding: 16, gap: 16,
    borderWidth: 1.5,
  },
  scoreLeft: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  scoreTotal: { fontSize: 44, fontFamily: "Inter_700Bold", letterSpacing: -2 },
  scoreOutOf: { fontSize: 18, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginBottom: 4 },
  scoreRight: { flex: 1, gap: 3 },
  scoreLabel: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  scoreDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },

  categoryCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.divider, overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 10, padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  categoryIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.primaryPale,
    alignItems: "center", justifyContent: "center",
  },
  categoryTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: -0.2 },
  categoryScore: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryScoreText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  optionList: { gap: 0 },
  option: {
    flexDirection: "row", alignItems: "center",
    padding: 13, borderBottomWidth: 1, borderBottomColor: Colors.divider,
    borderWidth: 0,
  },
  optionLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  optionRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionTextWrap: { flex: 1, gap: 2 },
  optionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionScore: {
    fontSize: 14, fontFamily: "Inter_700Bold",
    minWidth: 16, textAlign: "center",
  },
  optionLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  optionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, lineHeight: 17 },

  actions: { gap: 10 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#7A8A6A", borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  veraBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14,
  },
  veraBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  btnDisabled: { opacity: 0.45 },

  disclaimer: {
    flexDirection: "row", alignItems: "flex-start", gap: 7,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10, padding: 11,
  },
  disclaimerText: {
    flex: 1, fontSize: 11, fontFamily: "Inter_400Regular",
    color: Colors.textMuted, lineHeight: 16,
  },
});
