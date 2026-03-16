import { interactionsService } from "@/src/services/social/interactions.service";
import { postsService } from "@/src/services/social/posts.service";
import type {
    MainFeedParams,
    PostRead,
    VideoFeedParams,
} from "@/src/services/social/types";
import { useQuery } from "@tanstack/react-query";

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
 * Personalised hybrid main feed.
 * The API returns a flat array (not paginated) — the server blends
 * followed posts + discovery posts in a single response.
 * Call again with a fresh timestamp to get a refreshed feed.
 *
 * Usage:
 *   const { data: posts = [], isLoading, refetch } = useMainFeed({ latitude, longitude });
 */
export function useMainFeed(params: MainFeedParams) {
  return useQuery({
    queryKey: feedKeys.mainFeed(params),
    queryFn: () => postsService.getMainFeed(params),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(params.latitude && params.longitude),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}

/**
 * Pure geospatial feed — posts within radius_km of coords.
 * Redis-cached on server for 60s per location bucket.
 *
 * Usage:
 *   const { data: posts = [] } = useGeospatialFeed({ latitude, longitude, radius_km: 5 });
 */
export function useGeospatialFeed(params: MainFeedParams) {
  return useQuery({
    queryKey: feedKeys.geospatialFeed(
      params.latitude,
      params.longitude,
      params.radius_km,
    ),
    queryFn: () => postsService.getGeospatialFeed(params),
    staleTime: 1000 * 60 * 1,
    enabled: Boolean(params.latitude && params.longitude),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
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
