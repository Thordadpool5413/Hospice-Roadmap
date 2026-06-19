import {
  OFFLINE_RAGNA_SCRIPTS,
  OfflineRagnaScript,
  getOfflineScript,
} from "@/constants/offlineRagnaResponses";

export function listOfflineScripts(): OfflineRagnaScript[] {
  return OFFLINE_RAGNA_SCRIPTS;
}

export function getOfflineResponse(scenarioId: string): OfflineRagnaScript | undefined {
  return getOfflineScript(scenarioId);
}

export function formatOfflineScriptAsMessage(script: OfflineRagnaScript): string {
  const steps = script.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return [
    `**${script.title}** (offline guidance)`,
    "",
    script.summary,
    "",
    "**What to do now:**",
    steps,
    "",
    `**When to call:** ${script.callReminder}`,
    "",
    "_Reconnect when you can for a personalized answer from Ragna._",
  ].join("\n");
}

export function matchOfflineScriptFromMessage(message: string): OfflineRagnaScript | undefined {
  const lower = message.toLowerCase();
  for (const script of OFFLINE_RAGNA_SCRIPTS) {
    const titleWords = script.title.toLowerCase().split(/\s+/);
    if (titleWords.some((w) => w.length > 4 && lower.includes(w))) {
      return script;
    }
  }
  if (lower.includes("breath") || lower.includes("breathing")) {
    return getOfflineScript("breathing-changes");
  }
  if (lower.includes("pain")) return getOfflineScript("pain-worsening");
  if (lower.includes("oxygen")) return getOfflineScript("oxygen-concentrator");
  if (lower.includes("comfort kit") || lower.includes("medication")) {
    return getOfflineScript("comfort-kit");
  }
  if (lower.includes("died") || lower.includes("passed") || lower.includes("death")) {
    return getOfflineScript("after-death-practical");
  }
  if (lower.includes("not sure") || lower.includes("don't know") || lower.includes("uncertain")) {
    return getOfflineScript("not-sure-whats-happening");
  }
  return getOfflineScript("not-sure-whats-happening");
}