const palette = {
  // Warm sunset oranges (from icon road/glow)
  ember: "#C85A1C",
  emberDark: "#9E4414",
  emberLight: "#E47A3C",
  emberPale: "#FEF1E8",

  // Golden amber (from icon path highlight)
  gold: "#D4881A",
  goldDark: "#9A5C10",
  goldLight: "#F0AA3C",
  goldPale: "#FEF6E0",

  // Deep navy (from icon bottom dark band)
  navy: "#1A2840",
  navyMid: "#2A3D5C",
  navyLight: "#3D5478",

  // Warm neutral backgrounds
  cream: "#FBF6F0",
  stone: "#F5EDE0",
  sand: "#EEE0CC",

  // Text
  charcoal: "#1C1810",
  slate: "#3A3020",
  muted: "#6B5D4A",
  subtle: "#9B8E7C",

  divider: "#E8DDD0",

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
