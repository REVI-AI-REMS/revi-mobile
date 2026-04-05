import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/src/lib/queryClient";
import { useAuthStore } from "@/src/store/auth.store";

// ─── Config ──────────────────────────────────────────────────────────────────

SplashScreen.preventAutoHideAsync();

/** Routes that require a logged-in user */
const PROTECTED_ROUTES = new Set([
  "(tabs)",
  "chat-session",
  "notification",
  "profile",
  "post",
  "modal",
  "chat",
  "new-post",
]);

/** Routes that redirect away if already authenticated */
const AUTH_ROUTES = new Set(["auth", "login"]);

/** Screens with non-default options (presentation, title, etc.) */
const SPECIAL_SCREENS: Record<string, object> = {
  modal: { presentation: "modal", title: "Modal", headerShown: true },
};

/** All route names registered in the Stack */
const SCREENS = [
  "index",
  "splash",
  "auth",
  "login",
  "forgot-password",
  "(tabs)",
  "chat-session",
  "signup",
  "notification",
  "new-post",
  "post/[id]",
  "profile/tokens",
  "profile/edit-profile",
  "profile/my-profile",
  "profile/reviews",
  "profile/settings",
  "profile/privacy-policy",
  "profile/[userId]",
  "modal",
] as const;

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Hide splash once fonts + auth hydration are both ready
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isLoading]);

  // Route guard
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const segment = (segments[0] as string) ?? "";

    if (!isAuthenticated && PROTECTED_ROUTES.has(segment)) {
      router.replace("/login");
    } else if (isAuthenticated && AUTH_ROUTES.has(segment)) {
      router.replace("/(tabs)/social");
    }
  }, [isAuthenticated, isLoading, fontsLoaded, segments, router]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {SCREENS.map((name) => (
              <Stack.Screen
                key={name}
                name={name}
                options={SPECIAL_SCREENS[name]}
              />
            ))}
          </Stack>
          <StatusBar
            style="light"
            backgroundColor={
              Platform.OS === "android" ? "#000000" : "transparent"
            }
            translucent={Platform.OS === "android"}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
