/**
 * Family Updates Screen
 *
 * Lets premium caregivers generate a warm AI care-update draft from today's
 * symptom check-in and journal entry, edit it, then send it as SMS to up to
 * 6 saved family contacts via Twilio (server-side — no keys on device).
 *
 * Send history (last 10) is stored server-side so it syncs across devices.
 * AsyncStorage is used as an offline fallback cache.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
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
import {
  FamilyContactsManager,
  useFamilyContacts,
} from "@/components/FamilyContactsManager";
import { PremiumGate } from "@/components/PremiumGate";
import { Colors } from "@/constants/colors";
import { useJournal } from "@/context/JournalContext";
import { useSymptoms } from "@/context/SymptomContext";
import {
  type SendHistoryEntry,
  generateFamilyUpdateDraft,
  sendFamilyUpdate,
  fetchFamilyUpdateHistory,
  fetchOptedOutPhones,
} from "@/services/familyUpdatesService";

// ─── Local history cache (offline fallback) ───────────────────────────────────

const HISTORY_CACHE_KEY = "@family_update_history_v1";
const MAX_HISTORY = 10;

async function loadLocalHistory(): Promise<SendHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SendHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

async function cacheHistory(entries: SendHistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // cache writes are best-effort
  }
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sc.card}>
      <View style={sc.header}>
        <View style={sc.iconWrap}>
          <Feather name={icon as any} size={15} color={Colors.primary} />
        </View>
        <View style={sc.textWrap}>
          <Text style={sc.title}>{title}</Text>
          {subtitle && <Text style={sc.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: "rgba(10, 18, 50, 0.90)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(70, 110, 210, 0.20)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(60, 90, 170, 0.16)",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#D8E8FF",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
    marginTop: 1,
  },
});

// ─── Send History Row ─────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: SendHistoryEntry }) {
  const date = new Date(entry.sentAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={hr.row}>
      <View style={hr.dot} />
      <View style={hr.content}>
        <View style={hr.meta}>
          <Text style={hr.dateText}>
            {dateStr} · {timeStr}
          </Text>
          <Text style={hr.recipientText}>
            {entry.recipientCount}{" "}
            {entry.recipientCount === 1 ? "recipient" : "recipients"}
          </Text>
        </View>
        <Text style={hr.preview} numberOfLines={2}>
          {entry.preview}
        </Text>
      </View>
    </View>
  );
}

const hr = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success + "AA",
    marginTop: 5,
    flexShrink: 0,
  },
  content: { flex: 1, gap: 4 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#4A6090",
  },
  recipientText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
  },
  preview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8090B8",
    lineHeight: 19,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

function FamilyUpdatesContent() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const { contacts: rawContacts, isLoading: contactsLoading, addContact, updateContact, deleteContact } =
    useFamilyContacts();
  const { getTodayEntry } = useSymptoms();
  const { entries: journalEntries } = useJournal();

  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<SendHistoryEntry[]>([]);
  const [lastSendResult, setLastSendResult] = useState<{
    sentCount: number;
    failedCount: number;
    optedOutCount: number;
  } | null>(null);
  const [optedOutPhones, setOptedOutPhones] = useState<Set<string>>(new Set());

  // Merge opt-out status into contacts for display
  const contacts = rawContacts.map((c) => ({
    ...c,
    optedOut: optedOutPhones.has(c.phone),
  }));

  // Active (non-opted-out) contacts for sending
  const activeContacts = contacts.filter((c) => !c.optedOut);

  const refreshHistory = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = await getToken();
      if (signal?.aborted) return;
      if (token) {
        const [serverHistory, localHistory] = await Promise.all([
          fetchFamilyUpdateHistory(token),
          loadLocalHistory(),
        ]);
        if (signal?.aborted) return;
        // Merge: union by id, keeping server entry when both sides have the same id
        const serverIds = new Set(serverHistory.map((e) => e.id));
        const localOnly = localHistory.filter((e) => !serverIds.has(e.id));
        const merged = [...serverHistory, ...localOnly]
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
          .slice(0, MAX_HISTORY);
        setHistory(merged);
        cacheHistory(merged);
        return;
      }
    } catch {
      // server unavailable — fall through to local cache
    }
    if (signal?.aborted) return;
    const local = await loadLocalHistory();
    if (!signal?.aborted) setHistory(local);
  }, [getToken]);

  // Load history on mount
  useEffect(() => {
    const controller = new AbortController();
    refreshHistory(controller.signal);
    return () => { controller.abort(); };
  }, [refreshHistory]);

  // Silently re-fetch history when the app returns to the foreground
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        refreshHistory();
      }
      appStateRef.current = nextState;
    });
    return () => { subscription.remove(); };
  }, [refreshHistory]);

  // Fetch opt-out status whenever the contact list changes
  useEffect(() => {
    if (contactsLoading || rawContacts.length === 0) return;
    let cancelled = false;
    async function loadOptOuts() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const phones = rawContacts.map((c) => c.phone);
        const optedOut = await fetchOptedOutPhones(phones, token);
        if (!cancelled) setOptedOutPhones(new Set(optedOut));
      } catch {
        // silently ignore — opt-out status is best-effort
      }
    }
    loadOptOuts();
    return () => { cancelled = true; };
  }, [contactsLoading, rawContacts, getToken]);

  // ── Source material ────────────────────────────────────────────────────────

  const todayEntry = getTodayEntry();

  const symptomSummary = todayEntry
    ? [
        `Pain: ${todayEntry.pain}/10`,
        `Breathlessness: ${todayEntry.breathlessness}/10`,
        `Nausea: ${todayEntry.nausea}/10`,
        todayEntry.notes ? `Note: ${todayEntry.notes}` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const mostRecentJournal = journalEntries[0];
  const journalExcerpt = mostRecentJournal?.body
    ? mostRecentJournal.body.slice(0, 600)
    : "";

  const hasSourceData = !!symptomSummary || !!journalExcerpt;

  // ── Generate draft ─────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!hasSourceData) {
      Alert.alert(
        "No data yet today",
        "Complete a symptom check-in or write a journal entry first — Ragna will use that to write the update."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setLastSendResult(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in.");

      const result = await generateFamilyUpdateDraft(
        { symptomSummary, journalExcerpt },
        token
      );
      setDraft(result.draft);
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Couldn't generate draft", e?.message ?? "Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [hasSourceData, symptomSummary, journalExcerpt, getToken]);

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!draft.trim()) {
      Alert.alert("No message", "Generate or type a message first.");
      return;
    }
    if (contacts.length === 0) {
      Alert.alert("No contacts", "Add at least one family contact below.");
      return;
    }
    if (activeContacts.length === 0) {
      Alert.alert(
        "All contacts opted out",
        "All saved contacts have replied STOP and will not receive messages. Remove them or add new contacts."
      );
      return;
    }

    const names = activeContacts.map((c) => c.name).join(", ");
    const optedOutNote =
      contacts.length > activeContacts.length
        ? ` (${contacts.length - activeContacts.length} opted-out contact${contacts.length - activeContacts.length > 1 ? "s" : ""} will be skipped)`
        : "";
    Alert.alert(
      "Send family update?",
      `This will send an SMS to ${activeContacts.length} contact${activeContacts.length > 1 ? "s" : ""}: ${names}.${optedOutNote}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsSending(true);
            try {
              const token = await getToken();
              if (!token) throw new Error("Not signed in.");

              const response = await sendFamilyUpdate(
                {
                  message: draft.trim(),
                  phoneNumbers: contacts.map((c) => c.phone),
                },
                token
              );

              setLastSendResult({
                sentCount: response.sentCount,
                failedCount: response.failedCount,
                optedOutCount: response.optedOutCount ?? 0,
              });

              if (response.sentCount > 0) {
                const historyEntry: SendHistoryEntry = {
                  id: `fuh-${Date.now()}`,
                  sentAt: new Date().toISOString(),
                  recipientCount: response.sentCount,
                  preview: draft.trim().slice(0, 200),
                };
                const updated = [historyEntry, ...history].slice(0, MAX_HISTORY);
                setHistory(updated);
                cacheHistory(updated);
              }

              if (response.failedCount > 0 && response.sentCount === 0) {
                Alert.alert(
                  "Send failed",
                  "None of the messages were delivered. Check that phone numbers are in international format (+15551234567) and try again."
                );
              } else if (response.failedCount > 0) {
                Alert.alert(
                  "Partially sent",
                  `${response.sentCount} message${response.sentCount !== 1 ? "s" : ""} sent, ${response.failedCount} failed. Check the phone numbers that failed.`
                );
              }
            } catch (err: unknown) {
              const e = err as { message?: string };
              Alert.alert("Send failed", e?.message ?? "Please try again.");
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  }, [draft, contacts, activeContacts, getToken, history]);

  const sourceChips = [
    { label: "Symptom check-in", filled: !!symptomSummary, icon: "activity" },
    { label: "Journal entry", filled: !!journalExcerpt, icon: "edit-3" },
  ];

  return (
    <View style={s.root}>
      <CosmicBackground />

      {/* ── Header ── */}
      <View
        style={[
          s.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 72 : 16) },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.pageTitle}>Family Updates</Text>
          <Text style={s.pageSubtitle}>Send a care update by text message</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Source data chips ── */}
          <View style={s.chipsRow}>
            {sourceChips.map((chip) => (
              <View
                key={chip.label}
                style={[
                  s.chip,
                  chip.filled && { borderColor: Colors.success + "50", backgroundColor: Colors.success + "10" },
                ]}
              >
                <Feather
                  name={chip.icon as any}
                  size={12}
                  color={chip.filled ? Colors.success : "#3A5080"}
                />
                <Text
                  style={[s.chipText, chip.filled && { color: Colors.success }]}
                >
                  {chip.label}
                </Text>
                {chip.filled && (
                  <Feather name="check" size={11} color={Colors.success} />
                )}
              </View>
            ))}
          </View>

          {!hasSourceData && (
            <View style={s.noDataBanner}>
              <Feather name="info" size={14} color={Colors.amber} />
              <Text style={s.noDataText}>
                Complete a symptom check-in or journal entry today — Ragna will use that to write the update.
              </Text>
            </View>
          )}

          {/* ── Message draft ── */}
          <SectionCard
            icon="message-square"
            title="Today's Update"
            subtitle="Ragna writes a warm, plain-language message you can edit before sending"
          >
            <View style={s.draftArea}>
              {draft ? (
                <TextInput
                  style={s.draftInput}
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  scrollEnabled={false}
                  placeholder="Your care update will appear here…"
                  placeholderTextColor="#3A5080"
                />
              ) : (
                <View style={s.draftPlaceholder}>
                  <Text style={s.draftPlaceholderText}>
                    Tap "Generate update" to have Ragna draft a message from today's data.
                    You can edit it freely before sending.
                  </Text>
                </View>
              )}
            </View>

            {/* Character count */}
            {draft.length > 0 && (
              <Text style={[s.charCount, draft.length > 320 && { color: Colors.amber }]}>
                {draft.length} characters
                {draft.length > 320 && " — may split into 2 SMS"}
              </Text>
            )}

            {/* Actions */}
            <View style={s.draftActions}>
              <Pressable
                onPress={handleGenerate}
                disabled={isGenerating || !hasSourceData}
                style={({ pressed }) => [
                  s.generateBtn,
                  (isGenerating || !hasSourceData) && { opacity: 0.55 },
                  pressed && { opacity: 0.75 },
                ]}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Feather name="zap" size={14} color={Colors.primary} />
                )}
                <Text style={s.generateText}>
                  {isGenerating ? "Generating…" : draft ? "Re-generate" : "Generate update"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSend}
                disabled={isSending || !draft.trim() || activeContacts.length === 0}
                style={({ pressed }) => [
                  s.sendBtn,
                  (isSending || !draft.trim() || activeContacts.length === 0) && {
                    opacity: 0.45,
                  },
                  pressed && { opacity: 0.80 },
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={14} color="#fff" />
                )}
                <Text style={s.sendText}>
                  {isSending ? "Sending…" : `Send to ${activeContacts.length}`}
                </Text>
              </Pressable>
            </View>

            {/* Last send result */}
            {lastSendResult && (
              <View style={s.sendResultBanner}>
                <Feather
                  name={lastSendResult.failedCount === 0 ? "check-circle" : "alert-circle"}
                  size={13}
                  color={lastSendResult.failedCount === 0 ? Colors.success : Colors.amber}
                />
                <Text style={[
                  s.sendResultText,
                  { color: lastSendResult.failedCount === 0 ? Colors.success : Colors.amber },
                ]}>
                  {lastSendResult.failedCount === 0
                    ? `Sent to ${lastSendResult.sentCount} contact${lastSendResult.sentCount !== 1 ? "s" : ""}${lastSendResult.optedOutCount > 0 ? ` · ${lastSendResult.optedOutCount} skipped (opted out)` : ""}`
                    : `${lastSendResult.sentCount} sent, ${lastSendResult.failedCount} failed${lastSendResult.optedOutCount > 0 ? `, ${lastSendResult.optedOutCount} opted out` : ""}`}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* ── Family contacts ── */}
          <SectionCard
            icon="users"
            title="Family Contacts"
            subtitle="Up to 6 people receive the SMS — no app needed"
          >
            <FamilyContactsManager
              contacts={contacts}
              onAdd={addContact}
              onUpdate={updateContact}
              onDelete={deleteContact}
            />
          </SectionCard>

          {/* ── Send history ── */}
          {history.length > 0 && (
            <SectionCard
              icon="clock"
              title="Recent Updates Sent"
              subtitle={`Last ${history.length} update${history.length !== 1 ? "s" : ""}`}
            >
              {history.map((entry, i) => (
                <View key={entry.id}>
                  {i > 0 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(50, 80, 160, 0.15)",
                        marginHorizontal: 14,
                      }}
                    />
                  )}
                  <HistoryRow entry={entry} />
                </View>
              ))}
            </SectionCard>
          )}

          {/* ── Disclaimer ── */}
          <Text style={s.disclaimer}>
            Messages are sent from your Hospice Roadmap account. Recipients see a plain text message — no app download required. Standard carrier rates may apply.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function FamilyUpdatesScreen() {
  return (
    <PremiumGate
      featureName="Family Updates"
      description="Send warm, plain-language care updates by text to your family — included with your Hospice Roadmap subscription."
      showBackButton
    >
      <FamilyUpdatesContent />
    </PremiumGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030A18",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(14, 22, 55, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(60, 90, 170, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 4,
  },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(50, 80, 160, 0.30)",
    backgroundColor: "rgba(14, 22, 58, 0.70)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#3A5080",
  },

  noDataBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "rgba(30, 22, 8, 0.70)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber + "30",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  noDataText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.amber + "CC",
    lineHeight: 19,
  },

  draftArea: {
    minHeight: 120,
    padding: 14,
  },
  draftInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#D0E0FF",
    lineHeight: 22,
    textAlignVertical: "top",
  },
  draftPlaceholder: {
    flex: 1,
    justifyContent: "center",
  },
  draftPlaceholderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    lineHeight: 20,
  },

  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  draftActions: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(50, 80, 160, 0.16)",
  },
  generateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.primary + "12",
    paddingVertical: 12,
  },
  generateText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 4,
  },
  sendText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  sendResultBanner: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 0,
  },
  sendResultText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#344060",
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
