const palette = {
  // ── Deep navy ── richer, colder, more refined
  navy950: "#080E1C",
  navy900: "#0D1526",
  navy850: "#111B33",   // page background
  navy800: "#162040",
  navy750: "#1B2850",   // card base
  navy700: "#213060",   // elevated card
  navy650: "#283870",   // mid card
  navy600: "#304280",   // lifted element
  navy550: "#3A4E90",
  navy500: "#4A5E9E",

  // ── Text on dark ──
  navyText:   "#D6E4F8",   // primary text
  navySub:    "#7A9CC0",   // secondary text
  navyFaint:  "#A8C0DC",   // hint / tertiary
  navySubtle: "#3E5880",   // very muted / dividers

  // ── Ice blue / steel ── primary accent (replaces gold)
  ice:      "#5AADDC",   // crisp ice blue — primary action
  iceDark:  "#3A7EA8",   // pressed / dark variant
  iceLight: "#8FCAE8",   // lighter tint
  icePale:  "#0A1E2C",   // dark bg tint for ice-themed areas

  // ── Ember ── warm secondary, used very sparingly (alerts, urgency)
  ember:     "#B84818",
  emberDark: "#7A2E0A",
  emberLight:"#D96838",
  emberPale: "#220D04",

  // ── Surfaces — well-separated for depth ──
  surfaceDark: "#162040",   // lowest surface (sits on bg)
  surfaceMid:  "#1B2850",   // standard card
  surfaceHigh: "#213060",   // elevated / focused card
  surfaceTop:  "#283870",   // modal / overlay surface

  // ── Borders ── subtle, structural not decorative ──
  borderSubtle: "#1F3060",
  borderMid:    "#2A3D78",
  borderBright: "#3A5098",

  // ── Semantic ──
  rose:       "#B02828",
  roseMid:    "#7A1A1A",
  rosePale:   "#1C0808",
  teal:       "#1A8090",
  tealPale:   "#091E28",
  violet:     "#6040A0",
  violetPale: "#160E2C",
  sage:       "#3A7050",
  sagePale:   "#0C1E14",

  // ── Journey ── muted, dignified
  journeyBefore:     "#3A78C0",   // cool blue
  journeyBeforePale: "#0E1E3C",
  journeyDuring:     "#B04820",   // warm ember
  journeyDuringPale: "#1E0C04",
  journeyAfter:      "#7050A8",   // muted violet
  journeyAfterPale:  "#140C28",

  white: "#FFFFFF",
};

export const Colors = {
  // ── Backgrounds ──
  background:          palette.navy850,
  backgroundSecondary: palette.navy800,
  backgroundTertiary:  palette.navy750,

  // ── Surfaces ──
  surface:     palette.surfaceDark,
  surfaceMid:  palette.surfaceMid,
  surfaceLight:palette.surfaceHigh,
  surfaceTop:  palette.surfaceTop,

  // ── Primary action — ice blue ──
  primary:      palette.ice,
  primaryDark:  palette.iceDark,
  primaryLight: palette.iceLight,
  primaryPale:  palette.icePale,

  // ── Accent — ember, used sparingly for urgency/alerts ──
  accent:      palette.ember,
  accentDark:  palette.emberDark,
  accentLight: palette.emberLight,
  accentPale:  palette.emberPale,

  // ── Navy shorthands ──
  navy:       palette.navy750,
  navyMid:    palette.navy700,
  navyLight:  palette.navy600,
  navyFaint:  palette.navyFaint,
  navyText:   palette.navyText,
  navySub:    palette.navySub,
  navySubtle: palette.navySubtle,

  // ── Ice shorthands (replaces amber/gold) ──
  amber:      palette.ice,       // kept for backwards compat — now ice
  amberLight: palette.iceLight,
  amberPale:  palette.icePale,

  // ── Text ──
  text:          palette.navyText,
  textSecondary: palette.navySub,
  textMuted:     palette.navyFaint,
  textSubtle:    palette.navySubtle,

  // ── Borders ──
  divider:      palette.borderSubtle,
  cardBorder:   palette.borderMid,
  borderActive: palette.borderBright,

  // ── Semantic ──
  error:       palette.rose,
  errorMid:    palette.roseMid,
  errorPale:   palette.rosePale,
  info:        palette.teal,
  infoPale:    palette.tealPale,
  success:     palette.sage,
  successPale: palette.sagePale,
  warning:     palette.ice,      // use ice for informational warnings
  warningPale: palette.icePale,

  // ── Journey stage ──
  journeyBefore:     palette.journeyBefore,
  journeyBeforePale: palette.journeyBeforePale,
  journeyDuring:     palette.journeyDuring,
  journeyDuringPale: palette.journeyDuringPale,
  journeyAfter:      palette.journeyAfter,
  journeyAfterPale:  palette.journeyAfterPale,

  // ── Tab bar ──
  tabIconDefault:  palette.navySub,
  tabIconSelected: palette.ice,
  tint:            palette.ice,
};

export default Colors;
