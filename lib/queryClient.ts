import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseApiError } from "@/utils/api-error";

// Populated by ToastProvider once it mounts. Using a setter avoids a
// circular dep between queryClient (module scope) and React context.
let _showToast: ((msg: string, type: "error" | "success" | "info") => void) | null = null;
export function registerToast(fn: typeof _showToast) {
  _showToast = fn;
}

export const queryClient = new QueryClient({
  // Surface every failed mutation as a toast automatically.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Mutations with meta.silent handle their own error UI (e.g. auth modals
      // that live inside RNModal where the toast would be hidden).
      if (mutation.options.meta?.silent) return;
      _showToast?.(parseApiError(error), "error");
    },
  }),
  // Silently log query errors — don't toast on background refetch failures.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.options.meta?.silent) return;
      // Only toast if there's no cached data (first load = user sees blank screen).
      if (query.state.data === undefined) {
        _showToast?.(parseApiError(error), "error");
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes — no refetch during this window
      staleTime: 1000 * 60 * 5,
      // Cache kept alive for 10 minutes after all subscribers unmount
      gcTime: 1000 * 60 * 10,
      // Retry up to 3x — but only on network errors or 5xx server errors.
      // Never retry on 4xx (bad request, auth) — that would just spam the server.
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        const status = (error as { response?: { status: number } })?.response
          ?.status;
        // Don't retry client errors
        if (status && status >= 400 && status < 500) return false;
        // Retry network errors (no status) and 5xx
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      // Don't refetch on tab focus — social apps feel jarring when this fires
      refetchOnWindowFocus: false,
      // Refetch when reconnecting from offline
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
