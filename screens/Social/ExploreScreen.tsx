import { Fonts } from "@/constants/theme";
import { useMainFeed } from "@/hooks/queries/use-feed";
import { useSearch } from "@/hooks/queries/use-search";
import type { PostRead, UserSync } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "@/components/ExpoImage";
import { useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Keyboard,
    ListRenderItemInfo,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---- Design Constants (Bridged from reference) -------------------------------

const colors = {
  bg: "#0F0F10",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textMuted: "#52525B",
  accent: "#A855F7", // Purple accent
  border: "#27272A",
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const radius = {
  sm: 4,
  md: 8,
  lg: 12,
};

const typography = {
  h1: { fontSize: 24, fontFamily: Fonts.bold },
  displaySm: { fontSize: 20, fontFamily: Fonts.bold },
  bodyMd: { fontSize: 13, fontFamily: Fonts.bold },
  labelLg: { fontSize: 15, fontFamily: Fonts.regular },
  labelMd: { fontSize: 13, fontFamily: Fonts.medium },
  labelSm: { fontSize: 11, fontFamily: Fonts.regular },
};

const animation = {
  fast: 200,
  normal: 300,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const SCREEN_PADDING = 0; // The grid typically spans full width
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const DEFAULT_AVATAR =
  process.env.EXPO_PUBLIC_DEFAULT_AVATAR_URL ?? "https://ui-avatars.com/api/?background=333&color=fff&name=U";
const DEFAULT_BLURHASH = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

// ─── Dev location (match social feed) ────────────────────────────────────────

const DEV_LOCATION = {
  latitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT ?? "6.5244"),
  longitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG ?? "3.3792"),
  radius_km: 20,
  limit: 60,
};

// ---- Skeleton placeholder component -----------------------------------------

const SkeletonGrid = React.memo(function SkeletonGrid() {
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <View style={styles.skeletonContainer}>
      {Array.from(
        { length: Math.ceil(items.length / NUM_COLUMNS) },
        (_, row) => (
          <View key={row} style={styles.skeletonRow}>
            {items
              .slice(row * NUM_COLUMNS, row * NUM_COLUMNS + NUM_COLUMNS)
              .map((i) => (
                <View key={i} style={styles.skeletonThumb} />
              ))}
          </View>
        ),
      )}
    </View>
  );
});

// ---- Memoised sub-components -------------------------------------------------

interface GridThumbnailProps {
  post: PostRead;
  onPress?: () => void;
}

const GridThumbnail = React.memo(function GridThumbnail({
  post,
  onPress,
}: GridThumbnailProps) {
  const isVideo =
    post.media_type === "video" ||
    post.media_type === "video_upload" ||
    post.media_url?.includes(".m3u8");
  const isCarousel =
    post.media_type === "carousel" && (post.media_urls?.length ?? 0) > 1;

  const thumbnailUri = useVideoStore((s) =>
    isVideo ? (s.thumbnails[post.id] ?? null) : null,
  );
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!isVideo || thumbnailUri || thumbFailed) return;
    let cancelled = false;
    generateVideoThumbnail(post.media_url).then((uri) => {
      if (cancelled) return;
      if (uri) setThumbnail(post.id, uri);
      else setThumbFailed(true);
    });
    return () => { cancelled = true; };
  }, [isVideo, thumbnailUri, thumbFailed, post.id, post.media_url, setThumbnail]);

  // Reset image error state when the post changes (FlatList cell recycling).
  useEffect(() => { setImgError(false); }, [post.id]);

  // For non-video posts prefer media_url, fall back to first carousel URL.
  const imageSource = isVideo
    ? thumbnailUri
    : (post.media_url || post.media_urls?.[0] || null);

  const showImage = imageSource && !imgError;

  return (
    <Pressable style={styles.thumbWrapper} onPress={onPress}>
      {showImage ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`explore-${post.id}`}
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          transition={150}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      {isVideo && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      )}
      {isCarousel && (
        <View style={styles.carouselBadge}>
          <Ionicons name="copy-outline" size={12} color="#FFF" />
        </View>
      )}
      {post.like_count > 0 && (
        <View style={styles.likeBadge}>
          <Ionicons name="heart" size={10} color="#FF2D55" />
          <Text style={styles.likeBadgeText}>
            {post.like_count >= 1000
              ? `${(post.like_count / 1000).toFixed(1)}k`
              : post.like_count}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

interface UserChipProps {
  user: UserSync;
  onPress?: () => void;
}

const UserChip = React.memo(function UserChip({
  user,
  onPress,
}: UserChipProps) {
  const initials = (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "");

  return (
    <TouchableOpacity
      style={styles.userChip}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={styles.userChipAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
        />
      ) : (
        <View style={[styles.userChipAvatar, styles.userAvatarPlaceholder]}>
          <Text style={styles.userAvatarText}>
            {initials || user.username?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
      )}
      <Text style={styles.userChipName} numberOfLines={1}>
        {user.username}
      </Text>
    </TouchableOpacity>
  );
});

interface HistoryRowProps {
  item: string;
  onTap: (item: string) => void;
  onRemove: (item: string) => void;
}

const HistoryRow = React.memo(function HistoryRow({
  item,
  onTap,
  onRemove,
}: HistoryRowProps) {
  const handleTap = useCallback(() => onTap(item), [item, onTap]);
  const handleRemove = useCallback(() => onRemove(item), [item, onRemove]);

  return (
    <TouchableOpacity
      style={styles.historyItem}
      activeOpacity={0.7}
      onPress={handleTap}
    >
      <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
      <Text style={styles.historyText}>{item}</Text>
      <TouchableOpacity
        onPress={handleRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

interface SectionHeaderProps {
  title: string;
  trailing?: React.ReactNode;
}

const SectionHeader = React.memo(function SectionHeader({
  title,
  trailing,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing}
    </View>
  );
});

// ---- Main screen ------------------------------------------------------------

const HISTORY_STORAGE_KEY = "@revi/search-history";
const HISTORY_MAX = 15;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted search history on mount. historyLoaded guards the save
  // effect below so the first render doesn't overwrite the stored value
  // with an empty array before we read it.
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_STORAGE_KEY)
      .then((v) => {
        if (v) {
          try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed))
              setHistory(parsed.filter((x) => typeof x === "string"));
          } catch {
            // corrupt — ignore
          }
        }
      })
      .finally(() => setHistoryLoaded(true));
  }, []);

  // Persist history whenever it changes — only after the initial load has
  // completed so we never clobber stored entries with an empty array.
  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)).catch(
      () => {},
    );
  }, [history, historyLoaded]);

  // Main feed data (useInfiniteQuery — flatten pages)
  const { data: feedData, isLoading: feedLoading } = useMainFeed(DEV_LOCATION);

  const feedPosts = React.useMemo(
    () => feedData?.pages.flat() ?? [],
    [feedData?.pages],
  );

  // Subscribe to thumbnails so the grid re-renders as video stills arrive.
  const thumbnails = useVideoStore((s) => s.thumbnails);

  // Only show posts that have something to display. Video posts without a
  // generated thumbnail are hidden — they look like broken blank tiles.
  const gridPosts = React.useMemo(() => {
    return feedPosts.filter((p) => {
      const isVideo =
        p.media_type === "video" ||
        p.media_type === "video_upload" ||
        p.media_url?.includes(".m3u8");
      if (isVideo) return Boolean(thumbnails[p.id]);
      return Boolean(p.media_url || p.media_urls?.[0]);
    });
  }, [feedPosts, thumbnails]);

  // ─── Pre-generate thumbnails for video posts ───────────────────────────────
  // HLS thumbnailing (master.m3u8 → variant.m3u8 → .ts segment → decode) takes
  // several seconds per video. Without this, each grid cell waits until its
  // own useEffect fires before starting — result is blank tiles for the whole
  // time the user is looking at the grid. This runs as soon as feed data
  // arrives (or the screen mounts with cached data) with a small concurrency
  // so we don't hammer the device. Cached results are shared with the Social
  // screen via useVideoStore.
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const thumbnailsRef = useRef(useVideoStore.getState().thumbnails);
  useEffect(() => {
    thumbnailsRef.current = useVideoStore.getState().thumbnails;
  });
  useEffect(() => {
    const videoPosts = feedPosts.filter(
      (p) =>
        (p.media_type === "video" ||
          p.media_type === "video_upload" ||
          p.media_url?.includes(".m3u8")) &&
        !thumbnailsRef.current[p.id],
    );
    if (!videoPosts.length) return;

    let cancelled = false;
    const CONCURRENCY = 3;
    const run = async () => {
      for (let i = 0; i < videoPosts.length; i += CONCURRENCY) {
        if (cancelled) break;
        await Promise.allSettled(
          videoPosts.slice(i, i + CONCURRENCY).map(async (post) => {
            if (cancelled || thumbnailsRef.current[post.id]) return;
            const uri = await generateVideoThumbnail(post.media_url);
            if (uri && !cancelled) {
              setThumbnail(post.id, uri);
              thumbnailsRef.current = {
                ...thumbnailsRef.current,
                [post.id]: uri,
              };
            }
          }),
        );
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [feedPosts, setThumbnail]);

  // Search results
  const {
    data: searchResults,
    isFetching: searchLoading,
    isError: searchError,
    refetch: refetchSearch,
  } = useSearch(debouncedQ);

  const filteredPosts = searchResults?.posts ?? [];
  const filteredUsers = searchResults?.users ?? [];

  // Animated cancel button width
  const cancelOpacity = useSharedValue(0);

  useEffect(() => {
    cancelOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: animation.normal,
    });
  }, [isFocused, cancelOpacity]);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
    width: cancelOpacity.value === 0 ? 0 : 70, // Estimate width for "Cancel"
    marginLeft: cancelOpacity.value === 0 ? 0 : spacing.sm,
  }));

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isSearching = debouncedQ.length >= 2;
  const hasResults = filteredPosts.length > 0 || filteredUsers.length > 0;

  // Handlers
  const handleFocus = useCallback(() => setIsFocused(true), []);

  const handleCancel = useCallback(() => {
    setQuery("");
    setDebouncedQ("");
    setIsFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQ("");
  }, []);

  const handleSubmit = useCallback(() => {
    const t = query.trim();
    if (!t) return;
    // Move to front if already present, otherwise prepend. Cap at HISTORY_MAX.
    setHistory((prev) =>
      [t, ...prev.filter((h) => h !== t)].slice(0, HISTORY_MAX),
    );
  }, [query]);

  const handleUserPress = useCallback(
    (userId: string) => {
      router.push({ pathname: "/profile/[userId]", params: { userId } });
    },
    [router],
  );

  const handleHistoryTap = useCallback((item: string) => {
    setQuery(item);
    setDebouncedQ(item);
    inputRef.current?.focus();
  }, []);

  const handleHistoryRemove = useCallback((item: string) => {
    setHistory((prev) => prev.filter((h) => h !== item));
  }, []);

  const handleClearHistory = useCallback(() => setHistory([]), []);

  // Grid item renderer
  const renderGridItem = useCallback(
    ({ item }: ListRenderItemInfo<PostRead>) => (
      <GridThumbnail
        post={item}
        onPress={() =>
          router.push({ pathname: "/post/[id]", params: { id: item.id } })
        }
      />
    ),
    [router],
  );

  const gridKeyExtractor = useCallback((item: PostRead) => item.id, []);

  const columnWrapperStyle = useMemo(() => ({ gap: GRID_GAP }), []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<PostRead> | null | undefined, index: number) => ({
      length: THUMB_SIZE,
      offset: (THUMB_SIZE + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    [],
  );

  // ---- Search results content ------------------------------------------------

  const renderSearchContent = () => {
    if (searchLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.hint}>Searching...</Text>
        </View>
      );
    }

    if (searchError) {
      return (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={styles.hint}>Search failed — try again</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchSearch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasResults) {
      return (
        <Animated.View
          entering={FadeIn.duration(animation.normal)}
          style={styles.center}
        >
          <Ionicons name="search-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nothing found</Text>
          <Text style={styles.emptySubtitle}>Try different keywords</Text>
        </Animated.View>
      );
    }

    return (
      <FlatList
        data={filteredPosts}
        keyExtractor={gridKeyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={
          filteredPosts.length > 0 ? columnWrapperStyle : undefined
        }
        renderItem={renderGridItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        windowSize={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={
          <>
            {/* Users horizontal row. Using ScrollView (not FlatList) because
                nesting a horizontal VirtualizedList inside the vertical posts
                FlatList via ListHeaderComponent produces a runtime warning
                and offers no perf benefit — users list is capped at 20. */}
            {filteredUsers.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(animation.normal)}
                style={styles.section}
              >
                <SectionHeader title="People" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.usersRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredUsers.map((u) => (
                    <UserChip
                      key={u.id}
                      user={u}
                      onPress={() => handleUserPress(u.id)}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Posts section header */}
            {filteredPosts.length > 0 && <SectionHeader title="Posts" />}
          </>
        }
      />
    );
  };

  // ---- Idle content (no search active) ---------------------------------------

  const renderIdleContent = () => {
    if (isFocused && history.length > 0) {
      return (
        <Animated.View
          entering={FadeIn.duration(animation.fast)}
          exiting={FadeOut.duration(animation.fast)}
          style={styles.historyContainer}
        >
          <SectionHeader
            title="Recent Searches"
            trailing={
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            }
          />
          {history.map((item) => (
            <HistoryRow
              key={item}
              item={item}
              onTap={handleHistoryTap}
              onRemove={handleHistoryRemove}
            />
          ))}
        </Animated.View>
      );
    }

    if (feedLoading && feedPosts.length === 0) {
      return <SkeletonGrid />;
    }

    return (
      <FlatList
        data={gridPosts}
        keyExtractor={gridKeyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={columnWrapperStyle}
        renderItem={renderGridItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={styles.gridContent}
        // ListHeaderComponent={
        //   <SectionHeader title="Explore" />
        // }
        ListEmptyComponent={
          feedLoading ? (
            <SkeletonGrid />
          ) : (
            <View style={styles.center}>
              <Ionicons
                name="images-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.hint}>No posts yet</Text>
            </View>
          )
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search bar area */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search properties, people..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            selectionColor={colors.accent}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {isFocused && (
          <Animated.View style={cancelStyle}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {isSearching ? renderSearchContent() : renderIdleContent()}
      </View>
    </View>
  );
}

// ---- Styles -----------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 8,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search bar
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.labelLg,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    height: 40,
    justifyContent: "center",
    paddingLeft: 4,
  },
  cancelText: {
    ...typography.labelLg,
    color: colors.accent,
  },

  // Body
  body: {
    flex: 1,
  },

  // Sections
  section: {
    paddingBottom: 8,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  clearAllText: {
    ...typography.labelMd,
    color: colors.accent,
  },

  // History
  historyContainer: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyText: {
    flex: 1,
    ...typography.labelLg,
    color: colors.textPrimary,
  },

  // Users horizontal row
  usersRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 12,
  },
  userChip: {
    alignItems: "center",
    width: 72,
  },
  userChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 4,
    backgroundColor: "#27272A",
  },
  userAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
  },
  userChipName: {
    ...typography.labelSm,
    color: colors.textSecondary,
    textAlign: "center",
    width: 72,
  },

  // Grid
  gridContent: {
    paddingBottom: 24,
  },
  gridRow: { gap: GRID_GAP },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },
  videoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },
  likeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  likeBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: "#2C2C2E",
    borderRadius: 18,
    marginTop: 4,
  },
  retryText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  // Skeleton
  skeletonContainer: {
    padding: 0,
    gap: GRID_GAP,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
  skeletonThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: "#1C1C1E",
  },

  // Empty state
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyTitle: {
    ...typography.displaySm,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.labelLg,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  hint: {
    ...typography.labelMd,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
