/**
 * Family Updates Service
 *
 * Provides typed wrappers around the family-updates API endpoints:
 *   POST /api/family-updates/draft      — generate a warm AI care update draft
 *   POST /api/family-updates/send       — send the approved message via Twilio SMS
 *   GET  /api/family-updates/history    — fetch last 10 send history entries
 *   GET  /api/family-updates/opt-outs   — check which phone numbers have replied STOP
 */

import { apiBase, fetchJson, mergeJsonHeaders, makeRequestTimeoutSignal } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DraftRequest {
  symptomSummary?: string;
  journalExcerpt?: string;
  patientName?: string;
}

export interface DraftResponse {
  draft: string;
}

export interface SendResult {
  to: string;
  status: "sent" | "failed" | "opted_out";
  sid?: string;
  error?: string;
}

export interface SendRequest {
  message: string;
  phoneNumbers: string[];
}

export interface SendResponse {
  sentCount: number;
  failedCount: number;
  optedOutCount: number;
  results: SendResult[];
}

export interface SendHistoryEntry {
  id: string;
  sentAt: string;
  recipientCount: number;
  preview: string;
}

export interface HistoryResponse {
  history: SendHistoryEntry[];
}

export interface OptOutsResponse {
  optedOut: string[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Ask the server to generate a warm, plain-language care update draft
 * from the day's symptom check-in and journal entry.
 */
export async function generateFamilyUpdateDraft(
  params: DraftRequest,
  authToken: string,
): Promise<DraftResponse> {
  const url = `${apiBase()}/family-updates/draft`;
  return fetchJson<DraftResponse>(url, {
    method: "POST",
    headers: mergeJsonHeaders({ Authorization: `Bearer ${authToken}` }),
    signal: makeRequestTimeoutSignal(30_000),
    body: JSON.stringify(params),
  });
}

/**
 * Send the approved care update message to all saved family contacts via SMS.
 * The Twilio call happens entirely on the server — no keys on the device.
 * Opted-out numbers are automatically skipped by the server.
 */
export async function sendFamilyUpdate(
  params: SendRequest,
  authToken: string,
): Promise<SendResponse> {
  const url = `${apiBase()}/family-updates/send`;
  return fetchJson<SendResponse>(url, {
    method: "POST",
    headers: mergeJsonHeaders({ Authorization: `Bearer ${authToken}` }),
    signal: makeRequestTimeoutSignal(30_000),
    body: JSON.stringify(params),
  });
}

/**
 * Fetch the last 10 family update send history entries from the server.
 * Throws on network error so the caller can fall back to local storage.
 */
export async function fetchFamilyUpdateHistory(
  authToken: string,
): Promise<SendHistoryEntry[]> {
  const url = `${apiBase()}/family-updates/history`;
  const data = await fetchJson<HistoryResponse>(url, {
    method: "GET",
    headers: mergeJsonHeaders({ Authorization: `Bearer ${authToken}` }),
    signal: makeRequestTimeoutSignal(10_000),
  });
  return data.history;
}

/**
 * Check which of the supplied phone numbers (E.164) have opted out by replying
 * STOP to an SMS. Returns the subset that are opted out.
 * Silently returns an empty array on network error so the UI degrades gracefully.
 */
export async function fetchOptedOutPhones(
  phones: string[],
  authToken: string,
): Promise<string[]> {
  if (phones.length === 0) return [];
  const query = phones.join(",");
  const url = `${apiBase()}/family-updates/opt-outs?phones=${encodeURIComponent(query)}`;
  try {
    const data = await fetchJson<OptOutsResponse>(url, {
      method: "GET",
      headers: mergeJsonHeaders({ Authorization: `Bearer ${authToken}` }),
      signal: makeRequestTimeoutSignal(8_000),
    });
    return data.optedOut;
  } catch {
    return [];
  }
}
