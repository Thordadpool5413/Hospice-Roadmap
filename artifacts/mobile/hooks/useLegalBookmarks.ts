import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { StateCode } from "@/content/legal/types";

const STATES_KEY = "@legal_saved_states_v1";
const DOCS_KEY = "@legal_saved_docs_v1";
const RECENT_KEY = "@legal_recent_states_v1";
const MAX_RECENT = 6;

export function useLegalBookmarks() {
  const [savedStates, setSavedStates] = useState<StateCode[]>([]);
  const [savedDocs, setSavedDocs] = useState<string[]>([]);
  const [recentStates, setRecentStates] = useState<StateCode[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([STATES_KEY, DOCS_KEY, RECENT_KEY]).then(([[, sv], [, dv], [, rv]]) => {
      if (sv) setSavedStates(JSON.parse(sv));
      if (dv) setSavedDocs(JSON.parse(dv));
      if (rv) setRecentStates(JSON.parse(rv));
    });
  }, []);

  const toggleState = useCallback(async (code: StateCode) => {
    setSavedStates((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      AsyncStorage.setItem(STATES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleDoc = useCallback(async (id: string) => {
    setSavedDocs((prev) => {
      const next = prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id];
      AsyncStorage.setItem(DOCS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recordRecentState = useCallback(async (code: StateCode) => {
    setRecentStates((prev) => {
      const filtered = prev.filter((c) => c !== code);
      const next = [code, ...filtered].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    savedStates,
    savedDocs,
    recentStates,
    toggleState,
    toggleDoc,
    recordRecentState,
    isStateSaved: (code: StateCode) => savedStates.includes(code),
    isDocSaved: (id: string) => savedDocs.includes(id),
  };
}
