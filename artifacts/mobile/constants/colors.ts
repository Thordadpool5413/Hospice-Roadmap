const palette = {
  // ── Warm ember orange ── from the Hospice Roadmap sunset sky & landscape
  ember: "#C8501A",
  emberDark: "#8A3410",
  emberLight: "#E87040",
  emberPale: "#FEE8DA",

  // ── Golden amber ── from the glowing road (Hospice Roadmap) & Ragna's light swirls
  gold: "#D98818",
  goldDark: "#9A5C10",
  goldLight: "#F2AC38",
  goldPale: "#FEF2D8",

  // ── Deep midnight navy ── from Ragna's deep background & Hospice icon's dark corners
  navy: "#1A2848",
  navyMid: "#253558",
  navyLight: "#3A4E72",
  navyFaint: "#1E2F52",
  navyText: "#C8D8F0",
  navySub: "#8AAAC8",

  // ── Warm cream backgrounds ── warm sunset sky tone, not grey
  cream: "#FAF0E4",
  stone: "#F3E5CE",
  sand: "#EAD6B8",

  // ── Text ── warm, not cold grey
  charcoal: "#1C1610",
  slate: "#3A2E1A",
  muted: "#6A5A3A",
  subtle: "#9A8A6A",

  // ── Dividers ── warm amber tone
  divider: "#E2D0B8",

  // ── Semantic ──
  rose: "#C04030",
  rosePale: "#FDF0EE",
  sky: "#2A5C8A",
  skyPale: "#EBF0FA",
  success: "#3A7A4A",
  successPale: "#EBF5EE",

  warmWhite: "#FFFFFF",
};

export const Colors = {
  // Primary action (ember orange)
  primary: palette.ember,
  primaryDark: palette.emberDark,
  primaryLight: palette.emberLight,
  primaryPale: palette.emberPale,

  // Accent (golden amber)
  accent: palette.gold,
  accentDeep: palette.goldDark,
  accentLight: palette.goldLight,

  // Deep navy (for tab bar, Ragna header, dark surfaces)
  navy: palette.navy,
  navyMid: palette.navyMid,
  navyLight: palette.navyLight,
  navyFaint: palette.navyFaint,
  navyText: palette.navyText,
  navySub: palette.navySub,

  // Backgrounds
  background: palette.cream,
  backgroundSecondary: palette.stone,
  backgroundTertiary: palette.sand,

  surface: palette.warmWhite,
  surfaceElevated: palette.warmWhite,

  // Text
  text: palette.charcoal,
  textSecondary: palette.slate,
  textMuted: palette.muted,
  textSubtle: palette.subtle,

  divider: palette.divider,

  // Aliases
  amber: palette.gold,
  amberLight: palette.goldLight,
  amberPale: palette.goldPale,

  warning: palette.gold,
  warningPale: palette.goldPale,

  error: palette.rose,
  errorPale: palette.rosePale,

  info: palette.sky,
  infoPale: palette.skyPale,

  success: palette.success,
  successPale: palette.successPale,

  // Tab bar
  tabIconDefault: palette.navySub,
  tabIconSelected: palette.gold,
  tint: palette.ember,

  // Journey stages
  journeyBefore: palette.sky,
  journeyBeforePale: palette.skyPale,
  journeyDuring: palette.ember,
  journeyDuringPale: palette.emberPale,
  journeyAfter: "#7A5C8A",
  journeyAfterPale: "#F2EEF8",
};

export default Colors;
