import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: "#0F0F10",
  bgSecondary: "#1C1C1E",
  bgTertiary: "#2C2C2E",
  skeleton: "#1C1C1E",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textMuted: "#52525B",
  white: "#FFFFFF",

  // Borders
  border: "#27272A",
  borderLight: "#3A3A3C",

  // Accents
  accent: "#007AFF",
  error: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",

  // Transparent
  transparent: "transparent",
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

// ─── Radius ──────────────────────────────────────────────────────────────────

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const typography = {
  displayLg: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 34 },
  displaySm: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  h1: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 24 },
  h2: { fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 22 },
  h3: { fontSize: 16, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  bodyLg: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24 },
  bodyMd: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bodySm: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  labelLg: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  labelMd: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  labelSm: { fontSize: 11, fontFamily: "Inter_500Medium", lineHeight: 14 },
  caption: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 14 },
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export const layout = {
  screenPadding: 16,
  gridColumns: 3,
  gridGap: 2,
  minTouchTarget: 44,
  tabBarHeight: 50,
  get gridThumbSize() {
    return (SCREEN_WIDTH - (this.gridColumns - 1) * this.gridGap) / this.gridColumns;
  },
} as const;
