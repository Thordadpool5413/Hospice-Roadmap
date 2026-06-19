import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { AFTER_DEATH_STEPS } from "@/constants/crisisFlow";
import { useApp } from "@/context/AppContext";
import { callHospice } from "@/utils/hospiceCall";

const DONT_DO = [
  "Do not call 911 if DNR/POLST is in place for a natural death",
  "Do not rush to move your loved one",
  "Do not start CPR unless full code was their documented wish",
  "Do not feel you must call the funeral home immediately",
];

export default function AfterDeathGuideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const dnr = user?.patientProfile?.goalsOfCare?.dnrStatus;

  const handleCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ok = callHospice(user?.patientProfile);
    if (!ok) {
      Alert.alert(
        "Call hospice",
        "If you don't have the number saved, check paperwork from your hospice agency or your emergency card.",
        [{ text: "OK" }],
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CosmicBackground />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>After death</Text>
          <Text style={styles.headerSub}>What to do first — calmly, step by step</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Feather name="heart" size={22} color="#B89AE8" />
          <Text style={styles.bannerText}>
            There is no rush. Take the time you need. Hospice will guide every practical step when you call.
          </Text>
        </View>

        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.callHero, pressed && { opacity: 0.88 }]}
        >
          <Feather name="phone-call" size={24} color="#fff" />
          <View style={styles.callText}>
            <Text style={styles.callTitle}>Call hospice — not 911</Text>
            <Text style={styles.callSub}>Unless you were told otherwise for this situation</Text>
          </View>
        </Pressable>

        {dnr && dnr !== "not-discussed" && (
          <View style={styles.dnrNote}>
            <Feather name="shield" size={14} color={Colors.info} />
            <Text style={styles.dnrText}>
              Code status on file: {dnr === "dnr" ? "DNR — allow natural death" : dnr}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>What to do — in order</Text>
        {AFTER_DEATH_STEPS.map((item) => (
          <Pressable
            key={item.step}
            onPress={() =>
              router.push({ pathname: "/guidance/[id]", params: { id: item.guidanceId } } as any)
            }
            style={({ pressed }) => [styles.stepCard, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{item.step}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepText}>{item.body}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textSubtle} />
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>What not to do</Text>
        <View style={styles.avoidCard}>
          {DONT_DO.map((line) => (
            <View key={line} style={styles.avoidRow}>
              <Text style={styles.avoidX}>×</Text>
              <Text style={styles.avoidText}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/help",
              params: {
                initialMessage:
                  "My loved one has just died. I need calm, step-by-step guidance on what to do first and who to call.",
                offlineScenarioId: "after-death-practical",
              },
            } as any)
          }
          style={({ pressed }) => [styles.ragnaCard, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.ragnaTitle}>Ask Ragna — I'm here with you</Text>
          <Text style={styles.ragnaSub}>Gentle guidance for this moment, even offline</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push({ pathname: "/guidance/[id]", params: { id: "bereavement-support" } } as any)}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
        >
          <Feather name="cloud" size={16} color="#9A7ACC" />
          <Text style={styles.linkText}>Bereavement support — what to expect</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  content: { padding: 16, gap: 12 },
  banner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(154, 122, 204, 0.12)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#9A7ACC40",
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  callHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.error,
    borderRadius: 16,
    padding: 18,
  },
  callText: { flex: 1, gap: 2 },
  callTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  callSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  dnrNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  dnrText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.info },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#9A7ACC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  stepBody: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  stepText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  avoidCard: {
    backgroundColor: Colors.errorPale,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.error + "25",
  },
  avoidRow: { flexDirection: "row", gap: 8 },
  avoidX: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.error },
  avoidText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 18,
  },
  ragnaCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginTop: 4,
  },
  ragnaTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  ragnaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  linkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#9A7ACC" },
});