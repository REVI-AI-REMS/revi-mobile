import { queryClient } from "@/lib/queryClient";
import { authService } from "@/services/auth.service";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/services/auth/types";
import { useAuthStore } from "@/stores/auth.store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// ─── Dev-mode mock user ───────────────────────────────────────────────────────
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

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const isDev = process.env.EXPO_PUBLIC_DEV_MODE === "true";

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      if (isDev) {
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

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  });
}

// ─── Email Verification ───────────────────────────────────────────────────────

export function useRequestEmailVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.requestEmailVerification(email),
  });
}

export function useConfirmEmailVerificationMutation() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.confirmEmailVerification(email, otp),
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
}

export function useVerifyPasswordResetOtpMutation() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyPasswordResetOtp(email, otp),
  });
}

export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationFn: ({
      email,
      otp,
      new_password,
    }: {
      email: string;
      otp: string;
      new_password: string;
    }) => authService.confirmPasswordReset(email, otp, new_password),
  });
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export function useUpdateProfileMutation() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Pick<AuthUser, "username" | "first_name" | "last_name" | "avatar">>;
    }) => authService.updateUser(userId, updates),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
  });
}

// ─── Change Password ──────────────────────────────────────────────────────────

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({
      current_password,
      new_password,
    }: {
      current_password: string;
      new_password: string;
    }) => authService.changePassword(current_password, new_password),
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {},
    onSettled: () => {
      logout();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
