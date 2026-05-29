import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import type { QualitySummary } from "@/services/cmsProviderService";
import type { Provider } from "@/types";

export interface ProviderWithCoords extends Provider {
  latitude: number;
  longitude: number;
}

interface ProviderMapViewProps {
  providers: Provider[];
  qualitySummaries: Record<string, QualitySummary>;
  topInset: number;
}

export function ProviderMapView({ providers }: ProviderMapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Feather name="map" size={28} color={Colors.textMuted} />
        <Text style={styles.title}>Map view not available on web</Text>
        <Text style={styles.subtitle}>
          Open the app on your iOS or Android device to see providers on an
          interactive map.
        </Text>
        <View style={styles.countRow}>
          <Feather name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.count}>
            {providers.length} provider{providers.length !== 1 ? "s" : ""} in
            list view above
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    maxWidth: 340,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
