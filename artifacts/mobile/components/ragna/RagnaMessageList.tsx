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

import { LocalMessage, RagnaMessageBubble } from "./RagnaMessageBubble";

interface RagnaMessageListProps {
  localMessages: LocalMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  suggestions: string[];
  onShareMessage: (content: string) => void;
  onSuggestionPress: (text: string) => void;
  onPlayAudio?: (message: LocalMessage) => void;
}

export function RagnaMessageList({
  localMessages,
  isLoading,
  isStreaming,
  suggestions,
  onShareMessage,
  onSuggestionPress,
  onPlayAudio,
}: RagnaMessageListProps) {
  return (
    <View style={styles.messagesContainer}>
      {localMessages.map((msg) => (
        <RagnaMessageBubble
          key={msg.id}
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
    gap: 13,
    paddingTop: 4,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(15, 24, 54, 0.78)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(80, 110, 180, 0.16)",
    alignSelf: "flex-start",
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
    color: "#7588AD",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  suggestionPills: {
    flexDirection: "column",
    gap: 8,
  },
  suggestionPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(26, 46, 90, 0.92)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + "22",
  },
  suggestionPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primaryLight,
    lineHeight: 18,
  },
});
