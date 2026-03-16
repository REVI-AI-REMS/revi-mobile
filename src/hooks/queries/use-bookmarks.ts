import { bookmarksService } from "@/src/services/social/bookmarks.service";
import type { PostRead } from "@/src/services/social/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const bookmarkKeys = {
  all: ["bookmarks"] as const,
  list: (skip: number, limit: number) =>
    [...bookmarkKeys.all, "list", skip, limit] as const,
};

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * List posts bookmarked by the current user.
 * Ordered by most recently bookmarked first.
 *
 * Usage:
 *   const { data: bookmarks = [] } = useBookmarks();
 */
export function useBookmarks(skip = 0, limit = 20) {
  return useQuery<PostRead[]>({
    queryKey: bookmarkKeys.list(skip, limit),
    queryFn: () => bookmarksService.listBookmarks(skip, limit),
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Bookmark a post. Idempotent.
 *
 * Usage:
 *   const { mutate: addBookmark } = useBookmarkMutation();
 *   addBookmark(postId);
 */
export function useBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => bookmarksService.bookmark(postId),
    onSuccess: () => {
      // Invalidate so the bookmarks list refreshes
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    },
  });
}

/**
 * Remove a bookmark.
 *
 * Usage:
 *   const { mutate: removeBookmark } = useRemoveBookmarkMutation();
 *   removeBookmark(postId);
 */
export function useRemoveBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => bookmarksService.removeBookmark(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    },
  });
}
