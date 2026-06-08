import { ScreenHeader } from "@/components";
import { FollowersSheet, FollowersSheetMode } from "@/components/social/FollowersSheet";
import { colors, layout, spacing, typography } from "@/constants/design";
import { formatCount } from "@/data/mock";
import { useFollowMutation } from "@/hooks/mutations/use-feed-mutations";
import { useUserFollowing, useUserProfile } from "@/hooks/queries/use-relationships";
import { useUserPosts } from "@/hooks/queries/use-feed";
import { useUserStats } from "@/hooks";
import type { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "@/components/ExpoImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuthStore } from "@/stores/auth.store";

// ─── Constants ──────────────────────────────────────────────────────────────

// No longer hardcoded — fetched from store
// const currentUserId = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";

const NUM_COLUMNS = layout.gridColumns;
const GRID_GAP = layout.gridGap;
const THUMB_SIZE = layout.gridThumbSize;
const AVATAR_SIZE = 80;

const DEFAULT_AVATAR =
  process.env.EXPO_PUBLIC_DEFAULT_AVATAR_URL ?? "https://ui-avatars.com/api/?background=333&color=fff&name=U";

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatItem = React.memo(function StatItem({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.statValue}>{formatCount(value)}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const GridThumbnail = React.memo(function GridThumbnail({
  post,
  onPress,
}: {
  post: PostRead;
  onPress: () => void;
}) {
  const isVideo =
    post.media_type === "video" ||
    post.media_type === "video_upload" ||
    post.media_url?.includes(".m3u8");

  // Pull from the shared video store first (populated by Social/Explore);
  // fall back to post.thumbnail_url which the backend now supplies.
  const storedThumb = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const [thumbFailed, setThumbFailed] = useState(false);
  const videoThumb = storedThumb ?? post.thumbnail_url ?? null;

  // Generate the thumbnail on the fly when the store doesn't have one and
  // the backend didn't supply post.thumbnail_url. Without this, users who
  // open a profile directly (without first scrolling through Social/Explore)
  // see only the play-circle placeholder for video posts.
  useEffect(() => {
    if (!isVideo || videoThumb || thumbFailed || !post.media_url) return;
    let cancelled = false;
    generateVideoThumbnail(post.media_url).then((uri) => {
      if (cancelled) return;
      if (uri) setThumbnail(post.id, uri);
      else setThumbFailed(true);
    });
    return () => { cancelled = true; };
  }, [isVideo, videoThumb, thumbFailed, post.id, post.media_url, setThumbnail]);

  // The image to display: thumbnail for videos, media_url for images.
  const imageSource = isVideo ? videoThumb : (post.media_url || null);

  return (
    <Pressable onPress={onPress} style={styles.gridCell}>
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.gridImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`user-profile-${post.id}`}
          transition={0}
        />
      ) : (
        // Only shown for video posts that genuinely have no thumbnail yet
        <View style={styles.gridVideoPlaceholder}>
          <Ionicons
            name="play-circle-outline"
            size={24}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      )}
      {isVideo && (
        <View style={styles.gridVideoBadge}>
          <Ionicons name="play" size={10} color="#FFF" />
        </View>
      )}
    </Pressable>
  );
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: userPosts = [] } = useUserPosts(userId ?? null);
  const { data: profile } = useUserProfile(userId ?? null);
  const { data: stats } = useUserStats(userId ?? null);
  
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: followingList } = useUserFollowing(currentUserId || null);
  const followMutation = useFollowMutation();

  const [followSheet, setFollowSheet] = useState<FollowersSheetMode | null>(null);

  const gridPosts = userPosts;

  const isFollowing = useMemo(() => {
    if (!followingList || !userId) return false;
    return followingList.some(
      (f: { following_id: string }) => f.following_id === userId,
    );
  }, [followingList, userId]);

  const handleFollowToggle = useCallback(() => {
    if (!userId) return;
    followMutation.mutate({ userId, isFollowing });
  }, [userId, isFollowing, followMutation]);

  const handlePostPress = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router],
  );

  const renderGridItem = useCallback(
    ({ item }: ListRenderItemInfo<PostRead>) => (
      <GridThumbnail post={item} onPress={() => handlePostPress(item.id)} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: PostRead) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<PostRead> | null | undefined, index: number) => ({
      length: THUMB_SIZE + GRID_GAP,
      offset: (THUMB_SIZE + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    [],
  );

  const columnWrapperStyle = useMemo(() => ({ gap: GRID_GAP }), []);

  const displayName = useMemo(() => {
    const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    return full || profile?.username || (userId ? userId.slice(0, 8) : "—");
  }, [profile, userId]);
  const handle = profile?.username ? `@${profile.username}` : "";
  const avatarUri = profile?.avatar || DEFAULT_AVATAR;

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {handle ? <Text style={styles.handle}>{handle}</Text> : null}
          <View style={styles.statsRow}>
            <StatItem value={gridPosts.length} label="Posts" />
            <StatItem
              value={stats?.follower_count ?? 0}
              label="Followers"
              onPress={() => setFollowSheet("followers")}
            />
            <StatItem
              value={stats?.following_count ?? 0}
              label="Following"
              onPress={() => setFollowSheet("following")}
            />
          </View>

          {currentUserId && currentUserId.toString() !== userId?.toString() && (
            <Pressable
              style={[
                styles.followButton,
                isFollowing && styles.followButtonOutline,
              ]}
              onPress={handleFollowToggle}
              disabled={followMutation.isPending}
            >
              {followMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followButtonTextOutline,
                  ]}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.gridDivider}>
          <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
        </View>
      </View>
    ),
    [
      displayName,
      handle,
      gridPosts.length,
      stats,
      isFollowing,
      handleFollowToggle,
      followMutation.isPending,
      userId,
      setFollowSheet,
    ],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="grid-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No posts yet</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={handle || displayName}
        onBackPress={() => router.back()}
        showBackButton
        showMenuButton={false}
      />

      <FlatList
        data={gridPosts}
        keyExtractor={keyExtractor}
        renderItem={renderGridItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={
          gridPosts.length > 0 ? columnWrapperStyle : undefined
        }
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        windowSize={7}
        maxToRenderPerBatch={9}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
      />

      <FollowersSheet
        userId={followSheet ? (userId ?? null) : null}
        initialTab={followSheet ?? "followers"}
        followerCount={stats?.follower_count ?? 0}
        followingCount={stats?.following_count ?? 0}
        onClose={() => setFollowSheet(null)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: spacing.md,
    overflow: "hidden",
    backgroundColor: colors.bgSecondary,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  displayName: {
    ...typography.displaySm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  handle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    gap: 32,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Follow Button
  followButton: {
    paddingHorizontal: spacing.xxl,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    minWidth: 120,
  },
  followButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  followButtonTextOutline: {
    color: colors.textSecondary,
  },

  // Grid Divider
  gridDivider: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  // Grid
  gridCell: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: colors.bgSecondary,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridVideoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  gridVideoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.section,
    paddingHorizontal: 40,
    gap: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
