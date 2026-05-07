/**
 * Extracts a human-readable message from any API or network error.
 *
 * Handles:
 *  - FastAPI 422 validation errors  { detail: [{msg, loc, type}] }
 *  - FastAPI string detail          { detail: "Not found" }
 *  - Axios network errors           (no response)
 *  - Plain Error objects
 */
export function parseApiError(err: unknown): string {
  const e = err as {
    response?: { status?: number; data?: { detail?: unknown } };
    message?: string;
    request?: unknown;
  };

  const status = e?.response?.status;
  const detail = e?.response?.data?.detail;

  // Friendly status-based messages for common cases
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "That item could not be found.";
  if (status === 429) return "Too many requests. Please slow down.";
  if (status === 503) return "The server is temporarily unavailable.";

  // FastAPI validation error array
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first?.msg) return first.msg as string;
  }

  // FastAPI string detail
  if (typeof detail === "string" && detail.length > 0) return detail;

  // Network / no response
  if (!e?.response && e?.request) {
    return "No internet connection. Please check your network.";
  }

  // Generic fallback
  return e?.message ?? "Something went wrong. Please try again.";
}
