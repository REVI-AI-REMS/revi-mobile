export { useColorScheme } from "./use-color-scheme";
export { useThemeColor } from "./use-theme-color";

// ─── Query Hooks ─────────────────────────────────────────────────────────────
export {
    feedKeys,
    useComments,
    useGeospatialFeed,
    useMainFeed,
    usePost,
    useVideoFeed
} from "./queries/use-feed";

export { bookmarkKeys, useBookmarks } from "./queries/use-bookmarks";
export { searchKeys, useSearch } from "./queries/use-search";
export {
    relationshipKeys,
    useUserFollowers,
    useUserFollowing,
    useUserStats,
} from "./queries/use-relationships";

// ─── Mutation Hooks ──────────────────────────────────────────────────────────
export {
    useForgotPasswordMutation,
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
} from "./mutations/use-auth";

export {
    useAddCommentMutation,
    useBatchLogViewsMutation,
    useCreatePostMutation,
    useDeletePostMutation,
    useFollowMutation,
    useLikePostMutation,
    useReportPostMutation
} from "./mutations/use-feed-mutations";

