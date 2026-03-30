import { getClientId } from "./clientIdentity";
import { apiBase, fetchJson, mergeJsonHeaders } from "./apiClient";

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

  return fetchJson<SupportSubmissionResponse>(
    `${apiBase()}/support/support-requests`,
    {
      method: "POST",
      // Include x_client_id alongside standard JSON headers.
      headers: mergeJsonHeaders({ x_client_id: clientId }),
      body: JSON.stringify(input),
    }
  );
}
