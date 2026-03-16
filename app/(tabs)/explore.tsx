import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants";
import {
  feedKeys,
  useMainFeed,
} from "@/src/hooks/queries/use-feed";
import { useSearch } from "@/src/hooks/queries/use-search";
import type { PostRead, UserSync } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const { width } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_COLS = 3;
const THUMB = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ─── Dev location (match social feed) ────────────────────────────────────────
const DEV_LOCATION = {
  latitude: 6.5244,
  longitude: 3.3792,
  radius_km: 20,
  limit: 60,
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function initials(u: UserSync): string {
  const fn = u.first_name?.[0] ?? "";
  const ln = u.last_name?.[0] ?? "";
  return (fn + ln).toUpperCase() || u.username?.[0]?.toUpperCase() || "?";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserRow({ user }: { user: UserSync }) {
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username;
  return (
    <TouchableOpacity style={styles.userRow} activeOpacity={0.7}>
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={styles.userAvatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
          <Text style={styles.userAvatarText}>{initials(user)}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{name}</Text>
        {user.username ? (
          <Text style={styles.userHandle}>@{user.username}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#3A3A3C" />
    </TouchableOpacity>
  );
}

function PostThumb({ post }: { post: PostRead }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isCarousel =
    post.media_type === "carousel" && (post.media_urls?.length ?? 0) > 1;

  const handlePress = () => {
    // Optimistically seed the post detail query
    queryClient.setQueryData(feedKeys.post(post.id), post);
    router.push(`/post/${post.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.thumbWrapper}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Animated.View
        sharedTransitionTag={`post-media-${post.id}`}
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={{ uri: post.media_url }}
          style={styles.thumb}
          contentFit="cover"
          transition={150}
        />
      </Animated.View>
      {isCarousel && (
        <View style={styles.carouselBadge}>
          <Ionicons name="copy-outline" size={12} color="#FFF" />
        </View>
      )}
      {post.like_count > 0 && (
        <View style={styles.likesBadge}>
          <Ionicons name="heart" size={10} color="#FF3B30" />
          <Text style={styles.likesBadgeText}>{formatCount(post.like_count)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounce: fire search 400 ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Search query (only enabled when debouncedQ >= 2 chars)
  const {
    data: results,
    isFetching: searching,
    isError: searchError,
  } = useSearch(debouncedQ);

  // Explore grid: trending posts shown when search is empty
  const { data: explorePosts = [] } = useMainFeed(DEV_LOCATION);

  const handleSubmit = () => {
    const t = query.trim();
    if (t && !history.includes(t)) {
      setHistory((prev) => [t, ...prev].slice(0, 15));
    }
  };

  const handleHistoryTap = (item: string) => {
    setQuery(item);
    setDebouncedQ(item);
    inputRef.current?.focus();
  };

  const removeHistory = (item: string) =>
    setHistory((prev) => prev.filter((h) => h !== item));

  const clearHistory = () => setHistory([]);

  const clearSearch = () => {
    setQuery("");
    setDebouncedQ("");
  };

  // ─── Derived state ──────────────────────────────────────────────────────────
  const isActive = debouncedQ.length >= 2;
  const posts: PostRead[] = results?.posts ?? [];
  const users: UserSync[] = results?.users ?? [];
  const hasResults = posts.length > 0 || users.length > 0;

  // ─── Render states ──────────────────────────────────────────────────────────

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#A855F7" size="large" />
          <Text style={styles.hint}>Searching…</Text>
        </View>
      );
    }

    if (searchError) {
      return (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#666" />
          <Text style={styles.hint}>Search failed — check your connection</Text>
        </View>
      );
    }

    if (!hasResults) {
      return (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color="#3A3A3C" />
          <Text style={styles.noResultTitle}>Nothing found</Text>
          <Text style={styles.hint}>Try different keywords</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Users section */}
        {users.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>People</Text>
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </View>
        )}

        {/* Posts section */}
        {posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <View style={styles.grid}>
              {posts.map((p) => (
                <PostThumb key={p.id} post={p} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderIdle = () => {
    if (history.length > 0) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recent searches */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {history.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.historyItem}
                onPress={() => handleHistoryTap(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.historyText}>{item}</Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => removeHistory(item)}
                >
                  <Ionicons name="close" size={16} color="#3A3A3C" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Explore grid below history */}
          {explorePosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Explore</Text>
              <View style={styles.grid}>
                {explorePosts.map((p) => (
                  <PostThumb key={p.id} post={p} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      );
    }

    // No history → just the explore grid
    return (
      <FlatList
        data={explorePosts}
        keyExtractor={(p) => p.id}
        numColumns={GRID_COLS}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <PostThumb post={item} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          explorePosts.length > 0 ? (
            <Text
              style={[
                styles.sectionTitle,
                { paddingHorizontal: 16, paddingTop: 8 },
              ]}
            >
              Explore
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <ActivityIndicator color="#A855F7" />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Search"
        showMenuButton={false}
        showBackButton={false}
      />

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={{ marginRight: 10 }}
        />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search posts, people…"
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.body}>
        {isActive ? renderSearchResults() : renderIdle()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F10" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFF",
  },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  noResultTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#FFF",
  },
  // ─── Sections ──────────────────────────────────────────────────────────────
  section: { paddingBottom: 8 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#FFF",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  clearText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: "#A855F7",
  },
  // ─── History ───────────────────────────────────────────────────────────────
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFF",
  },
  // ─── Users ─────────────────────────────────────────────────────────────────
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarPlaceholder: {
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
  },
  userHandle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#666",
    marginTop: 2,
  },
  // ─── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: 0,
  },
  gridRow: { gap: GRID_GAP },
  thumbWrapper: {
    width: THUMB,
    height: THUMB,
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  carouselBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: 3,
  },
  likesBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  likesBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: "#FFF",
  },
});
