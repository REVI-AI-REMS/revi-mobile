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
    Platform,
    ScrollView,
    Share,
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
  likePending,
  currentUserId,
  videoPlayer,
  isMuted = true,
  onToggleMute,
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
  const [showLikes, setShowLikes] = useState(false);
  const liked = post.is_liked ?? false;
  const carouselRef = useRef<ScrollView>(null);
  const isClosingRef = useRef(false);

  const thumbnailUri = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const isActive = useVideoStore((s) => s.activeVideoId === post.id);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  // ─── Cell recycle reset ────────────────────────────────────────────────────
  // FlashList reuses the same component instance across posts. Without this,
  // local state (carousel index, modal state) leaks from the previous post
  // onto the new one. React's sanctioned "derive state from props during
  // render" pattern — the setState calls trigger one synchronous re-render
  // before children mount with stale values.
  const [lastPostId, setLastPostId] = useState(post.id);
  if (lastPostId !== post.id) {
    setLastPostId(post.id);
    setImageIndex(0);
    setFullscreenIndex(null);
    setShowLikes(false);
    setThumbnailFailed(false);
    // isMuted is global (driven by parent) — not reset here.
    // Video playback state lives on the hoisted player; nothing to clear.
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

  // Fallback thumbnail generation — runs if the parent-level pre-generator
  // hasn't cached one for this post yet. Uses an HLS-aware utility that
  // parses the .m3u8 manifest → extracts the first .ts segment → decodes
  // a frame.
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
    setThumbnail,
  ]);

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

  // Native share sheet. We use the app's deep-link scheme as the url so
  // apps that preview URLs (Messages, Mail) have something to render, and
  // include the caption + author as the message body. Swap the scheme to
  // a real web URL once we have `https://revi.ai/post/{id}` in place.
  const handleShare = async () => {
    try {
      const lines: string[] = [];
      if (post.caption) lines.push(`"${post.caption}"`);
      lines.push(`— ${shortAuthorId(post.author_id)} on Revi AI`);
      const message = lines.join("\n\n");
      const url = `reviaimobile://post/${post.id}`;
      await Share.share(
        Platform.OS === "ios"
          ? { url, message }
          : { message: `${message}\n${url}` },
        { dialogTitle: "Share this post" },
      );
    } catch {
      // User cancelled, or share sheet unavailable on this device — silent.
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
            {/* Avatar — shows profile image if available, otherwise initials circle */}
            {post.author_avatar ? (
              <Image
                source={{ uri: post.author_avatar }}
                style={styles.userAvatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarInitial}>
                  {(post.author_username ?? post.author_id).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {post.author_username ? `@${post.author_username}` : shortAuthorId(post.author_id)}
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
              // VideoView mounts only on the active card — one native
              // player drives the whole feed (see useFeedVideoPlayer).
              const canRenderVideo = isVideoUrl && isActive && !!videoPlayer;

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
                        {/* Layer 0: Dark fallback — always shown so card is never
                            pure black. Sits below both the thumbnail and VideoView. */}
                        <View style={styles.videoFallback}>
                          <Ionicons name="play-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
                        </View>

                        {/* Layer 1: Thumbnail — always rendered as base for
                            video posts so the card never looks empty. The
                            VideoView mounts on top once active. */}
                        {thumbnailUri && (
                          <Image
                            source={{ uri: thumbnailUri }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        )}

                        {/* Layer 2: VideoView bound to the hoisted player.
                            Mounts only when this card is active; source is
                            swapped by the parent via player.replace(). */}
                        {canRenderVideo && (
                          <VideoView
                            player={videoPlayer!}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            nativeControls={false}
                            fullscreenOptions={{ enable: false }}
                            allowsPictureInPicture={false}
                          />
                        )}

                        {/* Layer 3: Play button overlay — visible when not
                            actively playing (thumbnail mode). Tells users this
                            is a tappable video. Fades out once VideoView active. */}
                        {!canRenderVideo && (
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

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {formatCount(post.view_count)}
            </Text>
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

      {showLikes && (
        <LikesSheet
          postId={post.id}
          likeCount={Math.max(post.like_count, liked ? 1 : 0)}
          onClose={() => setShowLikes(false)}
        />
      )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgTertiary,
  },
  userAvatarInitial: {
    fontSize: 11,
    fontFamily: "System",
    fontWeight: "600",
    color: colors.textSecondary,
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
