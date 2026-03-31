import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { useSearch, useUserStats } from "@/src/hooks";
import { useFollowMutation } from "@/src/hooks/mutations/use-feed-mutations";
import { useUserFollowing } from "@/src/hooks/queries/use-relationships";
import type { PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Constants ──────────────────────────────────────────────────────────────

const currentUserId = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const colors = {
  bg: "#0F0F10",
  bgSecondary: "#1C1C1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textMuted: "#52525B",
  border: "#27272A",
  accent: "#6366F1",
};

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 48,
};

const layout = {
  gridColumns: 3,
  gridGap: 2,
  screenPadding: 16,
  get gridThumbSize() {
    return (
      (SCREEN_WIDTH - (this.gridColumns - 1) * this.gridGap) /
      this.gridColumns
    );
  },
};

const NUM_COLUMNS = layout.gridColumns;
const GRID_GAP = layout.gridGap;
const THUMB_SIZE = layout.gridThumbSize;
const AVATAR_SIZE = 80;

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=333&color=fff&name=U";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatItem = React.memo(function StatItem({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
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

  const imageUri = isVideo ? null : post.media_url;

  return (
    <Pressable onPress={onPress} style={styles.gridCell}>
      {imageUri ? (
        <ExpoImage
          source={{ uri: imageUri }}
          style={styles.gridImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`user-profile-${post.id}`}
          transition={0}
        />
      ) : (
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

  // Data
  const { data: searchData } = useSearch(userId ?? "");
  const { data: stats } = useUserStats(userId ?? null);
  const { data: followingList } = useUserFollowing(currentUserId || null);
  const followMutation = useFollowMutation();

  const gridPosts = useMemo(
    () => searchData?.posts ?? [],
    [searchData?.posts],
  );

  const isFollowing = useMemo(() => {
    if (!followingList || !userId) return false;
    return followingList.some(
      (f: { following_id: string }) => f.following_id === userId,
    );
  }, [followingList, userId]);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const displayName = userId ? `@${userId.slice(0, 8)}` : "";

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <ExpoImage
              source={{ uri: DEFAULT_AVATAR }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.statsRow}>
            <StatItem value={gridPosts.length} label="Posts" />
            <StatItem value={stats?.follower_count ?? 0} label="Followers" />
            <StatItem value={stats?.following_count ?? 0} label="Following" />
          </View>

          {/* Follow / Unfollow Button */}
          {currentUserId && currentUserId !== userId && (
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

        {/* Grid Divider */}
        <View style={styles.gridDivider}>
          <Ionicons
            name="grid-outline"
            size={22}
            color={colors.textPrimary}
          />
        </View>
      </View>
    ),
    [
      displayName,
      gridPosts.length,
      stats,
      isFollowing,
      handleFollowToggle,
      followMutation.isPending,
      userId,
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
        title={displayName}
        onBackPress={handleBack}
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
    borderRadius: AVATAR_SIZE / 2,
  },
  displayName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
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
    fontSize: 18,
    fontFamily: Fonts.bold,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    lineHeight: 16,
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
    borderColor: "#333333",
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    lineHeight: 16,
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
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
