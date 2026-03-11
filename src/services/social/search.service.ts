import { api } from "@/src/services/api";
import type { PostRead, UserSync } from "./types";

/**
 * GET /api/v1/search?q=<query>&limit=<n>
 *
 * Searches across:
 *   - Posts: matched on caption (case-insensitive substring)
 *   - Users: matched on username, first_name, or last_name
 *
 * Blocked/inactive posts are excluded.
 * Returns up to `limit` results per category.
 * Minimum query length: 2 characters.
 */

export interface SearchResult {
  posts: PostRead[];
  users: UserSync[];
}

export const searchService = {
  search: async (q: string, limit = 20): Promise<SearchResult> => {
    const { data } = await api.get<SearchResult>("/api/v1/search", {
      params: { q, limit },
    });
    return data;
  },
};
