import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";

interface VoiceOption {
  id: string;
  label: string;
}

interface RagnaComposerProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  isStreaming: boolean;
  isOnline: boolean;
  hasMessages: boolean;
  insetsBottom: number;
  inputRef: React.RefObject<TextInput | null>;
  onVoicePress?: () => void;
  isVoiceAvailable?: boolean;
  isVoiceBusy?: boolean;
  isVoiceRecording?: boolean;
  voiceStatusText?: string | null;
  voiceOptions?: VoiceOption[];
  selectedVoiceId?: string;
  onVoiceOptionSelect?: (voiceId: string) => void;
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
  onVoicePress,
  isVoiceAvailable = false,
  isVoiceBusy = false,
  isVoiceRecording = false,
  voiceStatusText,
  voiceOptions = [],
  selectedVoiceId,
  onVoiceOptionSelect,
}: RagnaComposerProps) {
  const voiceDisabled = !isOnline || isStreaming || (isVoiceBusy && !isVoiceRecording);
  const showVoiceOptions = isVoiceAvailable && voiceOptions.length > 1 && !!onVoiceOptionSelect;

  return (
    <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 84 : 49 + insetsBottom }]}>
      {!isOnline && (
        <View style={styles.offlineInputNotice}>
          <Feather name="wifi-off" size={15} color={Colors.amber} />
          <Text style={styles.offlineInputText}>
            No connection. Check your internet and try again.
          </Text>
        </View>
      )}
      {isStreaming && (
        <View style={styles.streamingBanner}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.streamingBannerText}>Ragna is responding…</Text>
        </View>
      )}
      {voiceStatusText ? (
        <View style={styles.voiceBanner}>
          <Feather
            name={isVoiceRecording ? "mic" : isVoiceBusy ? "radio" : "volume-2"}
            size={15}
            color={Colors.primaryLight}
          />
          <Text style={styles.voiceBannerText}>{voiceStatusText}</Text>
        </View>
      ) : null}
      {showVoiceOptions ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceOptionsRow}>
          {voiceOptions.map((option) => {
            const selected = option.id === selectedVoiceId;
            return (
              <Pressable
                key={option.id}
                onPress={() => onVoiceOptionSelect?.(option.id)}
                disabled={voiceDisabled}
                style={({ pressed }) => [
                  styles.voiceOptionPill,
                  selected && styles.voiceOptionPillSelected,
                  voiceDisabled && styles.voiceOptionPillDisabled,
                  pressed && !voiceDisabled ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={[styles.voiceOptionText, selected && styles.voiceOptionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
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
        {isVoiceAvailable && onVoicePress ? (
          <Pressable
            onPress={onVoicePress}
            disabled={voiceDisabled}
            style={({ pressed }) => [
              styles.voiceBtn,
              isVoiceRecording && styles.voiceBtnRecording,
              voiceDisabled && styles.voiceBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {isVoiceBusy && !isVoiceRecording ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name={isVoiceRecording ? "square" : "mic"} size={18} color="#FFFFFF" />
            )}
          </Pressable>
        ) : null}
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
  voiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  voiceBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primaryLight,
    lineHeight: 17,
  },
  voiceOptionsRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  voiceOptionPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(12,24,58,0.95)",
    borderWidth: 1,
    borderColor: "rgba(73,118,255,0.18)",
  },
  voiceOptionPillSelected: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary + "40",
  },
  voiceOptionPillDisabled: {
    opacity: 0.5,
  },
  voiceOptionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  voiceOptionTextSelected: {
    color: Colors.primaryDark,
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
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#6E5BFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6E5BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceBtnRecording: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
  },
  voiceBtnDisabled: {
    backgroundColor: "rgba(95,90,160,0.25)",
    shadowOpacity: 0,
    elevation: 0,
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
