const palette = {
  // ── Deep navy ── richer, colder, more refined
  navy950: "#080E1C",   // deepest shadow
  navy900: "#0D1526",   // near-black navy
  navy850: "#111B33",   // page background
  navy800: "#162040",   // slightly lifted bg
  navy750: "#1B2850",   // card base
  navy700: "#213060",   // elevated card
  navy650: "#283870",   // mid card
  navy600: "#304280",   // lifted element
  navy550: "#3A4E90",   // highlight / active state
  navy500: "#4A5E9E",   // secondary accent surfaces

  // ── Text on dark ──
  navyText: "#D6E4F8",      // primary text (slightly cooler, crisp)
  navySub: "#7A9CC0",       // secondary text
  navyFaint: "#A8C0DC",     // tertiary / hint text
  navySubtle: "#3E5880",    // very muted text / dividers

  // ── Antique gold ── soft, not electric
  gold: "#C8971C",          // primary action / highlight
  goldDark: "#96700E",      // pressed / dark variant
  goldLight: "#DEAD52",     // light variant
  goldPale: "#261E08",      // dark bg tint for gold-themed areas

  // ── Ember ── warm secondary, used very sparingly
  ember: "#B84818",
  emberDark: "#7A2E0A",
  emberLight: "#D96838",
  emberPale: "#220D04",

  // ── Surfaces — well-separated for depth ──
  surfaceDark: "#162040",   // lowest surface (sits on bg)
  surfaceMid:  "#1B2850",   // standard card
  surfaceHigh: "#213060",   // elevated / focused card
  surfaceTop:  "#283870",   // modal / overlay surface

  // ── Borders ── subtle, structural not decorative ──
  borderSubtle: "#1F3060",  // very faint structure
  borderMid:    "#2A3D78",  // card border
  borderBright: "#3A5098",  // active / focused border

  // ── Semantic ──
  rose:       "#B02828",
  roseMid:    "#7A1A1A",
  rosePale:   "#1C0808",
  teal:       "#1A7090",
  tealPale:   "#091E28",
  violet:     "#6040A0",
  violetPale: "#160E2C",
  sage:       "#3A7050",
  sagePale:   "#0C1E14",
  amber:      "#C8971C",
  amberPale:  "#261E08",

  // ── Journey ── muted, dignified
  journeyBefore:     "#3A78C0",   // cool blue
  journeyBeforePale: "#0E1E3C",   // deep navy-blue bg
  journeyDuring:     "#B04820",   // warm ember
  journeyDuringPale: "#1E0C04",   // deep ember bg
  journeyAfter:      "#7050A8",   // muted violet
  journeyAfterPale:  "#140C28",   // deep violet bg

  white: "#FFFFFF",
};

export const Colors = {
  // ── Backgrounds ──
  background:          palette.navy850,
  backgroundSecondary: palette.navy800,
  backgroundTertiary:  palette.navy750,

  // ── Surfaces (cards layered on dark bg) ──
  surface:    palette.surfaceDark,
  surfaceMid: palette.surfaceMid,
  surfaceLight: palette.surfaceHigh,
  surfaceTop:   palette.surfaceTop,

  // ── Primary action — antique gold ──
  primary:      palette.gold,
  primaryDark:  palette.goldDark,
  primaryLight: palette.goldLight,
  primaryPale:  palette.goldPale,

  // ── Accent — ember, used very sparingly ──
  accent:      palette.ember,
  accentDark:  palette.emberDark,
  accentLight: palette.emberLight,
  accentPale:  palette.emberPale,

  // ── Navy shorthands ──
  navy:        palette.navy750,
  navyMid:     palette.navy700,
  navyLight:   palette.navy600,
  navyFaint:   palette.navyFaint,
  navyText:    palette.navyText,
  navySub:     palette.navySub,
  navySubtle:  palette.navySubtle,

  // ── Gold shorthands ──
  amber:      palette.gold,
  amberLight: palette.goldLight,
  amberPale:  palette.goldPale,

  // ── Text ──
  text:          palette.navyText,
  textSecondary: palette.navySub,
  textMuted:     palette.navyFaint,
  textSubtle:    palette.navySubtle,

  // ── Borders ──
  divider:    palette.borderSubtle,
  cardBorder: palette.borderMid,
  borderActive: palette.borderBright,

  // ── Semantic ──
  error:       palette.rose,
  errorMid:    palette.roseMid,
  errorPale:   palette.rosePale,
  info:        palette.teal,
  infoPale:    palette.tealPale,
  success:     palette.sage,
  successPale: palette.sagePale,
  warning:     palette.amber,
  warningPale: palette.amberPale,

  // ── Journey stage ──
  journeyBefore:     palette.journeyBefore,
  journeyBeforePale: palette.journeyBeforePale,
  journeyDuring:     palette.journeyDuring,
  journeyDuringPale: palette.journeyDuringPale,
  journeyAfter:      palette.journeyAfter,
  journeyAfterPale:  palette.journeyAfterPale,

  // ── Tab bar ──
  tabIconDefault:  palette.navySub,
  tabIconSelected: palette.gold,
  tint:            palette.gold,
};

export default Colors;
