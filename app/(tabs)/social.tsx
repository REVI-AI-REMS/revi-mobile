import { SocialHeader } from "@/src/components";
import { CommentsSheet } from "@/src/components/social/comments-sheet";
import { PostCard, PostCardSkeleton } from "@/src/components/social/post-card";
import { PostOptionsSheet } from "@/src/components/social/post-options-sheet";
import { ReelsOverlay } from "@/src/components/social/reels-overlay";
import { UploadProgressCard } from "@/src/components/social/upload-progress-card";
import { Fonts } from "@/src/constants/theme";
import {
  useBatchLogViewsMutation,
  useFollowMutation,
  useLikePostMutation,
} from "@/src/hooks/mutations/use-feed-mutations";
import {
  useBookmarkMutation,
  useBookmarks,
  useRemoveBookmarkMutation,
} from "@/src/hooks/queries/use-bookmarks";
import { useGeospatialFeed, useMainFeed } from "@/src/hooks/queries/use-feed";
import { useUserFollowing } from "@/src/hooks/queries/use-relationships";
import type { MainFeedParams, PostRead } from "@/src/services/social/types";
import { useUploadStore } from "@/src/store/upload.store";
import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";

// ─── Dev / Default Location ───────────────────────────────────────────────────
// TODO: replace with expo-location getCurrentPositionAsync() when ready
const DEV_LOCATION: MainFeedParams = {
  latitude: 6.5244, // Lagos, Nigeria
  longitude: 3.3792,
  radius_km: 20,
  limit: 20,
};

function FeedSkeleton() {
  return (
    <>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = "trending" | "featured" | "neighborhoods";

const TABS: { key: Tab; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "featured", label: "Featured" },
  { key: "neighborhoods", label: "Nearby" },
];

export default function SocialsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [reelsPost, setReelsPost] = useState<PostRead | null>(null);
  const uploadStatus = useUploadStore((s) => s.status);
  const router = useRouter();

  // ─── Relationship status ───────────────────────────────────────────────────
  // Load who the current user already follows so Follow buttons initialise
  // correctly on every mount, not just after an in-session toggle.
  const currentUserId = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";
  const { data: followingList = [] } = useUserFollowing(currentUserId);
  const followingIds = useMemo(
    () => new Set(followingList.map((f) => f.following_id)),
    [followingList],
  );

  // ─── View tracking ─────────────────────────────────────────────────────────
  // Accumulate viewed IDs as user scrolls, flush to API at 50 or on unmount
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const { mutate: batchLogViews } = useBatchLogViewsMutation();

  useEffect(() => {
    const viewedIds = viewedIdsRef.current;
    return () => {
      if (viewedIds.size > 0) {
        batchLogViews([...viewedIds]);
        viewedIds.clear();
      }
    };
  }, [batchLogViews]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisible = new Set<string>();
      viewableItems.forEach(({ item }) => {
        const id = (item as PostRead)?.id;
        if (id) {
          viewedIdsRef.current.add(id);
          newVisible.add(id);
        }
      });
      setVisiblePostIds(newVisible);
      if (viewedIdsRef.current.size >= 50) {
        batchLogViews([...viewedIdsRef.current]);
        viewedIdsRef.current.clear();
      }
    },
    [batchLogViews],
  );

  // ─── Feed queries ──────────────────────────────────────────────────────────
  const mainFeedQuery = useMainFeed(DEV_LOCATION);
  const geoFeedQuery = useGeospatialFeed({ ...DEV_LOCATION, radius_km: 5 });

  const {
    data: rawPosts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = activeTab === "neighborhoods" ? geoFeedQuery : mainFeedQuery;

  // Sort posts by creation date (newest first)
  const posts = useMemo(() => {
    return [...rawPosts].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [rawPosts]);

  // Video posts from the already-loaded feed — passed straight to ReelsOverlay
  // so it NEVER makes a separate API call. Zero delay.
  const feedVideoPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.media_type === "video" ||
          p.media_type === "video_upload" ||
          p.media_url?.includes(".m3u8"),
      ),
    [posts],
  );

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: likePost, isPending: likePending } = useLikePostMutation();
  const { mutate: followUser } = useFollowMutation();

  // ─── Bookmarks ───────────────────────────────────────────────────────────
  // Seed the initial bookmarked-IDs Set from the server; optimistically toggle
  // on press so the icon updates immediately without waiting for a refetch.
  const { data: bookmarkedList = [] } = useBookmarks();
  const [optimisticBookmarks, setOptimisticBookmarks] = useState<Set<string>>(
    new Set(),
  );
  const { mutate: addBookmark } = useBookmarkMutation();
  const { mutate: removeBookmark } = useRemoveBookmarkMutation();

  // Derive bookmarked IDs from server data, merge with optimistic updates
  const bookmarkedIds = useMemo(() => {
    const serverIds = new Set(bookmarkedList.map((p) => p.id));
    // Merge optimistic updates
    optimisticBookmarks.forEach((id) => {
      if (serverIds.has(id)) {
        serverIds.delete(id); // Optimistically removed
      } else {
        serverIds.add(id); // Optimistically added
      }
    });
    return serverIds;
  }, [bookmarkedList, optimisticBookmarks]);

  // ─── Comments sheet ────────────────────────────────────────────────────────
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  // ─── Post options sheet ───────────────────────────────────────────────────
  const [optionsPost, setOptionsPost] = useState<PostRead | null>(null);

  const handleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      likePost({ postId, isLiked });
    },
    [likePost],
  );

  const handleFollow = useCallback(
    (authorId: string, isFollowing: boolean) => {
      followUser({ userId: authorId, isFollowing });
    },
    [followUser],
  );

  const handleComment = useCallback((postId: string) => {
    setCommentsPostId(postId);
  }, []);

  const handleMore = useCallback((post: PostRead) => {
    setOptionsPost(post);
  }, []);

  const handleVideoPress = useCallback((post: PostRead) => {
    setReelsPost(post);
  }, []);

  const handleBookmark = useCallback(
    (postId: string, isBookmarked: boolean) => {
      // Optimistic toggle - track which IDs we're toggling
      setOptimisticBookmarks((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId); // Remove from optimistic if already there (undo toggle)
        } else {
          next.add(postId); // Add to optimistic (new toggle)
        }
        return next;
      });

      if (isBookmarked) {
        removeBookmark(postId);
      } else {
        addBookmark(postId);
      }
    },
    [addBookmark, removeBookmark],
  );

  const renderPost = useCallback(
    ({ item }: { item: PostRead }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onFollow={handleFollow}
        onComment={handleComment}
        onMore={handleMore}
        onVideoPress={handleVideoPress}
        onBookmark={handleBookmark}
        isFollowing={followingIds.has(item.author_id)}
        isBookmarked={bookmarkedIds.has(item.id)}
        likePending={likePending}
        currentUserId={currentUserId}
        isVisible={!reelsPost && visiblePostIds.has(item.id)}
      />
    ),
    [
      handleLike,
      handleFollow,
      handleComment,
      handleMore,
      handleVideoPress,
      handleBookmark,
      followingIds,
      bookmarkedIds,
      likePending,
      currentUserId,
      visiblePostIds,
      reelsPost,
    ],
  );

  // ─── Empty / Loading / Error ───────────────────────────────────────────────
  const ListEmptyComponent = () => {
    if (isLoading) {
      return <FeedSkeleton />;
    }
    if (isError) {
      // Pull the HTTP status and server message for easy debugging
      const axiosError = error as {
        response?: { status: number; data?: { detail?: string } };
      } | null;
      const status = axiosError?.response?.status;
      const detail =
        axiosError?.response?.data?.detail ??
        (error as Error)?.message ??
        "Unknown error";

      return (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#666666" />
          <Text style={styles.emptyText}>Failed to load feed</Text>
          {status ? (
            <Text style={styles.errorDetail}>
              {status} — {detail}
            </Text>
          ) : (
            <Text style={styles.errorDetail}>{detail}</Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Ionicons name="newspaper-outline" size={48} color="#666666" />
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SocialHeader
        onAddPress={() => router.push("/new-post")}
        onNotificationPress={() => router.push("/notification")}
      />

      <View style={styles.updateBanner} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.activeTabText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onRefresh={refetch}
        refreshing={isLoading && posts.length > 0}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.feedContent
        }
        onEndReachedThreshold={0.5}
      />

      {/* Upload Progress Card - Positioned in layout flow above tab bar */}
      {uploadStatus !== "idle" && <UploadProgressCard />}

      {/* Comments Sheet */}
      <CommentsSheet
        postId={commentsPostId}
        currentUserId={currentUserId}
        onClose={() => setCommentsPostId(null)}
      />

      {/* Post Options Sheet */}
      <PostOptionsSheet
        post={optionsPost}
        currentUserId={currentUserId}
        onClose={() => setOptionsPost(null)}
      />

      {/* Reels overlay — renders on top of feed, no navigation, no reload */}
      {reelsPost && (
        <ReelsOverlay
          initialPost={reelsPost}
          feedVideoPosts={feedVideoPosts}
          currentUserId={currentUserId}
          onClose={() => setReelsPost(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
    overflow: "visible",
  },
  updateBanner: {
    height: 8,
    backgroundColor: "#0F0F10",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  tab: {
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
  },
  feedContent: {
    paddingBottom: 20,
  },
  uploadCardOverlay: {
    zIndex: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  errorDetail: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#FF6B6B",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
