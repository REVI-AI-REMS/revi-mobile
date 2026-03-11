import { Fonts } from "@/src/constants/theme";
import {
  useAddCommentMutation,
  useLikePostMutation,
} from "@/src/hooks/mutations/use-feed-mutations";
import { useMainFeed } from "@/src/hooks/queries/use-feed";
import type { MainFeedParams, PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const DEV_LOCATION: MainFeedParams = {
  latitude: 6.5244,
  longitude: 3.3792,
  radius_km: 20,
  limit: 50,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVideoPost(p: PostRead) {
  return p.media_type === "video" || p.media_type === "video_upload";
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function shortId(id: string) {
  return `@${id.slice(0, 8)}`;
}

// ─── Single Reel Item ─────────────────────────────────────────────────────────

interface ReelItemProps {
  post: PostRead;
  isActive: boolean;
  currentUserId: string;
  onComment: (postId: string) => void;
}

function ReelItem({ post, isActive, currentUserId, onComment }: ReelItemProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [muted, setMuted] = useState(false);
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

  // Play / pause when this reel enters or leaves viewport
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setPositionAsync(0).catch(() => {});
    }
  }, [isActive]);

  const isPlaying =
    status?.isLoaded && (status as { isPlaying?: boolean }).isPlaying;
  const isBuffering =
    status?.isLoaded && (status as { isBuffering?: boolean }).isBuffering;

  const togglePlay = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  return (
    <View style={[styles.reelContainer, { height }]}>
      {/* Video */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={togglePlay}
      >
        <Video
          ref={videoRef}
          source={{ uri: post.media_url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={muted}
          shouldPlay={isActive}
          onPlaybackStatusUpdate={setStatus}
        />
      </TouchableOpacity>

      {/* Gradient overlay — top (for status bar) */}
      <View style={styles.gradientTop} pointerEvents="none" />
      {/* Gradient overlay — bottom (for info) */}
      <View style={styles.gradientBottom} pointerEvents="none" />

      {/* Buffering spinner */}
      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator color="#FFF" size="large" />
        </View>
      )}

      {/* Paused indicator */}
      {!isPlaying && !isBuffering && (
        <View style={styles.pausedOverlay} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      {/* ── Right actions ─────────────────────────────────────── */}
      <View style={[styles.rightActions, { bottom: insets.bottom + 80 }]}>
        {/* Like */}
        <Animated.View style={heartAnimStyle}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={30}
              color={liked ? "#FF3B30" : "#FFF"}
            />
            <Text style={styles.actionLabel}>{formatCount(post.like_count)}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={28} color="#FFF" />
          <Text style={styles.actionLabel}>{formatCount(post.comment_count)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="arrow-redo-outline" size={28} color="#FFF" />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        {/* Mute */}
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

      {/* ── Bottom info ───────────────────────────────────────── */}
      <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 70 }]}>
        {/* Avatar + follow */}
        <View style={styles.authorRow}>
          <View style={styles.avatar} />
          <Text style={styles.authorName}>{shortId(post.author_id)}</Text>
        </View>

        {/* Caption */}
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Quick Comments Sheet (inline) ───────────────────────────────────────────

interface QuickCommentsProps {
  postId: string | null;
  currentUserId: string;
  onClose: () => void;
}

function QuickComments({ postId, currentUserId, onClose }: QuickCommentsProps) {
  const [text, setText] = useState("");
  const { mutate: addComment, isPending } = useAddCommentMutation();

  if (!postId) return null;

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    addComment(
      { content: t, post_id: postId, parent_id: null },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <View style={styles.commentsSheet}>
      <View style={styles.commentsHandle} />
      <TouchableOpacity style={styles.commentsClose} onPress={onClose}>
        <Ionicons name="close" size={22} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.commentsTitle}>Comments</Text>
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          autoFocus
          maxLength={500}
          editable={!isPending}
        />
        <TouchableOpacity
          style={[
            styles.commentSend,
            (!text.trim() || isPending) && styles.commentSendDisabled,
          ]}
          onPress={submit}
          disabled={!text.trim() || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Reels Screen ─────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUserId = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";

  const { data: allPosts = [] } = useMainFeed(DEV_LOCATION);
  const videoPosts = useMemo(
    () => allPosts.filter(isVideoPost),
    [allPosts],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<PostRead>>(null);

  // Jump to the tapped post once data loads
  useEffect(() => {
    if (!postId || videoPosts.length === 0) return;
    const idx = videoPosts.findIndex((p) => p.id === postId);
    if (idx > 0) {
      // Small delay to let FlatList render
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        setActiveIndex(idx);
      }, 100);
    }
  }, [postId, videoPosts]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

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
      />
    ),
    [activeIndex, commentsPostId, currentUserId],
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>

      {videoPosts.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#A855F7" size="large" />
          <Text style={styles.emptyText}>Loading reels…</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={videoPosts}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          scrollEnabled={!commentsPostId}
          decelerationRate="fast"
          snapToInterval={height}
          snapToAlignment="start"
        />
      )}

      {/* Inline comments sheet */}
      {commentsPostId && (
        <QuickComments
          postId={commentsPostId}
          currentUserId={currentUserId}
          onClose={() => setCommentsPostId(null)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    color: "#FFF",
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  // ─── Reel Item ──────────────────────────────────────────────────────────────
  reelContainer: {
    width,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "transparent",
    // iOS shadow hack for gradient feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 60 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  // ─── Right side actions ─────────────────────────────────────────────────────
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
  // ─── Bottom info ────────────────────────────────────────────────────────────
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
  // ─── Quick comments sheet ───────────────────────────────────────────────────
  commentsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    paddingTop: 16,
    zIndex: 200,
  },
  commentsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3C",
    alignSelf: "center",
    marginBottom: 16,
  },
  commentsClose: {
    position: "absolute",
    top: 16,
    right: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFF",
  },
  commentSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendDisabled: {
    backgroundColor: "#2C2C2E",
  },
});
