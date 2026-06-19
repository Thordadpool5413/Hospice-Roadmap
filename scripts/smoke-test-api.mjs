#!/usr/bin/env node

const API_BASE = (process.env.SMOKE_API_URL ?? "https://hospice-roadmap.replit.app/api").replace(/\/$/, "");

async function check(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { url, status: response.status, body };
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK: ${message}`);
}

async function main() {
  console.log(`Smoke testing ${API_BASE}`);

  const health = await check("/healthz");
  if (health.status !== 200 || health.body?.status !== "ok") {
    fail(`healthz returned ${health.status}`);
  } else {
    ok("healthz");
  }

  const clerk = await check("/mobile-clerk-config");
  if (clerk.status !== 200 || !clerk.body?.publishableKey) {
    fail(`mobile-clerk-config returned ${clerk.status}`);
  } else {
    ok("mobile-clerk-config");
  }

  const voice = await check("/voice-status?probe=1");
  if (voice.status !== 200) {
    fail(`voice-status returned ${voice.status}`);
  } else if (!voice.body?.elevenLabs?.configured) {
    fail(`ElevenLabs not configured: ${voice.body?.elevenLabs?.error ?? "unknown"}`);
  } else if (voice.body?.elevenLabs?.synthesisOk === false) {
    fail(`ElevenLabs synthesis probe failed: ${voice.body?.elevenLabs?.error ?? "unknown"}`);
  } else {
    ok(
      `voice-status (${voice.body.elevenLabs.connector}, synthesis=${voice.body.elevenLabs.synthesisOk ?? "skipped"})`,
    );
  }

  const speak = await check("/openai/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice: "ragna", text: "Smoke test." }),
  });
  if (speak.status === 401) {
    ok("openai preview is auth-protected");
  } else if (speak.status === 200) {
    ok("openai preview is publicly reachable");
  } else {
    fail(`unexpected /openai/preview status ${speak.status}`);
  }

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});