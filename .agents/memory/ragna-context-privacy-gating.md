---
name: Ragna patient-context privacy gating
description: Which RagnaPrivacySettings flag must gate each block of context sent to Anthropic
---

# Ragna context blocks must be gated by the right privacy flag

Every block appended to the Ragna patient context (built in the mobile help screen
and sent to Anthropic on every message) must be gated by the specific
`RagnaPrivacySettings` flag that matches the data it discloses — not only the master
`personalizationEnabled` toggle.

**Why:** Reminder labels routinely contain medication names (e.g. "Morphine dose").
A user who turns off medication disclosure but leaves personalization on would still
have those labels streamed to Anthropic if a new context block is gated only by the
master toggle. Each category flag exists precisely so users can withhold one kind of
data while keeping others.

**How to apply:** When adding a new id-tagged or summary block to the Ragna context,
pick the flag by content:
- symptom data → `includeRecentSymptoms`
- journal entries → `includeRecentJournal`
- medication / reminder labels / equipment → `includeMedicationAndEquipment`
- caregiver wellness → `includeCaregiverWellness`
- conversation memory → `includeConversationMemory`
- time-of-day → `includeTimeContext`
Add the chosen flag to the `useCallback` dependency array too, or the block will use a
stale flag value. The whole builder already early-returns "" when
`personalizationEnabled` is off, so that master check is necessary but never sufficient.
