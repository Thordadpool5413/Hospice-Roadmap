import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { mockProviders } from "@/data/mockProviders";

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleSavedProvider, isSavedProvider } = useApp();

  const provider = mockProviders.find((p) => p.id === id);

  if (!provider) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Provider not found</Text>
      </View>
    );
  }

  const saved = isSavedProvider(provider.id);
  const stars = provider.rating ? Math.round(provider.rating) : 0;

  const handleCall = () => {
    Linking.openURL(`tel:${provider.phone.replace(/[^0-9]/g, "")}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.location}>
          {provider.address}, {provider.city}, {provider.state}{" "}
          {provider.zip}
        </Text>

        {provider.distance && (
          <View style={styles.distanceRow}>
            <Feather name="navigation" size={13} color={Colors.primary} />
            <Text style={styles.distance}>{provider.distance} miles away</Text>
          </View>
        )}

        {provider.rating && (
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather
                key={i}
                name="star"
                size={14}
                color={i < stars ? Colors.amberLight : Colors.divider}
              />
            ))}
            <Text style={styles.ratingText}>
              {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)
            </Text>
          </View>
        )}

        <View style={styles.ctaRow}>
          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Now</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleSavedProvider(provider.id);
            }}
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.saveBtnActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather
              name="bookmark"
              size={16}
              color={saved ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.saveBtnText, saved && { color: Colors.primary }]}>
              {saved ? "Saved" : "Save"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/referral")}
            style={({ pressed }) => [styles.referralBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="send" size={16} color={Colors.primary} />
            <Text style={styles.referralBtnText}>Request Info</Text>
          </Pressable>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{provider.description}</Text>
      </View>

      {/* Insurance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance & Accreditation</Text>
        <View style={styles.chipRow}>
          {provider.acceptsMedicare && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Feather name="check" size={12} color={Colors.success} />
              <Text style={[styles.chipText, { color: Colors.success }]}>Medicare Accepted</Text>
            </View>
          )}
          {provider.acceptsMedicaid && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Feather name="check" size={12} color={Colors.success} />
              <Text style={[styles.chipText, { color: Colors.success }]}>Medicaid Accepted</Text>
            </View>
          )}
          {provider.accreditations.map((acc) => (
            <View key={acc} style={[styles.chip, styles.chipBlue]}>
              <Feather name="award" size={12} color={Colors.info} />
              <Text style={[styles.chipText, { color: Colors.info }]}>{acc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Provided</Text>
        <View style={styles.serviceList}>
          {provider.services.map((service) => (
            <View key={service} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.chipRow}>
          {provider.specialties.map((spec) => (
            <View key={spec} style={styles.chip}>
              <Text style={styles.chipText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Referral CTA */}
      <Pressable
        onPress={() => router.push("/referral")}
        style={({ pressed }) => [styles.referralBanner, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.referralBannerIcon}>
          <Feather name="send" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.referralBannerText}>
          <Text style={styles.referralBannerTitle}>Start a Referral or Request</Text>
          <Text style={styles.referralBannerSubtitle}>
            Submit a referral request or request information from this provider
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="#FFFFFF" />
      </Pressable>

      <View style={styles.disclaimer}>
        <Feather name="info" size={13} color={Colors.textSubtle} />
        <Text style={styles.disclaimerText}>
          Provider information is for educational reference. Verify services,
          credentials, and insurance coverage directly with the provider.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 100,
    paddingHorizontal: 20,
    gap: 24,
  },
  notFound: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  header: {
    gap: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  location: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 20,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  distance: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  callBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  saveBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  referralBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.primaryPale,
  },
  referralBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipGreen: {
    backgroundColor: Colors.successPale,
    borderColor: "#BFDDCC",
  },
  chipBlue: {
    backgroundColor: Colors.infoPale,
    borderColor: "#BCD9EE",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  serviceList: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  referralBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 16,
  },
  referralBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralBannerText: {
    flex: 1,
    gap: 3,
  },
  referralBannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  referralBannerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 17,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
