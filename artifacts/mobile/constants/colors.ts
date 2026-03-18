const palette = {
  // ── Deep navy ── primary background family from Ragna icon
  navy900: "#0E1628",
  navy800: "#141E38",
  navy700: "#1A2848",
  navy600: "#243258",
  navy500: "#304070",
  navy400: "#4A5E90",
  navyText: "#D8E4F4",
  navySub: "#8AAAC8",
  navyFaint: "#C0D0E8",

  // ── Gold / amber ── the Ragna swirl highlight
  gold: "#D9A020",
  goldDark: "#A07010",
  goldLight: "#F0C040",
  goldPale: "#2E2510",  // dark gold tint for on-navy use

  // ── Ember ── secondary warm accent (kept muted, not dominant)
  ember: "#C85020",
  emberDark: "#8A3010",
  emberLight: "#E87040",
  emberPale: "#2C1808",  // dark tint for on-navy

  // ── Surfaces ──
  surfaceDark: "#1E2B58",    // elevated card on navy bg
  surfaceMid: "#253470",     // mid-level card
  surfaceLight: "#2E3E88",   // lighter card
  cardBorder: "#3A52A8",

  // ── Light cream ── for bright white mode contexts only
  white: "#FFFFFF",
  offWhite: "#F5F8FF",
  lightCard: "#FFFFFF",
  lightBorder: "#DDE4F0",

  // ── Text on dark backgrounds ──
  textOnDark: "#EEF4FF",
  textSecOnDark: "#B0C4E0",
  textMutedOnDark: "#7090B8",
  textSubtleOnDark: "#4A6888",

  // ── Text on light backgrounds ──
  textOnLight: "#0E1628",
  textSecOnLight: "#243258",
  textMutedOnLight: "#4A5E90",

  // ── Dividers ──
  dividerDark: "#2A3878",
  dividerLight: "#DDE4F0",

  // ── Semantic ──
  rose: "#C03030",
  rosePale: "#2C0E0E",
  teal: "#1A6080",
  tealPale: "#0E2030",
  violet: "#6A4A9A",
  violetPale: "#1E1230",
  sage: "#4A7A5A",
  sagePale: "#0E2018",

  // ── Journey ──
  journeyBefore: "#4A7EC8",
  journeyBeforePale: "#1C2E54",
  journeyDuring: "#C85020",
  journeyDuringPale: "#2E1E10",
  journeyAfter: "#7A5AAA",
  journeyAfterPale: "#241844",
};

export const Colors = {
  // Core backgrounds — DARK navy
  background: palette.navy800,
  backgroundSecondary: palette.navy700,
  backgroundTertiary: palette.navy600,

  // Surfaces (cards on dark bg)
  surface: palette.surfaceDark,
  surfaceMid: palette.surfaceMid,
  surfaceLight: palette.surfaceLight,

  // Primary action — gold
  primary: palette.gold,
  primaryDark: palette.goldDark,
  primaryLight: palette.goldLight,
  primaryPale: palette.goldPale,

  // Secondary action — ember (use sparingly)
  accent: palette.ember,
  accentDark: palette.emberDark,
  accentLight: palette.emberLight,
  accentPale: palette.emberPale,

  // Navy shorthands
  navy: palette.navy700,
  navyMid: palette.navy600,
  navyLight: palette.navy500,
  navyFaint: palette.navyFaint,
  navyText: palette.navyText,
  navySub: palette.navySub,

  // Gold shorthands
  amber: palette.gold,
  amberLight: palette.goldLight,
  amberPale: palette.goldPale,

  // Text
  text: palette.textOnDark,
  textSecondary: palette.textSecOnDark,
  textMuted: palette.textMutedOnDark,
  textSubtle: palette.textSubtleOnDark,

  // Borders
  divider: palette.dividerDark,
  cardBorder: palette.cardBorder,

  // Semantic
  error: palette.rose,
  errorPale: palette.rosePale,
  info: palette.teal,
  infoPale: palette.tealPale,
  success: palette.sage,
  successPale: palette.sagePale,
  warning: palette.gold,
  warningPale: palette.goldPale,

  // Journey stage
  journeyBefore: palette.journeyBefore,
  journeyBeforePale: palette.journeyBeforePale,
  journeyDuring: palette.journeyDuring,
  journeyDuringPale: palette.journeyDuringPale,
  journeyAfter: palette.journeyAfter,
  journeyAfterPale: palette.journeyAfterPale,

  // Tab bar
  tabIconDefault: palette.navySub,
  tabIconSelected: palette.gold,
  tint: palette.gold,
};

export default Colors;
