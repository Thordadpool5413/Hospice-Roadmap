import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontScale = 1 | 1.2 | 1.4;

interface AccessibilityContextValue {
  fontScale: FontScale;
  highContrast: boolean;
  setFontScale: (scale: FontScale) => void;
  setHighContrast: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const STORAGE_KEY = "@hospice_roadmap_a11y";

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(1);
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.fontScale) setFontScaleState(saved.fontScale);
        if (typeof saved.highContrast === "boolean")
          setHighContrastState(saved.highContrast);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(
    (next: { fontScale: FontScale; highContrast: boolean }) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    },
    []
  );

  const setFontScale = useCallback(
    (scale: FontScale) => {
      setFontScaleState(scale);
      persist({ fontScale: scale, highContrast });
    },
    [highContrast, persist]
  );

  const setHighContrast = useCallback(
    (enabled: boolean) => {
      setHighContrastState(enabled);
      persist({ fontScale, highContrast: enabled });
    },
    [fontScale, persist]
  );

  return (
    <AccessibilityContext.Provider
      value={{ fontScale, highContrast, setFontScale, setHighContrast }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useA11y must be used inside AccessibilityProvider");
  return ctx;
}
