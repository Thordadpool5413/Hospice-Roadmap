import { Platform } from "react-native";

import { CmsQualityData, CmsSpendingData, Provider } from "@/types";

function getApiBase(): string {
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  if (envUrl) return envUrl;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const apiHostname = hostname.replace(".expo.", ".");
    return `${window.location.protocol}//${apiHostname}/api`;
  }
  return "http://localhost:80/api";
}

function apiBase(): string {
  return getApiBase();
}

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
  const url = new URL(`${base}/cms/providers`, "https://placeholder.dev");
  if (params.state) url.searchParams.set("state", params.state);
  if (params.zip) url.searchParams.set("zip", params.zip);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));

  const fetchUrl = `${base}/cms/providers?${url.searchParams.toString()}`;
  const res = await fetch(fetchUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`CMS search failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function fetchQualityData(ccn: string): Promise<CmsQualityData> {
  const res = await fetch(`${apiBase()}/cms/quality/${ccn}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Quality data failed (${res.status}): ${body}`);
  }

  return res.json();
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
  const res = await fetch(
    `${apiBase()}/cms/quality-summary?ccns=${ccns.join(",")}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) return {};

  const data = (await res.json()) as { summaries: Record<string, QualitySummary> };
  return data.summaries;
}

export async function fetchSpendingData(ccn: string): Promise<CmsSpendingData> {
  const res = await fetch(`${apiBase()}/cms/spending/${ccn}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Spending data failed (${res.status}): ${body}`);
  }

  return res.json();
}

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
