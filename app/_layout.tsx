import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { queryClient } from "@/src/lib/queryClient";
import { useAuthStore } from "@/src/store/auth.store";

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

// Routes that require authentication
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

// Routes that should redirect away when already authenticated
const AUTH_ROUTES = new Set(["auth", "login"]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Hide the native splash only after fonts are loaded AND token hydration is done
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Route protection — runs whenever auth state or current route changes
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const segment = (segments[0] as string) ?? "";

    if (!isAuthenticated && PROTECTED_ROUTES.has(segment)) {
      // Not logged in, tried to access a protected screen → send to login
      router.replace("/login");
    } else if (isAuthenticated && AUTH_ROUTES.has(segment)) {
      // Already logged in, ended up on an auth screen → send to app
      router.replace("/(tabs)/social");
    }
  }, [isAuthenticated, isLoading, fontsLoaded, segments, router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen
              name="forgot-password"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="chat-session"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen
              name="notification"
              options={{
                headerShown: false,
                title: "Notifications",
              }}
            />
            <Stack.Screen
              name="profile/tokens"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="profile/edit-profile"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="profile/my-profile"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="profile/reviews"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="profile/settings"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
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
