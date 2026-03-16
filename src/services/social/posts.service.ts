import { api } from "@/src/services/api";
import type {
    BatchViewRequest,
    GeospatialFeedParams,
    MainFeedParams,
    PostCreate,
    PostRead,
    ReportRequest,
    VideoFeedParams,
} from "./types";

/**
 * POST /api/v1/posts/
 * POST /api/v1/posts/feed
 * GET  /api/v1/posts/feed/main
 * GET  /api/v1/posts/{post_id}
 * DELETE /api/v1/posts/{post_id}
 * POST /api/v1/posts/{post_id}/view
 * POST /api/v1/posts/views/batch
 * POST /api/v1/posts/{post_id}/report
 */
export const postsService = {
  /**
   * GET /api/v1/posts/feed/main
   * Personalised hybrid: followed posts + nearby discovery posts.
   * Primary feed for the social tab.
   */
  getMainFeed: async (params: MainFeedParams): Promise<PostRead[]> => {
    const { data } = await api.get<PostRead[]>("/api/v1/posts/feed/main", {
      params,
    });
    return data;
  },

  /**
   * GET /api/v1/posts/feed
   * Pure geospatial feed — posts within radius_km of coords.
   * Redis-cached per location bucket for 60s.
   */
  getGeospatialFeed: async (
    params: GeospatialFeedParams,
  ): Promise<PostRead[]> => {
    const { data } = await api.get<PostRead[]>("/api/v1/posts/feed", {
      params,
    });
    return data;
  },

  /**
   * GET /api/v1/posts/feed/video
   * TikTok-style ranked video feed. Returns only fully-transcoded video posts.
   * Ranked by engagement (likes + comments + views).
   * With lat/lon: restricts to radius_km. Without: global top videos.
   */
  getVideoFeed: async (params: VideoFeedParams = {}): Promise<PostRead[]> => {
    const { data } = await api.get<PostRead[]>("/api/v1/posts/feed/video", {
      params,
    });
    return data;
  },

  /** GET /api/v1/posts/{post_id} */
  getPost: async (postId: string): Promise<PostRead> => {
    const { data } = await api.get<PostRead>(`/api/v1/posts/${postId}`);
    return data;
  },

  /** POST /api/v1/posts/ */
  createPost: async (payload: PostCreate): Promise<PostRead> => {
    const { data } = await api.post<PostRead>("/api/v1/posts/", payload);
    return data;
  },

  /** DELETE /api/v1/posts/{post_id} — 204 no content */
  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/api/v1/posts/${postId}`);
  },

  /** POST /api/v1/posts/{post_id}/view */
  logView: async (postId: string): Promise<void> => {
    await api.post(`/api/v1/posts/${postId}/view`);
  },

  /**
   * POST /api/v1/posts/views/batch
   * Send up to 50 post IDs — call on scroll session end or 2s visibility.
   * Returns campaign_ids for sponsored posts (follow up with ads.logImpression).
   */
  batchLogViews: async (postIds: string[]): Promise<void> => {
    const payload: BatchViewRequest = { post_ids: postIds };
    await api.post("/api/v1/posts/views/batch", payload);
  },

  /**
   * POST /api/v1/posts/{post_id}/report
   * reason: 'spam' | 'nudity' | 'violence' | 'misinformation' | 'other'
   * Each user can report a post once.
   */
  reportPost: async (postId: string, report: ReportRequest): Promise<void> => {
    await api.post(`/api/v1/posts/${postId}/report`, report);
  },
};
