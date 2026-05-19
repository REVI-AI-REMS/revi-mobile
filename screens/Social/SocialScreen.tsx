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
import { useVideoPlayer } from "expo-video";
import { useAuthorProfiles } from "@/hooks/queries/use-author-profiles";
import type { MainFeedParams, PostRead } from "@/scripts/services/social/types";
import { useUploadStore } from "@/stores/upload.store";
import { useVideoStore } from "@/stores/video.store";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";


import { socialTabPressEmitter } from "@/utils/social-tab-emitter";
import { FlashList, type FlashListRef, type ViewToken } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

  // Invalidate only the active feed queries on focus — NOT feedKeys.all.
  // Skip the very first mount so the cached data renders instantly without
  // a network round-trip that freezes the UI.
  const hasMountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return; // first mount — let react-query serve from cache
      }
      queryClient.invalidateQueries({ queryKey: feedKeys.mainFeed(DEV_LOCATION) });
      queryClient.invalidateQueries({
        queryKey: feedKeys.geospatialFeed(
          DEV_LOCATION.latitude,
          DEV_LOCATION.longitude,
          5,
        ),
      });
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
      // Keep the last-active video ID unless a new video scrolled into view.
      // Setting null here would tear down the VideoView and show a dark flash
      // when the user scrolls through image posts between two video posts,
      // or during the 50/50 split 'dead zone' where no video is 60% visible.
      if (firstVideoId) {
        lastActiveVideoIdRef.current = firstVideoId;
        setActiveVideoId(firstVideoId);
      } else if (viewableItems.length > 0) {
        // If there are viewable items but none are videos (i.e. an Image post),
        // we must explicitly nullify the active ID so the previous video pauses.
        setActiveVideoId(null);
      }
      // If viewableItems is empty, we are in a 'dead zone' mid-scroll. 
      // Do nothing, letting the video continue seamlessly until the next item comes into view.

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
    isRefetching,
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
  // Stable ref so renderPost reads the latest profiles on every render call
  // without adding the volatile Map to useCallback deps (which would force
  // FlashList to re-render all visible cells on every profile fetch).
  const authorProfilesRef = useRef(authorProfiles);
  authorProfilesRef.current = authorProfiles;


  // ─── Video player (single) ──────────────────────────────────────────────────
  // One native player for the whole feed. Thumbnail always shows underneath
  // so there's never a black frame. When a video scrolls into view, we swap
  // the source; the thumbnail covers the gap until the video is ready.
  const activeVideoId = useVideoStore((s) => s.activeVideoId);
  const activePost = useMemo(
    () => (activeVideoId ? posts.find((p) => p.id === activeVideoId) : null),
    [activeVideoId, posts],
  );

  // Global mute state — matches Instagram behaviour (tapping one unmuted them all).
  const [isMuted, setIsMuted] = useState(true);
  const handleToggleMute = useCallback(() => setIsMuted((m) => !m), []);

  // ─── Player Windowing System ───────────────────────────────────────────────
  // We compute a sliding window of AVPlayers (Previous, Current, Next).
  // This allows the old video to perfectly pause on its exact last frame when 
  // you scroll, without flashing black (which happens if a single player swaps sources).
  useEffect(() => {
    if (!activeVideoId) {
      // Do not clear the window when activeVideoId is null (e.g. when viewing an image).
      // This keeps the nearest players mounted so they don't black-flash when scrolled back into view.
      return;
    }

    const idx = posts.findIndex((p) => p.id === activeVideoId);
    if (idx === -1) return;

    const windowIds: string[] = [];
    
    // Previous video
    for (let i = idx - 1; i >= 0; i--) {
      const p = posts[i];
      if (p.media_type === "video" || p.media_type === "video_upload" || p.media_url?.includes(".m3u8")) {
        windowIds.push(p.id);
        break;
      }
    }
    
    // Current video
    windowIds.push(posts[idx].id);
    
    // Next video
    for (let i = idx + 1; i < posts.length; i++) {
      const p = posts[i];
      if (p.media_type === "video" || p.media_type === "video_upload" || p.media_url?.includes(".m3u8")) {
        windowIds.push(p.id);
        break;
      }
    }

    useVideoStore.getState().setActiveWindowIds(windowIds);
  }, [activeVideoId, posts]);



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

    // ── Diagnostic: log thumbnail_url status for all video posts ──
    const allVideoPosts = posts.filter(
      (p) => p.media_type === "video" || p.media_url?.includes(".m3u8"),
    );
    console.log("[Feed] Video posts thumbnail status:");
    allVideoPosts.forEach((p) => {
      console.log(`  [${p.id.slice(0, 8)}] thumbnail_url: ${p.thumbnail_url ?? "NULL"} | cached: ${!!thumbnailsRef.current[p.id]}`);
    });

    if (!videoPosts.length) return;

    let cancelled = false;
    const gen = async (post: (typeof videoPosts)[0]) => {
      if (cancelled || thumbnailsRef.current[post.id]) return;

      // Fast path: post already has a thumbnail uploaded at creation time.
      if (post.thumbnail_url) {
        setThumbnail(post.id, post.thumbnail_url);
        thumbnailsRef.current = { ...thumbnailsRef.current, [post.id]: post.thumbnail_url };
        return;
      }

      // Slow path: HLS extraction natively on iOS fails for remote .m3u8 files.
      // We no longer attempt to extract thumbnails for legacy posts without `thumbnail_url`.
      // This prevents the JS thread and native bridge from being completely choked 
      // by failed FFmpeg extractions during feed scroll.
    };

    // Defer heavy thumbnail work until AFTER the initial render + layout has
    // painted. Without this, the JS thread is blocked for 2-3s generating
    // thumbnails while the user stares at a frozen skeleton.
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const run = async () => {
        const priority = videoPosts.slice(0, 3);
        const rest = videoPosts.slice(3);
        await Promise.allSettled(priority.map(gen));

        const CONCURRENCY = 3;
        for (let i = 0; i < rest.length; i += CONCURRENCY) {
          if (cancelled) break;
          await Promise.allSettled(rest.slice(i, i + CONCURRENCY).map(gen));
        }
      };
      run();
    });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [posts, setThumbnail]);

  // Stable ref so the transcoding poll always reads the freshest posts
  // without capturing a stale closure, and without adding `posts` to the
  // effect's deps (which caused the polling timer to restart on every refetch).
  const postsRef = useRef(posts);
  postsRef.current = posts;


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
      const current = useUploadStore.getState().progress;
      if (current < 98) setUploadProgress(current + 0.15);
    }, 1000);

    const performRefresh = async () => {
      refreshCount++;
      try {
        await refetch();
        // Read via ref so we always see the freshly-refetched posts, not the
        // stale closure snapshot. Previously this was reading `posts` which
        // was captured at effect-creation time, so the check always evaluated
        // against the pre-refetch array and never detected the transition.
        setTimeout(() => {
          const currentPosts = postsRef.current;
          const stillProcessing = currentPosts.some(
            (p) =>
              p.media_type === "video_upload" &&
              !p.media_url?.includes(".m3u8"),
          );

          if (!stillProcessing && currentPosts.length > 0) {
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
      } catch {
        // Refresh failed silently
      }
    };

    const refreshTimer = setInterval(performRefresh, POLL_INTERVAL);
    performRefresh();

    return () => {
      clearInterval(progressInterval);
      clearInterval(refreshTimer);
    };
    // `posts` intentionally omitted — reads via postsRef so the polling timer
    // is not restarted every time a refetch updates the posts array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadStatus, refetch, setUploadProgress, setUploadStatus]);
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

  // ─── Home tab press → scroll to top ─────────────────────────────────────
  // The tab bar emits socialTabPressEmitter when the Home icon is tapped
  // while already on this screen. Scroll the feed to the top.
  useEffect(() => {
    return socialTabPressEmitter.subscribe(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, []);

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
      // Read via ref so that loading new profiles doesn't invalidate this
      // callback and force FlashList to re-render every visible card at once.
      // Individual cells still re-render when `extraData` changes (e.g. when
      // the profile Map updates), keeping names accurate without a mass teardown.
      const profile = authorProfilesRef.current.get(item.author_id);
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
          currentUserId={currentUserId || ""}
          isGlobalMuted={isMuted}
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
      currentUserId,
      isMuted,
      handleToggleMute,
      // authorProfiles intentionally omitted — read via authorProfilesRef above.
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
            onPress={() => {
              if (key === activeTab) {
                // Tap the active tab again → scroll to top (Instagram behaviour)
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
              } else {
                // Instantly unmount current videos to prevent hardware decoder
                // crashes and memory spikes when the FlashList data swaps.
                setActiveVideoId(null);
                lastActiveVideoIdRef.current = null;
                setVisiblePostIds([]);

                // Defer the actual data swap by 1 frame (50ms) so the native UI 
                // has time to cleanly destroy the AVPlayer instances.
                setTimeout(() => {
                  setActiveTab(key);
                  // Jump to top instantly when switching tabs so the new feed
                  // always starts at position 0, not mid-scroll from the old tab.
                  listRef.current?.scrollToOffset({ offset: 0, animated: false });
                }, 50);
              }
            }}
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
        refreshing={isRefetching && posts.length > 0}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={isFetchingNextPage ? <PostCardSkeleton /> : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.feedContent
        }
        extraData={{
          followingIds,
          bookmarkedIds,
          likePending,
          currentUserId,
          isMuted,
          // authorProfiles included so FlashList re-renders individual visible
          // cells when names load, without invalidating the renderPost callback.
          authorProfiles,
        }}
        // Pre-render ~2 cards ahead of the viewport. 250 (the old value)
        // was under half a card, so fast scrolls outpaced the warm-up and
        // landed on blank cells. FlashList 2.x auto-measures item sizes,
        // so no estimatedItemSize is needed.
        drawDistance={500}
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
