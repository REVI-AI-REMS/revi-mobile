import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ─── Safe Storage Adapter ─────────────────────────────────────────────────────
// @react-native-async-storage v3 requires a dev build — the native module is
// null when running in Expo Go. This wrapper silently falls back to an
// in-memory store so the app never crashes, while still persisting correctly
// in production builds that have the native module available.
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
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

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Actions
  setUser: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) => set({ user, token, isAuthenticated: true }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setToken: (token) => set({ token }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "revi-auth-store",
      storage: createJSONStorage(() => safeStorage),
      // Only persist what we need — skip any derived/computed fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
