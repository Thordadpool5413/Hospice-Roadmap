import {
  GuidanceCategoryId,
  GuidanceCategory,
  GuidanceContentItem,
  GuidanceScenario,
  GuidanceStage,
  GuidanceUrgency,
} from "./types";
import { guidanceCategories, guidanceItems } from "./items";

// ─── Core query helpers ───────────────────────────────────────────────────────

/** Return all guidance items as a flat array. */
export function getAllGuidance(): GuidanceContentItem[] {
  return guidanceItems;
}

/** Find a single item by its id. */
export function getGuidanceById(id: string): GuidanceContentItem | undefined {
  return guidanceItems.find((s) => s.id === id);
}

/** Find a category by its id. */
export function getCategoryById(
  id: GuidanceCategoryId
): GuidanceCategory | undefined {
  return guidanceCategories.find((c) => c.id === id);
}

/** Return all items belonging to a given category. */
export function getGuidanceByCategory(
  categoryId: GuidanceCategoryId
): GuidanceContentItem[] {
  return guidanceItems.filter((s) => s.categoryId === categoryId);
}

/** Return all items relevant to a given journey stage. */
export function getGuidanceByStage(
  stage: GuidanceStage
): GuidanceContentItem[] {
  return guidanceItems.filter((s) => s.stages.includes(stage));
}

/** Return all items at a given urgency level. */
export function getGuidanceByUrgency(
  urgency: GuidanceUrgency
): GuidanceContentItem[] {
  return guidanceItems.filter((s) => s.urgencyLevel === urgency);
}

/**
 * Full-text search across title, subtitle, tags/keywords, and
 * whatYouMayNotice strings. Returns items sorted with exact-title
 * matches first.
 */
export function searchGuidance(query: string): GuidanceContentItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const titleMatches: GuidanceContentItem[] = [];
  const otherMatches: GuidanceContentItem[] = [];

  for (const s of guidanceItems) {
    const inTitle =
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q);
    const inTags = s.tags.some((t) => t.toLowerCase().includes(q));
    const inNotice = s.whatYouMayNotice.some((w) =>
      w.toLowerCase().includes(q)
    );

    if (inTitle) {
      titleMatches.push(s);
    } else if (inTags || inNotice) {
      otherMatches.push(s);
    }
  }

  return [...titleMatches, ...otherMatches];
}

/**
 * Return items that share related-id links with the given item id.
 * Falls back to same-category items when relatedIds is not populated.
 */
export function getRelatedGuidance(
  id: string,
  limit = 4
): GuidanceContentItem[] {
  const item = getGuidanceById(id);
  if (!item) return [];

  if (item.relatedIds && item.relatedIds.length > 0) {
    return item.relatedIds
      .map((rid) => getGuidanceById(rid))
      .filter((s): s is GuidanceContentItem => s !== undefined)
      .slice(0, limit);
  }

  return guidanceItems
    .filter((s) => s.categoryId === item.categoryId && s.id !== item.id)
    .slice(0, limit);
}

// ─── Backward-compatible aliases ──────────────────────────────────────────────
// These match the original exports from data/guidanceContent.ts so that the
// thin compat re-export layer has zero logic of its own.

/** Flat array of all scenarios — alias for guidanceItems. */
export const allScenarios: GuidanceScenario[] = guidanceItems;

/** @deprecated Use getGuidanceById */
export function findScenarioById(id: string): GuidanceScenario | undefined {
  return getGuidanceById(id);
}

/** @deprecated Use getCategoryById */
export function findCategoryById(
  id: GuidanceCategoryId
): GuidanceCategory | undefined {
  return getCategoryById(id);
}

/** @deprecated Use searchGuidance */
export function searchScenarios(query: string): GuidanceScenario[] {
  return searchGuidance(query);
}
