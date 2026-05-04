import { Fonts } from "@/constants/theme";
import { useLikePostMutation } from "@/hooks/mutations/use-feed-mutations";

import type { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Platform,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type ViewToken,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommentsSheet } from "./CommentsSheet";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatReelCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function shortId(id: string) {
  return `@${id.slice(0, 8)}`;
}

// ─── Single Reel Item ─────────────────────────────────────────────────────────

export interface ReelItemProps {
  post: PostRead;
  isActive: boolean;
  currentUserId: string;
  onComment: (postId: string) => void;
  isInitialPost?: boolean; // The post that was tapped to open reels
}

export const ReelItem = memo(function ReelItem({
  post,
  isActive,
  currentUserId: _currentUserId,
  onComment,
  isInitialPost = false,
}: ReelItemProps) {
  const [muted, setMuted] = useState(false);
  // chromeReady: show buttons/info instantly for initial post, wait for video otherwise
  const [chromeReady, setChromeReady] = useState(isInitialPost);
  const [videoReady, setVideoReady] = useState(isInitialPost);
  const thumbnailUri = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const insets = useSafeAreaInsets();

  const { mutate: likePost, isPending: likePending } = useLikePostMutation();
  const liked = post.is_liked ?? false;

  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    if (likePending) return;
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 6 }),
    );
    likePost({ postId: post.id, isLiked: liked });
  };

  // ─── Per-reel video player ─────────────────────────────────────────────
  // Unlike the main feed (which hoists a single player), reels preload
  // the next ~2 items — TikTok's scroll-to-play illusion relies on the
  // first frame being ready as the user swipes. windowSize=3 in the
  // parent FlatList caps concurrent players at three.
  const player = useVideoPlayer({ uri: post.media_url }, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Keep the native mute state in sync with the React state.
  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  // Play when active, pause + rewind when this reel scrolls out.
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, player]);

  // Fade chrome in once the first frame is ready (unless we're the
  // initial tapped post, in which case chrome shows immediately).
  useEffect(() => {
    if (isInitialPost) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        setVideoReady(true);
        setChromeReady(true);
      }
    });
    return () => {
      sub?.remove?.();
    };
  }, [isInitialPost, player]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  // Native share sheet. Same format as PostCard's share so links from
  // reels and feed look identical.
  const handleShare = async () => {
    try {
      const lines: string[] = [];
      if (post.caption) lines.push(`"${post.caption}"`);
      lines.push(`— ${shortId(post.author_id)} on Revi AI`);
      const message = lines.join("\n\n");
      const url = `reviaimobile://post/${post.id}`;
      await Share.share(
        Platform.OS === "ios"
          ? { url, message }
          : { message: `${message}\n${url}` },
        { dialogTitle: "Share this reel" },
      );
    } catch {
      // User cancelled or share unavailable — silent.
    }
  };

  return (
    <View
      style={[
        styles.reelContainer,
        { height: screenHeight, backgroundColor: "#000" },
      ]}
    >
      {/* Video — uses post.media_url (same URL as PostCard) so iOS/Android
          HTTP cache serves the HLS manifest + recent segments instantly. */}
      {/* Thumbnail shown until first frame is decoded — eliminates black flash */}
      {!videoReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}

      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={togglePlay}
      >
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
        />
      </TouchableOpacity>

      {/* Chrome — instant for initial post, waits for first frame for others */}
      {chromeReady && (
        <>
          {/* Right actions */}
          <View style={[styles.rightActions, { bottom: insets.bottom + 80 }]}>
            <Animated.View style={heartAnimStyle}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={30}
                  color={liked ? "#FF3B30" : "#FFF"}
                />
                <Text style={styles.actionLabel}>
                  {formatReelCount(post.like_count)}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onComment(post.id)}
            >
              <Ionicons name="chatbubble-outline" size={28} color="#FFF" />
              <Text style={styles.actionLabel}>
                {formatReelCount(post.comment_count)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-redo-outline" size={28} color="#FFF" />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setMuted((m) => !m)}
            >
              <Ionicons
                name={muted ? "volume-mute" : "volume-high"}
                size={26}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>

          {/* Bottom info */}
          <View
            style={[styles.bottomInfo, { paddingBottom: insets.bottom + 70 }]}
          >
            <View style={styles.authorRow}>
              <View style={styles.avatar} />
              <Text style={styles.authorName}>{shortId(post.author_id)}</Text>
            </View>
            {post.caption ? (
              <Text style={styles.caption} numberOfLines={2}>
                {post.caption}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
});

// ─── Reels Overlay ────────────────────────────────────────────────────────────

export interface ReelsOverlayProps {
  initialPost: PostRead;
  feedVideoPosts: PostRead[]; // Already-loaded video posts from the main feed — no extra API call
  onClose: () => void;
  currentUserId: string;
}

export function ReelsOverlay({
  initialPost,
  feedVideoPosts,
  onClose,
  currentUserId,
}: ReelsOverlayProps) {
  const insets = useSafeAreaInsets();

  // Build the display list immediately from already-loaded feed data.
  // No API call, no delay — data is already available.
  const { posts: displayPosts, initialIndex } = useMemo(() => {
    if (feedVideoPosts.length === 0) {
      return { posts: [initialPost], initialIndex: 0 };
    }
    const idx = feedVideoPosts.findIndex((p) => p.id === initialPost.id);
    if (idx !== -1) {
      return { posts: feedVideoPosts, initialIndex: idx };
    }
    // Tapped post not in video list (edge case) — prepend it
    return { posts: [initialPost, ...feedVideoPosts], initialIndex: 0 };
  }, [feedVideoPosts, initialPost]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<PostRead>>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PostRead; index: number }) => (
      <ReelItem
        post={item}
        isActive={index === activeIndex && !commentsPostId}
        currentUserId={currentUserId}
        onComment={setCommentsPostId}
        isInitialPost={item.id === initialPost.id}
      />
    ),
    [activeIndex, commentsPostId, currentUserId, initialPost.id],
  );

  return (
    <View style={overlayStyles.container}>
      <StatusBar style="light" />

      {/* Back button */}
      <TouchableOpacity
        style={[overlayStyles.backBtn, { top: insets.top + 8 }]}
        onPress={onClose}
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Vertical reel list */}
      <FlatList
        ref={flatListRef}
        data={displayPosts}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        initialScrollIndex={initialIndex}
        scrollEnabled={!commentsPostId}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === "android"}
        decelerationRate="fast"
        snapToInterval={screenHeight}
        snapToAlignment="start"
      />

      {/* Full comments thread — same monochrome sheet used elsewhere in the
          app so the UX stays consistent between feed and reels. The reel
          list is pointer-locked (scrollEnabled=false) while this is open. */}
      <CommentsSheet
        postId={commentsPostId}
        currentUserId={currentUserId}
        onClose={() => setCommentsPostId(null)}
      />
    </View>
  );
}

// ─── Overlay container — transparent until video renders ─────────────────────
// No Modal, no navigation — the video just expands in place like Instagram.
// Starts transparent so the feed (with its playing video) stays visible
// underneath. Once the overlay Video renders its first frame, the ReelItem
// switches to opaque black → seamless transition, zero black flash.

const overlayStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: "#000",
    zIndex: 9999,
    elevation: 9999,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
  },
});

// ─── Shared styles (used by ReelItem + QuickComments) ────────────────────────

export const styles = StyleSheet.create({
  reelContainer: {
    overflow: "hidden",
  },
  rightActions: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 80,
    paddingHorizontal: 16,
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  authorName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFF",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
