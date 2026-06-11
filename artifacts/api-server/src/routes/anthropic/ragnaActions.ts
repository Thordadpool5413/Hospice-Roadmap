/**
 * Ragna action dispatch — server side.
 *
 * Ragna (Claude) can append a single trailing machine-readable block to her
 * prose when the user clearly wants to create, update, or cancel one of three
 * record types:
 *   - a reminder        (create_reminder / update_reminder / cancel_reminder)
 *   - a symptom log     (log_symptom / update_symptom / cancel_symptom)
 *   - a journal entry   (add_journal_entry / update_journal_entry / cancel_journal_entry)
 *
 * Update/cancel actions reference an existing record by the stable `id` that the
 * mobile app injects into the patient-context lists, so Ragna can only target a
 * record the user actually has.
 *
 * The block looks like:
 *
 *   ```ragna-action
 *   { "action": "create_reminder", "label": "Morphine dose", ... }
 *   ```
 *
 * This module owns:
 *   - the `RagnaAction` type (mirrored in the mobile app's types/index.ts)
 *   - the system-prompt instructions that teach Ragna when/how to emit a block
 *   - a streaming-aware filter that strips the block from the text streamed to
 *     the client (so the user never sees raw JSON) and parses it into a
 *     structured action delivered in its own SSE event.
 */

export type RagnaReminderType = "medication" | "appointment";
export type RagnaReminderRecurrence = "none" | "daily" | "weekly";
export type RagnaJournalEntryType =
  | "symptom"
  | "medication"
  | "observation"
  | "mood"
  | "general";

export type RagnaAction =
  | {
      action: "create_reminder";
      label: string;
      /** Local ISO-8601 datetime, no timezone offset (e.g. 2026-06-11T14:00:00). */
      datetime: string;
      reminderType: RagnaReminderType;
      recurrence: RagnaReminderRecurrence;
    }
  | {
      action: "log_symptom";
      pain?: number;
      breathlessness?: number;
      nausea?: number;
      notes?: string;
    }
  | {
      action: "add_journal_entry";
      title: string;
      body: string;
      journalType: RagnaJournalEntryType;
    }
  | {
      action: "update_reminder";
      /** Id of an existing reminder, taken from the patient-context records list. */
      id: string;
      label?: string;
      /** Local ISO-8601 datetime, no timezone offset. */
      datetime?: string;
      reminderType?: RagnaReminderType;
      recurrence?: RagnaReminderRecurrence;
    }
  | {
      action: "cancel_reminder";
      id: string;
    }
  | {
      action: "update_symptom";
      id: string;
      pain?: number;
      breathlessness?: number;
      nausea?: number;
      notes?: string;
    }
  | {
      action: "cancel_symptom";
      id: string;
    }
  | {
      action: "update_journal_entry";
      id: string;
      title?: string;
      body?: string;
      journalType?: RagnaJournalEntryType;
    }
  | {
      action: "cancel_journal_entry";
      id: string;
    };

const FENCE_OPEN = "```ragna-action";
const FENCE_CLOSE = "```";

/**
 * Build the system-prompt instructions for action emission. Built per-request so
 * the current date can be supplied as a reference for computing reminder times.
 */
export function buildRagnaActionInstructions(now: Date): string {
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayIso = now.toISOString().slice(0, 10);

  return `

═══════════════════════════════════════
ACTION BLOCK — SILENT WRITE-BACK TO THE APP
═══════════════════════════════════════
The app you live in can create, update, and cancel reminders, symptom logs, and journal entries. When the user CLEARLY wants you to do one of those things, you may append ONE machine-readable action block to the very end of your reply. The app strips this block out, never shows it to the user, and instead renders a one-tap confirmation card. Tapping it performs the action.

Emit a CREATE block only when the user's intent to create something is explicit and unambiguous, for example:
- "remind me to give morphine at 2pm" → create_reminder
- "log that Dad's pain is a 7 today" / "her pain is about a 6 right now" → log_symptom
- "note that the nurse visited this afternoon" / "add a journal entry about today" → add_journal_entry

UPDATING or CANCELLING existing records:
The PATIENT CONTEXT above may list the user's existing reminders, symptom logs, and journal entries, each prefixed with a stable id like [id: reminder-1234]. To change or remove one, emit an update_* or cancel_* block that references that EXACT id, for example:
- "move my 2pm morphine reminder to 4pm" → update_reminder (that reminder's id + new datetime)
- "cancel the appointment reminder" → cancel_reminder (that reminder's id)
- "actually my pain today was a 4, not a 7" → update_symptom (today's log id)
- "delete that journal entry about the nurse" → cancel_journal_entry (that entry's id)
Emit an update_* or cancel_* block ONLY when EXACTLY ONE record in those lists clearly matches what the user means. If nothing matches, or more than one record could match, do NOT emit a block — briefly ask the user which one they mean instead. NEVER invent an id; only use ids that appear in the lists above. For an update, include the id plus ONLY the fields that change.

Do NOT emit a block for general questions, hypotheticals, reflection, or when you are unsure ("how do I manage pain?" is NOT a log_symptom). When in doubt, leave it out. Never emit more than one block.

Always write your normal, warm, human reply first. The block is silent metadata — never mention it, never describe JSON, never tell the user "I've added a card." If you also end with a [SUGGEST: ...] line, the action block must come AFTER it, as the absolute last thing in your message.

Format — a fenced block exactly like this, as the final content of your reply:
${FENCE_OPEN}
{ "action": "...", ... }
${FENCE_CLOSE}

Schemas (emit exactly one object):

1) create_reminder
{ "action": "create_reminder", "label": "<short label, e.g. Morphine dose>", "datetime": "<local ISO-8601, no timezone, e.g. 2026-06-11T14:00:00>", "reminderType": "medication" | "appointment", "recurrence": "none" | "daily" | "weekly" }

2) log_symptom — include only the symptoms the user actually mentioned. Scores are 0–10.
{ "action": "log_symptom", "pain": <0-10>, "breathlessness": <0-10>, "nausea": <0-10>, "notes": "<optional short note>" }

3) add_journal_entry
{ "action": "add_journal_entry", "title": "<short title>", "body": "<1-3 sentence entry in the user's words>", "journalType": "symptom" | "medication" | "observation" | "mood" | "general" }

4) update_reminder — change an existing reminder. Include its id and ONLY the fields that change.
{ "action": "update_reminder", "id": "<existing reminder id>", "label"?: "...", "datetime"?: "<local ISO-8601>", "reminderType"?: "medication" | "appointment", "recurrence"?: "none" | "daily" | "weekly" }

5) cancel_reminder — remove an existing reminder.
{ "action": "cancel_reminder", "id": "<existing reminder id>" }

6) update_symptom — change an existing symptom log. Include its id and ONLY the scores/notes that change. Scores 0–10.
{ "action": "update_symptom", "id": "<existing symptom log id>", "pain"?: <0-10>, "breathlessness"?: <0-10>, "nausea"?: <0-10>, "notes"?: "..." }

7) cancel_symptom — delete an existing symptom log.
{ "action": "cancel_symptom", "id": "<existing symptom log id>" }

8) update_journal_entry — change an existing journal entry. Include its id and ONLY the fields that change.
{ "action": "update_journal_entry", "id": "<existing journal entry id>", "title"?: "...", "body"?: "...", "journalType"?: "symptom" | "medication" | "observation" | "mood" | "general" }

9) cancel_journal_entry — delete an existing journal entry.
{ "action": "cancel_journal_entry", "id": "<existing journal entry id>" }

Date reference: today is ${todayLabel} (${todayIso}). If the patient context above includes a more specific current date/time, prefer that (it reflects the user's device clock). Express reminder times as the user's local wall-clock time, with no timezone offset.`;
}

function clampScore(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 0) return 0;
  if (rounded > 10) return 10;
  return rounded;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const REMINDER_TYPES: RagnaReminderType[] = ["medication", "appointment"];
const RECURRENCES: RagnaReminderRecurrence[] = ["none", "daily", "weekly"];
const JOURNAL_TYPES: RagnaJournalEntryType[] = [
  "symptom",
  "medication",
  "observation",
  "mood",
  "general",
];

/**
 * Validate and normalize a parsed action object. Returns null when the object is
 * malformed or missing required fields — callers should then simply drop the
 * action and still show Ragna's prose.
 */
export function validateRagnaAction(obj: Record<string, unknown>): RagnaAction | null {
  switch (obj["action"]) {
    case "create_reminder": {
      const label = nonEmptyString(obj["label"]);
      const datetimeRaw = nonEmptyString(obj["datetime"]);
      if (!label || !datetimeRaw) return null;
      if (Number.isNaN(new Date(datetimeRaw).getTime())) return null;
      const reminderType = REMINDER_TYPES.includes(
        obj["reminderType"] as RagnaReminderType,
      )
        ? (obj["reminderType"] as RagnaReminderType)
        : "medication";
      const recurrence = RECURRENCES.includes(
        obj["recurrence"] as RagnaReminderRecurrence,
      )
        ? (obj["recurrence"] as RagnaReminderRecurrence)
        : "none";
      return {
        action: "create_reminder",
        label,
        datetime: datetimeRaw,
        reminderType,
        recurrence,
      };
    }
    case "log_symptom": {
      const pain = clampScore(obj["pain"]);
      const breathlessness = clampScore(obj["breathlessness"]);
      const nausea = clampScore(obj["nausea"]);
      const notes = nonEmptyString(obj["notes"]) ?? undefined;
      if (pain === undefined && breathlessness === undefined && nausea === undefined) {
        return null;
      }
      const result: Extract<RagnaAction, { action: "log_symptom" }> = {
        action: "log_symptom",
      };
      if (pain !== undefined) result.pain = pain;
      if (breathlessness !== undefined) result.breathlessness = breathlessness;
      if (nausea !== undefined) result.nausea = nausea;
      if (notes !== undefined) result.notes = notes;
      return result;
    }
    case "add_journal_entry": {
      const title = nonEmptyString(obj["title"]);
      const body = nonEmptyString(obj["body"]);
      if (!title || !body) return null;
      const journalType = JOURNAL_TYPES.includes(
        obj["journalType"] as RagnaJournalEntryType,
      )
        ? (obj["journalType"] as RagnaJournalEntryType)
        : "observation";
      return { action: "add_journal_entry", title, body, journalType };
    }
    case "update_reminder": {
      const id = nonEmptyString(obj["id"]);
      if (!id) return null;
      const result: Extract<RagnaAction, { action: "update_reminder" }> = {
        action: "update_reminder",
        id,
      };
      const label = nonEmptyString(obj["label"]);
      if (label) result.label = label;
      const datetimeRaw = nonEmptyString(obj["datetime"]);
      if (datetimeRaw) {
        if (Number.isNaN(new Date(datetimeRaw).getTime())) return null;
        result.datetime = datetimeRaw;
      }
      if (REMINDER_TYPES.includes(obj["reminderType"] as RagnaReminderType)) {
        result.reminderType = obj["reminderType"] as RagnaReminderType;
      }
      if (RECURRENCES.includes(obj["recurrence"] as RagnaReminderRecurrence)) {
        result.recurrence = obj["recurrence"] as RagnaReminderRecurrence;
      }
      // An update must change at least one field beyond the id.
      if (
        result.label === undefined &&
        result.datetime === undefined &&
        result.reminderType === undefined &&
        result.recurrence === undefined
      ) {
        return null;
      }
      return result;
    }
    case "cancel_reminder": {
      const id = nonEmptyString(obj["id"]);
      return id ? { action: "cancel_reminder", id } : null;
    }
    case "update_symptom": {
      const id = nonEmptyString(obj["id"]);
      if (!id) return null;
      const pain = clampScore(obj["pain"]);
      const breathlessness = clampScore(obj["breathlessness"]);
      const nausea = clampScore(obj["nausea"]);
      const notes = nonEmptyString(obj["notes"]) ?? undefined;
      if (
        pain === undefined &&
        breathlessness === undefined &&
        nausea === undefined &&
        notes === undefined
      ) {
        return null;
      }
      const result: Extract<RagnaAction, { action: "update_symptom" }> = {
        action: "update_symptom",
        id,
      };
      if (pain !== undefined) result.pain = pain;
      if (breathlessness !== undefined) result.breathlessness = breathlessness;
      if (nausea !== undefined) result.nausea = nausea;
      if (notes !== undefined) result.notes = notes;
      return result;
    }
    case "cancel_symptom": {
      const id = nonEmptyString(obj["id"]);
      return id ? { action: "cancel_symptom", id } : null;
    }
    case "update_journal_entry": {
      const id = nonEmptyString(obj["id"]);
      if (!id) return null;
      const result: Extract<RagnaAction, { action: "update_journal_entry" }> = {
        action: "update_journal_entry",
        id,
      };
      const title = nonEmptyString(obj["title"]);
      if (title) result.title = title;
      const body = nonEmptyString(obj["body"]);
      if (body) result.body = body;
      if (JOURNAL_TYPES.includes(obj["journalType"] as RagnaJournalEntryType)) {
        result.journalType = obj["journalType"] as RagnaJournalEntryType;
      }
      // An update must change at least one field beyond the id.
      if (
        result.title === undefined &&
        result.body === undefined &&
        result.journalType === undefined
      ) {
        return null;
      }
      return result;
    }
    case "cancel_journal_entry": {
      const id = nonEmptyString(obj["id"]);
      return id ? { action: "cancel_journal_entry", id } : null;
    }
    default:
      return null;
  }
}

/** Parse the raw text captured between the action fences into an action. */
export function parseRagnaActionBody(body: string): RagnaAction | null {
  const obj = extractJsonObject(body);
  if (!obj) return null;
  return validateRagnaAction(obj);
}

/** Longest suffix of `s` that is also a prefix of `token`. */
function partialTail(s: string, token: string): number {
  const max = Math.min(s.length, token.length - 1);
  for (let k = max; k > 0; k--) {
    if (token.startsWith(s.slice(s.length - k))) return k;
  }
  return 0;
}

export interface ActionStreamFilter {
  /** Feed a streamed delta; returns the text that is safe to forward now. */
  push(delta: string): string;
  /** Flush any held text and resolve the parsed action (if any). */
  finish(): { trailing: string; action: RagnaAction | null };
}

/**
 * Incremental filter that removes a trailing ```ragna-action``` block from a
 * streamed response. It withholds only the minimum needed to recognise a fence
 * (so normal text streams smoothly), captures the fenced body, and forwards any
 * text that appears AFTER the closing fence (so a trailing [SUGGEST: ...] line
 * survives regardless of ordering).
 */
export function createActionStreamFilter(): ActionStreamFilter {
  let mode: "before" | "inside" | "after" = "before";
  let buffer = "";
  let actionBody = "";
  let action: RagnaAction | null = null;

  function process(): string {
    let out = "";
    // Loop so multiple state transitions inside a single delta are handled.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (mode === "before" || mode === "after") {
        if (mode === "after") {
          // Past the action block: forward everything, no fence detection.
          out += buffer;
          buffer = "";
          return out;
        }
        const idx = buffer.indexOf(FENCE_OPEN);
        if (idx !== -1) {
          out += buffer.slice(0, idx);
          buffer = buffer.slice(idx + FENCE_OPEN.length);
          mode = "inside";
          continue;
        }
        const hold = partialTail(buffer, FENCE_OPEN);
        out += buffer.slice(0, buffer.length - hold);
        buffer = buffer.slice(buffer.length - hold);
        return out;
      }
      // mode === "inside"
      const idx = buffer.indexOf(FENCE_CLOSE);
      if (idx !== -1) {
        actionBody += buffer.slice(0, idx);
        buffer = buffer.slice(idx + FENCE_CLOSE.length);
        action = parseRagnaActionBody(actionBody);
        actionBody = "";
        mode = "after";
        continue;
      }
      const hold = partialTail(buffer, FENCE_CLOSE);
      actionBody += buffer.slice(0, buffer.length - hold);
      buffer = buffer.slice(buffer.length - hold);
      return out;
    }
  }

  return {
    push(delta: string): string {
      buffer += delta;
      return process();
    },
    finish(): { trailing: string; action: RagnaAction | null } {
      if (mode === "inside") {
        // Unclosed fence — try to parse what we have, drop it from display.
        const parsed = parseRagnaActionBody(actionBody + buffer);
        actionBody = "";
        buffer = "";
        return { trailing: "", action: action ?? parsed };
      }
      // "before" (no fence) or "after" (text past the fence): flush remainder.
      const trailing = buffer;
      buffer = "";
      return { trailing, action };
    },
  };
}
