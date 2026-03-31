import { feedKeys } from "@/src/hooks/queries/use-feed";
import { relationshipKeys } from "@/src/hooks/queries/use-relationships";
import { interactionsService } from "@/src/services/social/interactions.service";
import { postsService } from "@/src/services/social/posts.service";
import { relationshipsService } from "@/src/services/social/relationships.service";
import type {
    CommentCreate,
    FollowRead,
    PostCreate,
    PostRead,
} from "@/src/services/social/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const CURRENT_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";

// ─── Like / Unlike ───────────────────────────────────────────────────────────

export function useLikePostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; isLiked: boolean }>({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        await interactionsService.unlikePost(postId);
      } else {
        await interactionsService.likePost(postId);
      }
    },

    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      // Snapshot all matching feed query data for rollback
      const previousEntries = queryClient.getQueriesData<PostRead[]>({
        queryKey: feedKeys.all,
      });

      // Optimistically toggle in all matching feed caches
      queryClient.setQueriesData<PostRead[]>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: !isLiked,
                  like_count: isLiked
                    ? post.like_count - 1
                    : post.like_count + 1,
                }
              : post,
          );
        },
      );

      return { previousEntries };
    },

    onError: (_err, _vars, context) => {
      const ctx = context as
        | { previousEntries?: [unknown, PostRead[] | undefined][] }
        | undefined;
      if (ctx?.previousEntries) {
        ctx.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey as Parameters<typeof queryClient.setQueryData>[0],
            data,
          );
        });
      }
    },
    // No onSettled invalidation — the server doesn't return is_liked in feed
    // responses so refetching would overwrite the optimistic toggle with undefined.
  });
}

// ─── Create Post ──────────────────────────────────────────────────────────────

export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostCreate) => postsService.createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

// ─── Delete Post ──────────────────────────────────────────────────────────────

export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

// ─── Add Comment ──────────────────────────────────────────────────────────────

export function useAddCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CommentCreate) =>
      interactionsService.createComment(payload),

    onMutate: async ({ post_id }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      // Snapshot for rollback
      const previousEntries = queryClient.getQueriesData<PostRead[]>({
        queryKey: feedKeys.all,
      });

      // Optimistically bump comment_count in every feed cache
      queryClient.setQueriesData<PostRead[]>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((post) =>
            post.id === post_id
              ? { ...post, comment_count: post.comment_count + 1 }
              : post,
          );
        },
      );

      return { previousEntries };
    },

    onError: (_err, _vars, context) => {
      const ctx = context as
        | { previousEntries?: [unknown, PostRead[] | undefined][] }
        | undefined;
      if (ctx?.previousEntries) {
        ctx.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey as Parameters<typeof queryClient.setQueryData>[0],
            data,
          );
        });
      }
    },

    onSuccess: (_data, variables) => {
      // Refetch the comments list for this post
      queryClient.invalidateQueries({
        queryKey: feedKeys.comments(variables.post_id),
      });
      // Sync the single post detail if it's cached
      queryClient.invalidateQueries({
        queryKey: feedKeys.post(variables.post_id),
      });
      // NOTE: do NOT invalidate feedKeys.all — the feed endpoint doesn't return
      // is_liked, so refetching would silently overwrite the optimistic red heart.
    },
  });
}

// ─── Like / Unlike Comment ───────────────────────────────────────────────────

export function useLikeCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { postId: string; commentId: string; isLiked: boolean }
  >({
    mutationFn: async ({ commentId, isLiked }) => {
      if (isLiked) {
        await interactionsService.unlikeComment(commentId);
      } else {
        await interactionsService.likeComment(commentId);
      }
    },

    onMutate: async ({ postId, commentId, isLiked }) => {
      const queryKey = feedKeys.comments(postId);
      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData<any[]>(queryKey);

      // Optimistically toggle is_liked for the specific comment
      queryClient.setQueryData<any[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked: !isLiked,
                like_count: (comment.like_count ?? 0) + (isLiked ? -1 : 1),
              }
            : comment,
        );
      });

      return { previousComments };
    },

    onError: (_err, _vars, context) => {
      const ctx = context as { previousComments?: any[] } | undefined;
      if (ctx?.previousComments) {
        queryClient.setQueryData(feedKeys.comments(_vars.postId), ctx.previousComments);
      }
    },
  });
}

// ─── Delete Comment ───────��──────────────────────────────────────────────────

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; commentId: string }>({
    mutationFn: ({ commentId }) => interactionsService.deleteComment(commentId),

    onMutate: async ({ postId, commentId }) => {
      const queryKey = feedKeys.comments(postId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any[]>(queryKey);

      queryClient.setQueryData<any[]>(queryKey, (old) =>
        Array.isArray(old) ? old.filter((c) => c.id !== commentId) : old,
      );

      queryClient.setQueriesData<any>({ queryKey: feedKeys.all }, (data: any) => {
        if (!data?.pages) return data;
        return {
          ...data,
          pages: data.pages.map((page: PostRead[]) =>
            page.map((p) =>
              p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p,
            ),
          ),
        };
      });

      return { previous };
    },

    onError: (_err, { postId }, context) => {
      const ctx = context as { previous?: any[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(feedKeys.comments(postId), ctx.previous);
      }
    },

    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) });
    },
  });
}

// ���── Report Post ──────────────────────────────────────────────────────────────

export function useReportPostMutation() {
  return useMutation({
    mutationFn: ({
      postId,
      reason,
      additional_context,
    }: {
      postId: string;
      reason: "spam" | "nudity" | "violence" | "misinformation" | "other";
      additional_context?: string;
    }) => postsService.reportPost(postId, { reason, additional_context }),
  });
}

// ─── Batch Log Views ──────────────────────────────────────────────────────────

export function useBatchLogViewsMutation() {
  return useMutation({
    mutationFn: (postIds: string[]) => postsService.batchLogViews(postIds),
  });
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────
// Optimistic update: immediately reflect in the following query cache so the
// social feed Follow button updates without waiting for a refetch.

export function useFollowMutation() {
  const queryClient = useQueryClient();
  const currentUserId = CURRENT_USER_ID;

  return useMutation<void, Error, { userId: string; isFollowing: boolean }>({
    mutationFn: async ({ userId, isFollowing }) => {
      if (isFollowing) {
        await relationshipsService.unfollowUser(userId);
      } else {
        await relationshipsService.followUser(userId);
      }
    },

    onMutate: async ({ userId, isFollowing }) => {
      if (!currentUserId) return;

      const queryKey = relationshipKeys.following(currentUserId);
      await queryClient.cancelQueries({ queryKey });

      const previousFollowing =
        queryClient.getQueryData<FollowRead[]>(queryKey);

      // Optimistically add or remove from the following list
      queryClient.setQueryData<FollowRead[]>(queryKey, (old = []) => {
        if (isFollowing) {
          // Unfollow — remove from list
          return old.filter((f) => f.following_id !== userId);
        }
        // Follow — append to list
        return [
          ...old,
          {
            follower_id: currentUserId,
            following_id: userId,
            created_at: new Date().toISOString(),
          },
        ];
      });

      return { previousFollowing };
    },

    onError: (_err, _vars, context) => {
      const ctx = context as { previousFollowing?: FollowRead[] } | undefined;
      if (ctx?.previousFollowing !== undefined && currentUserId) {
        queryClient.setQueryData(
          relationshipKeys.following(currentUserId),
          ctx.previousFollowing,
        );
      }
    },

    onSettled: () => {
      if (!currentUserId) return;
      // Re-sync both the following list and the counts badge
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.following(currentUserId),
      });
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.stats(currentUserId),
      });
    },
  });
}
