import { api } from "@/src/services/api";
import type { PostRead } from "./types";

/**
 * POST   /api/v1/bookmarks/{post_id}
 * DELETE /api/v1/bookmarks/{post_id}
 * GET    /api/v1/bookmarks/
 */
export const bookmarksService = {
  /**
   * POST /api/v1/bookmarks/{post_id}
   * Idempotent — bookmarking an already-bookmarked post returns `already_bookmarked`
   * without duplicating.
   */
  bookmark: async (postId: string): Promise<void> => {
    await api.post(`/api/v1/bookmarks/${postId}`);
  },

  /** DELETE /api/v1/bookmarks/{post_id} */
  removeBookmark: async (postId: string): Promise<void> => {
    await api.delete(`/api/v1/bookmarks/${postId}`);
  },

  /**
   * GET /api/v1/bookmarks/
   * Returns all bookmarked posts, most recently bookmarked first.
   * Blocked or deleted posts are silently excluded.
   */
  listBookmarks: async (skip = 0, limit = 20): Promise<PostRead[]> => {
    // Some endpoints may fail if pagination params are sent but not supported
    const { data } = await api.get<PostRead[]>("/api/v1/bookmarks");
    return data;
  },
};
