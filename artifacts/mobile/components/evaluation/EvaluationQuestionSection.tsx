import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

interface EvaluationQuestionSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function EvaluationQuestionSection({ title, subtitle, children }: EvaluationQuestionSectionProps) {
  return (
    <View style={styles.questionBlock}>
      <Text style={styles.questionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.questionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  questionBlock: {
    gap: 10,
  },
  questionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  questionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: -4,
  },
});
