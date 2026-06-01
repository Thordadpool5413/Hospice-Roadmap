import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useJournal } from "@/context/JournalContext";
import { useCaregiverWellness } from "@/context/CaregiverWellnessContext";
import { useRagnaLearning } from "@/context/RagnaLearningContext";
import { useSymptoms } from "@/context/SymptomContext";
import { useVeraMemory } from "@/context/VeraMemoryContext";
import { useAppNetwork } from "@/hooks/useAppNetwork";
import {
  AiConversation,
  AiMessage,
  createConversation,
  deleteConversation,
  generateConversationMemory,
  getConversation,
  streamMessage,
  synthesizeProfile,
} from "@/services/aiService";
import {
  isNativeOpenAiVoiceSupported,
  pauseNativeOpenAiVoicePlayback,
  playNativeOpenAiVoiceAudio,
  resumeNativeOpenAiVoicePlayback,
  speakNativeOpenAiVoiceText,
  startNativeOpenAiVoiceRecording,
  stopNativeOpenAiVoice,
  stopNativeOpenAiVoicePlayback,
  stopNativeOpenAiVoiceRecordingAndTranscribe,
  subscribeNativeOpenAiVoicePlayback,
  subscribeNativeOpenAiVoiceReplySummary,
  updateNativeOpenAiVoiceReplySummary,
} from "@/services/nativeOpenAiVoiceService";
import {
  clearActiveConversationId,
  getActiveConversationId,
  setActiveConversationId,
} from "@/services/ragnaConversationState";
import {
  getHideReplyPreview,
  setHideReplyPreview,
} from "@/services/ragnaPreviewPreference";
import { setPreferredVoice } from "@/services/voicePreferences";
import { VeraEmotionalTone } from "@/types";

import { RagnaComposer } from "@/components/ragna/RagnaComposer";
import { RagnaEmptyState } from "@/components/ragna/RagnaEmptyState";
import { RagnaHeader } from "@/components/ragna/RagnaHeader";
import { LocalMessage } from "@/components/ragna/RagnaMessageBubble";
import { RagnaMessageList } from "@/components/ragna/RagnaMessageList";
import { PremiumGate } from "@/components/PremiumGate";

const VOICE_OPTIONS = [{ id: "marin", label: "Ragna" }] as const;

const VOICE_LABELS: Record<string, string> = {
  marin: "Ragna",
};

const GUIDANCE_PROMPTS: {
  label: string;
  prompt: string;
  caregiverOnly?: boolean;
  patientPrompt?: string;
}[] = [
  {
    label: "What changes near the end?",
    prompt:
      "What physical changes are common as someone approaches the end of life? Help me understand what to watch for and what is normal.",
    patientPrompt:
      "What physical changes happen near the end of life? I want to understand what is happening with my body.",
  },
  {
    label: "How do I know if this is urgent?",
    prompt:
      "I'm not sure if what I'm seeing with my patient is urgent enough to call hospice. Can you help me understand what changes require an immediate call versus what can wait?",
    patientPrompt:
      "I'm not sure if what I'm feeling is urgent enough to ask for help. Can you help me understand what's an emergency and what can wait?",
  },
  {
    label: "What do I say to the hospice nurse?",
    prompt:
      "Help me organize what to say when I call the hospice nurse. I want to communicate clearly and make sure I ask for what we actually need.",
    caregiverOnly: true,
  },
  {
    label: "How do I talk to family?",
    prompt:
      "I'm struggling to talk to family members about what is happening. Some people are in denial, some are grieving, and I'm in the middle. Can you help me with how to approach these conversations?",
  },
  {
    label: "How do I explain this to a child?",
    prompt:
      "I need to explain what is happening to a child. Can you help me with honest, age-appropriate language that will not traumatize them?",
  },
  {
    label: "What do I do if death happens now?",
    prompt:
      "I want to understand exactly what to do in the first moments and hours after my loved one dies at home. Who do I call, what is the order, and is it okay to take my time?",
    caregiverOnly: true,
  },
  {
    label: "What happens right after death?",
    prompt:
      "Can you walk me through what happens in the hours and days after someone dies at home on hospice? I want to be prepared with the practical steps, the calls, and the process.",
    caregiverOnly: true,
  },
  {
    label: "Is hospice doing enough?",
    prompt:
      "I'm not sure if we're getting the level of care we should be. What does good hospice care actually look like? And how do I advocate for better care if something feels wrong?",
    caregiverOnly: true,
  },
  {
    label: "I'm carrying grief right now",
    prompt:
      "I'm carrying a lot of grief, guilt, or fear right now. I don't need clinical advice. I just need to talk through what I'm feeling with someone who understands.",
  },
  {
    label: "No one has explained anything",
    prompt:
      "No one from hospice has taken time to explain what is happening or what to expect. I feel completely in the dark. Can you help me understand our situation from the beginning?",
    caregiverOnly: true,
  },
  {
    label: "How do I document care concerns?",
    prompt:
      "I think there have been problems with our hospice care. How do I document this and what can I do about it?",
    caregiverOnly: true,
  },
  {
    label: "What is a good death?",
    prompt:
      "I want to understand what a good, peaceful death looks like. What can we do to create the conditions for that? What does comfort-focused care really mean in the final days?",
  },
];

const URGENT_TILES = [
  {
    label: "Breathing difficulty",
    icon: "wind",
    color: Colors.error,
    prompt:
      "My patient is having breathing difficulty. What should I do right now?",
    patientPrompt:
      "I'm having difficulty breathing. What can be done to help me right now?",
  },
  {
    label: "Pain or discomfort",
    icon: "alert-circle",
    color: Colors.primaryLight,
    prompt:
      "My patient seems to be in pain or discomfort. How can I help them?",
    patientPrompt: "I'm experiencing pain or discomfort. How can I get relief?",
  },
  {
    label: "Confusion or agitation",
    icon: "alert-triangle",
    color: Colors.accentLight,
    prompt:
      "My patient is confused or agitated. What is happening and what should I do?",
    patientPrompt:
      "I'm feeling confused and very agitated. What might be causing this and what can I do?",
  },
  {
    label: "Not responding",
    icon: "moon",
    color: Colors.journeyAfter,
    prompt:
      "My patient is not responding or very hard to wake. What should I do?",
    caregiverOnly: true,
  },
  {
    label: "I think they died",
    icon: "heart",
    color: Colors.navySub,
    prompt: "I think my patient may have died. What do I do right now?",
    caregiverOnly: true,
  },
  {
    label: "Swallowing problems",
    icon: "droplet",
    color: Colors.journeyBefore,
    prompt:
      "My patient is having trouble swallowing medications or food. What should I do?",
    patientPrompt:
      "I'm having trouble swallowing my medications or food. What should I do?",
  },
  {
    label: "Medication question",
    icon: "package",
    color: Colors.success,
    prompt: "I have a question about a hospice medication.",
  },
  {
    label: "Equipment issue",
    icon: "tool",
    color: Colors.journeyBefore,
    prompt: "I'm having a problem with medical equipment in the home.",
  },
  {
    label: "Caregiver task",
    icon: "user-check",
    color: Colors.accentLight,
    prompt:
      "I need help with a hands-on caregiving task like bathing, repositioning, or a transfer.",
    caregiverOnly: true,
  },
  {
    label: "I'm overwhelmed",
    icon: "cloud",
    color: Colors.journeyAfter,
    prompt:
      "I'm feeling overwhelmed and exhausted as a caregiver. I need support.",
    patientPrompt:
      "I'm feeling overwhelmed, scared, and exhausted. I'm the patient and I need emotional support.",
  },
  {
    label: "Prepare to call hospice",
    icon: "phone-call",
    color: Colors.primary,
    prompt:
      "I need to call my hospice nurse and want to be organized. Based on everything you know about our situation, give me a brief SBAR script I can read directly to the nurse.",
    caregiverOnly: true,
  },
];

function parseSuggestions(raw: string): {
  text: string;
  suggestions: string[];
} {
  const match = raw.match(/\[SUGGEST:([^\]]+)\]\s*$/);
  if (!match || !match[1]) return { text: raw, suggestions: [] };
  const suggestions = match[1]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3);
  const text = raw.slice(0, match.index).trimEnd();
  return { text, suggestions };
}

function extractLiveSpeechSegments(buffer: string): {
  segments: string[];
  remainder: string;
} {
  const normalized = buffer.replace(/\r/g, " ");
  const parts = normalized.split(/(?<=[.!?])\s+|\n+/);
  const completeSegments = parts.slice(0, -1).map((part) => part.trim()).filter(Boolean);
  let remainder = parts.at(-1)?.trimStart() ?? "";

  if (completeSegments.length === 0 && remainder.length >= 120) {
    const commaIndex = remainder.lastIndexOf(",", Math.min(remainder.length - 1, 140));
    const spaceIndex = remainder.lastIndexOf(" ", Math.min(remainder.length - 1, 140));
    const cutoff = Math.max(commaIndex, spaceIndex);

    if (cutoff >= 50) {
      return {
        segments: [remainder.slice(0, cutoff + 1).trim()],
        remainder: remainder.slice(cutoff + 1).trimStart(),
      };
    }
  }

  return {
    segments: completeSegments,
    remainder,
  };
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { user, buildPatientContext, ragnaPrivacy } = useApp();
  const {
    entries: symptomEntries,
    getTodayEntry,
    getRecentSummary,
  } = useSymptoms();
  const { entries: journalEntries } = useJournal();
  const {
    memories,
    addMemory,
    getMemorySummary,
    memoryCount,
    livingProfile,
    updateLivingProfile,
    recentTiles,
    recordTile,
  } = useVeraMemory();
  const { getObservationContext } = useRagnaLearning();
  const { getWellnessSummary } = useCaregiverWellness();
  const { isOnline } = useAppNetwork();
  const { initialMessage } = useLocalSearchParams<{
    initialMessage?: string;
  }>();
  const lastInitialRef = useRef("");
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const liveSpeechQueueRef = useRef<string[]>([]);
  const liveSpeechBufferRef = useRef("");
  const liveSpeechSpeakingRef = useRef(false);
  const liveSpeechStreamingRef = useRef(false);

  const isPatient = user?.role === "patient";
  const nativeVoiceSupported = isNativeOpenAiVoiceSupported();
  const liveSpeechPreviewEnabled = nativeVoiceSupported && Platform.OS === "ios";

  const visibleTiles = URGENT_TILES.filter(
    (t) => !isPatient || !t.caregiverOnly,
  ).map((t) => ({
    ...t,
    activePrompt: isPatient && t.patientPrompt ? t.patientPrompt : t.prompt,
  }));

  const visibleGuidancePrompts = GUIDANCE_PROMPTS.filter(
    (p) => !isPatient || !p.caregiverOnly,
  ).map((p) => ({
    label: p.label,
    activePrompt: isPatient && p.patientPrompt ? p.patientPrompt : p.prompt,
  }));

  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [knowsExpanded, setKnowsExpanded] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("marin");
  const [isVoiceBusy, setIsVoiceBusy] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState<string | null>(null);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [isLiveSpeechActive, setIsLiveSpeechActive] = useState(false);
  const [replyPreviewText, setReplyPreviewText] = useState<string | undefined>(
    undefined,
  );
  const [hideReplyPreview, setHideReplyPreviewState] = useState(false);

  const todayEntry = useMemo(
    () => getTodayEntry(),
    [symptomEntries, getTodayEntry],
  );
  const selectedVoiceLabel = VOICE_LABELS[selectedVoice] ?? "Ragna";
  const effectivePlaybackActive = isPlaybackActive || isLiveSpeechActive;
  const effectivePlaybackPaused = isPlaybackActive ? isPlaybackPaused : false;

  const stopLiveSpeechPreview = useCallback((clearBuffer = true) => {
    Speech.stop();
    liveSpeechQueueRef.current = [];
    liveSpeechSpeakingRef.current = false;
    liveSpeechStreamingRef.current = false;
    if (clearBuffer) {
      liveSpeechBufferRef.current = "";
    }
    setIsLiveSpeechActive(false);
  }, []);

  const processLiveSpeechQueue = useCallback(() => {
    if (!liveSpeechPreviewEnabled || liveSpeechSpeakingRef.current) return;

    const nextSegment = liveSpeechQueueRef.current.shift();
    if (!nextSegment) {
      if (!liveSpeechStreamingRef.current) {
        setIsLiveSpeechActive(false);
      }
      return;
    }

    liveSpeechSpeakingRef.current = true;
    setIsLiveSpeechActive(true);
    setVoiceStatusText("Ragna is speaking live.");

    Speech.speak(nextSegment, {
      language: "en-US",
      onDone: () => {
        liveSpeechSpeakingRef.current = false;
        if (liveSpeechQueueRef.current.length === 0 && !liveSpeechStreamingRef.current) {
          setIsLiveSpeechActive(false);
        }
        processLiveSpeechQueue();
      },
      onStopped: () => {
        liveSpeechSpeakingRef.current = false;
        setIsLiveSpeechActive(false);
      },
      onError: () => {
        liveSpeechSpeakingRef.current = false;
        setIsLiveSpeechActive(false);
      },
    });
  }, [liveSpeechPreviewEnabled]);

  const enqueueLiveSpeechPreview = useCallback(
    (incomingText: string) => {
      if (!liveSpeechPreviewEnabled) return;

      liveSpeechStreamingRef.current = true;
      liveSpeechBufferRef.current += incomingText;

      const { segments, remainder } = extractLiveSpeechSegments(
        liveSpeechBufferRef.current,
      );
      liveSpeechBufferRef.current = remainder;

      if (segments.length === 0) return;

      liveSpeechQueueRef.current.push(...segments);
      processLiveSpeechQueue();
    },
    [liveSpeechPreviewEnabled, processLiveSpeechQueue],
  );

  const finalizeLiveSpeechPreview = useCallback(() => {
    if (!liveSpeechPreviewEnabled) return false;

    liveSpeechStreamingRef.current = false;
    const finalRemainder = liveSpeechBufferRef.current.trim();
    liveSpeechBufferRef.current = "";

    if (finalRemainder) {
      liveSpeechQueueRef.current.push(finalRemainder);
    }

    if (liveSpeechQueueRef.current.length > 0 || liveSpeechSpeakingRef.current) {
      processLiveSpeechQueue();
      return true;
    }

    return false;
  }, [liveSpeechPreviewEnabled, processLiveSpeechQueue]);

  const symptomAlert = useMemo<{ text: string; prompt: string } | null>(() => {
    if (!todayEntry) return null;
    const alerts: string[] = [];
    if (todayEntry.pain >= 7) alerts.push(`pain at ${todayEntry.pain}/10`);
    if (todayEntry.breathlessness >= 7) {
      alerts.push(`breathlessness at ${todayEntry.breathlessness}/10`);
    }
    if (todayEntry.nausea >= 7)
      alerts.push(`nausea at ${todayEntry.nausea}/10`);
    const agitationLabels = ["", "mild", "moderate", "severe"];
    if (todayEntry.agitation >= 2) {
      alerts.push(`${agitationLabels[todayEntry.agitation]} agitation`);
    }
    if (alerts.length === 0) return null;
    const alertText = alerts.join(" and ");
    return {
      text: `Today's symptom check-in shows ${alertText}.`,
      prompt: `My symptom tracker shows ${alertText} today. What can I do right now to help and should I call the hospice team?`,
    };
  }, [todayEntry]);

  const proactiveOpener = useMemo<{
    display: string;
    sendPrompt: string;
  } | null>(() => {
    if (!livingProfile || memoryCount === 0) return null;
    const hour = new Date().getHours();
    const greeting =
      hour < 6
        ? "You're up late"
        : hour < 12
          ? "Good morning"
          : hour < 17
            ? "Good afternoon"
            : "Good evening";
    const lastMemory = memories[0];
    const topTopic = lastMemory?.mainTopics?.[0];
    const topTile = recentTiles[0];
    let display: string;
    let sendPrompt: string;
    if (topTopic) {
      display = `${greeting}. Last time we spoke, ${topTopic} was on your mind. How have things been since then?`;
      sendPrompt = `I'm back. Last time we spoke about ${topTopic}. How do you think things are going with that, and is there anything I should be watching for?`;
    } else if (topTile) {
      const tileLabel = topTile.toLowerCase();
      display = `${greeting}. I've been thinking about you. How has ${tileLabel} been going?`;
      sendPrompt = `I'm checking back in. I've been dealing with ${tileLabel}. What should I be thinking about now?`;
    } else {
      display = `${greeting}. Good to see you again. How are you and your loved one doing today?`;
      sendPrompt = `I'm back checking in. How are things going overall and is there anything I should be watching for right now?`;
    }
    return { display, sendPrompt };
  }, [livingProfile, memoryCount, memories, recentTiles]);

  const scrollToBottom = useCallback((delay = 100) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  /**
   * Assembles the full patient context string sent to Ragna on every message.
   *
   * GoalsOfCare injection path (confirmed):
   *   buildPatientContext() (AppContext) → includes the "--- Goals of Care ---" block
   *   when privacy.includeGoalsOfCare is true and the user has saved GoC data.
   *   This context is appended to the system prompt server-side in
   *   artifacts/api-server/src/routes/anthropic/index.ts.
   *
   * Deep-link conversations (e.g. "Ask Ragna" from Goals of Care screen):
   *   The initialMessage param carries a short field excerpt for conversational
   *   framing, but Ragna already receives the FULL saved GoalsOfCare via this
   *   function — no extra wiring is needed for those entry points.
   */
  const buildRagnaPatientContext = useCallback(() => {
    if (!ragnaPrivacy.personalizationEnabled) return "";

    const baseContext = buildPatientContext();
    const symptomSummary = ragnaPrivacy.includeRecentSymptoms
      ? getRecentSummary(7)
      : "";
    const memorySummary = ragnaPrivacy.includeConversationMemory
      ? getMemorySummary()
      : "";

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

    const isCaregiver =
      user?.role === "caregiver" || user?.role === "other";
    const wellnessSummary =
      isCaregiver && ragnaPrivacy.includeCaregiverWellness
        ? getWellnessSummary(7)
        : "";

    return [
      baseContext,
      symptomSummary
        ? `--- Recent Symptom Tracking ---\n${symptomSummary}`
        : "",
      journalContext,
      wellnessSummary,
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
    getWellnessSummary,
    journalEntries,
    ragnaPrivacy.includeCaregiverWellness,
    ragnaPrivacy.includeConversationMemory,
    ragnaPrivacy.includeRecentJournal,
    ragnaPrivacy.includeRecentSymptoms,
    ragnaPrivacy.includeTimeContext,
    ragnaPrivacy.personalizationEnabled,
    user?.role,
  ]);

  const loadConversation = useCallback(
    async (convId: number): Promise<boolean> => {
      try {
        const conv = await getConversation(convId);
        setConversation(conv);
        await setActiveConversationId(conv.id);
        if (conv.messages) {
          setLocalMessages(
            conv.messages.map((m: AiMessage) => ({
              id: String(m.id),
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          );
          scrollToBottom(200);
        }
        return true;
      } catch {
        return false;
      }
    },
    [scrollToBottom],
  );

  const startNewConversation = useCallback(async () => {
    stopLiveSpeechPreview(true);
    await stopNativeOpenAiVoicePlayback();
    setConversation(null);
    setLocalMessages([]);
    setInputText("");
    setSuggestions([]);
    setVoiceStatusText(null);
    await clearActiveConversationId();
  }, [stopLiveSpeechPreview]);

  const handlePlayAudio = useCallback(async (message: LocalMessage) => {
    if (!message.audioBase64 && !message.audioUrl) return;
    try {
      stopLiveSpeechPreview(true);
      await playNativeOpenAiVoiceAudio({
        audioBase64: message.audioBase64,
        audioMimeType: message.audioMimeType,
        audioUrl: message.audioUrl,
        assistantTranscript: message.content,
      });
      setVoiceStatusText("Playing Ragna's voice reply.");
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Ragna's voice reply could not be played.";
      setVoiceStatusText(messageText);
      Alert.alert("Playback Error", messageText);
    }
  }, [stopLiveSpeechPreview]);

  const handlePlaybackToggle = useCallback(async () => {
    try {
      if (isPlaybackActive) {
        if (isPlaybackPaused) {
          await resumeNativeOpenAiVoicePlayback();
          setVoiceStatusText("Resumed Ragna's voice reply.");
        } else {
          await pauseNativeOpenAiVoicePlayback();
          setVoiceStatusText("Paused Ragna's voice reply.");
        }
        return;
      }

      if (isLiveSpeechActive) {
        stopLiveSpeechPreview(true);
        setVoiceStatusText("Stopped live voice reply.");
        return;
      }

      if (isPlaybackActive) {
        if (isPlaybackPaused) {
          await resumeNativeOpenAiVoicePlayback();
          setVoiceStatusText("Resumed Ragna's voice reply.");
        } else {
          await pauseNativeOpenAiVoicePlayback();
          setVoiceStatusText("Paused Ragna's voice reply.");
        }
        return;
      }

      const latestAssistantMessage = [...localMessages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" && message.content.trim().length > 0,
        );

      if (!latestAssistantMessage) {
        setVoiceStatusText("Ask Ragna a question first, then tap Play.");
        return;
      }

      if (latestAssistantMessage.audioBase64 || latestAssistantMessage.audioUrl) {
        await playNativeOpenAiVoiceAudio({
          audioBase64: latestAssistantMessage.audioBase64,
          audioMimeType: latestAssistantMessage.audioMimeType,
          audioUrl: latestAssistantMessage.audioUrl,
          assistantTranscript: latestAssistantMessage.content,
        });
        setVoiceStatusText("Playing Ragna's voice reply.");
        return;
      }

      if (!nativeVoiceSupported || !latestAssistantMessage.content.trim()) {
        setVoiceStatusText("Voice playback is not available on this device.");
        return;
      }

      setVoiceStatusText(`Generating ${selectedVoiceLabel} voice reply…`);
      const playback = await speakNativeOpenAiVoiceText({
        text: latestAssistantMessage.content,
        voice: selectedVoice,
      });

      if (playback.audioBase64 || playback.audioUrl) {
        setLocalMessages((prev) =>
          prev.map((message) =>
            message.id === latestAssistantMessage.id
              ? {
                  ...message,
                  audioBase64: playback.audioBase64,
                  audioMimeType: playback.audioMimeType,
                  audioUrl: playback.audioUrl,
                }
              : message,
          ),
        );
      }

      setVoiceStatusText(
        playback.didAutoPlayAudio
          ? `Ragna replied with ${selectedVoiceLabel}.`
          : `Ragna replied with ${selectedVoiceLabel}. Tap Play voice reply in the chat if audio did not start.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Playback control failed.";
      setVoiceStatusText(message);
      Alert.alert("Playback Error", message);
    }
  }, [
    isLiveSpeechActive,
    isPlaybackActive,
    isPlaybackPaused,
    localMessages,
    nativeVoiceSupported,
    selectedVoice,
    selectedVoiceLabel,
    stopLiveSpeechPreview,
  ]);

  const handlePlaybackStop = useCallback(async () => {
    stopLiveSpeechPreview(true);
    await stopNativeOpenAiVoicePlayback();
    setVoiceStatusText("Stopped Ragna's voice reply.");
  }, [stopLiveSpeechPreview]);

  const synthesizeAssistantVoice = useCallback(
    async (assistantMessageId: string, assistantText: string) => {
      if (!nativeVoiceSupported || !assistantText.trim()) return;

      try {
        const playback = await speakNativeOpenAiVoiceText({
          text: assistantText,
          voice: selectedVoice,
        });

        if (playback.audioBase64 || playback.audioUrl) {
          setLocalMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    audioBase64: playback.audioBase64,
                    audioMimeType: playback.audioMimeType,
                    audioUrl: playback.audioUrl,
                  }
                : message,
            ),
          );
        }

        setVoiceStatusText(
          playback.didAutoPlayAudio
            ? `Ragna replied with ${selectedVoiceLabel}.`
            : `Ragna replied with ${selectedVoiceLabel}. Tap Play voice reply in the chat if audio did not start.`,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Ragna replied in text, but voice playback failed.";
        setVoiceStatusText(message);
      }
    },
    [nativeVoiceSupported, selectedVoice, selectedVoiceLabel],
  );

  const sendMessage = useCallback(
    async (messageText: string) => {
      const text = messageText.trim();
      if (!text || isStreaming) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      stopLiveSpeechPreview(true);
      await stopNativeOpenAiVoicePlayback();

      let activeConv = conversation;
      if (!activeConv) {
        try {
          setIsLoading(true);
          activeConv = await createConversation(text.slice(0, 60));
          setConversation(activeConv);
          await setActiveConversationId(activeConv.id);
        } catch {
          Alert.alert(
            "Connection Error",
            "Could not connect to Ragna. Please check your connection.",
          );
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      } else {
        void setActiveConversationId(activeConv.id);
      }

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `asst-${Date.now()}`;
      const shouldSpeakLive = liveSpeechPreviewEnabled;

      setSuggestions([]);
      setLocalMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text },
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ]);
      setInputText("");
      setIsStreaming(true);
      scrollToBottom(150);

      const patientContext = buildRagnaPatientContext();
      let streamedAssistantText = "";
      let lockScreenSummaryTimer: ReturnType<typeof setTimeout> | null = null;
      const flushLockScreenSummary = (finalText?: string) => {
        if (lockScreenSummaryTimer) {
          clearTimeout(lockScreenSummaryTimer);
          lockScreenSummaryTimer = null;
        }
        updateNativeOpenAiVoiceReplySummary(
          finalText ?? streamedAssistantText,
        );
      };
      const scheduleLockScreenSummary = () => {
        if (lockScreenSummaryTimer) return;
        lockScreenSummaryTimer = setTimeout(() => {
          lockScreenSummaryTimer = null;
          updateNativeOpenAiVoiceReplySummary(streamedAssistantText);
        }, 300);
      };

      await streamMessage(
        activeConv.id,
        text,
        patientContext,
        (chunk) => {
          streamedAssistantText += chunk;
          if (shouldSpeakLive) {
            enqueueLiveSpeechPreview(chunk);
          }
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          );
          scheduleLockScreenSummary();
          scrollToBottom(50);
        },
        () => {
          const { text: parsedText, suggestions: parsed } =
            parseSuggestions(streamedAssistantText);

          if (parsed.length > 0) {
            setSuggestions(parsed);
          }

          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: parsedText, isStreaming: false }
                : m,
            ),
          );
          setIsStreaming(false);
          flushLockScreenSummary(parsedText);
          scrollToBottom(150);
          setTimeout(() => inputRef.current?.focus(), 500);

          if (shouldSpeakLive) {
            const isSpeakingLive = finalizeLiveSpeechPreview();
            if (!isSpeakingLive) {
              setVoiceStatusText(`Ragna replied with ${selectedVoiceLabel}.`);
            }
            return;
          }

          void synthesizeAssistantVoice(assistantMsgId, parsedText);
        },
        (err) => {
          if (lockScreenSummaryTimer) {
            clearTimeout(lockScreenSummaryTimer);
            lockScreenSummaryTimer = null;
          }
          stopLiveSpeechPreview(true);
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `I'm sorry, something went wrong. Please try again.\n\n(${err})`,
                    isStreaming: false,
                  }
                : m,
            ),
          );
          setIsStreaming(false);
          setTimeout(() => inputRef.current?.focus(), 300);
        },
      );
    },
    [
      buildRagnaPatientContext,
      conversation,
      enqueueLiveSpeechPreview,
      finalizeLiveSpeechPreview,
      isStreaming,
      liveSpeechPreviewEnabled,
      scrollToBottom,
      selectedVoiceLabel,
      stopLiveSpeechPreview,
      synthesizeAssistantVoice,
    ],
  );

  const handleVoiceSelect = useCallback(async (voiceId: string) => {
    setSelectedVoice(voiceId);
    await setPreferredVoice(voiceId);
    setVoiceStatusText(
      `Voice replies will use ${VOICE_LABELS[voiceId] ?? "Ragna"}.`,
    );
  }, []);

  const handleVoicePress = useCallback(async () => {
    if (!nativeVoiceSupported) {
      Alert.alert(
        "Voice is available on the phone app",
        "Use the iPhone or Android app build to speak with Ragna in chat.",
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      stopLiveSpeechPreview(true);
      await stopNativeOpenAiVoicePlayback();

      if (!isVoiceRecording) {
        setVoiceStatusText(
          `Recording with ${selectedVoiceLabel}. Tap the mic again to stop.`,
        );
        setIsVoiceBusy(false);
        await startNativeOpenAiVoiceRecording();
        setIsVoiceRecording(true);
        return;
      }

      setIsVoiceRecording(false);
      setIsVoiceBusy(true);
      setVoiceStatusText(`Transcribing your words with ${selectedVoiceLabel}…`);

      const result = await stopNativeOpenAiVoiceRecordingAndTranscribe();
      setInputText(result.userTranscript);
      setVoiceStatusText(
        "Review the transcript, edit if needed, then tap Send.",
      );
      setTimeout(() => inputRef.current?.focus(), 250);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Voice chat could not start.";
      setVoiceStatusText(message);
      Alert.alert("Voice Error", message);
      await stopNativeOpenAiVoice();
      setIsVoiceRecording(false);
    } finally {
      setIsVoiceBusy(false);
    }
  }, [
    isVoiceRecording,
    nativeVoiceSupported,
    selectedVoiceLabel,
    stopLiveSpeechPreview,
  ]);

  const handleTilePress = useCallback(
    (tile: { label: string; activePrompt: string }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recordTile(tile.label);
      void sendMessage(tile.activePrompt);
    },
    [sendMessage, recordTile],
  );

  const handleClearConversation = useCallback(async () => {
    if (!conversation) return;
    Alert.alert("New Conversation", "Start a fresh conversation with Ragna?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start Fresh",
        onPress: async () => {
          if (ragnaPrivacy.includeConversationMemory) {
            let newMemory: {
              summary: string;
              keyFacts: string[];
              emotionalTone: string;
              mainTopics: string[];
              date: string;
            } | null = null;
            try {
              const memory = await generateConversationMemory(conversation.id);
              if (memory && memory.summary) {
                newMemory = {
                  summary: memory.summary,
                  keyFacts: memory.keyFacts ?? [],
                  emotionalTone: memory.emotionalTone ?? "calm",
                  mainTopics: memory.mainTopics ?? [],
                  date: new Date().toISOString(),
                };
                await addMemory({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  date: newMemory.date,
                  conversationId: conversation.id,
                  summary: newMemory.summary,
                  keyFacts: newMemory.keyFacts,
                  emotionalTone:
                    (newMemory.emotionalTone as VeraEmotionalTone) ?? "calm",
                  mainTopics: newMemory.mainTopics,
                });
                const updatedProfile = await synthesizeProfile(
                  livingProfile,
                  newMemory,
                  recentTiles,
                );
                if (updatedProfile) {
                  await updateLivingProfile(updatedProfile);
                }
              }
            } catch {}
          }
          try {
            await deleteConversation(conversation.id);
          } catch {}
          await clearActiveConversationId();
          await startNewConversation();
        },
      },
    ]);
  }, [
    conversation,
    ragnaPrivacy.includeConversationMemory,
    startNewConversation,
    addMemory,
    livingProfile,
    updateLivingProfile,
    recentTiles,
  ]);

  const handleShareMessage = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({ message: content }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialMessage && initialMessage !== lastInitialRef.current) {
      lastInitialRef.current = initialMessage;
      const timer = setTimeout(() => {
        void sendMessage(initialMessage);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, sendMessage]);

  useEffect(() => {
    let cancelled = false;

    const restoreConversation = async () => {
      if (conversation || localMessages.length > 0) return;
      const activeConversationId = await getActiveConversationId();
      if (!activeConversationId || cancelled) return;

      const loaded = await loadConversation(activeConversationId);
      if (!loaded && !cancelled) {
        await clearActiveConversationId();
      }
    };

    void restoreConversation();

    return () => {
      cancelled = true;
    };
  }, [conversation, localMessages.length, loadConversation]);

  useEffect(() => {
    void (async () => {
      await setPreferredVoice("marin");
      setSelectedVoice("marin");
      setVoiceStatusText("Voice replies will use Ragna.");
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNativeOpenAiVoicePlayback((state) => {
      setIsPlaybackActive(state.isPlaying);
      setIsPlaybackPaused(state.isPaused);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNativeOpenAiVoiceReplySummary((summary) => {
      setReplyPreviewText(summary);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getHideReplyPreview();
      if (!cancelled) {
        setHideReplyPreviewState(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const stored = await getHideReplyPreview();
        if (!cancelled) {
          setHideReplyPreviewState(stored);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleToggleHideReplyPreview = useCallback(
    async (hidden: boolean) => {
      setHideReplyPreviewState(hidden);
      await setHideReplyPreview(hidden);
    },
    [],
  );

  const handleReplyPreviewLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Hide live reply preview?",
      "Ragna's in-progress reply will stop appearing above the message box. You can turn it back on from Ragna privacy settings. Voice playback is not affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hide preview",
          style: "destructive",
          onPress: () => {
            void handleToggleHideReplyPreview(true);
          },
        },
      ],
    );
  }, [handleToggleHideReplyPreview]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        stopLiveSpeechPreview(true);
        void stopNativeOpenAiVoice();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [stopLiveSpeechPreview]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopLiveSpeechPreview(true);
        void stopNativeOpenAiVoice();
      };
    }, [stopLiveSpeechPreview]),
  );

  useEffect(() => {
    return () => {
      stopLiveSpeechPreview(true);
      void stopNativeOpenAiVoice();
    };
  }, [stopLiveSpeechPreview]);

  const hasMessages = localMessages.length > 0;

  return (
    <PremiumGate
      featureName="Ragna AI"
      description="Chat with Ragna, your AI companion trained in hospice and palliative care. She can help with symptoms, difficult conversations, and guidance at every stage."
    >
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <CosmicBackground />
      <RagnaHeader
        hasMessages={hasMessages}
        memoryCount={memoryCount}
        onNewConversation={handleClearConversation}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !hasMessages && styles.scrollContentEmpty,
        ]}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {!hasMessages ? (
          <RagnaEmptyState
            memoryCount={memoryCount}
            isPatient={isPatient}
            proactiveOpener={proactiveOpener}
            symptomAlert={symptomAlert}
            visibleTiles={visibleTiles}
            guidancePrompts={visibleGuidancePrompts}
            livingProfile={livingProfile}
            knowsExpanded={knowsExpanded}
            personalizationEnabled={ragnaPrivacy.personalizationEnabled}
            onToggleKnowsExpanded={() => setKnowsExpanded((e) => !e)}
            onTilePress={handleTilePress}
            onGuidancePromptPress={(text) => {
              void sendMessage(text);
            }}
            onPressProactiveOpener={(text) => {
              void sendMessage(text);
            }}
            onPressSymptomAlert={(text) => {
              void sendMessage(text);
            }}
          />
        ) : (
          <RagnaMessageList
            localMessages={localMessages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            suggestions={suggestions}
            onShareMessage={handleShareMessage}
            onSuggestionPress={(text) => {
              void sendMessage(text);
            }}
            onPlayAudio={handlePlayAudio}
          />
        )}
      </ScrollView>

      <RagnaComposer
        inputText={inputText}
        onChangeText={setInputText}
        onSend={(text) => {
          void sendMessage(text);
        }}
        isStreaming={isStreaming}
        isOnline={isOnline}
        hasMessages={hasMessages}
        insetsBottom={insets.bottom}
        inputRef={inputRef}
        onVoicePress={() => {
          void handleVoicePress();
        }}
        isVoiceAvailable={nativeVoiceSupported}
        isVoiceBusy={isVoiceBusy}
        isVoiceRecording={isVoiceRecording}
        voiceStatusText={voiceStatusText}
        voiceOptions={
          VOICE_OPTIONS as unknown as { id: string; label: string }[]
        }
        selectedVoiceId={selectedVoice}
        onVoiceOptionSelect={(voiceId) => {
          void handleVoiceSelect(voiceId);
        }}
        isPlaybackActive={effectivePlaybackActive}
        isPlaybackPaused={effectivePlaybackPaused}
        replyPreviewText={
          hideReplyPreview && isStreaming ? undefined : replyPreviewText
        }
        onPlaybackToggle={() => {
          void handlePlaybackToggle();
        }}
        onPlaybackStop={() => {
          void handlePlaybackStop();
        }}
        onReplyPreviewPress={
          hasMessages &&
          localMessages[localMessages.length - 1]?.role === "assistant"
            ? () => scrollToBottom(0)
            : undefined
        }
        onReplyPreviewLongPress={handleReplyPreviewLongPress}
      />
    </KeyboardAvoidingView>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
});