import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";

import { RagnaActionCard } from "./RagnaActionCard";
import { LocalMessage, RagnaMessageBubble } from "./RagnaMessageBubble";

interface RagnaMessageListProps {
  localMessages: LocalMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  suggestions: string[];
  onShareMessage: (content: string) => void;
  onSuggestionPress: (text: string) => void;
  onPlayAudio?: (message: LocalMessage) => void;
  onConfirmAction?: (messageId: string) => void;
  onSkipAction?: (messageId: string) => void;
}

export function RagnaMessageList({
  localMessages,
  isLoading,
  isStreaming,
  suggestions,
  onShareMessage,
  onSuggestionPress,
  onPlayAudio,
  onConfirmAction,
  onSkipAction,
}: RagnaMessageListProps) {
  return (
    <View style={styles.messagesContainer}>
      {localMessages.map((msg) => (
        <React.Fragment key={msg.id}>
          <RagnaMessageBubble
            message={msg}
            onLongPress={
              msg.role === "assistant" && msg.content
                ? () => onShareMessage(msg.content)
                : undefined
            }
            onPlayAudio={
              msg.role === "assistant" &&
              (msg.audioBase64 || msg.audioUrl) &&
              onPlayAudio
                ? () => onPlayAudio(msg)
                : undefined
            }
          />
          {msg.role === "assistant" && msg.action && !msg.isStreaming && (
            <RagnaActionCard
              action={msg.action}
              state={msg.actionState ?? "pending"}
              onConfirm={() => onConfirmAction?.(msg.id)}
              onSkip={() => onSkipAction?.(msg.id)}
            />
          )}
        </React.Fragment>
      ))}
      {isLoading && (
        <View style={styles.loadingBubble}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Ragna is thinking…</Text>
        </View>
      )}
      {suggestions.length > 0 && !isStreaming && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Ask a follow up</Text>
          <View style={styles.suggestionPills}>
            {suggestions.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSuggestionPress(s);
                }}
                style={({ pressed }) => [
                  styles.suggestionPill,
                  pressed && { opacity: 0.72, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Feather
                  name="message-circle"
                  size={12}
                  color={Colors.primary}
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.suggestionPillText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messagesContainer: {
    gap: 12,
    paddingTop: 4,
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
});
