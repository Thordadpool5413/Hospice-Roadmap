import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const WIZARD_KEY = "@profile_wizard_status";

type WizardStatus = {
  completed: boolean;
  dismissCount: number;
  lastDismissedAt: string | null;
};

const DEFAULT_STATUS: WizardStatus = {
  completed: false,
  dismissCount: 0,
  lastDismissedAt: null,
};

function canShowWizard(status: WizardStatus): boolean {
  if (status.completed) return false;
  if (status.dismissCount === 0) return true;
  if (status.dismissCount >= 2) return false;
  if (!status.lastDismissedAt) return false;
  const daysSince =
    (Date.now() - new Date(status.lastDismissedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 7;
}

export function useProfileWizard() {
  const [status, setStatus] = useState<WizardStatus>(DEFAULT_STATUS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WIZARD_KEY)
      .then((raw) => {
        if (raw) setStatus(JSON.parse(raw) as WizardStatus);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const writeStatus = useCallback(async (next: WizardStatus) => {
    setStatus(next);
    await AsyncStorage.setItem(WIZARD_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const markCompleted = useCallback(async () => {
    await writeStatus({ ...status, completed: true });
  }, [status, writeStatus]);

  const markDismissed = useCallback(async () => {
    await writeStatus({
      ...status,
      dismissCount: status.dismissCount + 1,
      lastDismissedAt: new Date().toISOString(),
    });
  }, [status, writeStatus]);

  return {
    loaded,
    canShow: loaded && canShowWizard(status),
    markCompleted,
    markDismissed,
  };
}
