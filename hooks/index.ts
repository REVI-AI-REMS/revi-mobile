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
    useUserProfile,
} from "./queries/use-relationships";

// ─── Mutation Hooks ──────────────────────────────────────────────────────────
export {
    useConfirmEmailVerificationMutation,
    useConfirmPasswordResetMutation,
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
    useRequestEmailVerificationMutation,
    useRequestPasswordResetMutation,
    useVerifyPasswordResetOtpMutation,
} from "./mutations/use-auth";

export {
    useAddCommentMutation,
    useBatchLogViewsMutation,
    useCreatePostMutation,
    useDeleteCommentMutation,
    useDeletePostMutation,
    useFollowMutation,
    useLikePostMutation,
    useReportPostMutation
} from "./mutations/use-feed-mutations";

