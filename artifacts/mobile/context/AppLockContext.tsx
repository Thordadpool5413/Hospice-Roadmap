import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

export type LockTimeout = 0 | 1 | 5 | 15;

const LOCK_STORAGE_KEY = "@app_lock_settings";

interface LockSettings {
  enabled: boolean;
  timeoutMinutes: LockTimeout;
}

interface AppLockContextValue {
  isLockEnabled: boolean;
  lockTimeout: LockTimeout;
  isLocked: boolean;
  setLockEnabled: (enabled: boolean) => Promise<void>;
  setLockTimeout: (minutes: LockTimeout) => void;
  unlock: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [lockTimeout, setLockTimeoutState] = useState<LockTimeout>(1);
  const [isLocked, setIsLocked] = useState(false);

  // Refs avoid stale closures in the AppState listener, which is registered
  // once on mount and never re-registered.
  const isLockEnabledRef = useRef(false);
  const lockTimeoutRef   = useRef<LockTimeout>(1);
  const backgroundAt     = useRef<number | null>(null);

  // ── Load settings ─────────────────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem(LOCK_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as LockSettings;
        setIsLockEnabled(saved.enabled);
        setLockTimeoutState(saved.timeoutMinutes);
        isLockEnabledRef.current = saved.enabled;
        lockTimeoutRef.current   = saved.timeoutMinutes;
      })
      .catch(() => {});
  }, []);

  // Keep refs in sync so the listener always reads the latest values.
  useEffect(() => { isLockEnabledRef.current = isLockEnabled; }, [isLockEnabled]);
  useEffect(() => { lockTimeoutRef.current   = lockTimeout;   }, [lockTimeout]);

  // ── AppState listener ─────────────────────────────────────────────────────
  //
  // Strategy to prevent data flash on resume:
  //   • On background/inactive → pre-lock IMMEDIATELY (isLocked = true).
  //     The OS takes a screenshot at this point for the app switcher; the
  //     lock screen is already in the tree before that happens.
  //   • On active → check elapsed time:
  //       - elapsed < threshold → auto-release (user came back quickly, no auth needed)
  //       - elapsed >= threshold → keep locked; LockScreen auto-prompts auth on mount

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          if (isLockEnabledRef.current) {
            backgroundAt.current = Date.now();
            // Pre-lock before the OS screenshot is taken.
            setIsLocked(true);
          }
        } else if (nextState === "active") {
          if (!isLockEnabledRef.current) {
            backgroundAt.current = null;
            setIsLocked(false);
            return;
          }

          if (backgroundAt.current !== null) {
            const elapsedMs   = Date.now() - backgroundAt.current;
            const thresholdMs = lockTimeoutRef.current * 60 * 1000;
            if (elapsedMs < thresholdMs) {
              // User returned within the grace window — auto-release lock.
              setIsLocked(false);
            }
            // else: elapsed >= threshold → keep isLocked=true; LockScreen
            //       auto-prompts via its own useEffect on mount.
          }

          backgroundAt.current = null;
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // ── Persist helper ────────────────────────────────────────────────────────

  const persist = useCallback((settings: LockSettings) => {
    AsyncStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const setLockEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      setIsLockEnabled(enabled);
      isLockEnabledRef.current = enabled;
      // Disabling the lock also unlocks immediately.
      if (!enabled) setIsLocked(false);
      persist({ enabled, timeoutMinutes: lockTimeoutRef.current });
    },
    [persist]
  );

  const setLockTimeout = useCallback(
    (minutes: LockTimeout) => {
      setLockTimeoutState(minutes);
      lockTimeoutRef.current = minutes;
      persist({ enabled: isLockEnabledRef.current, timeoutMinutes: minutes });
    },
    [persist]
  );

  // authenticateAsync handles Face ID / Touch ID / fingerprint and falls
  // back to the device passcode when disableDeviceFallback is false.
  //
  // SECURITY: this function ALWAYS fails closed.  Any exception during auth
  // keeps isLocked=true and returns false — we never unlock on an error path.
  const unlock = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Hospice Roadmap",
        fallbackLabel: "Use Device Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLocked(false);
        return true;
      }
      // Auth failed or was cancelled — stay locked.
      return false;
    } catch {
      // Fail closed: keep app locked on any unexpected auth API error.
      // Never auto-unlock on an exception path.
      return false;
    }
  }, []);

  return (
    <AppLockContext.Provider
      value={{ isLockEnabled, lockTimeout, isLocked, setLockEnabled, setLockTimeout, unlock }}
    >
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used inside AppLockProvider");
  return ctx;
}
