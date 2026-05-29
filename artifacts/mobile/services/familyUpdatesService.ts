/**
 * Family Updates Service
 *
 * Provides typed wrappers around the two family-updates API endpoints:
 *   POST /api/family-updates/draft  — generate a warm AI care update draft
 *   POST /api/family-updates/send   — send the approved message via Twilio SMS
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
