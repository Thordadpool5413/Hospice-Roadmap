import { useCallback, useRef, useState } from "react";

export interface RxNormResult {
  rxcui: string;
  name: string;
  tty: string;
}

const TTY_LABEL: Record<string, string> = {
  IN: "Ingredient",
  PIN: "Precise Ingredient",
  BN: "Brand",
  SCD: "Clinical Drug",
  SBD: "Branded Drug",
  GPCK: "Generic Pack",
  BPCK: "Branded Pack",
  MIN: "Multi-Ingredient",
};

const PREFERRED_TTYS = ["SCD", "IN", "BN", "SBD", "MIN", "PIN"];

export function ttyLabel(tty: string): string {
  return TTY_LABEL[tty] ?? tty;
}

export function useRxNorm() {
  const [results, setResults] = useState<RxNormResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("RxNorm error");
        const data = await res.json();

        const groups: { tty?: string; conceptProperties?: { rxcui: string; name: string; tty: string }[] }[] =
          data?.drugGroup?.conceptGroup ?? [];

        const all: RxNormResult[] = [];
        for (const group of groups) {
          const tty = group.tty ?? "";
          if (!PREFERRED_TTYS.includes(tty)) continue;
          for (const prop of group.conceptProperties ?? []) {
            all.push({ rxcui: prop.rxcui, name: prop.name, tty });
          }
        }

        const seen = new Set<string>();
        const deduped = all
          .sort((a, b) => PREFERRED_TTYS.indexOf(a.tty) - PREFERRED_TTYS.indexOf(b.tty))
          .filter((r) => {
            const key = r.rxcui;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 12);

        setResults(deduped);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
