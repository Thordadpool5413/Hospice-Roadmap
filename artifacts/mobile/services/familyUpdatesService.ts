/**
 * Family Updates Service
 *
 * Provides typed wrappers around the family-updates API endpoints:
 *   POST /api/family-updates/draft    — generate a warm AI care update draft
 *   POST /api/family-updates/send     — send the approved message via Twilio SMS
 *   GET  /api/family-updates/history  — fetch last 10 send history entries
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
  status: "sent" | "failed";
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
