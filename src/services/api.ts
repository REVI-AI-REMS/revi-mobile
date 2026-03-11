import { useAuthStore } from "@/src/store/auth.store";
import axios from "axios";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://revi-social-api.niceriver-399abcd2.francecentral.azurecontainerapps.io";

export const api = axios.create({
  baseURL: BASE_URL,
  // 35s — Azure Container Apps can take 20-30s to wake from cold start.
  // Reduce to 15s once you enable min-replicas: 1 in Azure.
  timeout: 35_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Debug Interceptor (dev only) ────────────────────────────────────────────
if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
  api.interceptors.request.use((config) => {
    console.log(
      `[API] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      "\nparams:",
      config.params,
      "\nbody:",
      config.data ? JSON.stringify(config.data).slice(0, 300) : undefined,
      "\nheaders:",
      config.headers,
    );
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(
        `[API] ← ${response.status} ${response.config.url}`,
        "\ndata:",
        JSON.stringify(response.data).slice(0, 200),
      );
      return response;
    },
    (error) => {
      console.error(
        `[API] ✗ ${error.response?.status ?? "network"} ${error.config?.url}`,
        "\nbody:",
        JSON.stringify(error.response?.data),
        "\nmessage:",
        error.message,
      );
      return Promise.reject(error);
    },
  );
}

// ─── Request Interceptor ────────────────────────────────────────────────────
// Reads token from Zustand store on every request.
// Zustand store is synchronous — safe to call outside React here.
// In dev mode, use X-Dev-User-Id header instead of Bearer token.
api.interceptors.request.use(
  (config) => {
    const isDev = process.env.EXPO_PUBLIC_DEV_MODE === "true";

    if (isDev) {
      const devUserId = process.env.EXPO_PUBLIC_DEV_USER_ID;
      if (devUserId) {
        config.headers["X-Dev-User-Id"] = devUserId;
      }
    } else {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// On 401, clear auth state and let the router redirect to login.
// Skip in dev mode — we use X-Dev-User-Id so 401s shouldn't log us out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDev = process.env.EXPO_PUBLIC_DEV_MODE === "true";
    if (!isDev && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
