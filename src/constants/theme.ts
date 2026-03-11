/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#0F0F10",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  // Fallback fonts for platform-specific designs
  system: Platform.select({
    ios: "system-ui",
    android: "Roboto",
    default: "normal",
    web: "system-ui, sans-serif",
  }),
  mono: Platform.select({
    ios: "ui-monospace",
    android: "monospace",
    default: "monospace",
    web: "monospace",
  }),
};

// Platform-specific sizing
export const Typography = {
  // Font sizes that work well cross-platform
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  
  // Platform-specific line heights
  lineHeight: {
    tight: Platform.select({ ios: 1.2, android: 1.3, default: 1.2 }),
    normal: Platform.select({ ios: 1.4, android: 1.5, default: 1.4 }),
    loose: Platform.select({ ios: 1.6, android: 1.7, default: 1.6 }),
  },
};

// Platform-specific border radius values
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  // Android often looks better with slightly larger radius
  button: Platform.select({ ios: 12, android: 14, default: 12 }),
  card: Platform.select({ ios: 12, android: 16, default: 12 }),
};
