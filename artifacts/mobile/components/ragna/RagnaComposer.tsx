import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";

interface RagnaComposerProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  isStreaming: boolean;
  isOnline: boolean;
  hasMessages: boolean;
  insetsBottom: number;
  inputRef: React.RefObject<TextInput | null>;
}

export function RagnaComposer({
  inputText,
  onChangeText,
  onSend,
  isStreaming,
  isOnline,
  hasMessages,
  insetsBottom,
  inputRef,
}: RagnaComposerProps) {
  return (
    <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 84 : 49 + insetsBottom }]}>
      {!isOnline && (
        <View style={styles.offlineInputNotice}>
          <Feather name="wifi-off" size={15} color={Colors.amber} />
          <Text style={styles.offlineInputText}>
            No connection — check your internet and try again.
          </Text>
        </View>
      )}
      {isStreaming && (
        <View style={styles.streamingBanner}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.streamingBannerText}>Ragna is responding…</Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            hasMessages && !isStreaming && isOnline && styles.inputReady,
            !isOnline && styles.inputOffline,
          ]}
          value={inputText}
          onChangeText={onChangeText}
          placeholder={
            !isOnline
              ? "Reconnecting to Ragna…"
              : isStreaming
              ? "Ragna is responding…"
              : hasMessages
              ? "Reply to Ragna…"
              : "Describe what's happening or ask anything…"
          }
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="default"
          editable={!isStreaming && isOnline}
        />
        <Pressable
          onPress={() => onSend(inputText)}
          disabled={!inputText.trim() || isStreaming || !isOnline}
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || isStreaming || !isOnline) && styles.sendBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(3,10,24,0.97)",
  },
  streamingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  streamingBannerText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#5A78A8",
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "rgba(8,16,45,0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(50,75,160,0.30)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#EEF4FF",
  },
  inputReady: {
    borderColor: Colors.primary + "60",
    borderWidth: 1.5,
    backgroundColor: "rgba(60,120,255,0.08)",
  },
  inputOffline: {
    backgroundColor: "rgba(8,16,45,0.95)",
    borderColor: Colors.amber + "40",
    opacity: 0.6,
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
    backgroundColor: "rgba(55,85,170,0.25)",
    shadowOpacity: 0,
    elevation: 0,
  },
  offlineInputNotice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(200,150,50,0.10)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.amber + "30",
  },
  offlineInputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.amber,
    lineHeight: 18,
  },
});
