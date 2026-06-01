import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { Colors } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, fontSize: 14 },
    md: { paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14, fontSize: 16 },
  };

  const variantStyles: Record<ButtonVariant, { bg: string; textColor: string; borderColor?: string }> = {
    primary: { bg: Colors.primary, textColor: "#FFFFFF" },
    secondary: { bg: Colors.surfaceMid, textColor: Colors.text, borderColor: Colors.divider },
    outline: { bg: "transparent", textColor: Colors.primary, borderColor: Colors.cardBorder },
    ghost: { bg: "transparent", textColor: Colors.textSecondary },
    danger: { bg: Colors.errorPale, textColor: Colors.error, borderColor: Colors.errorMid + "60" },
  };

  const sz = sizeStyles[size];
  const vr = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vr.bg,
          borderWidth: vr.borderColor ? 1 : 0,
          borderColor: vr.borderColor ?? "transparent",
          paddingVertical: sz.paddingVertical,
          paddingHorizontal: sz.paddingHorizontal,
          borderRadius: sz.borderRadius,
          opacity: isDisabled ? 0.42 : 1,
          transform: [{ scale: isDisabled ? 1 : pressed ? 0.97 : 1 }],
          alignSelf: fullWidth ? undefined : "flex-start",
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vr.textColor}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { color: vr.textColor, fontSize: sz.fontSize },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: -0.25,
  },
});
