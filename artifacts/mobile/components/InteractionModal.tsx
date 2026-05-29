import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";
import { checkInteractions, getCachedInteractionResult } from "@/services/interactionChecker";
import { DrugInteractionPair, DrugInteractionResult } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCheckedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Pair card ────────────────────────────────────────────────────────────────

function PairCard({
  pair,
  onTellRagna,
}: {
  pair: DrugInteractionPair;
  onTellRagna: (drugA: string, drugB: string) => void;
}) {
  const isSerious = pair.severity === "serious";
  const isMonitor = pair.severity === "monitor";
  const hasInteraction = isSerious || isMonitor;

  const borderColor = isSerious
    ? Colors.error + "66"
    : isMonitor
      ? Colors.amber + "66"
      : "rgba(55,85,170,0.22)";

  const badgeBg = isSerious
    ? Colors.error + "22"
    : isMonitor
      ? Colors.amber + "22"
      : "rgba(55,85,170,0.14)";

  const badgeColor = isSerious
    ? Colors.error
    : isMonitor
      ? Colors.amberLight
      : Colors.textMuted;

  const badgeLabel = isSerious
    ? "Potentially serious"
    : isMonitor
      ? "Monitor closely"
      : "No significant interaction found";

  const badgeIcon = isSerious ? "alert-triangle" : isMonitor ? "eye" : "check-circle";

  return (
    <View style={[styles.pairCard, { borderColor }]}>
      <View style={styles.pairHeader}>
        <Text style={styles.pairNames}>
          {pair.drugA}
          <Text style={styles.pairAnd}> + </Text>
          {pair.drugB}
        </Text>
        <View style={[styles.severityBadge, { backgroundColor: badgeBg }]}>
          <Feather name={badgeIcon as any} size={11} color={badgeColor} />
          <Text style={[styles.severityText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>

      {hasInteraction && pair.summary ? (
        <Text style={styles.pairSummary}>{pair.summary}</Text>
      ) : !hasInteraction ? (
        <Text style={styles.pairNone}>
          No interaction was found in FDA drug labeling for this combination.
        </Text>
      ) : null}

      {hasInteraction && (
        <Pressable
          style={({ pressed }) => [styles.tellRagnaBtn, pressed && { opacity: 0.75 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onTellRagna(pair.drugA, pair.drugB);
          }}
        >
          <Feather name="message-circle" size={13} color={Colors.primary} />
          <Text style={styles.tellRagnaBtnText}>Tell Ragna</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface InteractionModalProps {
  visible: boolean;
  onClose: () => void;
  medicationNames: string[];
}

export function InteractionModal({ visible, onClose, medicationNames }: InteractionModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugInteractionResult | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState(false);

  const runCheck = useCallback(
    async (bypassCache = false) => {
      setLoading(true);
      setError(false);
      try {
        const data = await checkInteractions(medicationNames, { bypassCache });
        setResult(data);
        setIsStale(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [medicationNames]
  );

  useEffect(() => {
    if (!visible || medicationNames.length < 2) return;

    setResult(null);
    setIsStale(false);
    setError(false);

    // Try cache first without blocking
    getCachedInteractionResult(medicationNames).then((cached) => {
      if (cached) {
        setResult(cached);
        setIsStale(true);
        setLoading(false);
      } else {
        runCheck(false);
      }
    });
  }, [visible, medicationNames, runCheck]);

  const handleTellRagna = useCallback(
    (drugA: string, drugB: string) => {
      onClose();
      setTimeout(() => {
        router.push({
          pathname: "/(tabs)/help",
          params: {
            initialMessage: `Can you explain the interaction between ${drugA} and ${drugB}? We use both of these medications and I want to understand any risks or things to watch for.`,
          },
        } as any);
      }, 300);
    },
    [onClose]
  );

  const seriousPairs = result?.pairs.filter((p) => p.severity === "serious") ?? [];
  const monitorPairs = result?.pairs.filter((p) => p.severity === "monitor") ?? [];
  const nonePairs = result?.pairs.filter((p) => p.severity === "none") ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="shield" size={18} color={Colors.primary} />
            <Text style={styles.headerTitle}>Drug Interactions</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Feather name="x" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Medications checked */}
          <View style={styles.medsRow}>
            {medicationNames.map((name) => (
              <View key={name} style={styles.medPill}>
                <Text style={styles.medPillText}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Stale notice */}
          {isStale && result && (
            <View style={styles.staleNotice}>
              <Feather name="clock" size={12} color={Colors.textMuted} />
              <Text style={styles.staleText}>
                Last checked {formatCheckedAt(result.checkedAt)} · cached result
              </Text>
              <Pressable
                onPress={() => runCheck(true)}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            </View>
          )}

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Checking FDA drug labels…</Text>
            </View>
          )}

          {/* Error state */}
          {error && !loading && (
            <View style={styles.errorBox}>
              <Feather name="wifi-off" size={28} color={Colors.textSubtle} />
              <Text style={styles.errorTitle}>Could not reach FDA</Text>
              <Text style={styles.errorSub}>
                Check your connection and try again. Previous results will appear if available.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.75 }]}
                onPress={() => runCheck(true)}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {/* Results */}
          {!loading && result && (
            <>
              {/* Serious */}
              {seriousPairs.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Feather name="alert-triangle" size={14} color={Colors.error} />
                    <Text style={[styles.sectionTitle, { color: Colors.error }]}>
                      Potentially serious — discuss with your hospice nurse
                    </Text>
                  </View>
                  {seriousPairs.map((p) => (
                    <PairCard key={`${p.drugA}-${p.drugB}`} pair={p} onTellRagna={handleTellRagna} />
                  ))}
                </View>
              )}

              {/* Monitor */}
              {monitorPairs.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Feather name="eye" size={14} color={Colors.amberLight} />
                    <Text style={[styles.sectionTitle, { color: Colors.amberLight }]}>
                      Monitor closely
                    </Text>
                  </View>
                  {monitorPairs.map((p) => (
                    <PairCard key={`${p.drugA}-${p.drugB}`} pair={p} onTellRagna={handleTellRagna} />
                  ))}
                </View>
              )}

              {/* No interaction */}
              {nonePairs.length > 0 && seriousPairs.length === 0 && monitorPairs.length === 0 && (
                <View style={styles.section}>
                  <View style={styles.noInteractionBanner}>
                    <Feather name="check-circle" size={22} color={Colors.success} />
                    <Text style={styles.noInteractionTitle}>No significant interactions found</Text>
                    <Text style={styles.noInteractionSub}>
                      FDA drug labels did not identify significant interactions between these medications. This does not replace clinical judgment — always consult your hospice team.
                    </Text>
                  </View>
                </View>
              )}

              {/* Mixed: show none pairs collapsed */}
              {nonePairs.length > 0 && (seriousPairs.length > 0 || monitorPairs.length > 0) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Feather name="check-circle" size={14} color={Colors.success} />
                    <Text style={[styles.sectionTitle, { color: Colors.success }]}>
                      No significant interaction found
                    </Text>
                  </View>
                  {nonePairs.map((p) => (
                    <PairCard key={`${p.drugA}-${p.drugB}`} pair={p} onTellRagna={handleTellRagna} />
                  ))}
                </View>
              )}

              {result.pairs.length === 0 && (
                <View style={styles.noInteractionBanner}>
                  <Feather name="info" size={22} color={Colors.textMuted} />
                  <Text style={styles.noInteractionTitle}>No FDA interaction data found</Text>
                  <Text style={styles.noInteractionSub}>
                    FDA drug labels were not found for one or more of these medications. Consult your hospice pharmacist for a complete interaction review.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Feather name="alert-circle" size={12} color={Colors.textSubtle} />
            <Text style={styles.disclaimerText}>
              Interaction data is sourced from official FDA drug labeling. This feature is for
              informational purposes only and does not replace the clinical judgment of your hospice
              nurse, physician, or pharmacist.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(3,10,24,0.97)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 20,
  },
  medsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  medPill: {
    backgroundColor: "rgba(60,120,255,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(60,120,255,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  medPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  staleNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(14,22,55,0.80)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.18)",
  },
  staleText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  refreshText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  errorBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  pairCard: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  pairHeader: {
    gap: 8,
  },
  pairNames: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.2,
  },
  pairAnd: {
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  pairSummary: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 20,
  },
  pairNone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 19,
  },
  tellRagnaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(60,120,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(60,120,255,0.28)",
  },
  tellRagnaBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  noInteractionBanner: {
    alignItems: "center",
    backgroundColor: "rgba(58,128,96,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(58,128,96,0.25)",
    padding: 24,
    gap: 10,
  },
  noInteractionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.success,
    textAlign: "center",
  },
  noInteractionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.18)",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 16,
  },
});
