export const ENTITLEMENT_IDENTIFIER = "premium";

export const CAREGIVER_PACKAGE_IDENTIFIER = "$rc_monthly";
export const COMPANION_PACKAGE_IDENTIFIER = "companion_monthly";

/** Single plan shown in the paywall — full access including Ragna AI. */
export const PRIMARY_PACKAGE_IDENTIFIER = COMPANION_PACKAGE_IDENTIFIER;

export const OFFERING_IDENTIFIER = "default";

export type PlanName = "Free" | "Caregiver" | "Companion";

/**
 * Derive the human-readable plan name from RevenueCat entitlement data.
 * Uses the active product identifier to distinguish Caregiver vs Companion tiers.
 * Returns "Free" when there is no active premium entitlement.
 */
export function getPlanName(
  isPremium: boolean,
  productIdentifier?: string | null,
): PlanName {
  if (!isPremium) return "Free";
  const pid = (productIdentifier ?? "").toLowerCase();
  if (pid === CAREGIVER_PACKAGE_IDENTIFIER.toLowerCase() || pid.includes("caregiver")) {
    return "Caregiver";
  }
  if (pid === COMPANION_PACKAGE_IDENTIFIER.toLowerCase() || pid.includes("companion")) {
    return "Companion";
  }
  return "Companion";
}
