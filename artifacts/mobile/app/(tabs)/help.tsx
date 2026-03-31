import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { VeraEmotionalTone } from "@/types";

import { RagnaComposer } from "@/components/ragna/RagnaComposer";
import { RagnaEmptyState } from "@/components/ragna/RagnaEmptyState";
import { RagnaHeader } from "@/components/ragna/RagnaHeader";
import { LocalMessage } from "@/components/ragna/RagnaMessageBubble";
import { RagnaMessageList } from "@/components/ragna/RagnaMessageList";

const GUIDANCE_PROMPTS: { label: string; prompt: string; caregiverOnly?: boolean; patientPrompt?: string }[] = [
  {
    label: "What changes near the end?",
    prompt: "What physical changes are common as someone approaches the end of life? Help me understand what to watch for and what is normal.",
    patientPrompt: "What physical changes happen near the end of life? I want to understand what is happening with my body.",
  },
  {
    label: "How do I know if this is urgent?",
    prompt: "I'm not sure if what I'm seeing with my patient is urgent enough to call hospice. Can you help me understand what changes require an immediate call versus what can wait?",
    patientPrompt: "I'm not sure if what I'm feeling is urgent enough to ask for help. Can you help me understand what's an emergency and what can wait?",
  },
  {
    label: "What do I say to the hospice nurse?",
    prompt: "Help me organize what to say when I call the hospice nurse. I want to communicate clearly and make sure I ask for what we actually need.",
    caregiverOnly: true,
  },
  {
    label: "How do I talk to family?",
    prompt: "I'm struggling to talk to family members about what is happening. Some people are in denial, some are grieving, and I'm in the middle. Can you help me with how to approach these conversations?",
  },
  {
    label: "How do I explain this to a child?",
    prompt: "I need to explain what is happening — that someone is dying — to a child. Can you help me with honest, age-appropriate language that won't traumatize them?",
  },
  {
    label: "What do I do if death happens now?",
    prompt: "I want to understand exactly what to do in the first moments and hours after my loved one dies at home. Who do I call, what is the order, and is it okay to take my time?",
    caregiverOnly: true,
  },
  {
    label: "What happens right after death?",
    prompt: "Can you walk me through what happens in the hours and days after someone dies at home on hospice? I want to be prepared — the practical steps, the calls, the process.",
    caregiverOnly: true,
  },
  {
    label: "Is hospice doing enough?",
    prompt: "I'm not sure if we're getting the level of care we should be. What does good hospice care actually look like? And how do I advocate for better care if something feels wrong?",
    caregiverOnly: true,
  },
  {
    label: "I'm carrying grief right now",
    prompt: "I'm carrying a lot of grief, guilt, or fear right now. I don't need clinical advice — I just need to talk through what I'm feeling with someone who understands.",
  },
  {
    label: "No one has explained anything",
    prompt: "No one from hospice has taken time to explain what is happening or what to expect. I feel completely in the dark. Can you help me understand our situation from the beginning?",
    caregiverOnly: true,
  },
  {
    label: "How do I document care concerns?",
    prompt: "I think there have been problems with our hospice care — delayed responses, unanswered calls, or things that weren't handled well. How do I document this and what can I do about it?",
    caregiverOnly: true,
  },
  {
    label: "What is a good death?",
    prompt: "I want to understand what a good, peaceful death looks like. What can we do to create the conditions for that? What does comfort-focused care really mean in the final days?",
  },
];

const URGENT_TILES = [
  {
    label: "Breathing difficulty",
    icon: "wind", color: Colors.error,
    prompt: "My patient is having breathing difficulty. What should I do right now?",
    patientPrompt: "I'm having difficulty breathing. What can be done to help me right now?",
  },
  {
    label: "Pain or discomfort",
    icon: "alert-circle", color: Colors.primaryLight,
    prompt: "My patient seems to be in pain or discomfort. How can I help them?",
    patientPrompt: "I'm experiencing pain or discomfort. How can I get relief?",
  },
  {
    label: "Confusion or agitation",
    icon: "alert-triangle", color: Colors.accentLight,
    prompt: "My patient is confused or agitated. What is happening and what should I do?",
    patientPrompt: "I'm feeling confused and very agitated. What might be causing this and what can I do?",
  },
  {
    label: "Not responding",
    icon: "moon", color: Colors.journeyAfter,
    prompt: "My patient is not responding or very hard to wake. What should I do?",
    caregiverOnly: true,
  },
  {
    label: "I think they died",
    icon: "heart", color: Colors.navySub,
    prompt: "I think my patient may have died. What do I do right now?",
    caregiverOnly: true,
  },
  {
    label: "Swallowing problems",
    icon: "droplet", color: Colors.journeyBefore,
    prompt: "My patient is having trouble swallowing medications or food. What should I do?",
    patientPrompt: "I'm having trouble swallowing my medications or food. What should I do?",
  },
  {
    label: "Medication question",
    icon: "package", color: Colors.success,
    prompt: "I have a question about a hospice medication.",
  },
  {
    label: "Equipment issue",
    icon: "tool", color: Colors.journeyBefore,
    prompt: "I'm having a problem with medical equipment in the home.",
  },
  {
    label: "Caregiver task",
    icon: "user-check", color: Colors.accentLight,
    prompt: "I need help with a hands-on caregiving task like bathing, repositioning, or a transfer.",
    caregiverOnly: true,
  },
  {
    label: "I'm overwhelmed",
    icon: "cloud", color: Colors.journeyAfter,
    prompt: "I'm feeling overwhelmed and exhausted as a caregiver. I need support.",
    patientPrompt: "I'm feeling overwhelmed, scared, and exhausted. I'm the patient and I need emotional support.",
  },
  {
    label: "Prepare to call hospice",
    icon: "phone-call", color: Colors.primary,
    prompt: "I need to call my hospice nurse and want to be organized. Based on everything you know about our situation — the patient's diagnosis, recent symptoms, medications, and what's been happening — give me a ready-to-read SBAR script: (1) Situation — what's happening right now in 1–2 sentences, (2) Background — the patient's relevant history in 2–3 sentences, (3) Assessment — how serious this appears, (4) Request — exactly what I need from the hospice team. Make it brief and something I can read directly to the nurse on the phone.",
    caregiverOnly: true,
  },
];

function parseSuggestions(raw: string): { text: string; suggestions: string[] } {
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

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { user, buildPatientContext, ragnaPrivacy } = useApp();
  const { entries: symptomEntries, getTodayEntry, getRecentSummary } = useSymptoms();
  const { entries: journalEntries } = useJournal();
  const { memories, addMemory, getMemorySummary, memoryCount, livingProfile, updateLivingProfile, recentTiles, recordTile } = useVeraMemory();
  const { getObservationContext } = useRagnaLearning();
  const { isOnline } = useAppNetwork();
  const { initialMessage } = useLocalSearchParams<{ initialMessage?: string }>();
  const lastInitialRef = useRef("");
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const isPatient = user?.role === "patient";
  const visibleTiles = URGENT_TILES
    .filter((t) => !isPatient || !t.caregiverOnly)
    .map((t) => ({
      ...t,
      activePrompt: isPatient && t.patientPrompt ? t.patientPrompt : t.prompt,
    }));

  const visibleGuidancePrompts = GUIDANCE_PROMPTS
    .filter((p) => !isPatient || !p.caregiverOnly)
    .map((p) => ({
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

  const todayEntry = useMemo(() => getTodayEntry(), [symptomEntries, getTodayEntry]);

  const symptomAlert = useMemo<{ text: string; prompt: string } | null>(() => {
    if (!todayEntry) return null;
    const alerts: string[] = [];
    if (todayEntry.pain >= 7) alerts.push(`pain at ${todayEntry.pain}/10`);
    if (todayEntry.breathlessness >= 7) alerts.push(`breathlessness at ${todayEntry.breathlessness}/10`);
    if (todayEntry.nausea >= 7) alerts.push(`nausea at ${todayEntry.nausea}/10`);
    const agitationLabels = ["", "mild", "moderate", "severe"];
    if (todayEntry.agitation >= 2) alerts.push(`${agitationLabels[todayEntry.agitation]} agitation`);
    if (alerts.length === 0) return null;
    const alertText = alerts.join(" and ");
    return {
      text: `Today's symptom check-in shows ${alertText}.`,
      prompt: `My symptom tracker shows ${alertText} today. What can I do right now to help and should I call the hospice team?`,
    };
  }, [todayEntry]);

  const proactiveOpener = useMemo<{ display: string; sendPrompt: string } | null>(() => {
    if (!livingProfile || memoryCount === 0) return null;
    const hour = new Date().getHours();
    const greeting =
      hour < 6 ? "You're up late" :
      hour < 12 ? "Good morning" :
      hour < 17 ? "Good afternoon" :
      "Good evening";
    const lastMemory = memories[0];
    const topTopic = lastMemory?.mainTopics?.[0];
    const topTile = recentTiles[0];
    let display: string;
    let sendPrompt: string;
    if (topTopic) {
      display = `${greeting}. Last time we spoke, ${topTopic} was on your mind — how have things been since then?`;
      sendPrompt = `I'm back. Last time we spoke about ${topTopic}. How do you think things are going with that, and is there anything I should be watching for?`;
    } else if (topTile) {
      const tileLabel = topTile.toLowerCase();
      display = `${greeting}. I've been thinking about you — how has ${tileLabel} been going?`;
      sendPrompt = `I'm checking back in. I've been dealing with ${tileLabel} — what should I be thinking about now?`;
    } else {
      display = `${greeting}. Good to see you again — how are you and your loved one doing today?`;
      sendPrompt = `I'm back checking in. How are things going overall and is there anything I should be watching for right now?`;
    }
    return { display, sendPrompt };
  }, [livingProfile, memoryCount, memories, recentTiles]);

  const scrollToBottom = useCallback((delay = 100) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  const loadConversation = useCallback(async (convId: number) => {
    try {
      const conv = await getConversation(convId);
      setConversation(conv);
      if (conv.messages) {
        setLocalMessages(
          conv.messages.map((m: AiMessage) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
        scrollToBottom(200);
      }
    } catch {
      // ignore
    }
  }, [scrollToBottom]);

  const startNewConversation = useCallback(async () => {
    setConversation(null);
    setLocalMessages([]);
    setInputText("");
    setSuggestions([]);
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      const text = messageText.trim();
      if (!text || isStreaming) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let activeConv = conversation;
      if (!activeConv) {
        try {
          setIsLoading(true);
          const shortTitle = text.slice(0, 60);
          activeConv = await createConversation(shortTitle);
          setConversation(activeConv);
        } catch {
          Alert.alert("Connection Error", "Could not connect to Ragna. Please check your connection.");
          setIsLoading(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `asst-${Date.now()}`;

      setSuggestions([]);
      setLocalMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text },
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
      ]);
      setInputText("");
      setIsStreaming(true);
      scrollToBottom(150);

      let patientContext = "";
      if (ragnaPrivacy.personalizationEnabled) {
        const baseContext = buildPatientContext();

        const symptomSummary = ragnaPrivacy.includeRecentSymptoms ? getRecentSummary(7) : "";

        const memorySummary = ragnaPrivacy.includeConversationMemory ? getMemorySummary() : "";

        const now = new Date();
        const timeContext = ragnaPrivacy.includeTimeContext
          ? [
              `Current date/time: ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
              now.getHours() < 6 || now.getHours() >= 22
                ? "Note: This person is reaching out in the middle of the night — that often signals urgency, fear, or exhaustion."
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
                    .map((e) => {
                      const dateStr =
                        e.date ||
                        new Date(e.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      return `[${dateStr} · ${e.type}] ${e.title}: ${e.body.slice(0, 200)}${e.body.length > 200 ? "…" : ""}`;
                    })
                    .join("\n")}`
                : "";
            })()
          : "";

        const observationContext = getObservationContext();

        patientContext = [
          baseContext,
          symptomSummary ? `--- Recent Symptom Tracking ---\n${symptomSummary}` : "",
          journalContext,
          observationContext,
          memorySummary,
          timeContext,
        ]
          .filter(Boolean)
          .join("\n\n");
      }

      await streamMessage(
        activeConv.id,
        text,
        patientContext,
        (chunk) => {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
          scrollToBottom(50);
        },
        () => {
          setLocalMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantMsgId) return m;
              const { text: parsedText, suggestions: parsed } = parseSuggestions(m.content);
              if (parsed.length > 0) setSuggestions(parsed);
              return { ...m, content: parsedText, isStreaming: false };
            })
          );
          setIsStreaming(false);
          scrollToBottom(150);
          setTimeout(() => inputRef.current?.focus(), 500);
        },
        (err) => {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: `I'm sorry, something went wrong. Please try again.\n\n(${err})`, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          setTimeout(() => inputRef.current?.focus(), 300);
        }
      );
    },
    [conversation, isStreaming, buildPatientContext, getRecentSummary, getMemorySummary, journalEntries, scrollToBottom, ragnaPrivacy]
  );

  const handleTilePress = useCallback(
    (tile: { label: string; activePrompt: string }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recordTile(tile.label);
      sendMessage(tile.activePrompt);
    },
    [sendMessage, recordTile]
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
                  emotionalTone: (newMemory.emotionalTone as VeraEmotionalTone) ?? "calm",
                  mainTopics: newMemory.mainTopics,
                });
                const updatedProfile = await synthesizeProfile(
                  livingProfile,
                  newMemory,
                  recentTiles
                );
                if (updatedProfile) {
                  await updateLivingProfile(updatedProfile);
                }
              }
            } catch {
              // memory + profile generation is best-effort — still clear the conversation
            }
          }
          try {
            await deleteConversation(conversation.id);
          } catch {
            // ignore
          }
          startNewConversation();
        },
      },
    ]);
  }, [conversation, ragnaPrivacy.includeConversationMemory, startNewConversation, addMemory, livingProfile, updateLivingProfile, recentTiles]);

  const handleShareMessage = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({ message: content }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialMessage && initialMessage !== lastInitialRef.current) {
      lastInitialRef.current = initialMessage;
      const timer = setTimeout(() => sendMessage(initialMessage), 150);
      return () => clearTimeout(timer);
    }
  }, [initialMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMessages = localMessages.length > 0;

  return (
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
            onGuidancePromptPress={sendMessage}
            onPressProactiveOpener={sendMessage}
            onPressSymptomAlert={sendMessage}
          />
        ) : (
          <RagnaMessageList
            localMessages={localMessages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            suggestions={suggestions}
            onShareMessage={handleShareMessage}
            onSuggestionPress={sendMessage}
          />
        )}
      </ScrollView>

      <RagnaComposer
        inputText={inputText}
        onChangeText={setInputText}
        onSend={sendMessage}
        isStreaming={isStreaming}
        isOnline={isOnline}
        hasMessages={hasMessages}
        insetsBottom={insets.bottom}
        inputRef={inputRef}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
