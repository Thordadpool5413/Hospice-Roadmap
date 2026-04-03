import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { useApp } from "@/context/AppContext";
import { useJournal } from "@/context/JournalContext";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useVeraMemory } from "@/context/VeraMemoryContext";
import {
  isOpenAiVoiceSupported,
  OpenAiVoiceSession,
  OpenAiVoiceStatus,
  startOpenAiVoiceSession,
} from "@/services/openAiVoiceService";

const VOICE_STATUS_COPY: Record<OpenAiVoiceStatus, string> = {
  idle: "Tap the button below to talk with Ragna live.",
  "requesting-mic": "Checking microphone access…",
  connecting: "Connecting Ragna's voice line…",
  ready: "Ragna is connected and ready to listen.",
  listening: "Listening… speak naturally.",
  speaking: "Ragna is speaking…",
  error: "Voice hit a snag. Tap again to retry.",
};

const STARTER_PROMPTS = [
  "Help me understand what changes are normal near the end of life.",
  "I am not sure if what I am seeing is urgent enough to call hospice.",
  "Help me organize what I should say when I call the nurse.",
  "I am overwhelmed and need emotional support right now.",
];

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { buildPatientContext, ragnaPrivacy } = useApp();
  const { getRecentSummary } = useSymptoms();
  const { entries: journalEntries } = useJournal();
  const { getMemorySummary } = useVeraMemory();
  const { getObservationContext } = useRagnaLearning();

  const [voiceStatus, setVoiceStatus] = useState<OpenAiVoiceStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const voiceSessionRef = useRef<OpenAiVoiceSession | null>(null);

  const voiceSupported = isOpenAiVoiceSupported();

  const buildRagnaPatientContext = useCallback(() => {
    if (!ragnaPrivacy.personalizationEnabled) return "";

    const baseContext = buildPatientContext();
    const symptomSummary = ragnaPrivacy.includeRecentSymptoms ? getRecentSummary(7) : "";
    const memorySummary = ragnaPrivacy.includeConversationMemory ? getMemorySummary() : "";

    const now = new Date();
    const timeContext = ragnaPrivacy.includeTimeContext
      ? [
          `Current date/time: ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          now.getHours() < 6 || now.getHours() >= 22
            ? "Note: This person is reaching out in the middle of the night. That often signals urgency, fear, or exhaustion."
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const journalContext = ragnaPrivacy.includeRecentJournal
      ? (() => {
          const recentJournal = journalEntries.slice(0, 3);
          return recentJournal.length > 0
            ? `--- Recent Caregiver Journal Entries ---\n${recentJournal
                .map((entry) => {
                  const dateStr =
                    entry.date ||
                    new Date(entry.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  return `[${dateStr} · ${entry.type}] ${entry.title}: ${entry.body.slice(0, 200)}${entry.body.length > 200 ? "…" : ""}`;
                })
                .join("\n")}`
            : "";
        })()
      : "";

    return [
      baseContext,
      symptomSummary ? `--- Recent Symptom Tracking ---\n${symptomSummary}` : "",
      journalContext,
      getObservationContext(),
      memorySummary,
      timeContext,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [
    buildPatientContext,
    getMemorySummary,
    getObservationContext,
    getRecentSummary,
    journalEntries,
    ragnaPrivacy.includeConversationMemory,
    ragnaPrivacy.includeRecentJournal,
    ragnaPrivacy.includeRecentSymptoms,
    ragnaPrivacy.includeTimeContext,
    ragnaPrivacy.personalizationEnabled,
  ]);

  const stopVoiceConversation = useCallback(() => {
    voiceSessionRef.current?.stop();
    voiceSessionRef.current = null;
    setVoiceStatus("idle");
  }, []);

  const handleToggleVoice = useCallback(async () => {
    if (voiceSessionRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      stopVoiceConversation();
      return;
    }

    if (!voiceSupported) {
      Alert.alert(
        "Voice chat is ready for the web app",
        "Open Hospice Roadmap in the Replit web preview, allow microphone access, and tap the button again."
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setVoiceError(null);
      setVoiceTranscript(null);
      setVoiceStatus("requesting-mic");

      voiceSessionRef.current = await startOpenAiVoiceSession({
        patientContext: buildRagnaPatientContext(),
        voice: "marin",
        onStatusChange: (status) => {
          setVoiceStatus(status);
          if (status === "idle") {
            voiceSessionRef.current = null;
          }
        },
        onTranscript: (line) => setVoiceTranscript(line),
        onError: (message) => {
          setVoiceError(message);
          setVoiceStatus("error");
          voiceSessionRef.current = null;
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice chat could not start.";
      setVoiceError(message);
      setVoiceStatus("error");
      voiceSessionRef.current = null;
    }
  }, [buildRagnaPatientContext, stopVoiceConversation, voiceSupported]);

  useEffect(() => {
    return () => {
      voiceSessionRef.current?.stop();
      voiceSessionRef.current = null;
    };
  }, []);

  const statusText = voiceError ?? VOICE_STATUS_COPY[voiceStatus];
  const isVoiceActive = voiceStatus !== "idle" && voiceStatus !== "error";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>LIVE VOICE</Text>
          <Text style={styles.title}>Talk with Ragna</Text>
          <Text style={styles.subtitle}>
            This opens a real time voice conversation so your user can speak naturally and hear Ragna answer back.
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isVoiceActive ? styles.statusDotActive : null,
                voiceStatus === "speaking" ? styles.statusDotSpeaking : null,
              ]}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          <Pressable
            onPress={handleToggleVoice}
            style={({ pressed }) => [
              styles.voiceButton,
              isVoiceActive ? styles.voiceButtonActive : null,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.voiceButtonLabel}>
              {isVoiceActive ? "End Voice Session" : "Start Voice Session"}
            </Text>
          </Pressable>

          {!voiceSupported && (
            <Text style={styles.supportNote}>
              Voice chat currently runs in the web preview. On native builds you can keep using text chat until WebRTC is added there.
            </Text>
          )}

          {voiceTranscript && (
            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptLabel}>Latest transcript</Text>
              <Text style={styles.transcriptText}>{voiceTranscript}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Good starter topics</Text>
          <View style={styles.promptList}>
            {STARTER_PROMPTS.map((prompt) => (
              <View key={prompt} style={styles.promptPill}>
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>What this version does</Text>
          <Text style={styles.bodyText}>
            Ragna listens, responds with an AI voice, and uses the same patient context you already build for text chat.
          </Text>
          <Text style={styles.bodyText}>
            This voice mode is intentionally separate from the saved text thread, so the live call stays fast and the existing Ask Ragna experience stays untouched.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(73,118,255,0.24)",
    backgroundColor: "rgba(7,16,42,0.9)",
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 14,
  },
  eyebrow: {
    color: "#7AA2FF",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  title: {
    color: "#EEF4FF",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#9EB2D8",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(120,146,200,0.45)",
  },
  statusDotActive: {
    backgroundColor: "#5BC0FF",
  },
  statusDotSpeaking: {
    backgroundColor: "#8B7CFF",
  },
  statusText: {
    flex: 1,
    color: "#DDE8FF",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_500Medium",
  },
  voiceButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#4976FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  voiceButtonActive: {
    backgroundColor: "#6E5BFF",
  },
  voiceButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  supportNote: {
    color: "#7C94BE",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  transcriptCard: {
    borderRadius: 16,
    backgroundColor: "rgba(3,10,24,0.7)",
    borderWidth: 1,
    borderColor: "rgba(73,118,255,0.18)",
    padding: 14,
    gap: 6,
  },
  transcriptLabel: {
    color: "#7AA2FF",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  transcriptText: {
    color: "#EEF4FF",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(73,118,255,0.18)",
    backgroundColor: "rgba(7,16,42,0.78)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  sectionTitle: {
    color: "#EEF4FF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  promptList: {
    gap: 10,
  },
  promptPill: {
    borderRadius: 14,
    backgroundColor: "rgba(13,24,58,0.92)",
    borderWidth: 1,
    borderColor: "rgba(73,118,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  promptText: {
    color: "#DDE8FF",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_500Medium",
  },
  bodyText: {
    color: "#A9BCDF",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});
