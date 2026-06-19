import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { RagnaAction } from "@/types";

export type RagnaActionState = "pending" | "done" | "skipped";

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  audioBase64?: string;
  audioMimeType?: string;
  audioUrl?: string;
  /** Structured action Ragna requested alongside this message, if any. */
  action?: RagnaAction;
  /** Lifecycle of the action card for this message. */
  actionState?: RagnaActionState;
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

function RenderedMessage({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  if (isUser) {
    return <Text style={styles.bubbleTextUser}>{content}</Text>;
  }

  const lines = content
    .replace(/\[SUGGEST:[^\]]*\]\s*$/g, "")
    .trimEnd()
    .split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      elements.push(<View key={key++} style={{ height: 6 }} />);
    } else if (/^#{1,3}\s/.test(line)) {
      const text = line.replace(/^#{1,3}\s/, "");
      elements.push(
        <Text key={key++} style={styles.msgHeading}>
          {text}
        </Text>,
      );
    } else if (/^[•\-*]\s/.test(line)) {
      const text = line.replace(/^[•\-*]\s/, "");
      elements.push(
        <View key={key++} style={styles.msgBulletRow}>
          <Text style={styles.msgBulletDot}>•</Text>
          <Text style={styles.msgBulletText}>{renderInline(text)}</Text>
        </View>,
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <View key={key++} style={styles.msgBulletRow}>
            <Text style={styles.msgStepNum}>{match[1]}.</Text>
            <Text style={styles.msgBulletText}>{renderInline(match[2])}</Text>
          </View>,
        );
      }
    } else if (/^═+$/.test(line.trim())) {
      elements.push(<View key={key++} style={styles.msgDivider} />);
    } else {
      elements.push(
        <Text key={key++} style={styles.msgBody}>
          {renderInline(line)}
        </Text>,
      );
    }
  }

  return <View>{elements}</View>;
}

export function RagnaMessageBubble({
  message,
  onLongPress,
  onPlayAudio,
}: {
  message: LocalMessage;
  onLongPress?: () => void;
  onPlayAudio?: () => void;
}) {
  const isUser = message.role === "user";
  const content = message.content;
  const isStreaming = message.isStreaming;
  const hasAudio = !isUser && (!!message.audioBase64 || !!message.audioUrl);

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <Image
          source={require("@/assets/images/ragna-icon.png")}
          style={{ width: 26, height: 26, borderRadius: 8 }}
        />
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
        {hasAudio && onPlayAudio ? (
          <Pressable onPress={onPlayAudio} style={styles.audioButton}>
            <Feather name="volume-2" size={14} color={Colors.primary} />
            <Text style={styles.audioButtonText}>Play voice reply</Text>
          </Pressable>
        ) : null}
        {isStreaming && content !== "" && (
          <View style={styles.streamingCursor} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowUser: {
    flexDirection: "row-reverse",
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
    backgroundColor: Colors.surfaceMid,
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
  audioButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  audioButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryDark,
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
});
