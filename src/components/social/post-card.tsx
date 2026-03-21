import { Fonts } from "@/src/constants/theme";
import type { PostRead } from "@/src/services/social/types";
import { useVideoStore } from "@/src/store/video.store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LikesSheet } from "./likes-sheet";

// ─── Local Design Tokens ───────────────────────────────────────────────────

const colors = {
  skeleton: "#1C1C1E",
  white: "#FFFFFF",
  textTertiary: "#888888",
  like: "#FF3B30",
  overlayLight: "rgba(0,0,0,0.4)",
};
const spacing = { xs: 4, sm: 8, md: 16 };
const typography = { displayMd: { fontSize: 24, fontFamily: Fonts.semiBold } };

// ─── Constants & Helpers ───────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_HEIGHT = SCREEN_WIDTH * (5 / 4);
const BLURHASH = "LKO2?U%2Tw=w]~RBVZRi};RPxuwH";

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatRelativeTime(isoString: string): string {
  const normalized = isoString.endsWith("Z") ? isoString : isoString + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function shortAuthorId(id: string): string {
  if (!id) return "user";
  return id.slice(0, 8);
}

// ─── Heart Animation ──────────────────────────────────────────────────────────

const HeartAnimation = React.memo(({ onComplete }: { onComplete: () => void }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 200 }),
      withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 200 }, () => {
        onComplete();
      }))
    );
  }, [onComplete, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.heartOverlay, animatedStyle]}>
        <Ionicons name="heart" size={100} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SkeletonBlock({ style }: { style: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: "#2C2C2E", borderRadius: 4 },
        style,
        animStyle,
      ]}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={[styles.postHeader, { marginBottom: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <SkeletonBlock style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ gap: 6 }}>
            <SkeletonBlock style={{ width: 100, height: 12 }} />
            <SkeletonBlock style={{ width: 60, height: 10 }} />
          </View>
        </View>
        <SkeletonBlock style={{ width: 72, height: 30, borderRadius: 100 }} />
      </View>

      {/* Image */}
      <SkeletonBlock style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75, borderRadius: 0 }} />

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <SkeletonBlock style={{ width: 48, height: 14 }} />
        <SkeletonBlock style={{ width: 48, height: 14 }} />
        <SkeletonBlock style={{ width: 32, height: 14 }} />
        <SkeletonBlock style={{ width: 48, height: 14 }} />
      </View>

      {/* Caption lines */}
      <View style={{ paddingHorizontal: 16, gap: 6, paddingBottom: 8 }}>
        <SkeletonBlock style={{ width: SCREEN_WIDTH - 80, height: 12 }} />
        <SkeletonBlock style={{ width: SCREEN_WIDTH - 140, height: 12 }} />
      </View>
    </View>
  );
}

// ─── Carousel Grid ───────────────────────────────────────────────────────────

interface CarouselGridProps {
  urls: string[];
  postId: string;
  onTap: (imageIndex?: number) => void;
}

const CarouselGrid = React.memo<CarouselGridProps>(
  ({ urls, postId, onTap }: CarouselGridProps) => {
  const count = urls.length;

  if (count === 2) {
    return (
      <View style={styles.carouselRow}>
        <Pressable onPress={() => onTap(0)} style={styles.carousel2Left}>
          <Image
            source={{ uri: urls[0] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-0`}
          />
        </Pressable>
        <Pressable onPress={() => onTap(1)} style={styles.carousel2Right}>
          <Image
            source={{ uri: urls[1] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-1`}
          />
        </Pressable>
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={styles.carouselRow}>
        <Pressable onPress={() => onTap(0)} style={styles.carousel3Left}>
          <Image
            source={{ uri: urls[0] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-0`}
          />
        </Pressable>
        <View style={styles.carousel3Right}>
          <Pressable onPress={() => onTap(1)} style={styles.carousel3RightTop}>
            <Image
              source={{ uri: urls[1] }}
              style={StyleSheet.absoluteFill}
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              recyclingKey={`carousel-${postId}-1`}
            />
          </Pressable>
          <Pressable onPress={() => onTap(2)} style={styles.carousel3RightBottom}>
            <Image
              source={{ uri: urls[2] }}
              style={StyleSheet.absoluteFill}
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              recyclingKey={`carousel-${postId}-2`}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  const displayed = urls.slice(0, 4);
  const remaining = count - 4;

  return (
    <View style={styles.carouselGrid}>
      <View style={styles.carouselGridRow}>
        <Pressable onPress={() => onTap(0)} style={styles.carouselGridCell}>
          <Image
            source={{ uri: displayed[0] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-0`}
          />
        </Pressable>
        <Pressable onPress={() => onTap(1)} style={styles.carouselGridCell}>
          <Image
            source={{ uri: displayed[1] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-1`}
          />
        </Pressable>
      </View>
      <View style={styles.carouselGridRow}>
        <Pressable onPress={() => onTap(2)} style={styles.carouselGridCell}>
          <Image
            source={{ uri: displayed[2] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-2`}
          />
        </Pressable>
        <Pressable onPress={() => onTap(3)} style={styles.carouselGridCellWrap}>
          <Image
            source={{ uri: displayed[3] }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            recyclingKey={`carousel-${postId}-3`}
          />
          {remaining > 0 && (
            <View style={styles.carouselOverlayCount}>
              <Text style={styles.carouselOverlayText}>+{remaining}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});
CarouselGrid.displayName = "CarouselGrid";

// ─── ImagePost ───────────────────────────────────────────────────────────────

interface ImagePostProps {
  post: PostRead;
  onTap: () => void;
}

const ImagePost = React.memo<ImagePostProps>(({ post, onTap }: ImagePostProps) => (
  <Pressable onPress={onTap}>
    <Image
      source={{ uri: post.media_url }}
      style={styles.media}
      cachePolicy="memory-disk"
      contentFit="cover"
      placeholder={{ blurhash: BLURHASH }}
      transition={0}
      recyclingKey={`feed-${post.id}`}
      priority="high"
    />
  </Pressable>
));
ImagePost.displayName = "ImagePost";

// ─── FeedVideoPost ──────────────────────────────────────────────────────────

interface FeedVideoPostProps {
  post: PostRead;
  isActive: boolean;
  isMuted: boolean;
  onTap: () => void;
  onToggleMute: () => void;
}

const FeedVideoPost = React.memo<FeedVideoPostProps>(
  ({ post, isActive, isMuted, onTap, onToggleMute }: FeedVideoPostProps) => {
    const isProcessing = post.media_type === "video_upload" && !(post.media_url && typeof post.media_url === 'string' && post.media_url.includes(".m3u8"));

    const player = useVideoPlayer(post.media_url, (p) => {
      p.loop = true;
      p.muted = isMuted;
      p.volume = isMuted ? 0 : 1;
    });

    useEffect(() => {
      player.muted = isMuted;
      player.volume = isMuted ? 0 : 1;
    }, [player, isMuted]);

    useEffect(() => {
      if (isActive && !isProcessing) {
        player.play();
      } else {
        player.pause();
      }
    }, [isActive, player, isProcessing]);

    return (
      <View style={styles.mediaContainer}>
        <View style={[styles.media, { backgroundColor: colors.skeleton }]} />
        {isProcessing ? (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="time-outline" size={32} color="#FFFFFF" />
            <Text style={styles.videoPlaceholderText}>Processing video...</Text>
          </View>
        ) : (
          <VideoView
            player={player}
            style={[styles.media, StyleSheet.absoluteFillObject]}
            contentFit="cover"
            nativeControls={false}
          />
        )}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onTap}
        />
        {!isProcessing && (
          <Pressable
            style={styles.muteBtn}
            onPress={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            hitSlop={spacing.sm}
          >
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={12}
              color={colors.white}
            />
          </Pressable>
        )}
      </View>
    );
  },
);
FeedVideoPost.displayName = "FeedVideoPost";

// ─── PostCard ────────────────────────────────────────────────────────────────

export interface PostCardProps {
  post: PostRead;
  onLike: (postId: string, isLiked: boolean) => void;
  onFollow: (authorId: string, isFollowing: boolean) => void;
  onComment: (postId: string) => void;
  onMore: (post: PostRead) => void;
  onVideoPress?: (post: PostRead) => void;
  onBookmark?: (postId: string, isBookmarked: boolean) => void;
  isFollowing: boolean;
  isBookmarked?: boolean;
  likePending: boolean;
  currentUserId: string;
}

export const PostCardComponent = React.memo(({
  post,
  onLike,
  onFollow,
  onComment,
  onMore,
  onVideoPress,
  onBookmark,
  isFollowing,
  isBookmarked = false,
  likePending,
  currentUserId,
}: PostCardProps) => {
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showLikes, setShowLikes] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTap = useRef<number>(0);

  const isVideoActive = useVideoStore((s) => s.activeVideoId === post.id);

  const isVideo = post.media_type === "video" || post.media_type === "video_upload" || (post.media_url && typeof post.media_url === 'string' && post.media_url.includes(".m3u8"));
  const isCarousel =
    post.media_type === "carousel" &&
    post.media_urls !== null &&
    post.media_urls !== undefined &&
    post.media_urls.length >= 2;

  const isLiked = post.is_liked ?? false;
  const isOwnPost = post.author_id === currentUserId;

  const handleLike = useCallback(() => {
    if (!likePending) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLike(post.id, isLiked);
    }
  }, [likePending, onLike, post.id, isLiked]);

  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBookmark?.(post.id, isBookmarked);
  }, [onBookmark, post.id, isBookmarked]);

  const handleTap = useCallback(
    (imageIndex?: number) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap
        if (!isLiked && !likePending) {
          handleLike();
          setShowHeartAnim(true);
        } else if (isLiked) {
          // If already liked, just pulse the animation or do nothing? 
          // Usually Instagram shows the heart animation even if already liked.
          setShowHeartAnim(true);
        }
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        // Navigation or reels on single tap
        if (isVideo && onVideoPress) {
          onVideoPress(post);
        }
      }
    },
    [isVideo, onVideoPress, post, isLiked, likePending, handleLike],
  );

  const handleComment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComment(post.id);
  }, [onComment, post.id]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleExpandCaption = useCallback(() => {
    setCaptionExpanded(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const authorLabel = `@${shortAuthorId(post.author_id)}`;

  return (
    <View style={styles.postContainer}>
      <View style={styles.topr}>
        <View style={styles.infoLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={12} color={colors.textTertiary} />
          </View>
          <Text style={styles.username} numberOfLines={1}>
            {authorLabel}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.timeText}>
            {formatRelativeTime(post.created_at)}
          </Text>
        </View>
        <View style={styles.toprRight}>
          {!isOwnPost && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => onFollow(post.author_id, isFollowing)}
            >
              <Text style={styles.followButtonText}>{isFollowing ? "Following" : "Follow"}</Text>
            </TouchableOpacity>
          )}
          <Pressable
            onPress={() => onMore(post)}
            hitSlop={spacing.sm}
            style={styles.moreButton}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>

      {isVideo ? (
        <FeedVideoPost
          post={post}
          isActive={isVideoActive}
          isMuted={isMuted}
          onTap={handleTap}
          onToggleMute={handleToggleMute}
        />
      ) : isCarousel ? (
        <CarouselGrid
          urls={post.media_urls as string[]}
          postId={post.id}
          onTap={handleTap}
        />
      ) : (
        <ImagePost post={post} onTap={handleTap} />
      )}

      {showHeartAnim && (
        <HeartAnimation onComplete={() => setShowHeartAnim(false)} />
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoRight}>
          <Pressable
            onPress={handleLike}
            hitSlop={spacing.xs}
            style={styles.actionIcon}
            disabled={likePending}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? colors.like : "#555"}
            />
          </Pressable>
          <Pressable
            onPress={handleComment}
            hitSlop={spacing.xs}
            style={styles.actionIcon}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#555"
            />
          </Pressable>
          <Pressable
            onPress={handleShare}
            hitSlop={spacing.xs}
            style={styles.actionIcon}
          >
            <Ionicons
              name="paper-plane-outline"
              size={20}
              color="#555"
            />
          </Pressable>
          <Pressable
            onPress={handleBookmark}
            hitSlop={spacing.xs}
            style={styles.actionIcon}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? colors.white : "#555"}
            />
          </Pressable>
        </View>
      </View>

      {(post.caption != null && post.caption.length > 0) || (post.like_count ?? 0) > 0 ? (
        <View style={styles.captionContainer}>
          {post.caption != null && post.caption.length > 0 && (
            <Pressable onPress={handleExpandCaption}>
              <Text
                style={styles.captionText}
                numberOfLines={captionExpanded ? undefined : 1}
              >
                {post.caption}
              </Text>
            </Pressable>
          )}
          {(post.like_count > 0 || isLiked) && (() => {
            const count = Math.max(post.like_count ?? 0, isLiked ? 1 : 0);
            const others = isLiked ? count - 1 : count;
            return (
              <View style={styles.likedByRow}>
                <Text style={styles.likedByText}>
                  {"Liked by "}
                  {isLiked ? (
                    <>
                      <Text style={styles.likedByBold}>you</Text>
                      {others > 0 && (
                        <>
                          {" and "}
                          <Text style={[styles.likedByBold, styles.likedByTappable]} onPress={() => setShowLikes(true)}>
                            {formatCount(others)} others
                          </Text>
                        </>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.likedByBold, styles.likedByTappable]} onPress={() => setShowLikes(true)}>
                      {formatCount(others)} others
                    </Text>
                  )}
                </Text>
              </View>
            );
          })()}
        </View>
      ) : null}

      <View style={styles.divider} />
      <LikesSheet postId={showLikes ? post.id : null} likeCount={post.like_count} onClose={() => setShowLikes(false)} />
    </View>
  );
});

PostCardComponent.displayName = "PostCardComponent";
export const PostCard = memo(PostCardComponent);

// ─── Styles ──────────────────────────────────────────────────────────────────

const CAROUSEL_GAP = 2;
const CAROUSEL_HEIGHT = IMAGE_HEIGHT;
const HALF_WIDTH = (SCREEN_WIDTH - CAROUSEL_GAP) / 2;
const TWO_THIRD = (SCREEN_WIDTH - CAROUSEL_GAP) * 0.66;
const ONE_THIRD = SCREEN_WIDTH - CAROUSEL_GAP - TWO_THIRD;

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: "#0F0F10",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postContainer: {
    backgroundColor: "#0F0F10",
  },
  videoPlaceholder: { 
    ...StyleSheet.absoluteFillObject, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#1C1C1E", 
    gap: 10 
  },
  videoPlaceholderText: { 
    color: "#FFF", 
    fontFamily: Fonts.medium, 
    fontSize: 13, 
    opacity: 0.9 
  },
  mediaContainer: {
    position: "relative",
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  media: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: colors.skeleton,
  },
  muteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  carouselRow: {
    flexDirection: "row",
    gap: CAROUSEL_GAP,
    height: CAROUSEL_HEIGHT,
    backgroundColor: colors.skeleton,
  },
  carousel2Left: {
    width: HALF_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  carousel2Right: {
    width: HALF_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  carousel3Left: {
    width: TWO_THIRD,
    height: CAROUSEL_HEIGHT,
  },
  carousel3Right: {
    width: ONE_THIRD,
    gap: CAROUSEL_GAP,
  },
  carousel3RightTop: {
    width: ONE_THIRD,
    height: (CAROUSEL_HEIGHT - CAROUSEL_GAP) / 2,
  },
  carousel3RightBottom: {
    width: ONE_THIRD,
    height: (CAROUSEL_HEIGHT - CAROUSEL_GAP) / 2,
  },
  carouselGrid: {
    gap: CAROUSEL_GAP,
    height: CAROUSEL_HEIGHT,
    backgroundColor: colors.skeleton,
  },
  carouselGridRow: {
    flexDirection: "row",
    gap: CAROUSEL_GAP,
    flex: 1,
  },
  carouselGridCell: {
    flex: 1,
    height: "100%" as unknown as number,
  },
  carouselGridCellWrap: {
    flex: 1,
    position: "relative",
  },
  carouselOverlayCount: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselOverlayText: {
    ...typography.displayMd,
    color: colors.white,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 44,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    marginRight: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    lineHeight: 18,
    color: colors.white,
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
    color: "#555",
  },
  timeText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
    color: "#555",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 28,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  captionContainer: {
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  captionText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: "#888",
  },
  likeCountText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    lineHeight: 16,
    color: "#666",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#1C1C1E",
    marginTop: 12,
    marginBottom: 12,
  },

  topr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },
  toprRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moreButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#2C2C2E", borderRadius: 100 },
  followingButton: { backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#3A3A3C" },
  followButtonText: { fontSize: 13, fontFamily: Fonts.semiBold, color: "#FFFFFF" },

  likedByRow: { paddingTop: 4 },
  likedByText: { fontSize: 13, fontFamily: Fonts.regular, color: "#FFFFFF" },
  likedByBold: { fontFamily: Fonts.semiBold, color: "#FFFFFF" },
  likedByTappable: { textDecorationLine: "underline", opacity: 0.9 },
});
