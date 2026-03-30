/**
 * Backward-compatibility re-export layer.
 *
 * The guidance content has been moved to the modular architecture at
 * `content/guidance/`. This file re-exports everything that existing consumers
 * (`guidance/[id].tsx`, `situation-finder.tsx`, and others) already import so
 * that no consumer imports need to change during the migration.
 *
 * New code should import directly from `@/content/guidance` instead.
 */
export type {
  UrgencyLevel,
  GuidanceCategoryId,
  GuidanceStep,
  GuidanceScenario,
  GuidanceCategory,
  // New structured types — available to consumers that want to opt in
  GuidanceStage,
  GuidanceUrgency,
  GuidanceGovernance,
  GuidanceContentItem,
} from "@/content/guidance";

export {
  guidanceCategories,
  guidanceItems,
  allScenarios,
  findScenarioById,
  findCategoryById,
  searchScenarios,
  // New helpers — available to consumers that want to opt in
  getAllGuidance,
  getGuidanceById,
  getCategoryById,
  getGuidanceByCategory,
  getGuidanceByStage,
  getGuidanceByUrgency,
  searchGuidance,
  getRelatedGuidance,
} from "@/content/guidance";
