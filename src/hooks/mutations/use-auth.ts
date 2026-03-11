import { queryClient } from "@/src/lib/queryClient";
import {
    authService,
    LoginPayload,
    SignUpPayload,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// ─── Login ───────────────────────────────────────────────────────────────────

export function useLoginMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ user, token }) => {
      setUser(user, token);
      router.replace("/(tabs)/chat");
    },
  });
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export function useSignUpMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignUpPayload) => authService.signUp(payload),
    onSuccess: ({ user, token }) => {
      setUser(user, token);
      router.replace("/(tabs)/chat");
    },
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
// onSettled instead of onSuccess so we always clear state even if API 500s

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
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

// ─── Verify Email Code ────────────────────────────────────────────────────────

export function useVerifyCodeMutation() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authService.verifyCode(email, code),
  });
}
