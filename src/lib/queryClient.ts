import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
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
