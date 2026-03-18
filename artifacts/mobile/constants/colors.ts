const palette = {
  // Warm sunset oranges — matched to the Hospice Roadmap app icon landscape
  ember: "#C8541A",
  emberDark: "#9A3E10",
  emberLight: "#E07A3C",
  emberPale: "#FEEDE6",

  // Golden amber — matched to the glowing road in the icon
  gold: "#D98C18",
  goldDark: "#9A5C10",
  goldLight: "#F0AA3C",
  goldPale: "#FEF4DC",

  // Deep navy — matched to the icon's deep bottom corners
  navy: "#1E2848",
  navyMid: "#2A3D5C",
  navyLight: "#3D5478",

  // Warm neutral backgrounds — warmer cream to complement the icon's amber tones
  cream: "#FAF1E6",
  stone: "#F3E6D2",
  sand: "#EAD8C0",

  // Text
  charcoal: "#1C1810",
  slate: "#3A3020",
  muted: "#6B5D4A",
  subtle: "#9B8E7C",

  divider: "#E6D8C8",

  // Semantic
  rose: "#C04A3A",
  rosePale: "#FDF0EE",
  sky: "#2A5C8A",
  skyPale: "#EBF0FA",
  success: "#3A7A4A",
  successPale: "#EBF5EE",

  // Warm white
  warmWhite: "#FFFFFF",
};

export const Colors = {
  primary: palette.ember,
  primaryDark: palette.emberDark,
  primaryLight: palette.emberLight,
  primaryPale: palette.emberPale,

  accent: palette.gold,
  accentDeep: palette.goldDark,
  accentLight: palette.goldLight,

  background: palette.cream,
  backgroundSecondary: palette.stone,
  backgroundTertiary: palette.sand,

  surface: palette.warmWhite,
  surfaceElevated: palette.warmWhite,

  text: palette.charcoal,
  textSecondary: palette.slate,
  textMuted: palette.muted,
  textSubtle: palette.subtle,

  divider: palette.divider,

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

  tabIconDefault: palette.subtle,
  tabIconSelected: palette.ember,
  tint: palette.ember,

  journeyBefore: palette.sky,
  journeyBeforePale: palette.skyPale,
  journeyDuring: palette.ember,
  journeyDuringPale: palette.emberPale,
  journeyAfter: "#7A5C8A",
  journeyAfterPale: "#F2EEF8",
};

export default Colors;
