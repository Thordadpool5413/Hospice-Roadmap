import { getClientId } from "./clientIdentity";

function apiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.replace(".expo.", ".");
    return `https://${host}/api`;
  }
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  return envUrl ?? "http://localhost:8080/api";
}

export interface SupportSubmissionInput {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  preferredContact: "email" | "phone";
  message: string;
}

export interface SupportSubmissionResponse {
  id: number;
  status: string;
  createdAt: string;
}

export async function submitSupportRequest(
  input: SupportSubmissionInput
): Promise<SupportSubmissionResponse> {
  const clientId = await getClientId();

  const res = await fetch(`${apiBase()}/support/support-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      x_client_id: clientId,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let message = "Failed to submit support request";
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return res.json() as Promise<SupportSubmissionResponse>;
}
