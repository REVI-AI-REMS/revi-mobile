import { CommentsSheet } from "@/components/social/CommentsSheet";
import { PostCard, PostCardSkeleton } from "@/components/social/PostCard";
import { PostOptionsSheet } from "@/components/social/PostOptionsSheet";
import { ReelsOverlay } from "@/components/social/ReelsOverlay";
import { Fonts } from "@/constants/theme";
import {
    useFollowMutation,
    useLikePostMutation,
} from "@/hooks/mutations/use-feed-mutations";
import {
    useBookmarkMutation,
    useBookmarks,
    useRemoveBookmarkMutation,
} from "@/hooks/queries/use-bookmarks";
import { usePost } from "@/hooks/queries/use-feed";
import { useUserFollowing } from "@/hooks/queries/use-relationships";
import { useVideoPlayer } from "expo-video";
import { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// No longer hardcoded
// const CURRENT_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";

const baseScreenOptions = {
  title: "Post",
  headerStyle: { backgroundColor: "#0F0F10" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
  },
  headerShadowVisible: false,
  // "minimal" removes the back title — otherwise iOS prints the previous
  // route's name (currently "(tabs)" — the Expo Router group id) next to
  // the chevron, which looks like a dev leak.
  headerBackButtonDisplayMode: "minimal" as const,
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: post, isLoading, error, refetch } = usePost(id);
  const { data: following = [] } = useUserFollowing(currentUserId);
  const { data: bookmarks = [] } = useBookmarks();

  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [optionsPost, setOptionsPost] = useState<PostRead | null>(null);
  const [reelsPost, setReelsPost] = useState<PostRead | null>(null);

  const { mutate: likePost, isPending: likePending } = useLikePostMutation();
  const { mutate: followUser } = useFollowMutation();
  const { mutate: addBookmark } = useBookmarkMutation();
  const { mutate: removeBookmark } = useRemoveBookmarkMutation();

  const isFollowing = useMemo(
    () =>
      post ? following.some((f) => f.following_id === post.author_id) : false,
    [following, post],
  );

  const isBookmarked = useMemo(
    () => (post ? bookmarks.some((b) => b.id === post.id) : false),
    [bookmarks, post],
  );

  const handleLike = useCallback(
    (postId: string, currentlyLiked: boolean) =>
      likePost({ postId, isLiked: currentlyLiked }),
    [likePost],
  );

  const handleFollow = useCallback(
    (authorId: string, currentlyFollowing: boolean) =>
      followUser({ userId: authorId, isFollowing: currentlyFollowing }),
    [followUser],
  );

  const handleBookmark = useCallback(
    (postId: string, currentlyBookmarked: boolean) => {
      if (currentlyBookmarked) removeBookmark(postId);
      else addBookmark(postId);
    },
    [addBookmark, removeBookmark],
  );

  const handleAuthorPress = useCallback(
    (authorId: string) => {
      router.push({
        pathname: "/profile/[userId]",
        params: { userId: authorId },
      });
    },
    [router],
  );

  const handleComment = useCallback(
    (postId: string) => setCommentsPostId(postId),
    [],
  );
  const handleMore = useCallback((p: PostRead) => setOptionsPost(p), []);
  const handleVideoPress = useCallback((p: PostRead) => setReelsPost(p), []);

  const setActiveVideoId = useVideoStore((s) => s.setActiveVideoId);
  const postIsVideo =
    !!post &&
    (post.media_type === "video" ||
      post.media_type === "video_upload" ||
      !!post.media_url?.includes(".m3u8"));

  const videoPlayer = useVideoPlayer(
    postIsVideo && post?.media_url ? { uri: post.media_url } : null,
    (p) => { p.loop = true; p.muted = true; },
  );

  useEffect(() => {
    if (post && postIsVideo) {
      videoPlayer.play();
      setActiveVideoId(post.id);
    }
    return () => {
      videoPlayer.pause();
      setActiveVideoId(null);
    };
  }, [post?.id, postIsVideo, videoPlayer, setActiveVideoId]);

  const [isMuted, setIsMuted] = useState(true);
  useEffect(() => {
    videoPlayer.muted = isMuted;
  }, [videoPlayer, isMuted]);
  const handleToggleMute = useCallback(() => setIsMuted((m) => !m), []);

  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        <Stack.Screen options={{ ...baseScreenOptions, headerShown: true }} />
        <PostCardSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.container, styles.centered]}
      >
        <Stack.Screen
          options={{
            ...baseScreenOptions,
            headerShown: true,
            title: "Not found",
          }}
        />
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Post not found or failed to load</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Hide the Stack header while ReelsOverlay is open — the overlay wants
  // the full screen including the status bar area, and keeping the header
  // visible would stack it on top of the overlay with ReelsOverlay's own
  // back button — two back buttons, two headers.
  const showHeader = !reelsPost;

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        <Stack.Screen
          options={{ ...baseScreenOptions, headerShown: showHeader }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PostCard
            post={post}
            currentUserId={currentUserId || ""}
            isFollowing={isFollowing}
            isBookmarked={isBookmarked}
            onLike={handleLike}
            onFollow={handleFollow}
            onBookmark={handleBookmark}
            onAuthorPress={handleAuthorPress}
            onComment={handleComment}
            onMore={handleMore}
            onVideoPress={handleVideoPress}
            videoPlayer={videoPlayer}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </ScrollView>

        <CommentsSheet
          postId={commentsPostId}
          currentUserId={currentUserId || ""}
          onClose={() => setCommentsPostId(null)}
        />

        <PostOptionsSheet
          post={optionsPost}
          currentUserId={currentUserId || ""}
          onClose={() => setOptionsPost(null)}
        />
      </SafeAreaView>

      {reelsPost && (
        <ReelsOverlay
          initialPost={reelsPost}
          feedVideoPosts={[]}
          currentUserId={currentUserId || ""}
          onClose={() => setReelsPost(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    color: "#666666",
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
});
