// ─── Auth User ────────────────────────────────────────────────────────────────
// Matches the user object returned by POST /auth/login and GET /auth/me

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  type: string;
  subscription_type: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  pending_type: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  email_verified: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  date_joined: string;
  last_login: string | null;
  agent_info?: Record<string, unknown> | null;
}

// ─── Request / Response shapes ────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  type: "user" | "agent" | "admin";
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
}
