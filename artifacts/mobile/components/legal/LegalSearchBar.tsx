import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Colors } from "@/constants/colors";

interface LegalSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function LegalSearchBar({ value, onChangeText, placeholder }: LegalSearchBarProps) {
  return (
    <View style={s.wrap}>
      <Feather name="search" size={16} color={Colors.textSubtle} style={s.icon} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Search by state, POLST, DNR, proxy, advance directive…"}
        placeholderTextColor={Colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} style={s.clear} hitSlop={8}>
          <Feather name="x" size={14} color={Colors.textSubtle} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,41,90,0.90)",
    borderWidth: 1,
    borderColor: "rgba(53,94,159,0.45)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  icon: {},
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    height: "100%",
  },
  clear: { padding: 4 },
});
