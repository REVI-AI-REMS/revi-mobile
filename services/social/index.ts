// ─── Social Services Barrel ──────────────────────────────────────────────────
// Import from here — not from individual files directly.
//
// Usage:
//   import { postsService } from '@/services/social';
//   import type { PostRead } from '@/services/social';

export { adsService } from "./ads.service";
export { bookmarksService } from "./bookmarks.service";
export { interactionsService } from "./interactions.service";
export { internalService } from "./internal.service";
export { mediaService } from "./media.service";
export { notificationsService } from "./notifications.service";
export { postsService } from "./posts.service";
export { relationshipsService } from "./relationships.service";
export { searchService } from "./search.service";

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
    // Ads
    AdCampaign,
    AdCampaignCreate,
    BatchViewRequest,
    CampaignStatus,
    // Interactions
    CommentCreate,
    CommentRead,
    // Relationships
    FollowRead,
    FollowerStats,
    GeospatialFeedParams,
    LikeCreate,
    LikeRead,
    MainFeedParams,
    // Posts
    MediaType,
    // Notifications
    NotificationRead,
    PostCreate,
    PostRead,
    ReportRequest,
    // Media
    UploadResponse,
    // Internal
    UserSync,
    // Video feed
    VideoFeedParams
} from "./types";

