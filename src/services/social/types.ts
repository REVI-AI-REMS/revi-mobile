// ─── Shared Types ─────────────────────────────────────────────────────────────
// Single source of truth for all social service schemas.
// Mirrors the OpenAPI spec at /api/v1/openapi.json exactly.

// ─── Posts ────────────────────────────────────────────────────────────────────

export type MediaType = "image" | "carousel" | "video" | "video_upload";

export interface PostRead {
  id: string;
  author_id: string;
  caption: string | null;
  media_url: string;
  media_urls: string[] | null; // carousel only
  media_type: MediaType;
  location: string; // raw PostGIS WKB (internal)
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean; // false while video is transcoding
  is_sponsored?: boolean;
  campaign_id?: string | null; // present when is_sponsored=true
  is_liked?: boolean; // client-side, set after like mutations
}

export interface PostCreate {
  caption?: string | null;
  media_url: string;
  media_urls?: string[] | null;
  media_type?: MediaType; // default: 'image'
  latitude: number;
  longitude: number;
  is_sponsored?: boolean;
}

export interface GeospatialFeedParams {
  latitude: number;
  longitude: number;
  radius_km?: number; // default 5.0
  limit?: number; // 1-100, default 20
}

export interface MainFeedParams {
  latitude: number;
  longitude: number;
  radius_km?: number; // default 20.0
  limit?: number;
}

/** GET /api/v1/posts/feed/video — all params optional */
export interface VideoFeedParams {
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number; // default 50 km
  skip?: number; // default 0
  limit?: number; // 1-100, default 20
}

export interface BatchViewRequest {
  post_ids: string[]; // max 50
}

export interface ReportRequest {
  reason: "spam" | "nudity" | "violence" | "misinformation" | "other";
  additional_context?: string | null;
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export interface CommentCreate {
  content: string;
  post_id: string;
  parent_id?: string | null;
}

export interface CommentRead {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface LikeCreate {
  post_id: string;
}

export interface LikeRead {
  post_id: string;
  user_id: string;
  created_at: string;
}

// ─── Media ────────────────────────────────────────────────────────────────────

export interface UploadResponse {
  upload_url: string; // SAS URL — PUT directly to Azure
  blob_url: string; // use as media_url in PostCreate
  filename: string;
  requires_transcoding: boolean; // true for video — HLS ready in ~15-30s
}

// ─── Relationships ────────────────────────────────────────────────────────────

export interface FollowRead {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowerStats {
  follower_count: number;
  following_count: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationRead {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

export type CampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface AdCampaign {
  id: string;
  advertiser_id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  cpm: number;
  target_latitude: number | null;
  target_longitude: number | null;
  target_radius_km: number | null;
  start_date: string;
  end_date: string | null;
  status: CampaignStatus;
  post_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdCampaignCreate {
  name: string;
  post_id: string;
  total_budget: number;
  cpm: number;
  target_latitude?: number;
  target_longitude?: number;
  target_radius_km?: number;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

export interface UserSync {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
}
