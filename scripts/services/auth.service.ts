import axios from "axios";
import { getAccessToken } from "./auth/token-accessor";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
} from "./auth/types";

export type { AuthUser, LoginRequest, LoginResponse, RegisterRequest, RefreshResponse };

const authAxios = axios.create({
  baseURL: process.env.EXPO_PUBLIC_AUTH_API_URL ?? "https://backend.reviai.ai",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Inject Bearer token on every request where one exists.
// Unauthenticated endpoints (login, register, refresh) are called before the
// store has a token, so the header is simply omitted for those requests.
authAxios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
  authAxios.interceptors.request.use((config) => {
    console.log(
      `[AUTH] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      "\nbody:", config.data,
    );
    return config;
  });
  authAxios.interceptors.response.use(
    (r) => { console.log(`[AUTH] ← ${r.status} ${r.config.url}`, r.data); return r; },
    (e) => { console.warn(`[AUTH] ✗ ${e.response?.status} ${e.config?.url}`, e.response?.data); return Promise.reject(e); },
  );
}

export const authService = {
  /** POST /auth/login */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await authAxios.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  /** POST /auth/register */
  register: async (payload: RegisterRequest): Promise<AuthUser> => {
    const { data } = await authAxios.post<AuthUser>("/auth/register", payload);
    return data;
  },

  /** POST /auth/refresh */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await authAxios.post<RefreshResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  /** GET /auth/me */
  me: async (accessToken: string): Promise<AuthUser> => {
    const { data } = await authAxios.get<AuthUser>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` }, // explicit — called during cold-start before store hydrates
    });
    return data;
  },

  /** POST /auth/email/verify/request — send OTP to email (also used as resend) */
  requestEmailVerification: async (email: string): Promise<void> => {
    await authAxios.post("/auth/email/verify/request", { email });
  },

  /** POST /auth/email/verify/confirm — verify OTP and activate account */
  confirmEmailVerification: async (email: string, otp: string): Promise<void> => {
    await authAxios.post("/auth/email/verify/confirm", { email, otp });
  },

  /** POST /auth/password/reset/request — send password reset OTP */
  requestPasswordReset: async (email: string): Promise<void> => {
    await authAxios.post("/auth/password/reset/request", { email });
  },

  /** POST /auth/password/reset/verify — verify password reset OTP */
  verifyPasswordResetOtp: async (email: string, otp: string): Promise<void> => {
    await authAxios.post("/auth/password/reset/verify", { email, otp });
  },

  /** PATCH /auth/users/{user_id} — update profile fields */
  updateUser: async (
    userId: string,
    updates: Partial<Pick<AuthUser, "username" | "first_name" | "last_name" | "avatar">>,
  ): Promise<AuthUser> => {
    const { data } = await authAxios.patch<AuthUser>(`/auth/users/${userId}`, updates);
    return data;
  },

  /** POST /auth/password/change — change password while authenticated */
  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    await authAxios.post("/auth/password/change", { current_password, new_password });
  },

  /** POST /auth/password/reset/confirm — set new password */
  confirmPasswordReset: async (
    email: string,
    otp: string,
    new_password: string,
  ): Promise<void> => {
    await authAxios.post("/auth/password/reset/confirm", { email, otp, new_password });
  },
};
