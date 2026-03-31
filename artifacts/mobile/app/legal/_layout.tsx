import { Stack } from "expo-router";
import React from "react";

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="state/[code]" />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="info" />
    </Stack>
  );
}
