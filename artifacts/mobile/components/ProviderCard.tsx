import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/colors";
import { Provider } from "@/types";
import type { QualitySummary } from "@/services/cmsProviderService";

interface ProviderCardProps {
  provider: Provider;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  isCms?: boolean;
  qualitySummary?: QualitySummary | null;
}

export function ProviderCard({
  provider,
  onPress,
  onSave,
  isSaved = false,
  isCms = false,
  qualitySummary,
}: ProviderCardProps) {
  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  const stars = provider.rating ? Math.round(provider.rating) : 0;

  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {provider.name}
          </Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={styles.location}>
              {provider.city}, {provider.state}
              {provider.distance ? `  ·  ${provider.distance} mi` : ""}
            </Text>
          </View>
        </View>
        {onSave && (
          <Pressable onPress={handleSave} style={styles.saveBtn} hitSlop={8}>
            <Feather
              name="bookmark"
              size={18}
              color={isSaved ? Colors.primary : Colors.textSubtle}
            />
          </Pressable>
        )}
      </View>

      {provider.rating && (
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather
                key={i}
                name="star"
                size={12}
                color={i < stars ? Colors.amberLight : Colors.divider}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {provider.rating.toFixed(1)}
            <Text style={styles.reviewCount}> ({provider.reviewCount} reviews)</Text>
          </Text>
        </View>
      )}

      <View style={styles.tags}>
        {isCms && (
          <View style={[styles.tag, styles.tagCms]}>
            <Text style={[styles.tagText, styles.tagTextCms]}>CMS Verified</Text>
          </View>
        )}
        {provider.acceptsMedicare && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Medicare</Text>
          </View>
        )}
        {provider.acceptsMedicaid && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Medicaid</Text>
          </View>
        )}
        {provider.accreditations.slice(0, 1).map((acc) => (
          <View key={acc} style={[styles.tag, styles.tagAccred]}>
            <Text style={[styles.tagText, styles.tagTextAccred]}>{acc}</Text>
          </View>
        ))}
      </View>

      {isCms && qualitySummary && (qualitySummary.hciScore || qualitySummary.starRating) && (
        <View style={styles.qualityRow}>
          {qualitySummary.hciScore && (
            <View style={styles.qualityBadge}>
              <Feather name="bar-chart-2" size={11} color="#1A6DAA" />
              <Text style={styles.qualityBadgeText}>
                HCI: {qualitySummary.hciScore}/10
              </Text>
            </View>
          )}
          {qualitySummary.starRating && (
            <View style={styles.qualityBadge}>
              <Feather name="star" size={11} color="#D4A017" />
              <Text style={styles.qualityBadgeText}>
                {qualitySummary.starRating} Stars
              </Text>
            </View>
          )}
          {qualitySummary.avgDailyCensus && (
            <View style={styles.qualityBadge}>
              <Feather name="users" size={11} color={Colors.textMuted} />
              <Text style={styles.qualityBadgeText}>
                {qualitySummary.avgDailyCensus} ADC
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.description} numberOfLines={2}>
        {provider.description}
      </Text>

      <View style={styles.footer}>
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="phone" size={14} color={Colors.primary} />
          <Text style={styles.callText}>{provider.phone}</Text>
        </Pressable>
        <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  nameContainer: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  saveBtn: {
    padding: 2,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  reviewCount: {
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    fontSize: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.successPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.success + "30",
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
    letterSpacing: 0.1,
  },
  tagCms: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primary + "35",
  },
  tagTextCms: {
    color: Colors.primary,
  },
  tagAccred: {
    backgroundColor: Colors.infoPale,
    borderColor: Colors.info + "30",
  },
  tagTextAccred: {
    color: Colors.info,
  },
  qualityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  qualityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  qualityBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
