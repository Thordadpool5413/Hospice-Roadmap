import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  AiConversation,
  AiMessage,
  createConversation,
  deleteConversation,
  getConversation,
  streamMessage,
} from "@/services/aiService";

const URGENT_TILES = [
  { label: "Breathing difficulty", icon: "wind", color: "#C0392B", bg: "#FDEDEC", prompt: "My patient is having breathing difficulty. What should I do right now?" },
  { label: "Pain or discomfort", icon: "alert-circle", color: "#E67E22", bg: "#FEF9E7", prompt: "My patient seems to be in pain or discomfort. How can I help them?" },
  { label: "Confusion or agitation", icon: "alert-triangle", color: "#D35400", bg: "#FDF2E9", prompt: "My patient is confused or agitated. What is happening and what should I do?" },
  { label: "Not responding", icon: "moon", color: "#7D3C98", bg: "#F5EEF8", prompt: "My patient is not responding or very hard to wake. What should I do?" },
  { label: "I think they died", icon: "heart", color: "#2C3E50", bg: "#EAECEE", prompt: "I think my patient may have died. What do I do right now?" },
  { label: "Swallowing problems", icon: "droplet", color: "#1A5276", bg: "#EBF5FB", prompt: "My patient is having trouble swallowing medications or food. What should I do?" },
  { label: "Medication question", icon: "package", color: "#1E8449", bg: "#EAFAF1", prompt: "I have a question about a hospice medication." },
  { label: "Equipment issue", icon: "tool", color: "#2E86C1", bg: "#EBF5FB", prompt: "I'm having a problem with medical equipment in the home." },
  { label: "Caregiver task", icon: "user-check", color: "#5A8A7A", bg: "#EAF4F2", prompt: "I need help with a hands-on caregiving task like bathing, repositioning, or a transfer." },
  { label: "I'm overwhelmed", icon: "cloud", color: "#884EA0", bg: "#F4ECF7", prompt: "I'm feeling overwhelmed and exhausted as a caregiver. I need support." },
];

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

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
  const { user, buildPatientContext } = useApp();
  const { isOnline } = useNetworkStatus();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
          Alert.alert("Connection Error", "Could not connect to Compass. Please check your connection.");
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

      const patientContext = buildPatientContext();

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
              const { text, suggestions: parsed } = parseSuggestions(m.content);
              if (parsed.length > 0) setSuggestions(parsed);
              return { ...m, content: text, isStreaming: false };
            })
          );
          setIsStreaming(false);
          scrollToBottom(150);
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
        }
      );
    },
    [conversation, isStreaming, buildPatientContext, scrollToBottom]
  );

  const handleTilePress = useCallback(
    (prompt: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const handleClearConversation = useCallback(async () => {
    if (!conversation) return;
    Alert.alert("New Conversation", "Start a fresh conversation with Compass?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start Fresh",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConversation(conversation.id);
          } catch {
            // ignore
          }
          startNewConversation();
        },
      },
    ]);
  }, [conversation, startNewConversation]);

  const handleShareMessage = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({ message: content }).catch(() => {});
  }, []);

  const handleCallHospice = useCallback(() => {
    const phone = user?.patientProfile?.hospicePhone;
    if (!phone) {
      router.push("/support" as any);
      return;
    }
    Linking.openURL(`tel:${phone}`);
  }, [user]);

  const hasMessages = localMessages.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.compassBadge}>
            <Feather name="compass" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Compass</Text>
            <Text style={styles.headerSubtitle}>Your hospice care partner</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {hasMessages && (
            <Pressable
              onPress={handleClearConversation}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <Feather name="edit" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
          <Pressable
            onPress={handleCallHospice}
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Hospice</Text>
          </Pressable>
        </View>
      </View>

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
          <>
            <View style={styles.welcomeSection}>
              <View style={styles.compassLarge}>
                <Feather name="compass" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.welcomeTitle}>
                I'm here to help.
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Ask me anything about symptoms, medications, caregiving tasks, equipment, or what to expect. I'll give you clear, step-by-step guidance.
              </Text>
            </View>

            <Text style={styles.tilesLabel}>What's happening right now?</Text>
            <View style={styles.tilesGrid}>
              {URGENT_TILES.map((tile) => (
                <Pressable
                  key={tile.label}
                  onPress={() => handleTilePress(tile.prompt)}
                  style={({ pressed }) => [
                    styles.tile,
                    { backgroundColor: tile.bg, borderColor: tile.color + "30" },
                    pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <View style={[styles.tileIcon, { backgroundColor: tile.color + "20" }]}>
                    <Feather name={tile.icon as any} size={18} color={tile.color} />
                  </View>
                  <Text style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.profileNudge}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.profileNudgeText}>
                Add your patient's diagnosis, medications, and hospice phone number in{" "}
                <Text
                  style={styles.profileNudgeLink}
                  onPress={() => router.push("/(tabs)/more" as any)}
                >
                  Settings
                </Text>{" "}
                for personalized guidance.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.messagesContainer}>
            {localMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onLongPress={
                  msg.role === "assistant" && msg.content
                    ? () => handleShareMessage(msg.content)
                    : undefined
                }
              />
            ))}
            {isLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Compass is thinking…</Text>
              </View>
            )}
            {suggestions.length > 0 && !isStreaming && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Ask a follow-up</Text>
                <View style={styles.suggestionPills}>
                  {suggestions.map((s, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        sendMessage(s);
                      }}
                      style={({ pressed }) => [
                        styles.suggestionPill,
                        pressed && { opacity: 0.72, transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      <Feather name="message-circle" size={12} color={Colors.primary} style={{ marginRight: 5 }} />
                      <Text style={styles.suggestionPillText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!isOnline ? (
          <View style={styles.offlineInputNotice}>
            <Feather name="wifi-off" size={15} color={Colors.amber} />
            <Text style={styles.offlineInputText}>
              Internet required for Compass AI — all guidance content works offline.
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={hasMessages ? "Ask a follow-up question…" : "Describe what's happening or ask anything…"}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
              returnKeyType="default"
              editable={!isStreaming}
            />
            <Pressable
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isStreaming}
              style={({ pressed }) => [
                styles.sendBtn,
                (!inputText.trim() || isStreaming) && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="send" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onLongPress,
}: {
  message: LocalMessage;
  onLongPress?: () => void;
}) {
  const isUser = message.role === "user";
  const content = message.content;
  const isStreaming = message.isStreaming;

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.avatarSmall}>
          <Feather name="compass" size={12} color="#FFFFFF" />
        </View>
      )}
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={450}
        style={({ pressed }) => [
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          pressed && onLongPress && { opacity: 0.85 },
        ]}
      >
        {isStreaming && content === "" ? (
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        ) : (
          <RenderedMessage content={content} isUser={isUser} />
        )}
        {isStreaming && content !== "" && (
          <View style={styles.streamingCursor} />
        )}
      </Pressable>
    </View>
  );
}

function RenderedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <Text style={styles.bubbleTextUser}>{content}</Text>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      elements.push(<View key={key++} style={{ height: 6 }} />);
    } else if (/^#{1,3}\s/.test(line)) {
      const text = line.replace(/^#{1,3}\s/, "");
      elements.push(
        <Text key={key++} style={styles.msgHeading}>{text}</Text>
      );
    } else if (/^[•\-\*]\s/.test(line)) {
      const text = line.replace(/^[•\-\*]\s/, "");
      elements.push(
        <View key={key++} style={styles.msgBulletRow}>
          <Text style={styles.msgBulletDot}>•</Text>
          <Text style={styles.msgBulletText}>{renderInline(text)}</Text>
        </View>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <View key={key++} style={styles.msgBulletRow}>
            <Text style={styles.msgStepNum}>{match[1]}.</Text>
            <Text style={styles.msgBulletText}>{renderInline(match[2])}</Text>
          </View>
        );
      }
    } else if (/^═+$/.test(line.trim())) {
      elements.push(<View key={key++} style={styles.msgDivider} />);
    } else {
      elements.push(
        <Text key={key++} style={styles.msgBody}>{renderInline(line)}</Text>
      );
    }
  }

  return <View>{elements}</View>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={styles.msgBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compassBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#C0392B",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  callBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
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
  welcomeSection: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  compassLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },
  tilesLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: -4,
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    width: "47.5%",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  profileNudge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  profileNudgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  profileNudgeLink: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  messagesContainer: {
    gap: 12,
    paddingTop: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 16,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  bubbleTextUser: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 1 },
  streamingCursor: {
    width: 8,
    height: 14,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 4,
    opacity: 0.6,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  msgHeading: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
    marginTop: 4,
    marginBottom: 2,
  },
  msgBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  msgBold: {
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  msgBulletRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  msgBulletDot: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 22,
    width: 12,
    flexShrink: 0,
  },
  msgStepNum: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    lineHeight: 22,
    width: 20,
    flexShrink: 0,
  },
  msgBulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  msgDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 6,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.divider,
    shadowOpacity: 0,
    elevation: 0,
  },
  suggestionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  suggestionPills: {
    flexDirection: "column",
    gap: 7,
  },
  suggestionPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryPale,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  suggestionPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  offlineInputNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.amberPale,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.amberLight,
  },
  offlineInputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
    lineHeight: 18,
  },
});
