import { CmsQualityData, CmsSpendingData, Provider } from "@/types";
import {
  apiBase,
  fetchJson,
  makeRequestTimeoutSignal,
  mergeJsonHeaders,
} from "./apiClient";

// CMS endpoints hit external government APIs proxied by the backend — they
// can be noticeably slower than internal endpoints, so timeouts are higher.
const CMS_TIMEOUT_MS = 20_000;
const QUALITY_SUMMARY_TIMEOUT_MS = 30_000; // Batch endpoint is slowest.

interface SearchProvidersResponse {
  providers: Provider[];
  total: number;
  limit: number;
  offset: number;
  source: string;
}

export async function searchCmsProviders(params: {
  state?: string;
  zip?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchProvidersResponse> {
  const base = apiBase();
  const query = new URLSearchParams();
  if (params.state) query.set("state", params.state);
  if (params.zip) query.set("zip", params.zip);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  return fetchJson<SearchProvidersResponse>(
    `${base}/cms/providers?${query.toString()}`,
    {
      headers: mergeJsonHeaders(),
      timeoutMs: CMS_TIMEOUT_MS,
    }
  );
}

export async function fetchQualityData(ccn: string): Promise<CmsQualityData> {
  return fetchJson<CmsQualityData>(`${apiBase()}/cms/quality/${ccn}`, {
    headers: mergeJsonHeaders(),
    timeoutMs: CMS_TIMEOUT_MS,
  });
}

export interface QualitySummary {
  hciScore: string | null;
  starRating: string | null;
  avgDailyCensus: string | null;
}

export async function fetchQualitySummary(
  ccns: string[]
): Promise<Record<string, QualitySummary>> {
  if (ccns.length === 0) return {};

  // This endpoint is used as a background enrichment — silently returns {} on
  // any failure rather than surfacing an error to the user.
  try {
    const res = await fetch(
      `${apiBase()}/cms/quality-summary?ccns=${ccns.join(",")}`,
      {
        headers: mergeJsonHeaders(),
        signal: makeRequestTimeoutSignal(QUALITY_SUMMARY_TIMEOUT_MS),
      }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as {
      summaries: Record<string, QualitySummary>;
    };
    return data.summaries;
  } catch {
    return {};
  }
}

export async function fetchSpendingData(ccn: string): Promise<CmsSpendingData> {
  return fetchJson<CmsSpendingData>(`${apiBase()}/cms/spending/${ccn}`, {
    headers: mergeJsonHeaders(),
    timeoutMs: CMS_TIMEOUT_MS,
  });
}

// ─── US States list ──────────────────────────────────────────────────────────

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "Washington DC" },
  { value: "PR", label: "Puerto Rico" },
  { value: "GU", label: "Guam" },
  { value: "VI", label: "US Virgin Islands" },
];

export { US_STATES };
