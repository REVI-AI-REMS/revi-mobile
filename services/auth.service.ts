import axios from "axios";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
} from "./auth/types";

// ─── Re-export types for consumers ───────────────────────────────────────────
export type { AuthUser, LoginRequest, LoginResponse, RegisterRequest, RefreshResponse };

// ─── Dedicated Auth axios instance ───────────────────────────────────────────
// Intentionally separate from the social API instance in api.ts.
// This avoids circular imports (api.ts → auth.store → auth.service → api.ts).
const authAxios = axios.create({
  baseURL: "https://backend.reviai.ai",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  /** POST /auth/login — returns access + refresh tokens and the user */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await authAxios.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  /** POST /auth/register — creates the account; returns the new user (no tokens) */
  register: async (payload: RegisterRequest): Promise<AuthUser> => {
    const { data } = await authAxios.post<AuthUser>("/auth/register", payload);
    return data;
  },

  /** POST /auth/refresh — exchange a refresh token for a fresh token pair */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await authAxios.post<RefreshResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },

  /** GET /auth/me — validate an access token and return the current user */
  me: async (accessToken: string): Promise<AuthUser> => {
    const { data } = await authAxios.get<AuthUser>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  /** POST /auth/forgot-password — trigger a password-reset email */
  forgotPassword: async (email: string): Promise<void> => {
    await authAxios.post("/auth/forgot-password", { email });
  },

  /** POST /auth/reset-password — set a new password with the reset token */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await authAxios.post("/auth/reset-password", { token, password });
  },
};
