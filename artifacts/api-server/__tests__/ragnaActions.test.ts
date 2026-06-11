import { describe, it, expect } from "vitest";
import { validateRagnaAction } from "../src/routes/anthropic/ragnaActions";

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
