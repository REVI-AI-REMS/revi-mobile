import { Fonts } from "@/constants/theme";
import { useBookmarks, useUserPosts, useUserStats } from "@/hooks";
import { feedKeys } from "@/hooks/queries/use-feed";
import type { PostRead } from "@/scripts/services/social/types";
import { useAuthStore } from "@/stores/auth.store";
import { useVideoStore } from "@/stores/video.store";
import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "@/components/ExpoImage";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Design Tokens (Bridged from Reference) ──────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const colors = {
  bg: "#0F0F10",
  bgSecondary: "#1C1C1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textMuted: "#52525B",
  border: "#27272A",
  transparent: "transparent",
};

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
};

const radius = {
  full: 9999,
};

const typography = {
  displaySm: { fontSize: 22, fontFamily: Fonts.bold },
  h2: { fontSize: 18, fontFamily: Fonts.bold },
  bodyMd: { fontSize: 13, fontFamily: Fonts.regular },
  bodySm: { fontSize: 12, fontFamily: Fonts.regular },
};

const layout = {
  gridColumns: 3,
  gridGap: 2,
  screenPadding: 16,
  minTouchTarget: 44,
  get gridThumbSize() {
    return (
      (SCREEN_WIDTH - (this.gridColumns - 1) * this.gridGap) / this.gridColumns
    );
  },
};

const NUM_COLUMNS = layout.gridColumns;
const GRID_GAP = layout.gridGap;
const THUMB_SIZE = layout.gridThumbSize;

// ─── Types ───────────────────────────────────────────────────────────────────

const PROFILE_TABS = ["posts", "saved", "tagged"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

interface TabIconMap {
  posts: keyof typeof Ionicons.glyphMap;
  saved: keyof typeof Ionicons.glyphMap;
  tagged: keyof typeof Ionicons.glyphMap;
}

const TAB_ICONS: TabIconMap = {
  posts: "grid-outline",
  saved: "bookmark-outline",
  tagged: "pricetag-outline",
};

const DEFAULT_AVATAR =
  process.env.EXPO_PUBLIC_DEFAULT_AVATAR_URL ?? "https://ui-avatars.com/api/?background=333&color=fff&name=U";

// ─── Sub-components ──────────────────────────────────────────────────────────

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

  // Read cached thumbnail from the store (populated when post was seen in the feed)
  const cachedThumbnail = useVideoStore((s) => s.thumbnails[post.id] ?? null);
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const [localThumb, setLocalThumb] = useState<string | null>(cachedThumbnail);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!isVideo || localThumb || generatingRef.current) return;
    if (
      post.media_type === "video_upload" &&
      !post.media_url?.includes(".m3u8")
    )
      return; // still transcoding

    generatingRef.current = true;
    generateVideoThumbnail(post.media_url)
      .then((uri) => {
        if (uri) {
          setLocalThumb(uri);
          setThumbnail(post.id, uri);
        }
      })
      .catch(() => {})
      .finally(() => {
        generatingRef.current = false;
      });
  }, [
    isVideo,
    localThumb,
    post.media_url,
    post.media_type,
    post.id,
    setThumbnail,
  ]);

  const imageSource = isVideo ? localThumb : post.media_url;

  return (
    <Pressable onPress={onPress} style={styles.gridCell}>
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.gridImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`profile-${post.id}`}
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const user = useAuthStore((s) => s.user);

  // Invalidate user posts every time this tab comes into focus so a freshly
  // uploaded post always appears without waiting for staleTime to expire.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: feedKeys.userPosts(user.id) });
      }
    }, [user?.id, queryClient]),
  );

  // Fetch user posts by ID instead of search for better reliability
  const { data: userPosts = [] } = useUserPosts(user?.id ?? null);
  const { data: bookmarksData } = useBookmarks();
  const { data: stats } = useUserStats(user?.id ?? null);

  const gridPosts = userPosts;
  const savedPosts = useMemo(() => bookmarksData ?? [], [bookmarksData]);

  const activePosts = activeTab === "saved" ? savedPosts : gridPosts;

  const handleTabPress = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  const handleSettings = useCallback(() => {
    router.push("/profile/settings");
  }, [router]);

  const handleEditProfile = useCallback(() => {
    router.push("/profile/edit-profile");
  }, [router]);

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
    const full = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
    return full || user?.username || "—";
  }, [user]);

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Pressable
            style={styles.avatarWrapper}
            onPress={handleEditProfile}
          >
            <Image
              source={{ uri: user?.avatar ?? DEFAULT_AVATAR }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
            <View style={styles.cameraBtn}>
              <Ionicons name="camera-outline" size={13} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.displayName}>{displayName}</Text>
          {user?.username ? (
            <Text style={styles.username}>@{user.username}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <StatItem value={gridPosts.length} label="Posts" />
            <StatItem value={stats?.follower_count ?? 0} label="Followers" />
            <StatItem value={stats?.following_count ?? 0} label="Following" />
          </View>
          <Pressable
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          {PROFILE_TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => handleTabPress(tab)}
              >
                <Ionicons
                  name={TAB_ICONS[tab]}
                  size={22}
                  color={isActive ? colors.textPrimary : colors.textTertiary}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [
      user,
      displayName,
      gridPosts.length,
      stats,
      activeTab,
      handleTabPress,
      handleEditProfile,
    ],
  );

  const ListEmptyComponent = useMemo(
    () =>
      activeTab === "tagged" ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="pricetag-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptyStateTitle}>No tagged posts</Text>
          <Text style={styles.emptyStateSubtitle}>
            When people tag you in posts, they'll appear here.
          </Text>
        </View>
      ) : activeTab === "saved" ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="bookmark-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptyStateTitle}>No saved posts</Text>
          <Text style={styles.emptyStateSubtitle}>
            Tap the bookmark icon on posts to save them here.
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>No posts yet</Text>
        </View>
      ),
    [activeTab],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerUsername}>
          {user?.username ? `@${user.username}` : "Profile"}
        </Text>
        <Pressable
          style={styles.headerButton}
          hitSlop={8}
          onPress={handleSettings}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* FlatList replaces ScrollView — virtualizes the grid */}
      <FlatList
        data={activeTab === "tagged" ? [] : activePosts}
        keyExtractor={keyExtractor}
        renderItem={renderGridItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={
          activePosts.length > 0 ? columnWrapperStyle : undefined
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },

  headerUsername: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },
  headerButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scrollContent: {
    paddingBottom: 120,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: spacing.md,
    overflow: "visible",
    backgroundColor: colors.bgSecondary,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3A3A3C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: AVATAR_SIZE / 2,
  },
  displayName: {
    ...typography.displaySm,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  username: {
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
  // Edit Profile
  editProfileButton: {
    paddingHorizontal: spacing.xxl,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSecondary,
  },
  editProfileText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    lineHeight: 16,
    color: colors.textPrimary,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  tabItemActive: {
    borderBottomColor: colors.textPrimary,
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
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
