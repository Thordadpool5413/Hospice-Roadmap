// Public surface of the guidance content module.
// Import from here in new code; import from @/data/guidanceContent only for
// backward-compat paths that haven't migrated yet.
export type {
  UrgencyLevel,
  GuidanceCategoryId,
  GuidanceStep,
  GuidanceScenario,
  GuidanceCategory,
  GuidanceStage,
  GuidanceUrgency,
  GuidanceGovernance,
  GuidanceContentItem,
} from "./types";

export { guidanceCategories, guidanceItems } from "./items";

export {
  getAllGuidance,
  getGuidanceById,
  getCategoryById,
  getGuidanceByCategory,
  getGuidanceByStage,
  getGuidanceByUrgency,
  searchGuidance,
  getRelatedGuidance,
  allScenarios,
} from "./helpers";
