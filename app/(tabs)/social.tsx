import { SocialHeader } from "@/src/components";
import { CommentsSheet } from "@/src/components/social/comments-sheet";
import {
  PostCard,
  PostCardSkeleton
} from "@/src/components/social/post-card";
import { PostOptionsSheet } from "@/src/components/social/post-options-sheet";
import { Fonts } from "@/src/constants/theme";
import {
  useBatchLogViewsMutation,
  useFollowMutation,
  useLikePostMutation
} from "@/src/hooks/mutations/use-feed-mutations";
import {
  useGeospatialFeed,
  useMainFeed
} from "@/src/hooks/queries/use-feed";
import { useUserFollowing } from "@/src/hooks/queries/use-relationships";
import type { MainFeedParams, PostRead } from "@/src/services/social/types";
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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach(({ item }) => {
        if ((item as PostRead)?.id) {
          viewedIdsRef.current.add((item as PostRead).id);
        }
      });
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
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = activeTab === "neighborhoods" ? geoFeedQuery : mainFeedQuery;

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: likePost, isPending: likePending } = useLikePostMutation();
  const { mutate: followUser } = useFollowMutation();

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

  const handleVideoPress = useCallback(
    (post: PostRead) => {
      router.push(`/reels?postId=${post.id}`);
    },
    [router],
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
        isFollowing={followingIds.has(item.author_id)}
        likePending={likePending}
        currentUserId={currentUserId}
      />
    ),
    [
      handleLike,
      handleFollow,
      handleComment,
      handleMore,
      handleVideoPress,
      followingIds,
      likePending,
      currentUserId,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
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
