import { SocialHeader } from "@/components";
import { CommentsSheet } from "@/components/social/CommentsSheet";
import { PostCard, PostCardSkeleton } from "@/components/social/PostCard";
import { PostOptionsSheet } from "@/components/social/PostOptionsSheet";
import { ReelsOverlay } from "@/components/social/ReelsOverlay";
import { UploadProgressCard } from "@/components/social/UploadProgressCard";
import { Fonts } from "@/constants/theme";
import {
    useBatchLogViewsMutation,
    useFollowMutation,
    useLikePostMutation,
} from "@/hooks/mutations/use-feed-mutations";
import {
    useBookmarkMutation,
    useBookmarks,
    useRemoveBookmarkMutation,
} from "@/hooks/queries/use-bookmarks";
import { feedKeys, useGeospatialFeed, useMainFeed } from "@/hooks/queries/use-feed";
import { useQueryClient } from "@tanstack/react-query";
import { useUserFollowing } from "@/hooks/queries/use-relationships";
import { useFeedVideoPlayer } from "@/hooks/use-feed-video-player";
import { useAuthorProfiles } from "@/hooks/queries/use-author-profiles";
import type { MainFeedParams, PostRead } from "@/scripts/services/social/types";
import { useUploadStore } from "@/stores/upload.store";
import { useVideoStore } from "@/stores/video.store";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";

import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import { FlashList, type FlashListRef, type ViewToken } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Dev / Default Location ───────────────────────────────────────────────────
// TODO: replace with expo-location getCurrentPositionAsync() when ready
// Temporary: the backend currently ignores the `skip` query parameter and
// returns the same posts on every page, so offset pagination can't fetch
// beyond the first page. Asking for a bigger limit up front pulls the full
// feed (~21 posts today) in one request. Drop this back to PAGE_SIZE once
// the server honors `skip` correctly.
const DEV_LOCATION: MainFeedParams = {
  latitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT ?? "6.5244"), // Lagos, Nigeria
  longitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG ?? "3.3792"),
  radius_km: 20,
  limit: 50,
};

// CURRENT_USER_ID is now read from the auth store inside the component
// so it reflects the logged-in user rather than a hardcoded env var.

// Segregates FlashList recycler pools so a video cell never recycles to an
// image cell (and vice versa). Without this, FlashList would reuse the same
// mounted component for different media types, which thrashes the native
// Video surface every scroll.
function getPostType(item: PostRead): string {
  if (
    item.media_type === "video" ||
    item.media_type === "video_upload" ||
    item.media_url?.includes(".m3u8")
  ) {
    return "video";
  }
  if (item.media_type === "carousel" && (item.media_urls?.length ?? 0) > 1) {
    return "carousel";
  }
  return "image";
}

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
  const setActiveVideoId = useVideoStore((s) => s.setActiveVideoId);
  const setVisiblePostIds = useVideoStore((s) => s.setVisiblePostIds);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Invalidate the main feed every time this tab comes into focus so posts
  // from other accounts appear without needing a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    }, [queryClient]),
  );

  // Mirrors the last value passed to setActiveVideoId so we can restore it
  // when the screen comes back into focus.
  const lastActiveVideoIdRef = useRef<string | null>(null);

  // Pause feed video when reels overlay opens, resume when it closes.
  useEffect(() => {
    if (reelsPost) {
      setActiveVideoId(null);
    } else if (lastActiveVideoIdRef.current) {
      setActiveVideoId(lastActiveVideoIdRef.current);
    }
  }, [reelsPost, setActiveVideoId]);

  // Pause on blur (navigate to another tab/screen), resume on focus.
  useFocusEffect(
    useCallback(() => {
      if (!reelsPost && lastActiveVideoIdRef.current) {
        setActiveVideoId(lastActiveVideoIdRef.current);
      }
      return () => {
        setActiveVideoId(null);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setActiveVideoId]),
  );

  // ─── Relationship status ───────────────────────────────────────────────────
  // Load who the current user already follows so Follow buttons initialise
  // correctly on every mount, not just after an in-session toggle.
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const { data: followingList = [] } = useUserFollowing(currentUserId);
  const followingIds = useMemo(
    () => new Set(followingList.map((f) => f.following_id)),
    [followingList],
  );

  // ─── View tracking ─────────────────────────────────────────────────────────
  // Accumulate viewed IDs as user scrolls, flush to API at 50 or on unmount
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const visibleIdsRef = useRef<Set<string>>(new Set());
  const { mutate: batchLogViews } = useBatchLogViewsMutation();

  useEffect(() => {
    const viewedIds = viewedIdsRef.current;
    return () => {
      if (viewedIds.size > 0) {
        batchLogViews(Array.from(viewedIds));
        viewedIds.clear();
      }
    };
  }, [batchLogViews]);

  // 60% threshold — drives visible/active state (playback)
  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
      changed = [],
    }: {
      viewableItems: ViewToken<PostRead>[];
      changed?: ViewToken<PostRead>[];
    }) => {
      let didVisibilityChange = false;
      let firstVideoId: string | null = null;

      changed.forEach(({ item, isViewable }) => {
        const post = item as PostRead;
        const id = post?.id;
        if (!id) return;

        if (isViewable) {
          if (!visibleIdsRef.current.has(id)) {
            visibleIdsRef.current.add(id);
            didVisibilityChange = true;
          }
        } else if (visibleIdsRef.current.delete(id)) {
          didVisibilityChange = true;
        }
      });

      viewableItems.forEach(({ item }) => {
        const post = item as PostRead;
        const id = post?.id;
        if (id) {
          viewedIdsRef.current.add(id);
          if (
            !firstVideoId &&
            (post.media_type === "video" ||
              post.media_type === "video_upload" ||
              post.media_url?.includes(".m3u8"))
          ) {
            firstVideoId = id;
          }
        }
      });

      if (didVisibilityChange) {
        setVisiblePostIds(Array.from(visibleIdsRef.current));
      }
      lastActiveVideoIdRef.current = firstVideoId;
      setActiveVideoId(firstVideoId);

      if (viewedIdsRef.current.size >= 50) {
        batchLogViews(Array.from(viewedIdsRef.current));
        viewedIdsRef.current.clear();
      }
    },
    [batchLogViews, setActiveVideoId, setVisiblePostIds],
  );

  // Stable ref wrapper so viewabilityConfigCallbackPairs never changes identity.
  // The 5% preload pair was removed — PostCard no longer mounts video on the
  // preload threshold, so firing that callback every scroll tick just churned
  // Zustand state for nothing.
  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  useEffect(() => {
    onViewableItemsChangedRef.current = onViewableItemsChanged;
  });

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 60 },
      onViewableItemsChanged: (
        info: Parameters<typeof onViewableItemsChanged>[0],
      ) => onViewableItemsChangedRef.current(info),
    },
  ]).current;

  // ─── Feed queries ──────────────────────────────────────────────────────────
  // Only fetch the feed for the active tab. The other query stays cached in
  // the background and rehydrates instantly when the user switches tabs.
  const mainFeedQuery = useMainFeed(DEV_LOCATION);
  const geoFeedQuery = useGeospatialFeed(
    { ...DEV_LOCATION, radius_km: 5 },
    activeTab === "neighborhoods",
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = activeTab === "neighborhoods" ? geoFeedQuery : mainFeedQuery;

  // Trust the server's ranking order — page 1, then page 2 appended. We used
  // to re-sort by created_at here, which interleaved page 2 posts back into
  // page 1 when they arrived and made FlashList shuffle visible cards.
  //
  // Dedup by id. Offset-based pagination (skip/limit) can return the same
  // post on adjacent pages when new items are inserted at the head mid-scroll
  // — without dedup FlashList gets duplicate keys, warns in console, and
  // recycled cells collide, which shows up as "feels like a loop" scrolling.
  const posts = useMemo(() => {
    const flat = data?.pages.flat() ?? [];
    const seen = new Set<string>();
    const out: PostRead[] = [];
    for (const p of flat) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [data]);

  // ─── Author profiles (first + last name for display) ─────────────────────
  const authorIds = useMemo(
    () => [...new Set(posts.map((p) => p.author_id))],
    [posts],
  );
  const authorProfiles = useAuthorProfiles(authorIds);

  // ─── Hoisted video player ──────────────────────────────────────────────────
  // One player drives the whole feed. The currently-active post's media_url
  // is loaded into it; every other card just shows a thumbnail. That keeps
  // exactly one native decoder alive no matter how many video cards are on
  // screen — which is what Instagram/TikTok do and the reason the earlier
  // flinching stopped when we moved to an active-only pattern.
  const activeVideoId = useVideoStore((s) => s.activeVideoId);
  const activePost = useMemo(
    () => (activeVideoId ? posts.find((p) => p.id === activeVideoId) : null),
    [activeVideoId, posts],
  );
  const videoPlayer = useFeedVideoPlayer(
    activeVideoId,
    activePost?.media_url ?? null,
  );

  // Global mute — matches Instagram behaviour (tapping mute on one video
  // persists across scrolls instead of resetting per card).
  const [isMuted, setIsMuted] = useState(true);
  useEffect(() => {
    videoPlayer.muted = isMuted;
  }, [videoPlayer, isMuted]);
  const handleToggleMute = useCallback(() => setIsMuted((m) => !m), []);

  // ─── Pre-generate thumbnails ───────────────────────────────────────────────
  // Start as soon as feed data arrives — NOT when the user scrolls to a post.
  // By the time they reach a video, the thumbnail is already in the store.
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const thumbnailsRef = useRef(useVideoStore.getState().thumbnails);

  useEffect(() => {
    // Keep ref current without adding store slice to deps (avoids re-running on each thumbnail write)
    thumbnailsRef.current = useVideoStore.getState().thumbnails;
  });

  useEffect(() => {
    const videoPosts = posts.filter(
      (p) =>
        (p.media_type === "video" || p.media_url?.includes(".m3u8")) &&
        !thumbnailsRef.current[p.id],
    );
    if (!videoPosts.length) return;

    let cancelled = false;
    // Generate a thumbnail and save it to the store.
    const gen = async (post: (typeof videoPosts)[0]) => {
      if (cancelled || thumbnailsRef.current[post.id]) return;
      const uri = await generateVideoThumbnail(post.media_url);
      if (uri && !cancelled) {
        setThumbnail(post.id, uri);
        thumbnailsRef.current = { ...thumbnailsRef.current, [post.id]: uri };
      }
    };

    const run = async () => {
      // First 5 posts are likely on screen — fire them all at once.
      const priority = videoPosts.slice(0, 5);
      const rest = videoPosts.slice(5);
      await Promise.allSettled(priority.map(gen));

      // Remaining posts: batches of 5 so the device isn't overwhelmed.
      const CONCURRENCY = 5;
      for (let i = 0; i < rest.length; i += CONCURRENCY) {
        if (cancelled) break;
        await Promise.allSettled(rest.slice(i, i + CONCURRENCY).map(gen));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [posts, setThumbnail]);

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

  // ─── Transcoding Polling ────────────────────────────────────────────────
  // If we just uploaded a video, poll until it's fully active in the feed.
  const setUploadProgress = useUploadStore((s) => s.setProgress);
  const setUploadStatus = useUploadStore((s) => s.setStatus);

  useEffect(() => {
    if (uploadStatus !== "processing") return;

    let refreshCount = 0;
    const MAX_REFRESHES = 22; // ~3 minutes max
    const POLL_INTERVAL = 8_000; // 8 seconds

    // Animate progress from 90% → 98% gradually
    const progressInterval = setInterval(() => {
      // In mobile we just use the store
      const current = useUploadStore.getState().progress;
      if (current < 98) setUploadProgress(current + 0.15);
    }, 1000);

    const performRefresh = async () => {
      refreshCount++;
      try {
        await refetch();
        // Check if there are NO more "video_upload" posts (they become "video" or "image" once done)
        // or if they have a .m3u8 media_url.
        setTimeout(() => {
          const stillProcessing = posts.some(
            (p) =>
              p.media_type === "video_upload" &&
              !p.media_url?.includes(".m3u8"),
          );

          if (!stillProcessing && posts.length > 0) {
            clearInterval(progressInterval);
            clearInterval(refreshTimer);
            setUploadProgress(100);
            setUploadStatus("done");
            // Smoothly glide back to the top once the new post is ready
            setTimeout(() => {
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
          }

          if (refreshCount >= MAX_REFRESHES) {
            clearInterval(progressInterval);
            clearInterval(refreshTimer);
            setUploadProgress(100);
            setUploadStatus("done");
          }
        }, 500);
      } catch (err) {
        // Refresh failed silently
      }
    };

    const refreshTimer = setInterval(performRefresh, POLL_INTERVAL);
    performRefresh();

    return () => {
      clearInterval(progressInterval);
      clearInterval(refreshTimer);
    };
  }, [uploadStatus, refetch, posts, setUploadProgress, setUploadStatus]);
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
  const listRef = useRef<FlashListRef<PostRead>>(null);

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

  const handleAuthorPress = useCallback(
    (authorId: string) => {
      router.push({
        pathname: "/profile/[userId]",
        params: { userId: authorId },
      });
    },
    [router],
  );

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
    ({ item }: { item: PostRead }) => {
      const profile = authorProfiles.get(item.author_id);
      const authorName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username
        : null;
      return (
        <PostCard
          post={item}
          onLike={handleLike}
          onFollow={handleFollow}
          onComment={handleComment}
          onMore={handleMore}
          onVideoPress={handleVideoPress}
          onBookmark={handleBookmark}
          onAuthorPress={handleAuthorPress}
          isFollowing={followingIds.has(item.author_id)}
          isBookmarked={bookmarkedIds.has(item.id)}
          likePending={likePending}
          currentUserId={currentUserId || ""}
          videoPlayer={videoPlayer}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          authorName={authorName}
        />
      );
    },
    [
      handleLike,
      handleFollow,
      handleComment,
      handleMore,
      handleVideoPress,
      handleBookmark,
      handleAuthorPress,
      followingIds,
      bookmarkedIds,
      likePending,
      currentUserId,
      videoPlayer,
      isMuted,
      handleToggleMute,
      authorProfiles,
    ],
  );

  // ─── Empty / Loading / Error ───────────────────────────────────────────────
  const ListEmptyComponent = () => {
    if (isLoading) {
      return <FeedSkeleton />;
    }
    if (isError) {
      const axiosError = error as {
        code?: string;
        response?: { status: number; data?: { detail?: string } };
      } | null;
      const isTimeout =
        axiosError?.code === "ECONNABORTED" ||
        (error as Error)?.message?.toLowerCase().includes("timeout");
      const status = axiosError?.response?.status;

      return (
        <View style={styles.centered}>
          <Ionicons
            name={isTimeout ? "time-outline" : "cloud-offline-outline"}
            size={48}
            color="#666666"
          />
          <Text style={styles.emptyText}>
            {isTimeout ? "Server taking too long" : "Could not load feed"}
          </Text>
          <Text style={styles.errorDetail}>
            {isTimeout
              ? "The feed server may be starting up. Please retry in a moment."
              : status
                ? `Error ${status} — check your connection and try again.`
                : "Check your connection and try again."}
          </Text>
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
      {/*
        FlashList recycles mounted cells instead of unmounting/remounting.
        For a video-heavy feed this means the same native Video surface is
        reused as the user scrolls, instead of rebuilding one per post.
        getItemType segregates recycler pools so a video card never has
        its Video torn down to become an image card.
      */}
      <FlashList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        getItemType={getPostType}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        onRefresh={refetch}
        refreshing={isLoading && posts.length > 0}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={isFetchingNextPage ? <PostCardSkeleton /> : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.feedContent
        }
        // Pre-render ~2 cards ahead of the viewport. 250 (the old value)
        // was under half a card, so fast scrolls outpaced the warm-up and
        // landed on blank cells. FlashList 2.x auto-measures item sizes,
        // so no estimatedItemSize is needed.
        drawDistance={1200}
        // Kick off the next page when the user is ~1.5 screens from the
        // end — the 10-post batch has time to arrive before they hit it.
        onEndReachedThreshold={1.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      />

      {/* Upload Progress Card - Positioned in layout flow above tab bar */}
      {uploadStatus !== "idle" && <UploadProgressCard />}

      {commentsPostId !== null && (
        <CommentsSheet
          postId={commentsPostId}
          currentUserId={currentUserId || ""}
          onClose={() => setCommentsPostId(null)}
        />
      )}

      {optionsPost !== null && (
        <PostOptionsSheet
          post={optionsPost}
          currentUserId={currentUserId || ""}
          onClose={() => setOptionsPost(null)}
        />
      )}

      {/* Reels overlay — renders on top of feed, no navigation, no reload */}
      {reelsPost && (
        <ReelsOverlay
          initialPost={reelsPost}
          feedVideoPosts={feedVideoPosts}
          currentUserId={currentUserId || ""}
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
