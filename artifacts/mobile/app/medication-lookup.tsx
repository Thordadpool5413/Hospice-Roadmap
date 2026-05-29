import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors } from "@/constants/colors";
import { fetchFdaLabel } from "@/services/fdaService";
import { RxNormResult, ttyLabel, useRxNorm } from "@/hooks/useRxNorm";

// ─── Hospice clinical context ─────────────────────────────────────────────────
// Keyed by lowercase drug name fragments that appear in RxNorm results.

interface HospiceNote {
  uses: string[];
  note: string;
  category: "pain" | "dyspnea" | "nausea" | "secretions" | "agitation" | "comfort";
}

const HOSPICE_CONTEXT: Record<string, HospiceNote> = {
  morphine: {
    uses: ["Pain", "Breathlessness"],
    note: "First-line opioid for hospice pain and dyspnea. Low doses (2.5–5 mg oral) relieve air hunger without hastening death.",
    category: "pain",
  },
  hydromorphone: {
    uses: ["Pain", "Breathlessness"],
    note: "More potent than morphine (5:1 ratio). Often used when morphine causes troublesome side effects or in renal impairment.",
    category: "pain",
  },
  oxycodone: {
    uses: ["Pain"],
    note: "Good alternative to morphine for moderate to severe pain. Available in immediate-release and extended-release forms.",
    category: "pain",
  },
  fentanyl: {
    uses: ["Pain"],
    note: "Transdermal patch useful when patients can no longer swallow. Patch changes every 72 h; not ideal for rapidly changing pain.",
    category: "pain",
  },
  methadone: {
    uses: ["Pain"],
    note: "Useful for neuropathic pain and opioid rotation. Long half-life requires careful titration. Consult hospice physician before starting.",
    category: "pain",
  },
  lorazepam: {
    uses: ["Anxiety", "Dyspnea", "Agitation"],
    note: "Rapid-onset benzodiazepine for anxiety, air hunger, and terminal restlessness. 0.5–1 mg sublingual or oral every 4–6 h as needed.",
    category: "agitation",
  },
  midazolam: {
    uses: ["Agitation", "Dyspnea"],
    note: "Short-acting benzodiazepine often used in the final hours for refractory agitation or dyspnea. Given subcutaneously or IV.",
    category: "agitation",
  },
  haloperidol: {
    uses: ["Delirium", "Agitation", "Nausea"],
    note: "First-line for terminal delirium and agitation. Also effective for nausea. Does not cause respiratory depression at hospice doses.",
    category: "agitation",
  },
  "glycopyrrolate": {
    uses: ["Secretions"],
    note: "Does not cross the blood-brain barrier. Preferred for secretion management in alert patients. Reduces 'death rattle'.",
    category: "secretions",
  },
  hyoscine: {
    uses: ["Secretions", "Colic"],
    note: "Scopolamine patch or SL tablets manage excess secretions and bowel colic. May cause confusion in some patients.",
    category: "secretions",
  },
  scopolamine: {
    uses: ["Secretions"],
    note: "Transdermal patch for secretion management. Apply behind the ear; change every 3 days. May cause confusion.",
    category: "secretions",
  },
  dexamethasone: {
    uses: ["Inflammation", "Appetite", "Dyspnea", "Pain"],
    note: "Steroid with broad hospice uses: appetite stimulation, inflammation, bone pain, brain tumor symptoms, and dyspnea.",
    category: "comfort",
  },
  metoclopramide: {
    uses: ["Nausea", "Bowel motility"],
    note: "Prokinetic and antiemetic. Particularly effective for gastroparesis-related nausea. Avoid in bowel obstruction.",
    category: "nausea",
  },
  ondansetron: {
    uses: ["Nausea"],
    note: "Effective for nausea from opioids, chemotherapy (palliative), and general causes. Orally dissolving tablet useful when swallowing is difficult.",
    category: "nausea",
  },
  prochlorperazine: {
    uses: ["Nausea", "Vomiting"],
    note: "Effective antiemetic for nausea and vomiting. Available as suppository when oral route is unavailable.",
    category: "nausea",
  },
  promethazine: {
    uses: ["Nausea", "Sedation"],
    note: "Antiemetic and mild sedative. Useful for nausea with anxiety. Note: can cause paradoxical agitation in elderly patients.",
    category: "nausea",
  },
  furosemide: {
    uses: ["Fluid overload", "Dyspnea"],
    note: "Diuretic used when fluid overload contributes to dyspnea or discomfort. Comfort-focused dosing avoids excessive monitoring.",
    category: "dyspnea",
  },
  gabapentin: {
    uses: ["Neuropathic pain", "Anxiety"],
    note: "Effective for burning, shooting, or nerve pain. Also reduces anxiety. Dose reduce in renal impairment.",
    category: "pain",
  },
  amitriptyline: {
    uses: ["Neuropathic pain", "Sleep", "Secretion reduction"],
    note: "Low-dose tricyclic antidepressant for nerve pain and sleep. Anticholinergic effect also reduces secretions.",
    category: "pain",
  },
  mirtazapine: {
    uses: ["Appetite", "Sleep", "Nausea"],
    note: "Antidepressant with strong appetite stimulation and anti-nausea effects at low doses (7.5–15 mg). Especially helpful when weight loss is distressing.",
    category: "comfort",
  },
  acetaminophen: {
    uses: ["Pain", "Fever"],
    note: "First-line for mild-moderate pain and fever. Can be given rectally when oral route is unavailable. Safe to combine with opioids.",
    category: "pain",
  },
};

const CATEGORY_META: Record<HospiceNote["category"], { label: string; color: string; icon: string }> = {
  pain: { label: "Pain", color: Colors.error, icon: "activity" },
  dyspnea: { label: "Dyspnea", color: Colors.info, icon: "wind" },
  nausea: { label: "Nausea", color: Colors.warning, icon: "droplet" },
  secretions: { label: "Secretions", color: Colors.accent, icon: "mic" },
  agitation: { label: "Agitation", color: Colors.accentLight, icon: "zap" },
  comfort: { label: "Comfort", color: Colors.success, icon: "heart" },
};

function getHospiceNote(name: string): HospiceNote | null {
  const lower = name.toLowerCase();
  for (const [key, note] of Object.entries(HOSPICE_CONTEXT)) {
    if (lower.includes(key)) return note;
  }
  return null;
}

// ─── Common hospice medications shown when search is empty ───────────────────

const COMMON_MEDS = [
  "Morphine", "Lorazepam", "Haloperidol", "Dexamethasone",
  "Glycopyrrolate", "Ondansetron", "Metoclopramide", "Gabapentin",
  "Hydromorphone", "Midazolam", "Mirtazapine", "Acetaminophen",
];

// ─── Components ──────────────────────────────────────────────────────────────

function FdaInteractionsCard({ drugName }: { drugName: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;
    setFetched(true);
    setLoading(true);
    fetchFdaLabel(drugName)
      .then((label) => {
        setText(label?.drugInteractions ?? null);
      })
      .catch(() => setText(null))
      .finally(() => setLoading(false));
  }, [drugName, fetched]);

  const handleTellRagna = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(tabs)/help",
      params: {
        initialMessage: `Can you tell me about drug interactions for ${drugName}? I want to know what other medications it might interact with and what to watch for.`,
      },
    } as any);
  }, [drugName]);

  return (
    <View style={styles.fdaCard}>
      <View style={styles.fdaCardHeader}>
        <Feather name="shield" size={13} color={Colors.primary} />
        <Text style={styles.fdaCardTitle}>FDA Interactions</Text>
        <Text style={styles.fdaCardSource}>FDA Drug Label</Text>
      </View>

      {loading && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
      )}

      {!loading && text === null && (
        <Text style={styles.fdaNoData}>
          No FDA interaction data found for this drug. Consult your hospice pharmacist.
        </Text>
      )}

      {!loading && text !== null && text.length === 0 && (
        <Text style={styles.fdaNoData}>
          FDA label does not list specific drug interactions for this medication.
        </Text>
      )}

      {!loading && text && text.length > 0 && (
        <>
          <Text style={styles.fdaText} numberOfLines={6}>
            {text}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.fdaTellRagna, pressed && { opacity: 0.75 }]}
            onPress={handleTellRagna}
          >
            <Feather name="message-circle" size={13} color={Colors.primary} />
            <Text style={styles.fdaTellRagnaText}>Ask Ragna about {drugName} interactions</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function ResultCard({ result, onTap }: { result: RxNormResult; onTap: () => void }) {
  const hospice = getHospiceNote(result.name);
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((e) => !e);
    onTap();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.9 }]}
      onPress={handlePress}
    >
      <View style={styles.resultTop}>
        <View style={styles.resultNameRow}>
          <Text style={styles.resultName} numberOfLines={expanded ? undefined : 1}>
            {result.name}
          </Text>
          {hospice && (
            <View style={[styles.hospiceBadge, { backgroundColor: CATEGORY_META[hospice.category].color + "22" }]}>
              <Feather name={CATEGORY_META[hospice.category].icon as any} size={10} color={CATEGORY_META[hospice.category].color} />
              <Text style={[styles.hospiceBadgeText, { color: CATEGORY_META[hospice.category].color }]}>
                {CATEGORY_META[hospice.category].label}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.resultMeta}>
          <View style={styles.ttyPill}>
            <Text style={styles.ttyPillText}>{ttyLabel(result.tty)}</Text>
          </View>
          <Text style={styles.rxcuiText}>RxCUI {result.rxcui}</Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={Colors.textMuted}
          />
        </View>
      </View>

      {expanded && hospice && (
        <View style={styles.hospiceDetail}>
          <View style={styles.hospiceUseRow}>
            {hospice.uses.map((u) => (
              <View key={u} style={styles.useChip}>
                <Text style={styles.useChipText}>{u}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.hospiceNote}>{hospice.note}</Text>
        </View>
      )}

      {expanded && !hospice && (
        <View style={styles.hospiceDetail}>
          <Text style={styles.hospiceNote}>
            No specific hospice guidance is stored for this medication. Consult your hospice pharmacist or nurse for dosing and use information.
          </Text>
        </View>
      )}

      {expanded && <FdaInteractionsCard drugName={result.name} />}
    </Pressable>
  );
}

function CommonMedChip({ label, onPress }: { label: string; onPress: () => void }) {
  const hospice = getHospiceNote(label);
  const meta = hospice ? CATEGORY_META[hospice.category] : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.commonChip, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      {meta && <Feather name={meta.icon as any} size={12} color={meta.color} />}
      <Text style={styles.commonChipText}>{label}</Text>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MedicationLookupScreen() {
  const insets = useSafeAreaInsets();
  const { results, loading, search, clear } = useRxNorm();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim().length >= 2) {
      setHasSearched(true);
      search(text);
    } else {
      setHasSearched(false);
      clear();
    }
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    clear();
  };

  const handleCommonMed = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(name);
    setHasSearched(true);
    search(name);
  };

  const showCommon = !hasSearched || query.trim().length < 2;
  const showResults = hasSearched && query.trim().length >= 2;

  return (
    <View style={styles.container}>
      <CosmicBackground />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Medication Lookup</Text>
          <Text style={styles.headerSub}>RxNorm database · hospice context</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={Colors.primary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search medication name…"
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {loading && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />
            )}
            {!loading && query.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={8} style={{ marginRight: 10 }}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Text style={styles.searchHint}>
            Searches the NLM RxNorm database. Tap a result to see hospice-specific clinical context.
          </Text>
        </View>

        {/* Common hospice medications */}
        {showCommon && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={14} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Common Hospice Medications</Text>
            </View>
            <Text style={styles.sectionSub}>
              Tap any medication to search and view hospice guidance.
            </Text>
            <View style={styles.commonGrid}>
              {COMMON_MEDS.map((med) => (
                <CommonMedChip key={med} label={med} onPress={() => handleCommonMed(med)} />
              ))}
            </View>
          </View>
        )}

        {/* Guidance categories */}
        {showCommon && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={14} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>Symptom Categories</Text>
            </View>
            <View style={styles.categoryGrid}>
              {(Object.entries(CATEGORY_META) as [HospiceNote["category"], typeof CATEGORY_META[HospiceNote["category"]]][]).map(([key, meta]) => (
                <View key={key} style={[styles.categoryChip, { borderColor: meta.color + "55" }]}>
                  <Feather name={meta.icon as any} size={13} color={meta.color} />
                  <Text style={[styles.categoryChipText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Search results */}
        {showResults && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="list" size={14} color={Colors.textMuted} />
              <Text style={styles.sectionTitle}>
                {loading ? "Searching RxNorm…" : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
              </Text>
            </View>

            {!loading && results.length === 0 && (
              <View style={styles.noResults}>
                <Feather name="search" size={28} color={Colors.textSubtle} />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSub}>
                  Try a different spelling or generic drug name. RxNorm uses standardized US names.
                </Text>
              </View>
            )}

            {results.map((r) => (
              <ResultCard key={r.rxcui} result={r} onTap={() => {}} />
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="alert-circle" size={13} color={Colors.textSubtle} />
          <Text style={styles.disclaimerText}>
            Medication information is for educational reference only. Dosing decisions must be made by your hospice nurse or physician.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(40,65,140,0.40)",
    backgroundColor: "rgba(3,10,24,0.97)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14,22,55,0.90)",
    borderWidth: 1,
    borderColor: "rgba(60,90,170,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  searchCard: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  searchIcon: {
    marginLeft: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#EEF4FF",
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    paddingRight: 4,
  },
  searchHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    paddingHorizontal: 14,
    paddingBottom: 12,
    lineHeight: 16,
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
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#7A90B8",
    letterSpacing: 0.1,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    marginTop: -4,
  },
  commonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  commonChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  commonChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#EEF4FF",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(14,22,55,0.80)",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  resultCard: {
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
    padding: 14,
    gap: 0,
  },
  resultTop: {
    gap: 6,
  },
  resultNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  resultName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EEF4FF",
    letterSpacing: -0.2,
  },
  hospiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  hospiceBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ttyPill: {
    backgroundColor: "rgba(60,120,255,0.12)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ttyPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  rxcuiText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    flex: 1,
  },
  hospiceDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(55,85,170,0.15)",
    gap: 8,
  },
  hospiceUseRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  useChip: {
    backgroundColor: "rgba(8,16,45,0.95)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  useChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#7A90B8",
  },
  hospiceNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#7A90B8",
    lineHeight: 20,
  },
  fdaCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(55,85,170,0.15)",
    gap: 8,
  },
  fdaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fdaCardTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    flex: 1,
  },
  fdaCardSource: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
  },
  fdaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    lineHeight: 18,
  },
  fdaNoData: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    lineHeight: 18,
  },
  fdaTellRagna: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(60,120,255,0.10)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(60,120,255,0.25)",
  },
  fdaTellRagnaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  noResultsTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#5A78A8",
  },
  noResultsSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "rgba(12,20,55,0.90)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(55,85,170,0.22)",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    lineHeight: 16,
  },
});
