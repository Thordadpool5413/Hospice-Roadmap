/**
 * CaregiverWellnessCard — Daily "how are you today?" check-in for caregivers.
 *
 * States:
 *   prompt      → mood selector shown (no check-in today)
 *   note        → mood selected, optional note input + submit
 *   acknowledged → just submitted; warm message + optional Ragna CTA
 *   collapsed   → already checked in today; shows mood + 7-day sparkline
 */

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { Colors } from "@/constants/colors";
import {
  MOOD_LABELS,
  MOOD_SCORES,
  useCaregiverWellness,
} from "@/context/CaregiverWellnessContext";
import { CaregiverMood, CaregiverWellnessEntry } from "@/types";

// ─── Mood config ──────────────────────────────────────────────────────────────

type MoodConfig = {
  emoji: string;
  label: string;
  color: string;
  score: number;
};

const MOOD_CONFIG: Record<CaregiverMood, MoodConfig> = {
  doing_okay:  { emoji: "😌", label: "Doing okay",  color: Colors.success,      score: 5 },
  holding_up:  { emoji: "🙂", label: "Holding up",  color: Colors.primary,      score: 4 },
  tired:       { emoji: "😔", label: "Tired",        color: Colors.amber,        score: 3 },
  sad:         { emoji: "😢", label: "Sad",          color: "#9B7FD4",           score: 2 },
  overwhelmed: { emoji: "😰", label: "Overwhelmed",  color: Colors.error,        score: 1 },
};

const MOOD_ORDER: CaregiverMood[] = [
  "doing_okay",
  "holding_up",
  "tired",
  "sad",
  "overwhelmed",
];

const NEEDS_RAGNA_CTA: CaregiverMood[] = ["overwhelmed", "sad"];

// ─── Acknowledgment messages by mood ─────────────────────────────────────────

const ACK_MESSAGES: Record<CaregiverMood, string> = {
  doing_okay:  "That's really good to hear. You're doing important work.",
  holding_up:  "You're holding steady — that counts for a lot.",
  tired:       "Caregiving is exhausting. It's okay to feel this way. Please rest when you can.",
  sad:         "It's okay to feel sad. What you're carrying is heavy, and your feelings are valid.",
  overwhelmed: "Thank you for being honest. You don't have to carry this alone.",
};

// ─── 7-Day Mood Sparkline (SVG) ───────────────────────────────────────────────

interface WellnessSparklineProps {
  entries: CaregiverWellnessEntry[];
}

function WellnessSparkline({ entries }: WellnessSparklineProps) {
  const [width, setWidth] = useState(0);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.date === dateStr) ?? null;
    return { dateStr, entry, isToday: i === 6 };
  });

  const entriesWithData = days.filter((d) => d.entry);
  if (entriesWithData.length === 0) return null;

  const HEIGHT = 38;
  const PAD_V = 5;
  const plotH = HEIGHT - PAD_V * 2;

  const toX = (i: number) =>
    width === 0 ? 0 : (i / 6) * width;

  const toY = (score: number) =>
    PAD_V + (1 - (score - 1) / 4) * plotH;

  const plotPoints = days
    .map((d, i) =>
      d.entry
        ? { x: toX(i), y: toY(MOOD_SCORES[d.entry.mood]), entry: d.entry, isToday: d.isToday }
        : null,
    )
    .filter(Boolean) as { x: number; y: number; entry: CaregiverWellnessEntry; isToday: boolean }[];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && plotPoints.length >= 1 && (
        <Svg width={width} height={HEIGHT}>
          {plotPoints.map((pt, i) => {
            const next = plotPoints[i + 1];
            if (!next) return null;
            return (
              <Line
                key={`line-${i}`}
                x1={pt.x} y1={pt.y}
                x2={next.x} y2={next.y}
                stroke="rgba(100,140,220,0.35)"
                strokeWidth={1.5}
              />
            );
          })}

          {days.map((d, i) => {
            const x = toX(i);
            if (d.entry) {
              const cfg = MOOD_CONFIG[d.entry.mood];
              const y = toY(MOOD_SCORES[d.entry.mood]);
              return (
                <React.Fragment key={d.dateStr}>
                  <Circle cx={x} cy={y} r={d.isToday ? 6 : 4} fill={cfg.color} fillOpacity={0.25} />
                  <Circle cx={x} cy={y} r={d.isToday ? 4 : 3} fill={cfg.color} />
                </React.Fragment>
              );
            }
            return (
              <Circle
                key={d.dateStr}
                cx={x} cy={HEIGHT / 2}
                r={2}
                fill="rgba(60,90,160,0.30)"
              />
            );
          })}
        </Svg>
      )}

      <View style={spk.axisRow}>
        <Text style={spk.axisLabel}>7 days ago</Text>
        <Text style={spk.axisLabel}>Today</Text>
      </View>
    </View>
  );
}

const spk = StyleSheet.create({
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  axisLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "#2A3A60",
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

type CardState = "prompt" | "note" | "acknowledged" | "collapsed";

export function CaregiverWellnessCard() {
  const { addEntry, getTodayEntry, getRecentEntries } = useCaregiverWellness();

  const todayEntry = getTodayEntry();
  const recentEntries = getRecentEntries(7);

  const [cardState, setCardState] = useState<CardState>(
    todayEntry ? "collapsed" : "prompt",
  );
  const [selectedMood, setSelectedMood] = useState<CaregiverMood | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (todayEntry && cardState === "prompt") {
      setCardState("collapsed");
    }
  }, [todayEntry]);

  const selectMood = useCallback((mood: CaregiverMood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMood(mood);
    setCardState("note");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMood || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addEntry(selectedMood, noteText.trim() || undefined);
    setIsSubmitting(false);
    setCardState("acknowledged");
  }, [selectedMood, noteText, isSubmitting, addEntry]);

  const handleCollapse = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCardState("collapsed");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleRagnaTap = useCallback(() => {
    if (!selectedMood) return;
    const moodLabel = MOOD_LABELS[selectedMood].toLowerCase();
    const message = `Ragna, I wanted to let you know that I'm feeling ${moodLabel} right now. I could use some support.`;
    handleCollapse();
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/help",
        params: { initialMessage: message },
      } as any);
    }, 250);
  }, [selectedMood, handleCollapse]);

  const currentEntry = todayEntry ?? (cardState === "acknowledged" && selectedMood
    ? ({ mood: selectedMood, date: new Date().toISOString().slice(0, 10) } as CaregiverWellnessEntry)
    : null);

  const accentColor = currentEntry ? MOOD_CONFIG[currentEntry.mood].color : Colors.primary;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[cw.card, { borderColor: accentColor + "30" }]}>
        <LinearGradient
          colors={[accentColor + "10", "rgba(12,20,60,0.00)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Prompt state: mood selector ── */}
        {cardState === "prompt" && (
          <>
            <View style={cw.header}>
              <View style={[cw.iconWrap, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name="heart" size={16} color={Colors.primary} />
              </View>
              <View style={cw.headerText}>
                <Text style={cw.title}>How are you today?</Text>
                <Text style={cw.subtitle}>A quick check-in, just for you</Text>
              </View>
            </View>

            <View style={cw.moodRow}>
              {MOOD_ORDER.map((mood) => {
                const cfg = MOOD_CONFIG[mood];
                return (
                  <Pressable
                    key={mood}
                    onPress={() => selectMood(mood)}
                    style={({ pressed }) => [
                      cw.moodBtn,
                      pressed && { opacity: 0.75, transform: [{ scale: 0.92 }] },
                    ]}
                  >
                    <Text style={cw.moodEmoji}>{cfg.emoji}</Text>
                    <Text style={[cw.moodLabel, { color: cfg.color }]} numberOfLines={1}>
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {recentEntries.length >= 2 && (
              <View style={cw.sparkWrap}>
                <WellnessSparkline entries={recentEntries} />
              </View>
            )}
          </>
        )}

        {/* ── Note state: selected mood + optional note ── */}
        {cardState === "note" && selectedMood && (
          <>
            <View style={cw.header}>
              <View style={[cw.iconWrap, { backgroundColor: MOOD_CONFIG[selectedMood].color + "22" }]}>
                <Text style={cw.selectedEmoji}>{MOOD_CONFIG[selectedMood].emoji}</Text>
              </View>
              <View style={cw.headerText}>
                <Text style={cw.title}>{MOOD_CONFIG[selectedMood].label}</Text>
                <Text style={cw.subtitle}>Anything you want to add? (optional)</Text>
              </View>
              <Pressable
                onPress={() => setCardState("prompt")}
                hitSlop={8}
                style={({ pressed }) => [cw.backBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather name="chevron-left" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="One line is enough…"
              placeholderTextColor="#3A5080"
              style={cw.noteInput}
              maxLength={140}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <View style={cw.moodRowCompact}>
              {MOOD_ORDER.map((mood) => {
                const cfg = MOOD_CONFIG[mood];
                const active = mood === selectedMood;
                return (
                  <Pressable
                    key={mood}
                    onPress={() => selectMood(mood)}
                    style={({ pressed }) => [
                      cw.moodBtnSmall,
                      active && { backgroundColor: cfg.color + "20", borderColor: cfg.color + "50" },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Text style={cw.moodEmojiSmall}>{cfg.emoji}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                cw.submitBtn,
                { backgroundColor: MOOD_CONFIG[selectedMood].color + "20", borderColor: MOOD_CONFIG[selectedMood].color + "50" },
                pressed && { opacity: 0.80 },
              ]}
            >
              <Text style={[cw.submitText, { color: MOOD_CONFIG[selectedMood].color }]}>
                {isSubmitting ? "Saving…" : "Save check-in"}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Acknowledged state ── */}
        {cardState === "acknowledged" && selectedMood && (
          <>
            <View style={cw.header}>
              <View style={[cw.iconWrap, { backgroundColor: MOOD_CONFIG[selectedMood].color + "22" }]}>
                <Text style={cw.selectedEmoji}>{MOOD_CONFIG[selectedMood].emoji}</Text>
              </View>
              <View style={cw.headerText}>
                <Text style={cw.title}>Check-in saved</Text>
                <Text style={[cw.subtitle, { color: MOOD_CONFIG[selectedMood].color + "CC", fontFamily: "Inter_400Regular" }]}>
                  {ACK_MESSAGES[selectedMood]}
                </Text>
              </View>
            </View>

            {NEEDS_RAGNA_CTA.includes(selectedMood) && (
              <Pressable
                onPress={handleRagnaTap}
                style={({ pressed }) => [
                  cw.ragnaCta,
                  pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Feather name="message-circle" size={15} color={Colors.primary} />
                <Text style={cw.ragnaCtaText}>Would you like to talk to Ragna?</Text>
                <Feather name="arrow-right" size={14} color={Colors.primary + "90"} />
              </Pressable>
            )}

            <Pressable
              onPress={handleCollapse}
              style={({ pressed }) => [cw.dismissBtn, pressed && { opacity: 0.65 }]}
            >
              <Text style={cw.dismissText}>
                {NEEDS_RAGNA_CTA.includes(selectedMood) ? "Not now" : "Done"}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Collapsed state: compact done-for-today view ── */}
        {cardState === "collapsed" && currentEntry && (
          <View style={cw.collapsedRow}>
            <View style={[cw.collapsedDot, { backgroundColor: MOOD_CONFIG[currentEntry.mood].color }]} />
            <View style={cw.collapsedText}>
              <Text style={cw.collapsedTitle}>
                {MOOD_CONFIG[currentEntry.mood].emoji}{"  "}
                <Text style={{ color: MOOD_CONFIG[currentEntry.mood].color }}>
                  {MOOD_LABELS[currentEntry.mood]}
                </Text>
                {"  "}
                <Text style={cw.collapsedCheck}>✓</Text>
              </Text>
              <Text style={cw.collapsedSub}>Your check-in · today</Text>
            </View>

            {recentEntries.length >= 2 && (
              <View style={cw.collapsedSparkWrap}>
                <WellnessSparkline entries={recentEntries} />
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cw = StyleSheet.create({
  card: {
    backgroundColor: "rgba(12, 20, 58, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#E8F0FF",
    letterSpacing: -0.25,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#5A78A8",
    lineHeight: 17,
  },
  selectedEmoji: {
    fontSize: 20,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  moodRow: {
    flexDirection: "row",
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(80,120,200,0.18)",
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.1,
    textAlign: "center",
  },

  moodRowCompact: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  moodBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(80,120,200,0.18)",
  },
  moodEmojiSmall: {
    fontSize: 20,
  },

  noteInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(80,120,200,0.22)",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#E8F0FF",
  },

  submitBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },

  ragnaCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary + "12",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ragnaCtaText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    letterSpacing: -0.2,
  },

  dismissBtn: {
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#3A5080",
  },

  sparkWrap: {
    marginTop: -2,
  },

  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  collapsedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  collapsedText: {
    gap: 1,
  },
  collapsedTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#E8F0FF",
    letterSpacing: -0.2,
  },
  collapsedCheck: {
    color: Colors.success,
    fontSize: 12,
  },
  collapsedSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
  },
  collapsedSparkWrap: {
    flex: 1,
    minWidth: 80,
  },
});
