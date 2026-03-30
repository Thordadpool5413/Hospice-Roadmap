// ─── Design System: Dark Premium ────────────────────────────────────────────
// Background:  #091734 (deep navy)  →  #1A3470 (overlay lift)
// Text:        #F3F6FF (primary)    →  #8F9AB8 (muted)
// Primary:     #63C8FF (hero glow)  /  #77C8FF (tab active)
// Stage pill:  #4C2A39 bg / #F09A7A text / #FF8B68 dot  (fixed warm rose)
// ─────────────────────────────────────────────────────────────────────────────

const palette = {
  // ── Background layers ── (deepest → lifted)
  bg0:    "#091734",   // page background (deepest)
  bg1:    "#10214A",   // deep panel / base surface
  bg2:    "#14295A",   // standard card
  bg3:    "#1A3470",   // elevated card / overlay lift
  bg4:    "#223A80",   // top modal / focused surface

  // ── Text ──
  txtPrimary:   "#F3F6FF",   // primary text
  txtSecondary: "#B6C0DA",   // secondary / supporting
  txtMuted:     "#8F9AB8",   // hint / disabled
  txtSubtle:    "#4A6090",   // very muted / border-weight

  // ── Primary accent — cool ice blue ──
  blue400: "#63C8FF",   // hero glow / primary cta
  blue350: "#77C8FF",   // tab active / lighter cta
  blue300: "#9AD8FF",   // lighter tint
  blue900: "#0A1E3A",   // pale tinted bg

  // ── Border / structural ──
  border0: "#1E3060",   // subtle divider
  border1: "#355E9F",   // soft blue border
  border2: "rgba(130, 190, 255, 0.18)",  // card edge highlight
  borderGlow: "#58C8FF",  // hero glow

  // ── Stage pill (fixed warm rose, always) ──
  stagePillBg:   "#4C2A39",
  stagePillText: "#F09A7A",
  stagePillDot:  "#FF8B68",

  // ── Semantic ──
  rose:       "#C03040",
  rosePale:   "#1A1430",
  sage:       "#3A8060",
  sagePale:   "#101E30",
  teal:       "#1A9090",
  tealPale:   "#101E30",

  // ── Amber / warm ──
  amber:      "#D59A32",
  amberPale:  "#1E1A10",
  amberLight: "#F0BC5C",

  // ── Journey stage ──
  before:     "#4E8AD8",
  beforePale: "#0E1C38",
  during:     "#CC6030",
  duringPale: "#1A1420",
  after:      "#9068C8",
  afterPale:  "#130E2A",

  // ── Action accent palette ──
  accentSymptom:   "#67B7FF",
  accentJournal:   "#D59A32",
  accentGoals:     "#B97DFF",
  accentCareWishes:"#C48BFF",
  accentReminders: "#59D0D5",
  accentSituation: "#73B9FF",
  accentJourney:   "#58B6FF",

  // ── Tab nav ──
  tabBg:       "rgba(9, 18, 46, 0.97)",
  tabActive:   "#77C8FF",
  tabInactive: "#A3AECF",
  chatDot:     "#7CFF7A",

  white: "#FFFFFF",
};

export const Colors = {
  // ── Backgrounds ──
  background:          palette.bg0,
  backgroundSecondary: palette.bg1,
  backgroundTertiary:  palette.bg2,

  // ── Surfaces ──
  surface:      palette.bg1,
  surfaceMid:   palette.bg2,
  surfaceLight: palette.bg3,
  surfaceTop:   palette.bg4,

  // ── Primary action — bright ice blue ──
  primary:      palette.blue400,
  primaryDark:  "#3A7EA8",
  primaryLight: palette.blue300,
  primaryPale:  palette.blue900,

  // ── Accent — warm ember (alerts, urgency) ──
  accent:      palette.during,
  accentDark:  "#7A2E0A",
  accentLight: "#E08040",
  accentPale:  palette.duringPale,

  // ── Amber shorthands ──
  amber:      palette.amber,
  amberLight: palette.amberLight,
  amberPale:  palette.amberPale,

  // ── Text ──
  text:          palette.txtPrimary,
  textSecondary: palette.txtSecondary,
  textMuted:     palette.txtMuted,
  textSubtle:    palette.txtSubtle,

  // ── Borders / dividers ──
  divider:      palette.border0,
  cardBorder:   palette.border1,
  borderActive: palette.borderGlow,

  // ── Stage pill (global, fixed warm rose) ──
  stagePillBg:   palette.stagePillBg,
  stagePillText: palette.stagePillText,
  stagePillDot:  palette.stagePillDot,

  // ── Semantic ──
  error:       palette.rose,
  errorMid:    "#8A1830",
  errorPale:   palette.rosePale,
  info:        palette.teal,
  infoPale:    palette.tealPale,
  success:     palette.sage,
  successPale: palette.sagePale,
  warning:     palette.amber,
  warningPale: palette.amberPale,

  // ── Journey stage ──
  journeyBefore:     palette.before,
  journeyBeforePale: palette.beforePale,
  journeyDuring:     palette.during,
  journeyDuringPale: palette.duringPale,
  journeyAfter:      palette.after,
  journeyAfterPale:  palette.afterPale,

  // ── Action accent colors (home screen + cards) ──
  accentSymptom:    palette.accentSymptom,
  accentJournal:    palette.accentJournal,
  accentGoals:      palette.accentGoals,
  accentCareWishes: palette.accentCareWishes,
  accentReminders:  palette.accentReminders,
  accentSituation:  palette.accentSituation,
  accentJourney:    palette.accentJourney,

  // ── Tab bar ──
  tabBarBg:        palette.tabBg,
  tabIconDefault:  palette.tabInactive,
  tabIconSelected: palette.tabActive,
  chatLiveDot:     palette.chatDot,
  tint:            palette.blue400,

  // ── Navy shorthands (legacy compat) ──
  navy:       palette.bg2,
  navyMid:    palette.bg3,
  navyLight:  palette.bg4,
  navyFaint:  palette.txtMuted,
  navyText:   palette.txtPrimary,
  navySub:    palette.txtSecondary,
  navySubtle: palette.txtSubtle,
};

export default Colors;
