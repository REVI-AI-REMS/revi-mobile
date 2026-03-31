import { colors, radius, spacing, typography } from "@/src/constants/design";
import { Fonts } from "@/src/constants/theme";
import type { PostRead } from "@/src/services/social/types";
import { useVideoStore } from "@/src/store/video.store";
import { generateVideoThumbnail } from "@/src/utils/video-thumbnail";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
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
import { LikesSheet } from "./likes-sheet";

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
      <View style={[styles.postHeader, { marginBottom: 12 }]}>
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
  likePending: boolean;
  currentUserId: string;
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
  likePending,
  currentUserId,
}: PostCardProps) {
  const isVideo =
    post.media_type === "video" ||
    post.media_type === "video_upload" ||
    (post.media_url && typeof post.media_url === 'string' && post.media_url.includes(".m3u8"));
  const isTranscoded =
    post.media_type === "video" || post.media_url?.includes(".m3u8");
  const isProcessing = post.media_type === "video_upload" && !isTranscoded;
  const isOwnPost = post.author_id === currentUserId;
  const mediaUrls =
    post.media_type === "carousel" && post.media_urls?.length
      ? post.media_urls
      : [post.media_url];

  const [imageIndex, setImageIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [showLikes, setShowLikes] = useState(false);
  const liked = post.is_liked ?? false;
  const videoRef = useRef<Video>(null);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isClosingRef = useRef(false);

  const setBreadcrumb = useVideoStore((s) => s.setBreadcrumb);
  const thumbnailUri = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const savedTime = useVideoStore((s) => s.breadcrumbs[post.id]);
  const isActive = useVideoStore((s) => s.activeVideoId === post.id);
  const isViewable = useVideoStore((s) => s.visiblePostIds.has(post.id));
  const isPreload = useVideoStore((s) => s.preloadVideoIds.has(post.id));
  const [actualVideoSource, setActualVideoSource] = useState<string | null>(null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isVideoReadyForPlayback =
    !!actualVideoSource && (isPreload || isViewable || isActive) && !videoError;

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

  // Load source as soon as post edges into viewport (isPreload = 5% visible).
  // Never unload eagerly — let the component unmount handle cleanup.
  // Unloading on scroll boundaries causes blank flashes.
  useEffect(() => {
    if ((isPreload || isViewable || isActive) && isVideo && !isProcessing && !actualVideoSource) {
      setActualVideoSource(post.media_url);
    }
  }, [isPreload, isViewable, isActive, isVideo, isProcessing, actualVideoSource, post.media_url]);

  // Play when active, pause when not — keeps the decoded frame visible
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
      videoRef.current.setIsMutedAsync(isMuted).catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive, isVideo, isMuted]);

  // Cleanup only on unmount (FlatList recycles far-off items)
  useEffect(() => {
    const ref = videoRef.current;
    return () => {
      ref?.unloadAsync().catch(() => {});
    };
  }, []);

  // Fallback thumbnail generation — runs if social.tsx pre-generation hasn't
  // cached one yet (e.g. post detail screen, profile grid).
  // Uses HLS-aware utility: parses .m3u8 → extracts first .ts segment → thumbnail.
  useEffect(() => {
    if (!isVideo || isProcessing || thumbnailUri || thumbnailFailed) return;

    let cancelled = false;

    generateVideoThumbnail(post.media_url).then((uri) => {
      if (cancelled) return;
      if (uri) {
        setThumbnail(post.id, uri);
      } else {
        setThumbnailFailed(true);
      }
    });

    return () => { cancelled = true; };
  }, [isVideo, isProcessing, thumbnailUri, thumbnailFailed, post.id, post.media_url, setThumbnail]);

  // Heart pulse animation on like
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikeTap = () => {
    if (!likePending) {
      heartScale.value = withSequence(
        withSpring(1.35, { damping: 4 }),
        withSpring(1, { damping: 6 }),
      );
      onLike(post.id, liked);
    }
  };

  return (
    <>
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.postUser}
            activeOpacity={0.7}
            onPress={() => onAuthorPress?.(post.author_id)}
          >
            <View style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {shortAuthorId(post.author_id)}
              </Text>
              <Text style={styles.postTime}>
                {formatRelativeTime(post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.postHeaderActions}>
            {!isOwnPost && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={() => onFollow(post.author_id, isFollowing)}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => onMore(post)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media */}
        <View>
          <ScrollView
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
              const canRenderVideo =
                isVideoUrl &&
                isVideoReadyForPlayback;

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
                        {/* Layer 1: Thumbnail — always rendered as base for video posts.
                            Covers the dark background immediately so user never sees blank. */}
                        {thumbnailUri && (
                          <Image
                            source={{ uri: thumbnailUri }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        )}

                        {/* Layer 2: Video — rendered on top once source is loaded.
                            shouldPlay only when active. Invisible until first frame
                            decodes, then it covers the thumbnail seamlessly. */}
                        {canRenderVideo && (
                          <Video
                            ref={i === 0 ? videoRef : undefined}
                            source={{ uri: actualVideoSource }}
                            style={StyleSheet.absoluteFill}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted
                            useNativeControls={false}
                            progressUpdateIntervalMillis={1000}
                            onPlaybackStatusUpdate={(status) => {
                              if (status.isLoaded && status.isPlaying) {
                                // Preloading (not active) — pause after first frame decoded
                                if (!isActive) {
                                  videoRef.current?.pauseAsync().catch(() => {});
                                  return;
                                }
                                // Active — unmute if user toggled
                                if (!isMuted) {
                                  videoRef.current?.setIsMutedAsync(false).catch(() => {});
                                }
                                setBreadcrumb(post.id, status.positionMillis);
                              }
                            }}
                            onError={() => setVideoError(true)}
                            onLoad={() => {
                              if (savedTime && videoRef.current) {
                                videoRef.current.setPositionAsync(savedTime);
                              }
                            }}
                          />
                        )}
                      </>
                    ) : isProcessing ? (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="time-outline" size={32} color="#FFFFFF" />
                        <Text style={styles.videoPlaceholderText}>Processing video...</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: url }}
                        style={styles.postImage}
                        contentFit="cover"
                        transition={200}
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

          {/* Counter badge — absolute over the carousel */}
          {mediaUrls.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {imageIndex + 1}/{mediaUrls.length}
              </Text>
            </View>
          )}

          {/* Tap anywhere on a ready video → open reels */}
          {isVideo && !isProcessing && (
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={0.9}
              onPress={() => onVideoPress?.(post)}
            />
          )}

          {/* Bottom-right control: mute toggle for video, expand for images */}
          {isVideo && !isProcessing ? (
            <TouchableOpacity
              style={styles.muteButton}
              onPress={() => setIsMuted((m) => !m)}
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

          {/* Processing overlay — centre, only while transcoding */}
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

        {/* Actions */}
        <View style={styles.postActions}>
          <Animated.View style={heartAnimStyle}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLikeTap}
              disabled={likePending}
              activeOpacity={0.7}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? "#FF3B30" : "#FFFFFF"}
              />
              <Text style={[styles.actionText, liked && styles.likedText]}>
                {formatCount(post.like_count)}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {formatCount(post.comment_count)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>{formatCount(post.view_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => onBookmark?.(post.id, isBookmarked)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isBookmarked ? "#007AFF" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Liked by */}
        {(post.like_count > 0 || liked) &&
          (() => {
            const count = Math.max(post.like_count, liked ? 1 : 0);
            const others = liked ? count - 1 : count;
            return (
              <View style={styles.likedByRow}>
                <Text style={styles.likedByText}>
                  {"Liked by "}
                  {liked ? (
                    <>
                      <Text style={styles.likedByBold}>you</Text>
                      {others > 0 && (
                        <>
                          {" and "}
                          <Text
                            style={[styles.likedByBold, styles.likedByTappable]}
                            onPress={() => setShowLikes(true)}
                          >
                            {formatCount(others)} others
                          </Text>
                        </>
                      )}
                    </>
                  ) : (
                    <Text
                      style={[styles.likedByBold, styles.likedByTappable]}
                      onPress={() => setShowLikes(true)}
                    >
                      {formatCount(others)} others
                    </Text>
                  )}
                </Text>
              </View>
            );
          })()}

        {/* Caption */}
        {post.caption ? (
          <View style={styles.postDescription}>
            <Text style={styles.description} numberOfLines={3}>
              {post.caption}
            </Text>
          </View>
        ) : null}
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
          {/* Close */}
          <TouchableOpacity
            style={styles.fsClose}
            onPress={closeFullscreen}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>

          {/* Counter */}
          {mediaUrls.length > 1 && fullscreenIndex !== null && (
            <View style={styles.fsCounter}>
              <Text style={styles.fsCounterText}>
                {fullscreenIndex + 1}/{mediaUrls.length}
              </Text>
            </View>
          )}

          {/* Scrollable images */}
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

      {/* Likes sheet */}
      <LikesSheet
        postId={showLikes ? post.id : null}
        likeCount={Math.max(post.like_count, liked ? 1 : 0)}
        onClose={() => setShowLikes(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.bg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    height: 44,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgTertiary,
  },
  userInfo: {
    gap: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  postTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  postHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  followButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.lg,
  },
  followingButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  followButtonText: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  moreButton: {
    padding: spacing.xxs,
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
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSecondary,
    gap: spacing.xs,
  },
  videoPlaceholderText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    opacity: 0.9,
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
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  actionText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.error,
  },
  bookmarkButton: {
    marginLeft: "auto",
  },
  postDescription: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxs,
  },
  description: {
    ...typography.bodyMd,
    color: colors.textSecondary,
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
  likedByRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  likedByText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  likedByBold: {
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },
  likedByTappable: {
    textDecorationLine: "underline",
    opacity: 0.9,
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
