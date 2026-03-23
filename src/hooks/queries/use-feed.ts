import { interactionsService } from "@/src/services/social/interactions.service";
import { postsService } from "@/src/services/social/posts.service";
import type {
    MainFeedParams,
    PostRead,
    VideoFeedParams,
} from "@/src/services/social/types";
import {
    keepPreviousData,
    useInfiniteQuery,
    useQuery,
} from "@tanstack/react-query";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10; // fetch 10 posts per page for fast first paint

// ─── Query Keys ─────────────────────────────────────────────────────────────
// Centralised as const so cache invalidation is type-safe everywhere

export const feedKeys = {
  all: ["feed"] as const,
  mainFeed: (params: MainFeedParams) =>
    [...feedKeys.all, "main", params] as const,
  geospatialFeed: (lat: number, lng: number, radius?: number) =>
    [...feedKeys.all, "geo", lat, lng, radius] as const,
  videoFeed: (params: VideoFeedParams) =>
    [...feedKeys.all, "video", params] as const,
  post: (postId: string) => [...feedKeys.all, "post", postId] as const,
  comments: (postId: string) => [...feedKeys.all, "comments", postId] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Personalised hybrid main feed with **infinite scroll**.
 * Fetches PAGE_SIZE posts per page. Call `fetchNextPage` when the user
 * scrolls near the bottom of the list.
 *
 * Usage:
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch }
 *     = useMainFeed({ latitude, longitude });
 *   const posts = data?.pages.flat() ?? [];
 */
export function useMainFeed(params: MainFeedParams) {
  return useInfiniteQuery<PostRead[]>({
    queryKey: feedKeys.mainFeed(params),
    queryFn: ({ pageParam = 0 }) =>
      postsService.getMainFeed({
        ...params,
        skip: pageParam as number,
        limit: params.limit ?? PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned fewer items than PAGE_SIZE, we've
      // reached the end of the feed — return undefined to signal "no more".
      const limit = params.limit ?? PAGE_SIZE;
      if (lastPage.length < limit) return undefined;
      // Otherwise the next offset = total items fetched so far
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(params.latitude && params.longitude),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    placeholderData: keepPreviousData,
  });
}

/**
 * Pure geospatial feed — posts within radius_km of coords.
 * Also paginated with infinite scroll.
 *
 * Usage:
 *   const { data, fetchNextPage, hasNextPage } = useGeospatialFeed(params);
 *   const posts = data?.pages.flat() ?? [];
 */
export function useGeospatialFeed(params: MainFeedParams) {
  return useInfiniteQuery<PostRead[]>({
    queryKey: feedKeys.geospatialFeed(
      params.latitude,
      params.longitude,
      params.radius_km,
    ),
    queryFn: ({ pageParam = 0 }) =>
      postsService.getGeospatialFeed({
        ...params,
        skip: pageParam as number,
        limit: params.limit ?? PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const limit = params.limit ?? PAGE_SIZE;
      if (lastPage.length < limit) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    staleTime: 1000 * 60 * 1,
    enabled: Boolean(params.latitude && params.longitude),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    placeholderData: keepPreviousData,
  });
}

/**
 * TikTok-style ranked video feed from GET /api/v1/posts/feed/video.
 * Returns only fully-transcoded video posts, ranked by engagement.
 * Use this in the reels screen instead of filtering the main feed.
 *
 * Usage:
 *   const { data: videos = [] } = useVideoFeed({ latitude: 6.52, longitude: 3.38 });
 */
export function useVideoFeed(params: VideoFeedParams = {}, options: any = {}) {
  return useQuery<PostRead[]>({
    queryKey: feedKeys.videoFeed(params),
    queryFn: () => postsService.getVideoFeed(params),
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    ...options,
  });
}

/**
 * Single post detail.
 *
 * Usage:
 *   const { data: post } = usePost(postId);
 */
export function usePost(postId: string) {
  return useQuery({
    queryKey: feedKeys.post(postId),
    queryFn: () => postsService.getPost(postId),
    enabled: Boolean(postId),
  });
}

/**
 * Comments for a post. Offset-based (skip/limit).
 *
 * Usage:
 *   const { data: comments = [] } = useComments(postId);
 */
export function useComments(postId: string, skip = 0, limit = 50) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: () => interactionsService.getComments(postId, skip, limit),
    enabled: Boolean(postId),
  });
}
