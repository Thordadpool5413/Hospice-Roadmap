import { describe, it, expect } from "vitest";
import {
  validateRagnaAction,
  parseRagnaActionBody,
  createActionStreamFilter,
  type RagnaAction,
} from "../src/routes/anthropic/ragnaActions";

describe("validateRagnaAction — update/cancel variants", () => {
  describe("update_reminder", () => {
    it("rejects when id is missing", () => {
      expect(
        validateRagnaAction({ action: "update_reminder", label: "New label" }),
      ).toBeNull();
    });

    it("rejects when no field beyond id changes", () => {
      expect(
        validateRagnaAction({ action: "update_reminder", id: "r1" }),
      ).toBeNull();
    });

    it("rejects an unparseable datetime", () => {
      expect(
        validateRagnaAction({
          action: "update_reminder",
          id: "r1",
          datetime: "not-a-date",
        }),
      ).toBeNull();
    });

    it("accepts a single changed field and keeps the id", () => {
      expect(
        validateRagnaAction({
          action: "update_reminder",
          id: "r1",
          label: "Take morphine",
        }),
      ).toEqual({ action: "update_reminder", id: "r1", label: "Take morphine" });
    });

    it("maps reminderType and recurrence when valid, drops invalid values", () => {
      expect(
        validateRagnaAction({
          action: "update_reminder",
          id: "r1",
          reminderType: "appointment",
          recurrence: "bogus",
        }),
      ).toEqual({
        action: "update_reminder",
        id: "r1",
        reminderType: "appointment",
      });
    });
  });

  describe("cancel_reminder", () => {
    it("requires an id", () => {
      expect(validateRagnaAction({ action: "cancel_reminder" })).toBeNull();
    });

    it("accepts a valid id", () => {
      expect(
        validateRagnaAction({ action: "cancel_reminder", id: "r1" }),
      ).toEqual({ action: "cancel_reminder", id: "r1" });
    });
  });

  describe("update_symptom", () => {
    it("rejects when id is missing", () => {
      expect(
        validateRagnaAction({ action: "update_symptom", pain: 3 }),
      ).toBeNull();
    });

    it("rejects when no field beyond id changes", () => {
      expect(
        validateRagnaAction({ action: "update_symptom", id: "s1" }),
      ).toBeNull();
    });

    it("clamps numeric scores into range", () => {
      expect(
        validateRagnaAction({
          action: "update_symptom",
          id: "s1",
          pain: 99,
          nausea: -4,
        }),
      ).toEqual({ action: "update_symptom", id: "s1", pain: 10, nausea: 0 });
    });
  });

  describe("cancel_symptom", () => {
    it("requires an id", () => {
      expect(validateRagnaAction({ action: "cancel_symptom" })).toBeNull();
    });

    it("accepts a valid id", () => {
      expect(
        validateRagnaAction({ action: "cancel_symptom", id: "s1" }),
      ).toEqual({ action: "cancel_symptom", id: "s1" });
    });
  });

  describe("update_journal_entry", () => {
    it("rejects when id is missing", () => {
      expect(
        validateRagnaAction({ action: "update_journal_entry", body: "hi" }),
      ).toBeNull();
    });

    it("rejects when no field beyond id changes", () => {
      expect(
        validateRagnaAction({ action: "update_journal_entry", id: "j1" }),
      ).toBeNull();
    });

    it("accepts changed fields and maps journalType", () => {
      expect(
        validateRagnaAction({
          action: "update_journal_entry",
          id: "j1",
          title: "Rough night",
          journalType: "symptom",
        }),
      ).toEqual({
        action: "update_journal_entry",
        id: "j1",
        title: "Rough night",
        journalType: "symptom",
      });
    });
  });

  describe("cancel_journal_entry", () => {
    it("requires an id", () => {
      expect(validateRagnaAction({ action: "cancel_journal_entry" })).toBeNull();
    });

    it("accepts a valid id", () => {
      expect(
        validateRagnaAction({ action: "cancel_journal_entry", id: "j1" }),
      ).toEqual({ action: "cancel_journal_entry", id: "j1" });
    });
  });
});

describe("validateRagnaAction — create variants", () => {
  describe("create_reminder", () => {
    it("normalizes a valid object", () => {
      expect(
        validateRagnaAction({
          action: "create_reminder",
          label: "  Morphine dose  ",
          datetime: "2026-06-11T14:00:00",
          reminderType: "appointment",
          recurrence: "daily",
        }),
      ).toEqual({
        action: "create_reminder",
        label: "Morphine dose",
        datetime: "2026-06-11T14:00:00",
        reminderType: "appointment",
        recurrence: "daily",
      });
    });

    it("falls back to default enum values when reminderType/recurrence are invalid", () => {
      expect(
        validateRagnaAction({
          action: "create_reminder",
          label: "Morphine dose",
          datetime: "2026-06-11T14:00:00",
          reminderType: "banana",
          recurrence: "yearly",
        }),
      ).toEqual({
        action: "create_reminder",
        label: "Morphine dose",
        datetime: "2026-06-11T14:00:00",
        reminderType: "medication",
        recurrence: "none",
      });
    });

    it("rejects an unparseable datetime", () => {
      expect(
        validateRagnaAction({
          action: "create_reminder",
          label: "Morphine dose",
          datetime: "not-a-date",
        }),
      ).toBeNull();
    });

    it("rejects a missing label", () => {
      expect(
        validateRagnaAction({
          action: "create_reminder",
          datetime: "2026-06-11T14:00:00",
        }),
      ).toBeNull();
    });
  });

  describe("log_symptom", () => {
    it("clamps scores into 0–10 and rounds fractional values", () => {
      expect(
        validateRagnaAction({
          action: "log_symptom",
          pain: 99,
          nausea: -4,
          breathlessness: 3.4,
        }),
      ).toEqual({
        action: "log_symptom",
        pain: 10,
        breathlessness: 3,
        nausea: 0,
      });
    });

    it("rejects when no numeric score is present (notes alone is not enough)", () => {
      expect(
        validateRagnaAction({ action: "log_symptom", notes: "rough day" }),
      ).toBeNull();
    });

    it("rejects non-numeric scores", () => {
      expect(
        validateRagnaAction({ action: "log_symptom", pain: "seven" }),
      ).toBeNull();
    });
  });

  describe("add_journal_entry", () => {
    it("falls back to 'observation' when journalType is invalid", () => {
      expect(
        validateRagnaAction({
          action: "add_journal_entry",
          title: "Nurse visit",
          body: "The nurse came by this afternoon.",
          journalType: "rant",
        }),
      ).toEqual({
        action: "add_journal_entry",
        title: "Nurse visit",
        body: "The nurse came by this afternoon.",
        journalType: "observation",
      });
    });

    it("rejects when the body is blank", () => {
      expect(
        validateRagnaAction({
          action: "add_journal_entry",
          title: "Nurse visit",
          body: "   ",
        }),
      ).toBeNull();
    });
  });

  it("rejects an unknown action type", () => {
    expect(validateRagnaAction({ action: "explode" })).toBeNull();
  });
});

describe("parseRagnaActionBody", () => {
  it("parses a valid JSON body surrounded by whitespace", () => {
    expect(
      parseRagnaActionBody('\n  { "action": "cancel_reminder", "id": "r1" }\n'),
    ).toEqual({ action: "cancel_reminder", id: "r1" });
  });

  it("extracts the object even when wrapped in stray prose", () => {
    expect(
      parseRagnaActionBody(
        'Sure!\n{ "action": "cancel_symptom", "id": "s9" }\nthanks',
      ),
    ).toEqual({ action: "cancel_symptom", id: "s9" });
  });

  it("returns null for malformed JSON", () => {
    expect(parseRagnaActionBody('{ "action": cancel_reminder }')).toBeNull();
  });

  it("returns null when there is no closing brace", () => {
    expect(parseRagnaActionBody('{ "action": "cancel_reminder", ')).toBeNull();
  });

  it("returns null for a JSON array (not an object)", () => {
    expect(parseRagnaActionBody("[1, 2, 3]")).toBeNull();
  });

  it("returns null for an empty body", () => {
    expect(parseRagnaActionBody("")).toBeNull();
  });
});

describe("createActionStreamFilter", () => {
  function runFilter(deltas: string[]): {
    text: string;
    action: RagnaAction | null;
  } {
    const filter = createActionStreamFilter();
    let text = "";
    for (const delta of deltas) {
      text += filter.push(delta);
    }
    const { trailing, action } = filter.finish();
    return { text: text + trailing, action };
  }

  const CREATE_REMINDER_JSON =
    '{ "action": "create_reminder", "label": "Morphine dose", "datetime": "2026-06-11T14:00:00", "reminderType": "medication", "recurrence": "none" }';

  it("strips an action block whose fence is split across multiple deltas", () => {
    const { text, action } = runFilter([
      "Take your morphine now.\n\n``",
      "`ragna-action\n" + CREATE_REMINDER_JSON + "\n``",
      "`",
    ]);

    expect(text).toBe("Take your morphine now.\n\n");
    expect(text).not.toContain("create_reminder");
    expect(action).toEqual({
      action: "create_reminder",
      label: "Morphine dose",
      datetime: "2026-06-11T14:00:00",
      reminderType: "medication",
      recurrence: "none",
    });
  });

  it("forwards a [SUGGEST: ...] line that follows the action block", () => {
    const { text, action } = runFilter([
      "Done — I removed it.\n\n```ragna-action\n",
      '{ "action": "cancel_reminder", "id": "r1" }\n```\n',
      "[SUGGEST: How do I manage breakthrough pain?]",
    ]);

    expect(text).toContain("Done — I removed it.");
    expect(text).toContain("[SUGGEST: How do I manage breakthrough pain?]");
    expect(text).not.toContain("cancel_reminder");
    expect(action).toEqual({ action: "cancel_reminder", id: "r1" });
  });

  it("forwards a [SUGGEST: ...] line that precedes the action block", () => {
    const { text, action } = runFilter([
      "Here's a thought.\n[SUGGEST: What helps with nausea?]\n",
      "```ragna-action\n" + CREATE_REMINDER_JSON + "\n```",
    ]);

    expect(text).toContain("[SUGGEST: What helps with nausea?]");
    expect(text).not.toContain("create_reminder");
    expect(action?.action).toBe("create_reminder");
  });

  it("passes an ordinary code fence through untouched, even fed one char at a time", () => {
    const message = "Here's an example:\n```js\nconst dose = 10;\n```\nThat's it.";
    const { text, action } = runFilter([...message]);

    expect(text).toBe(message);
    expect(action).toBeNull();
  });

  it("recovers the action and leaks no JSON when the closing fence never arrives", () => {
    const { text, action } = runFilter([
      "I'll cancel that for you.\n\n```ragna-action\n",
      '{ "action": "cancel_symptom", "id": "s1" }',
    ]);

    expect(text).toBe("I'll cancel that for you.\n\n");
    expect(text).not.toContain("cancel_symptom");
    expect(action).toEqual({ action: "cancel_symptom", id: "s1" });
  });

  it("drops an unclosed, malformed block without leaking it and yields no action", () => {
    const { text, action } = runFilter([
      'Let me note that.\n\n```ragna-action\n{ "action": "log_symptom", ',
    ]);

    expect(text).toBe("Let me note that.\n\n");
    expect(text).not.toContain("log_symptom");
    expect(action).toBeNull();
  });
});
