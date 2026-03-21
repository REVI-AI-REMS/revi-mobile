import { Fonts } from "@/src/constants/theme";
import { useMainFeed } from "@/src/hooks/queries/use-feed";
import { useSearch } from "@/src/hooks/queries/use-search";
import type { PostRead, UserSync } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  Pressable,
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

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=333&color=fff&name=U";
const DEFAULT_BLURHASH = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

// ─── Dev location (match social feed) ────────────────────────────────────────

const DEV_LOCATION = {
  latitude: 6.5244,
  longitude: 3.3792,
  radius_km: 20,
  limit: 60,
};

// ---- Skeleton placeholder component -----------------------------------------

const SkeletonGrid = React.memo(function SkeletonGrid() {
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: Math.ceil(items.length / NUM_COLUMNS) }, (_, row) => (
        <View key={row} style={styles.skeletonRow}>
          {items
            .slice(row * NUM_COLUMNS, row * NUM_COLUMNS + NUM_COLUMNS)
            .map((i) => (
              <View key={i} style={styles.skeletonThumb} />
            ))}
        </View>
      ))}
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
  const isCarousel = post.media_type === "carousel" && (post.media_urls?.length ?? 0) > 1;

  return (
    <Pressable style={styles.thumbWrapper} onPress={onPress}>
      <Image
        source={{ uri: post.media_url }}
        style={styles.thumb}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={`explore-${post.id}`}
        placeholder={{ blurhash: DEFAULT_BLURHASH }}
        transition={0}
      />
      {isCarousel && (
        <View style={styles.carouselBadge}>
          <Ionicons name="copy-outline" size={12} color="#FFF" />
        </View>
      )}
    </Pressable>
  );
});

interface UserChipProps {
  user: UserSync;
  onPress?: () => void;
}

const UserChip = React.memo(function UserChip({ user, onPress }: UserChipProps) {
  const initials = (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "");

  return (
    <TouchableOpacity style={styles.userChip} activeOpacity={0.7} onPress={onPress}>
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
          <Text style={styles.userAvatarText}>{initials || user.username?.[0]?.toUpperCase() || "?"}</Text>
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

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Main feed data
  const {
    data: feedPosts = [],
    isLoading: feedLoading,
  } = useMainFeed(DEV_LOCATION);

  // Search results
  const {
    data: searchResults,
    isFetching: searchLoading,
    isError: searchError,
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
    if (t && !history.includes(t)) {
      setHistory((prev) => [t, ...prev].slice(0, 15));
    }
  }, [query, history]);

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
        onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
      />
    ),
    [router]
  );

  const gridKeyExtractor = useCallback((item: PostRead) => item.id, []);

  const columnWrapperStyle = useMemo(
    () => ({ gap: GRID_GAP }),
    []
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<PostRead> | null | undefined, index: number) => ({
      length: THUMB_SIZE,
      offset: (THUMB_SIZE + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
      index,
    }),
    []
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
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.hint}>Search failed — check connection</Text>
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
        columnWrapperStyle={filteredPosts.length > 0 ? columnWrapperStyle : undefined}
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
            {/* Users horizontal scroll */}
            {filteredUsers.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(animation.normal)}
                style={styles.section}
              >
                <SectionHeader title="People" />
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(u) => u.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.usersRow}
                  renderItem={({ item }) => (
                    <UserChip
                      user={item}
                      onPress={() => console.log("User tapped:", item.id)}
                    />
                  )}
                />
              </Animated.View>
            )}

            {/* Posts section header */}
            {filteredPosts.length > 0 && (
              <SectionHeader title="Posts" />
            )}
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
        data={feedPosts}
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
          feedLoading ? <SkeletonGrid /> : (
            <View style={styles.center}>
              <Ionicons name="images-outline" size={48} color={colors.textMuted} />
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
          <Ionicons
            name="search"
            size={20}
            color={colors.textTertiary}
          />
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
    position: "relative",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  carouselBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
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
