import { colors, radius, spacing, typography } from "@/constants/design";
import { Fonts } from "@/constants/theme";
import type { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "@/components/ExpoImage";
import { VideoView, type VideoPlayer } from "expo-video";
import { memo, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { LikesSheet } from "./LikesSheet";
import { PostHeader } from "./post/PostHeader";
import { PostActions } from "./post/PostActions";
import { PostCaption } from "./post/PostCaption";

const { width, height: screenHeight } = Dimensions.get("window");
const fsWidth = width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatRelativeTime(isoString: string): string {
  // Server returns timestamps without Z — treat as UTC
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
  return `@${id.slice(0, 8)}`;
}

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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 44, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <SkeletonBlock style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ gap: 6 }}>
            <SkeletonBlock style={{ width: 100, height: 12 }} />
            <SkeletonBlock style={{ width: 60, height: 10 }} />
          </View>
        </View>
        <SkeletonBlock style={{ width: 72, height: 30, borderRadius: 15 }} />
      </View>

      {/* Image */}
      <SkeletonBlock style={{ width, height: width * 0.75, borderRadius: 0 }} />

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
        <SkeletonBlock style={{ width: width - 80, height: 12 }} />
        <SkeletonBlock style={{ width: width - 140, height: 12 }} />
      </View>
    </View>
  );
}

export interface PostCardProps {
  post: PostRead;
  onLike: (postId: string, isLiked: boolean) => void;
  onFollow: (authorId: string, isFollowing: boolean) => void;
  onComment: (postId: string) => void;
  onMore: (post: PostRead) => void;
  onVideoPress?: (post: PostRead) => void;
  onBookmark?: (postId: string, isBookmarked: boolean) => void;
  onAuthorPress?: (authorId: string) => void;
  isFollowing: boolean;
  isBookmarked?: boolean;
  currentUserId: string;
  /** Full name resolved by the parent (first + last from author profile). */
  authorName?: string | null;
  // Hoisted video player — owned by the feed screen. When this card is
  // isActive, we render a VideoView bound to this player. Other cards
  // render only the thumbnail. Omit for thumbnail-only contexts.
  videoPlayer?: VideoPlayer;
  // Global mute state driven by the parent; tapping the mute button
  // toggles it across the whole feed (matches Instagram/TikTok UX).
  isMuted?: boolean;
  onToggleMute?: () => void;
}

function PostCardComponent({
  post,
  onLike,
  onFollow,
  onComment,
  onMore,
  onVideoPress,
  onBookmark,
  onAuthorPress,
  isFollowing,
  isBookmarked = false,
  currentUserId,
  videoPlayer,
  isMuted = true,
  onToggleMute,
  authorName,
}: PostCardProps) {
  const isVideo =
    post.media_type === "video" ||
    post.media_type === "video_upload" ||
    (post.media_url &&
      typeof post.media_url === "string" &&
      post.media_url.includes(".m3u8"));
  const isTranscoded =
    post.media_type === "video" || post.media_url?.includes(".m3u8");
  const isProcessing = post.media_type === "video_upload" && !isTranscoded;
  const isOwnPost = post.author_id?.toString() === currentUserId?.toString();
  const mediaUrls =
    post.media_type === "carousel" && post.media_urls?.length
      ? post.media_urls
      : [post.media_url];

  const [imageIndex, setImageIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const liked = post.is_liked ?? false;
  const carouselRef = useRef<ScrollView>(null);
  const isClosingRef = useRef(false);

  const thumbnailUri = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const isActive = useVideoStore((s) => s.activeVideoId === post.id);
  const isVideoReady = useVideoStore((s) => s.readyVideoId === post.id);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  // ─── Cell recycle reset ────────────────────────────────────────────────────
  const [lastPostId, setLastPostId] = useState(post.id);
  if (lastPostId !== post.id) {
    setLastPostId(post.id);
    setImageIndex(0);
    setFullscreenIndex(null);
    setThumbnailFailed(false);
  }

  const openFullscreen = (idx: number) => {
    if (!isClosingRef.current) setFullscreenIndex(idx);
  };
  const closeFullscreen = () => {
    isClosingRef.current = true;
    setFullscreenIndex(null);
    setTimeout(() => {
      isClosingRef.current = false;
    }, 400);
  };

  // Reset carousel scroll position when cell recycles to a new post. The
  // ScrollView keeps its native scroll offset across recycles, so without
  // this the new post would briefly open on whatever slide the old post was
  // on (e.g. image 3 of 3 instead of image 1).
  useEffect(() => {
    carouselRef.current?.scrollTo({ x: 0, animated: false });
  }, [post.id]);

  // Fallback thumbnail generation — runs if SocialScreen's pre-generator
  // hasn't cached one yet for this post.
  useEffect(() => {
    if (!isVideo || isProcessing || thumbnailUri || thumbnailFailed) return;

    // Fast path: backend returned a thumbnail uploaded at post time.
    // Store it directly — no HLS parsing, no network call.
    if (post.thumbnail_url) {
      setThumbnail(post.id, post.thumbnail_url);
      return;
    }

    // Slow path: HLS-based extraction for older posts without thumbnail_url.
    let cancelled = false;
    generateVideoThumbnail(post.media_url).then((uri) => {
      if (cancelled) return;
      if (uri) {
        setThumbnail(post.id, uri);
      } else {
        setThumbnailFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    isVideo,
    isProcessing,
    thumbnailUri,
    thumbnailFailed,
    post.id,
    post.media_url,
    post.thumbnail_url,
    setThumbnail,
  ]);


  return (
    <>
      <View style={styles.postCard}>
        {/* ── Header (memo'd — re-renders only on follow/author change) ── */}
        <PostHeader
          post={post}
          isOwnPost={isOwnPost}
          isFollowing={isFollowing}
          authorName={authorName}
          onFollow={onFollow}
          onMore={onMore}
          onAuthorPress={onAuthorPress}
        />

        {/* Media */}
        <View>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(idx);
            }}
          >
            {mediaUrls.map((url, i) => {
              const isVideoUrl =
                isVideo && !isProcessing && (i === 0 || url.includes(".m3u8"));
              const showVideoView = isVideoUrl && !!videoPlayer && isVideoReady;
              const showThumbnailCover = isVideoUrl && !isVideoReady;

              return (
                <View
                  key={i}
                  style={[
                    styles.imageContainer,
                    isVideo && styles.videoContainer,
                  ]}
                >
              <Animated.View style={StyleSheet.absoluteFill}>
                    {isVideoUrl ? (
                      <>
                        {thumbnailUri && showThumbnailCover && (
                          <Image
                            source={{ uri: thumbnailUri }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            recyclingKey={post.id}
                          />
                        )}
                        {!thumbnailUri && showThumbnailCover && (
                          <SkeletonBlock
                            style={StyleSheet.absoluteFill as object}
                          />
                        )}

                        {showVideoView && (
                          <VideoView
                            player={videoPlayer!}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            nativeControls={false}
                            fullscreenOptions={{ enable: false }}
                            allowsPictureInPicture={false}
                          />
                        )}

                        {!isActive && !showVideoView && (
                          <View style={styles.playOverlay}>
                            <View style={styles.playOverlayCircle}>
                              <Ionicons name="play" size={26} color="#FFF" />
                            </View>
                          </View>
                        )}
                      </>
                    ) : isProcessing ? (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons
                          name="time-outline"
                          size={32}
                          color="#FFFFFF"
                        />
                        <Text style={styles.videoPlaceholderText}>
                          Processing video...
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: url ?? undefined }}
                        style={styles.postImage}
                        contentFit="cover"
                        recyclingKey={`${post.id}-${i}`}
                      />
                    )}
                  </Animated.View>
                  {post.is_sponsored && i === 0 && (
                    <View style={styles.sponsoredBadge}>
                      <Text style={styles.sponsoredText}>Sponsored</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Counter badge */}
          {mediaUrls.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {imageIndex + 1}/{mediaUrls.length}
              </Text>
            </View>
          )}

          {/* Tap video → open reels */}
          {isVideo && !isProcessing && (
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={0.9}
              onPress={() => onVideoPress?.(post)}
            />
          )}

          {/* Mute / expand button */}
          {isVideo && !isProcessing ? (
            <TouchableOpacity
              style={styles.muteButton}
              onPress={onToggleMute}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={15}
                color="#FFF"
              />
            </TouchableOpacity>
          ) : !isVideo ? (
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => openFullscreen(imageIndex)}
              activeOpacity={0.8}
            >
              <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}

          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.videoOverlay}>
              <View style={styles.processingBadge}>
                <Ionicons name="time-outline" size={24} color="#FFF" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            </View>
          )}
        </View>

        {/* Pagination dots */}
        {mediaUrls.length > 1 && (
          <View style={styles.paginationDots}>
            {mediaUrls.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* ── Actions (memo'd — re-renders only on like/bookmark change) ── */}
        <PostActions
          postId={post.id}
          authorId={post.author_id}
          caption={post.caption}
          likeCount={post.like_count}
          commentCount={post.comment_count}
          viewCount={post.view_count}
          isLiked={liked}
          isBookmarked={isBookmarked}
          onLike={onLike}
          onComment={onComment}
          onBookmark={onBookmark}
        />

        {/* ── Caption + Liked By (memo'd — re-renders only on like count) ── */}
        <PostCaption
          postId={post.id}
          caption={post.caption}
          likeCount={post.like_count}
          isLiked={liked}
        />
      </View>

      {/* Fullscreen image viewer */}
      <Modal
        visible={fullscreenIndex !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fsOverlay}>
          <TouchableOpacity
            style={styles.fsClose}
            onPress={closeFullscreen}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>

          {mediaUrls.length > 1 && fullscreenIndex !== null && (
            <View style={styles.fsCounter}>
              <Text style={styles.fsCounterText}>
                {fullscreenIndex + 1}/{mediaUrls.length}
              </Text>
            </View>
          )}

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (fullscreenIndex ?? 0) * fsWidth, y: 0 }}
            onMomentumScrollEnd={(e) => {
              if (isClosingRef.current) return;
              const idx = Math.round(e.nativeEvent.contentOffset.x / fsWidth);
              setFullscreenIndex(idx);
            }}
          >
            {mediaUrls.map((url, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={1}
                onPress={closeFullscreen}
                style={styles.fsImageWrap}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.fsImage}
                  contentFit="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.bg,
    // Top breathing room between a card and whatever's above it (either the
    // tabs row for the first card, or the previous card's caption). Applied
    // here (not on the feed container) so every card — including ones that
    // mount later via pagination — gets the same spacing.
    paddingTop: 16,
  },
  imageContainer: {
    width: width,
    height: width * (5 / 4),
    backgroundColor: colors.bgSecondary,
  },
  videoContainer: {
    height: width * (5 / 4),
  },
  postImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2C2C2E",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSecondary,
    gap: spacing.xs,
  },
  videoFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  videoPlaceholderText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    opacity: 0.9,
  },
  loadingVideoCover: {
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  playBadgeText: {
    color: "#FFFFFF",
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  sponsoredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sponsoredText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  fullscreenButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 20,
  },
  muteButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 20,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  processingText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: "#FFFFFF",
  },
  videoBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  // ─── Fullscreen image viewer ───────────────────────────────────────────────
  fsOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  fsClose: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fsCounter: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fsCounterText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
  },
  fsImageWrap: {
    width: fsWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  fsImage: {
    width: fsWidth,
    height: screenHeight,
  },
});

export const PostCard = memo(PostCardComponent);
