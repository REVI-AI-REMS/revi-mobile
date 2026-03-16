import { useAuthStore } from "@/src/store/auth.store";
import axios from "axios";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://revi-social-api.niceriver-399abcd2.francecentral.azurecontainerapps.io";

export const api = axios.create({
  baseURL: BASE_URL,
  // 15s timeout — if the server cold-starts, the request will timeout and
  // React Query will retry with backoff rather than blocking for 35s.
  timeout: 15_000,
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
// Reads accessToken from Zustand store on every request.
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
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// On 401, attempt a silent token refresh then replay the failed request.
// Concurrent 401s are queued — only one refresh call is ever in-flight.
// Skip entirely in dev mode (X-Dev-User-Id bypass means 401s are real errors).

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isDev = process.env.EXPO_PUBLIC_DEV_MODE === "true";
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (!isDev && error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another refresh is already in-flight — queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await useAuthStore.getState().refreshAccessToken();
        if (newToken) {
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
