import { ScreenHeader } from "@/components";
import { Fonts } from "@/constants/theme";
import {
    useBookmarks,
    useRemoveBookmarkMutation,
} from "@/hooks/queries/use-bookmarks";
import type { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { generateVideoThumbnail } from "@/utils/video-thumbnail";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const GRID_GAP = 8;
const HORIZONTAL_PADDING = 16;
const COLUMN_COUNT = 2;
const CARD_WIDTH =
  (width - HORIZONTAL_PADDING * 2 - GRID_GAP * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.1;

const DEFAULT_BLURHASH = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

type FilterType = "all" | "photo" | "video";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const normalized = isoString.endsWith("Z") ? isoString : isoString + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function isVideoPost(post: PostRead): boolean {
  return (
    post.media_type === "video" ||
    post.media_type === "video_upload" ||
    !!post.media_url?.includes(".m3u8")
  );
}

// ─── Saved card ───────────────────────────────────────────────────────────

interface SavedCardProps {
  post: PostRead;
  onPress: () => void;
  onRemove: () => void;
}

const SavedCard = memo(function SavedCard({
  post,
  onPress,
  onRemove,
}: SavedCardProps) {
  const isVideo = isVideoPost(post);
  const isCarousel =
    post.media_type === "carousel" && (post.media_urls?.length ?? 0) > 1;

  // Video URLs are HLS manifests which expo-image can't render. Read from
  // the shared video thumbnail store (same store Social/Explore populate),
  // and fall back to generating one on demand.
  const thumbnailUri = useVideoStore((s) =>
    isVideo ? (s.thumbnails[post.id] ?? null) : null,
  );
  const setThumbnail = useVideoStore((s) => s.setThumbnail);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    if (!isVideo || thumbnailUri || thumbFailed) return;
    let cancelled = false;
    generateVideoThumbnail(post.media_url).then((uri) => {
      if (cancelled) return;
      if (uri) setThumbnail(post.id, uri);
      else setThumbFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    isVideo,
    thumbnailUri,
    thumbFailed,
    post.id,
    post.media_url,
    setThumbnail,
  ]);

  const imageSource = isVideo ? thumbnailUri : post.media_url;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImageWrapper}>
        {imageSource ? (
          <ExpoImage
            source={{ uri: imageSource }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`saved-${post.id}`}
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={200}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardFallback]} />
        )}

        {/* Media-type badge (top-left) */}
        {(isVideo || isCarousel) && (
          <View style={styles.typeBadge}>
            <Ionicons
              name={isVideo ? "play" : "copy-outline"}
              size={12}
              color="#FFF"
            />
          </View>
        )}

        {/* Unsave button (top-right) */}
        <Pressable
          style={styles.unsaveBtn}
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Ionicons name="bookmark" size={14} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.cardFooter}>
        {post.author_avatar ? (
          <ExpoImage
            source={{ uri: post.author_avatar }}
            style={styles.uploaderAvatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.uploaderAvatar, styles.uploaderAvatarFallback]}>
            <Ionicons name="person" size={12} color="#888" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.uploadedByLabel} numberOfLines={1}>
            @{post.author_username ?? post.author_id.slice(0, 8)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeLabel}>
              {formatRelativeTime(post.created_at)}
            </Text>
            {post.like_count > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="heart" size={10} color="#FF2D55" />
                <Text style={styles.timeLabel}>{post.like_count}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const {
    data: bookmarks = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useBookmarks();

  const { mutate: removeBookmark } = useRemoveBookmarkMutation();

  // ─── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((post) => {
      const matchesSearch =
        !q ||
        post.caption?.toLowerCase().includes(q) ||
        post.author_id.toLowerCase().includes(q);
      const video = isVideoPost(post);
      const matchesType =
        activeFilter === "all" ||
        (activeFilter === "photo" && !video) ||
        (activeFilter === "video" && video);
      return matchesSearch && matchesType;
    });
  }, [bookmarks, query, activeFilter]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleOpenPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router],
  );

  const handleRemove = useCallback(
    (postId: string) => {
      Alert.alert(
        "Remove from saved?",
        "This post won't appear in your saved list anymore.",
        [
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removeBookmark(postId),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    },
    [removeBookmark],
  );

  const renderItem = useCallback(
    ({ item }: { item: PostRead }) => (
      <SavedCard
        post={item}
        onPress={() => handleOpenPost(item.id)}
        onRemove={() => handleRemove(item.id)}
      />
    ),
    [handleOpenPost, handleRemove],
  );

  const keyExtractor = useCallback((p: PostRead) => p.id, []);

  // ─── Header (search + filter chips) ─────────────────────────────────────
  const ListHeader = (
    <>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your saved here"
          placeholderTextColor="#666666"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoriesRow}>
        <TouchableOpacity
          style={[
            styles.categoryCard,
            activeFilter === "photo" && styles.categoryCardActive,
          ]}
          onPress={() =>
            setActiveFilter(activeFilter === "photo" ? "all" : "photo")
          }
          activeOpacity={0.7}
        >
          <Ionicons name="image-outline" size={22} color="#FF2D55" />
          <Text
            style={[
              styles.categoryText,
              activeFilter === "photo" && styles.categoryTextActive,
            ]}
          >
            Photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryCard,
            activeFilter === "video" && styles.categoryCardActive,
          ]}
          onPress={() =>
            setActiveFilter(activeFilter === "video" ? "all" : "video")
          }
          activeOpacity={0.7}
        >
          <Ionicons name="videocam-outline" size={22} color="#FFD700" />
          <Text
            style={[
              styles.categoryText,
              activeFilter === "video" && styles.categoryTextActive,
            ]}
          >
            Videos
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {bookmarks.length === 0 ? "Saved" : `Saved · ${filtered.length}`}
        </Text>
      </View>
    </>
  );

  // ─── Empty / error states ───────────────────────────────────────────────
  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.state}>
          <Ionicons name="cloud-offline-outline" size={40} color="#666" />
          <Text style={styles.stateTitle}>Couldn't load saved posts</Text>
          <Text style={styles.stateSubtitle}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.state}>
        <Ionicons name="bookmark-outline" size={40} color="#3A3A3C" />
        <Text style={styles.stateTitle}>
          {query || activeFilter !== "all"
            ? "No matches"
            : "You haven't saved anything yet"}
        </Text>
        <Text style={styles.stateSubtitle}>
          {query || activeFilter !== "all"
            ? "Try a different search or filter."
            : "Tap the bookmark icon on any post to save it here."}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved"
        showMenuButton={false}
        showBackButton={false}
      />

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={filtered.length > 0 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP * 2,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 48,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    height: "100%",
  },

  // Filter chips
  categoriesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryCardActive: {
    borderColor: "#3A3A3C",
    backgroundColor: "#2C2C2E",
  },
  categoryText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: "#999999",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },

  // Card
  card: {
    width: CARD_WIDTH,
  },
  cardImageWrapper: {
    width: "100%",
    height: CARD_IMAGE_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
    marginBottom: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardFallback: {
    backgroundColor: "#1C1C1E",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    padding: 4,
  },
  unsaveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploaderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2C2C2E",
    flexShrink: 0,
    overflow: "hidden",
  },
  uploaderAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaDot: {
    fontSize: 10,
    color: "#666666",
  },
  uploadedByLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 1,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: "#999999",
  },

  // Empty / error / loading
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#666666",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 18,
  },
  retryText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
