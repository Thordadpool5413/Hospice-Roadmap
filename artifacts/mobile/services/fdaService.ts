import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FdaLabelData {
  genericName: string;
  brandName: string;
  drugInteractions: string;
  fetchedAt: string;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

const LABEL_CACHE_PREFIX = "@fda_label_v1:";
const LABEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface LabelCacheEntry {
  data: FdaLabelData | null;
  cachedAt: string;
}

async function getCachedLabel(drugName: string): Promise<LabelCacheEntry | null> {
  try {
    const key = LABEL_CACHE_PREFIX + drugName.toLowerCase().trim();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LabelCacheEntry;
  } catch {
    return null;
  }
}

async function setCachedLabel(drugName: string, data: FdaLabelData | null): Promise<void> {
  try {
    const key = LABEL_CACHE_PREFIX + drugName.toLowerCase().trim();
    const entry: LabelCacheEntry = { data, cachedAt: new Date().toISOString() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

function isCacheValid(cachedAt: string): boolean {
  return Date.now() - new Date(cachedAt).getTime() < LABEL_CACHE_TTL_MS;
}

// ─── FDA API ─────────────────────────────────────────────────────────────────

const FDA_BASE = "https://api.fda.gov/drug/label.json";

/**
 * Fetch the FDA drug label for a given drug name.
 * Returns null if the drug has no label data or the API is unavailable.
 * Results are cached in AsyncStorage for 24 hours.
 */
export async function fetchFdaLabel(
  drugName: string,
  options?: { bypassCache?: boolean }
): Promise<FdaLabelData | null> {
  const normalized = drugName.toLowerCase().trim();

  if (!options?.bypassCache) {
    const cached = await getCachedLabel(normalized);
    if (cached && isCacheValid(cached.cachedAt)) {
      return cached.data;
    }
  }

  try {
    const search = encodeURIComponent(`"${normalized}"`);
    const url = `${FDA_BASE}?search=openfda.generic_name:${search}&limit=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    // Fallback: try brand name search if generic name found nothing
    if (!res.ok) {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 8000);
      const url2 = `${FDA_BASE}?search=openfda.brand_name:${search}&limit=1`;
      res = await fetch(url2, { signal: controller2.signal });
      clearTimeout(timer2);
    }

    if (!res.ok) {
      await setCachedLabel(normalized, null);
      return null;
    }

    const json = await res.json();
    const result = json?.results?.[0];
    if (!result) {
      await setCachedLabel(normalized, null);
      return null;
    }

    const genericName =
      result?.openfda?.generic_name?.[0] ?? drugName;
    const brandName =
      result?.openfda?.brand_name?.[0] ?? "";
    const rawInteractions =
      result?.drug_interactions?.[0] ?? "";

    const label: FdaLabelData = {
      genericName,
      brandName,
      drugInteractions: rawInteractions,
      fetchedAt: new Date().toISOString(),
    };

    await setCachedLabel(normalized, label);
    return label;
  } catch {
    return null;
  }
}
