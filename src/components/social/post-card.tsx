import { Fonts } from "@/src/constants/theme";
import type { PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { LikesSheet } from "./likes-sheet";
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
        <SkeletonBlock style={{ width: 72, height: 30, borderRadius: 100 }} />
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

// ─── Post Card ────────────────────────────────────────────────────────────────

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
  isVisible?: boolean;
}

export function PostCard({
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
  isVisible = false,
}: PostCardProps) {
  const isVideo =
    post.media_type === "video" || post.media_type === "video_upload";
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

  const openFullscreen = (idx: number) => {
    if (!isClosingRef.current) setFullscreenIndex(idx);
  };
  const closeFullscreen = () => {
    isClosingRef.current = true;
    setFullscreenIndex(null);
    setTimeout(() => { isClosingRef.current = false; }, 400);
  };

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
        <View style={styles.postUser}>
          <View style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{shortAuthorId(post.author_id)}</Text>
            <Text style={styles.postTime}>
              {formatRelativeTime(post.created_at)}
            </Text>
          </View>
        </View>
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

            return (
              <View
                key={i}
                style={[
                  styles.imageContainer,
                  isVideo && styles.videoContainer,
                ]}
              >
                <Animated.View
                  style={StyleSheet.absoluteFill}
                >
                  {isVideoUrl && !videoError ? (
                    <Video
                      ref={i === 0 ? videoRef : undefined}
                      source={{ uri: url }}
                      style={styles.postImage}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={isVisible}
                      isLooping
                      isMuted={isMuted}
                      useNativeControls={false}
                      onError={() => setVideoError(true)}
                    />
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
    marginTop: 16,
    backgroundColor: "#0F0F10",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
  },
  userInfo: {
    gap: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  postTime: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  postHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#2C2C2E",
    borderRadius: 100,
  },
  followingButton: {
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: "#1C1C1E",
    position: "relative",
  },
  videoContainer: {
    height: width * 1.25,
  },
  postImage: {
    width: "100%",
    height: "100%",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  likedText: {
    color: "#FF3B30",
  },
  bookmarkButton: {
    marginLeft: "auto",
  },
  postDescription: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3A3A3C",
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  likedByRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likedByText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  likedByBold: {
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
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
