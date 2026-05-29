/**
 * FamilyContactsManager
 *
 * Manages a list of up to 6 named family contacts (name + phone number).
 * Contacts are persisted in AsyncStorage and exposed via a custom hook.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyContact {
  id: string;
  name: string;
  phone: string;
}

const STORAGE_KEY = "@family_contacts_v1";
const MAX_CONTACTS = 6;

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function loadContacts(): Promise<FamilyContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FamilyContact[]) : [];
  } catch {
    return [];
  }
}

async function saveContacts(contacts: FamilyContact[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface ContactsHook {
  contacts: FamilyContact[];
  isLoading: boolean;
  addContact: (name: string, phone: string) => Promise<void>;
  updateContact: (id: string, name: string, phone: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export function useFamilyContacts(): ContactsHook {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts()
      .then(setContacts)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addContact = useCallback(async (name: string, phone: string) => {
    const newContact: FamilyContact = {
      id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      phone: phone.trim(),
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await saveContacts(updated);
  }, [contacts]);

  const updateContact = useCallback(async (id: string, name: string, phone: string) => {
    const updated = contacts.map((c) =>
      c.id === id ? { ...c, name: name.trim(), phone: phone.trim() } : c
    );
    setContacts(updated);
    await saveContacts(updated);
  }, [contacts]);

  const deleteContact = useCallback(async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    await saveContacts(updated);
  }, [contacts]);

  return { contacts, isLoading, addContact, updateContact, deleteContact };
}

// ─── E.164 phone validation ────────────────────────────────────────────────────

const E164_RE = /^\+[1-9]\d{7,14}$/;

function normalizePhone(raw: string): string {
  return raw.trim().replace(/[\s\-().]/g, "");
}

function isValidPhone(raw: string): boolean {
  return E164_RE.test(normalizePhone(raw));
}

// ─── Contact Form Modal ───────────────────────────────────────────────────────

interface ContactFormProps {
  visible: boolean;
  initial?: FamilyContact;
  onSave: (name: string, phone: string) => void;
  onClose: () => void;
}

function ContactFormModal({ visible, initial, onSave, onClose }: ContactFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
    }
  }, [visible, initial?.id]);

  const handleSave = () => {
    const trimName = name.trim();
    const normalPhone = normalizePhone(phone);

    if (!trimName) {
      Alert.alert("Name required", "Please enter a name for this contact.");
      return;
    }
    if (!isValidPhone(phone)) {
      Alert.alert(
        "Invalid phone number",
        "Enter the number in international format, e.g. +15551234567"
      );
      return;
    }
    onSave(trimName, normalPhone);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={fm.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={fm.sheet}>
          <View style={fm.handle} />
          <Text style={fm.title}>{initial ? "Edit Contact" : "Add Family Contact"}</Text>
          <Text style={fm.hint}>They'll receive SMS updates — no app needed.</Text>

          <View style={fm.field}>
            <Text style={fm.label}>Name</Text>
            <TextInput
              style={fm.input}
              placeholder="e.g. Maria (sister)"
              placeholderTextColor="#4A6090"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              autoFocus
            />
          </View>

          <View style={fm.field}>
            <Text style={fm.label}>Phone number</Text>
            <TextInput
              ref={phoneRef}
              style={fm.input}
              placeholder="+15551234567"
              placeholderTextColor="#4A6090"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text style={fm.fieldHint}>International format: +1 for US numbers</Text>
          </View>

          <View style={fm.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [fm.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={fm.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [fm.saveBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={fm.saveText}>{initial ? "Save Changes" : "Add Contact"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const fm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0D1A40",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(80,120,220,0.25)",
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(100,140,220,0.30)",
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.4,
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6A80AE",
    lineHeight: 18,
    marginTop: -6,
  },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#7A90B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "rgba(14, 24, 60, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(80, 120, 220, 0.28)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#EEF4FF",
  },
  fieldHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(80,120,220,0.25)",
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#7A90B8",
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});

// ─── ContactRow ───────────────────────────────────────────────────────────────

interface ContactRowProps {
  contact: FamilyContact;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactRow({ contact, onEdit, onDelete }: ContactRowProps) {
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove contact?",
      `${contact.name} will no longer receive family updates.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <View style={cr.row}>
      <View style={cr.avatar}>
        <Text style={cr.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={cr.info}>
        <Text style={cr.name}>{contact.name}</Text>
        <Text style={cr.phone}>{contact.phone}</Text>
      </View>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(); }}
        style={({ pressed }) => [cr.iconBtn, pressed && { opacity: 0.6 }]}
        hitSlop={6}
      >
        <Feather name="edit-2" size={15} color="#5A78A8" />
      </Pressable>
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [cr.iconBtn, pressed && { opacity: 0.6 }]}
        hitSlop={6}
      >
        <Feather name="trash-2" size={15} color={Colors.error} />
      </Pressable>
    </View>
  );
}

const cr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  info: { flex: 1, gap: 2 },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#E8F0FF",
  },
  phone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#5A78A8",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── FamilyContactsManager (main component) ───────────────────────────────────

interface FamilyContactsManagerProps {
  contacts: FamilyContact[];
  onAdd: (name: string, phone: string) => Promise<void>;
  onUpdate: (id: string, name: string, phone: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FamilyContactsManager({
  contacts,
  onAdd,
  onUpdate,
  onDelete,
}: FamilyContactsManagerProps) {
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<FamilyContact | undefined>(undefined);

  const openAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(undefined);
    setFormVisible(true);
  };

  const openEdit = (contact: FamilyContact) => {
    setEditing(contact);
    setFormVisible(true);
  };

  const handleSave = async (name: string, phone: string) => {
    if (editing) {
      await onUpdate(editing.id, name, phone);
    } else {
      await onAdd(name, phone);
    }
    setFormVisible(false);
  };

  const canAddMore = contacts.length < MAX_CONTACTS;

  return (
    <View style={mgr.root}>
      {contacts.length === 0 ? (
        <View style={mgr.empty}>
          <Feather name="users" size={28} color="#3A5080" />
          <Text style={mgr.emptyText}>No contacts yet</Text>
          <Text style={mgr.emptyHint}>
            Add family members who should receive today's care updates by text.
          </Text>
        </View>
      ) : (
        <View style={mgr.list}>
          {contacts.map((c, i) => (
            <View key={c.id}>
              {i > 0 && <View style={mgr.divider} />}
              <ContactRow
                contact={c}
                onEdit={() => openEdit(c)}
                onDelete={() => onDelete(c.id)}
              />
            </View>
          ))}
        </View>
      )}

      {canAddMore && (
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [mgr.addBtn, pressed && { opacity: 0.75 }]}
        >
          <Feather name="plus" size={15} color={Colors.primary} />
          <Text style={mgr.addText}>
            {contacts.length === 0 ? "Add your first contact" : "Add another contact"}
          </Text>
          <Text style={mgr.addCount}>{contacts.length}/{MAX_CONTACTS}</Text>
        </Pressable>
      )}

      {!canAddMore && (
        <Text style={mgr.maxNote}>Maximum {MAX_CONTACTS} contacts reached.</Text>
      )}

      <ContactFormModal
        visible={formVisible}
        initial={editing}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

const mgr = StyleSheet.create({
  root: { gap: 0 },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#5A78A8",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
    textAlign: "center",
    lineHeight: 19,
  },
  list: {},
  divider: {
    height: 1,
    backgroundColor: "rgba(50, 80, 160, 0.18)",
    marginHorizontal: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(50, 80, 160, 0.15)",
  },
  addText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  addCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
  },
  maxNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4A6090",
    textAlign: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(50, 80, 160, 0.15)",
  },
});
