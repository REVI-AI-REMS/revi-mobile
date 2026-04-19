import { useAuthStore } from "@/stores/auth.store";
import axios from "axios";

// Dedicated axios instance for the AI backend. Intentionally separate from
// the social `api` in services/api.ts so changes to one don't ripple into
// the other. Reuses the same Zustand access token that auth.service already
// populates at login — the AI backend shares the same auth service.
export const aiClient = axios.create({
  baseURL: "https://backend.reviai.ai",
  // AI responses can legitimately take 30-60s when the model is cold or the
  // prompt is long. Anything shorter just causes retry churn.
  timeout: 60_000,
  headers: {
    Accept: "application/json",
  },
});

aiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mirror the social api's dev-only debug log so requests are visible in
// Metro when something misbehaves. Warn (not error) so LogBox doesn't flash
// a red screen on legitimate 4xx/5xx responses.
if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
  aiClient.interceptors.request.use((config) => {
    console.log(
      `[AI] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
    return config;
  });
  aiClient.interceptors.response.use(
    (response) => {
      console.log(`[AI] ← ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.warn(
        `[AI] ✗ ${error.response?.status ?? "network"} ${error.config?.url}`,
        "\nmessage:",
        error.message,
      );
      return Promise.reject(error);
    },
  );
}
