import { api } from "@/src/services/api";
import type { UserSync } from "./types";

/**
 * Internal service-to-service endpoints.
 * Requires X-Internal-Key header (not a JWT).
 * Called by Revi Core — not used directly from the mobile client.
 *
 * POST /api/v1/internal/users/sync
 */
export const internalService = {
  /**
   * POST /api/v1/internal/users/sync
   * Creates or updates a UserReplica from Revi Core user data.
   */
  syncUser: async (payload: UserSync): Promise<void> => {
    await api.post("/api/v1/internal/users/sync", payload);
  },
};
