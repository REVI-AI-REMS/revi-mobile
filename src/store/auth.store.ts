import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { authService } from "@/src/services/auth.service";
import type { AuthUser } from "@/src/services/auth/types";

// ─── Re-export AuthUser for existing consumers ────────────────────────────────
export type { AuthUser };

// ─── Safe Storage Adapter ─────────────────────────────────────────────────────
// @react-native-async-storage v3 requires a dev build — the native module is
// null when running in Expo Go. This wrapper silently falls back to an
// in-memory store so the app never crashes, while still persisting correctly
// in production builds that have the native module available.
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return memoryStore.get(name) ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      memoryStore.set(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      memoryStore.delete(name);
    }
  },
};

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** true while restoring session on app launch — keep splash visible */
  isLoading: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Store a fresh token pair (e.g. after login or token refresh) */
  setTokens: (accessToken: string, refreshToken: string) => void;
  /** Store the authenticated user and flip isAuthenticated */
  setUser: (user: AuthUser) => void;
  /** Merge partial updates into the current user */
  updateUser: (updates: Partial<AuthUser>) => void;
  /**
   * Called once on app start (via onRehydrateStorage).
   * Validates the persisted access token; silently refreshes if expired.
   */
  hydrate: () => Promise<void>;
  /**
   * Exchange the stored refresh token for a new token pair.
   * Returns the new access token on success, or null on failure (triggers logout).
   */
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // true until hydrate() resolves

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      hydrate: async () => {
        set({ isLoading: true });

        // In dev mode, tokens are synthetic — skip real API validation.
        // If a user is already set (persisted), just keep it; otherwise finish loading.
        if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
          const { user } = get();
          set({
            isAuthenticated: !!user,
            isLoading: false,
          });
          return;
        }

        const { accessToken, refreshToken } = get();

        // Nothing persisted — treat as logged-out
        if (!accessToken && !refreshToken) {
          set({ isLoading: false });
          return;
        }

        // Try to validate the existing access token
        if (accessToken) {
          try {
            const user = await authService.me(accessToken);
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          } catch (err: any) {
            // Non-401 error (network, server) — bail out without wiping tokens
            if (err?.response?.status !== 401) {
              set({ isLoading: false });
              return;
            }
            // 401 → fall through to refresh
          }
        }

        // Access token missing or expired — attempt a silent refresh
        if (refreshToken) {
          try {
            const refreshed = await authService.refresh(refreshToken);
            set({
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
            });
            const user = await authService.me(refreshed.access_token);
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          } catch {
            // Refresh also failed — clear the session
          }
        }

        // Both strategies failed — log the user out cleanly
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAccessToken: async () => {
        // Dev mode — synthetic token never expires, nothing to refresh
        if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
          return get().accessToken;
        }
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return null;
        }
        try {
          const refreshed = await authService.refresh(refreshToken);
          set({
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
          });
          return refreshed.access_token;
        } catch {
          get().logout();
          return null;
        }
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "revi-auth-store",
      storage: createJSONStorage(() => safeStorage),
      // isLoading is intentionally NOT persisted — always starts as true
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // After AsyncStorage restores the persisted state, validate the tokens.
      // By the time this fires, get() returns the fresh persisted tokens.
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.hydrate();
        } else {
          // Storage read failed — unblock the UI
          useAuthStore.setState({ isLoading: false });
        }
      },
    },
  ),
);

