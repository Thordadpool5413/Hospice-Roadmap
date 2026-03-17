import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";
import { RxNormResult, ttyLabel, useRxNorm } from "@/hooks/useRxNorm";
import { MedicationEntry } from "@/types";

interface Props {
  medications: MedicationEntry[];
  onChange: (medications: MedicationEntry[]) => void;
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

export function MedicationPicker({ medications, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { results, loading, search, clear } = useRxNorm();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [doseText, setDoseText] = useState("");

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setShowDropdown(true);
    search(text);
  };

  const addResult = (result: RxNormResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entry: MedicationEntry = {
      id: makeId(),
      name: result.name,
      rxcui: result.rxcui,
      tty: result.tty,
    };
    onChange([...medications, entry]);
    setQuery("");
    setShowDropdown(false);
    clear();
  };

  const addCustom = () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entry: MedicationEntry = {
      id: makeId(),
      name: query.trim(),
    };
    onChange([...medications, entry]);
    setQuery("");
    setShowDropdown(false);
    clear();
  };

  const remove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(medications.filter((m) => m.id !== id));
  };

  const openDoseEdit = (med: MedicationEntry) => {
    setEditingId(med.id);
    setDoseText(med.doseNote ?? "");
  };

  const saveDose = () => {
    onChange(
      medications.map((m) =>
        m.id === editingId ? { ...m, doseNote: doseText.trim() || undefined } : m
      )
    );
    setEditingId(null);
    setDoseText("");
  };

  const showResults = showDropdown && (results.length > 0 || loading || query.trim().length >= 2);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Feather name="search" size={16} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search medications…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />}
        {!loading && query.length > 0 && (
          <Pressable
            onPress={() => { setQuery(""); clear(); setShowDropdown(false); }}
            hitSlop={8}
            style={{ marginRight: 8 }}
          >
            <Feather name="x" size={15} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showResults && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 220 }}
          >
            {loading && results.length === 0 && (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.dropdownLoadingText}>Searching RxNorm…</Text>
              </View>
            )}
            {results.map((r) => (
              <Pressable
                key={r.rxcui}
                style={({ pressed }) => [styles.dropdownRow, pressed && styles.dropdownRowPressed]}
                onPress={() => addResult(r)}
              >
                <View style={styles.dropdownRowInner}>
                  <Text style={styles.dropdownName} numberOfLines={1}>{r.name}</Text>
                  <View style={styles.ttyBadge}>
                    <Text style={styles.ttyBadgeText}>{ttyLabel(r.tty)}</Text>
                  </View>
                </View>
                {r.rxcui && (
                  <Text style={styles.rxcuiText}>RxCUI {r.rxcui}</Text>
                )}
              </Pressable>
            ))}
            {!loading && query.trim().length >= 2 && (
              <Pressable
                style={({ pressed }) => [styles.dropdownRow, styles.addCustomRow, pressed && styles.dropdownRowPressed]}
                onPress={addCustom}
              >
                <Feather name="plus-circle" size={14} color={Colors.primary} />
                <Text style={styles.addCustomText}>Add "{query.trim()}" as entered</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}

      {medications.length > 0 && (
        <View style={styles.tagList}>
          {medications.map((med) => (
            <Pressable
              key={med.id}
              style={styles.tag}
              onPress={() => openDoseEdit(med)}
            >
              <View style={styles.tagInner}>
                <Feather
                  name="package"
                  size={12}
                  color={med.rxcui ? Colors.primary : Colors.textMuted}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tagName} numberOfLines={2}>{med.name}</Text>
                  {med.doseNote ? (
                    <Text style={styles.tagDose}>{med.doseNote}</Text>
                  ) : (
                    <Text style={styles.tagDoseHint}>Tap to add dose/route</Text>
                  )}
                </View>
              </View>
              <Pressable onPress={() => remove(med.id)} hitSlop={8} style={styles.tagRemove}>
                <Feather name="x" size={13} color={Colors.textMuted} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={editingId !== null} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={saveDose}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dose / Route</Text>
            <Text style={styles.modalSub}>
              {medications.find((m) => m.id === editingId)?.name}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={doseText}
              onChangeText={setDoseText}
              placeholder="e.g. 5mg oral every 4 hours"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveDose}
            />
            <Pressable
              style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.8 }]}
              onPress={saveDose}
            >
              <Text style={styles.modalBtnText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    minHeight: 48,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    paddingRight: 4,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  dropdownLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
  },
  dropdownLoadingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  dropdownRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownRowPressed: {
    backgroundColor: Colors.backgroundSecondary,
  },
  dropdownRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dropdownName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  ttyBadge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ttyBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  rxcuiText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    marginTop: 2,
  },
  addCustomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 0,
  },
  addCustomText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  tagList: {
    marginTop: 10,
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 8,
    gap: 8,
  },
  tagInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  tagName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    lineHeight: 18,
  },
  tagDose: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  tagDoseHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSubtle,
    marginTop: 1,
    fontStyle: "italic",
  },
  tagRemove: {
    padding: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    width: "100%",
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: -4,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  modalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
