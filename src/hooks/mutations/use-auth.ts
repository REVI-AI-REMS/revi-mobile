import { queryClient } from "@/src/lib/queryClient";
import { authService } from "@/src/services/auth.service";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/src/services/auth/types";
import { useAuthStore } from "@/src/store/auth.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// ─── Dev-mode mock user ───────────────────────────────────────────────────────
// When EXPO_PUBLIC_DEV_MODE=true the auth backend is not used.
// We set a synthetic user whose id matches EXPO_PUBLIC_DEV_USER_ID so that
// the social API's X-Dev-User-Id header stays consistent.
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "dev-user";
const DEV_MOCK_USER: AuthUser = {
  id: DEV_USER_ID,
  email: "dev@reviai.ai",
  username: "devuser",
  first_name: "Dev",
  last_name: "User",
  type: "user",
  subscription_type: "free",
  subscription_start_date: null,
  subscription_end_date: null,
  pending_type: null,
  is_active: true,
  is_staff: false,
  is_superuser: false,
  email_verified: true,
  avatar: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  date_joined: new Date().toISOString(),
  last_login: new Date().toISOString(),
};

// ─── Login ────────────────────────────────────────────────────────────────────
// In dev mode: bypass the real auth backend and set mock state immediately.
// In production: call POST /auth/login and persist the returned tokens + user.

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const isDev = process.env.EXPO_PUBLIC_DEV_MODE === "true";

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      if (isDev) {
        // Skip the real API — return synthetic tokens + the mock user
        return {
          access_token: "dev-access-token",
          refresh_token: "dev-refresh-token",
          token_type: "Bearer" as const,
          user: DEV_MOCK_USER,
        };
      }
      return authService.login(payload);
    },
    onSuccess: ({ access_token, refresh_token, user }) => {
      setTokens(access_token, refresh_token);
      setUser(user);
    },
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────
// Returns the new AuthUser. The caller is responsible for auto-login.

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
// No server-side logout endpoint — just clear local state.

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      /* no logout endpoint on this backend */
    },
    onSettled: () => {
      logout();
      // Wipe all cached server state so no stale data bleeds into next session
      queryClient.clear();
      router.replace("/login");
    },
  });
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}
