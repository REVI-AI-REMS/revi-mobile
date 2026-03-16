import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { useBookmarks } from "@/src/hooks/queries/use-bookmarks";
import type { PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type FilterType = "all" | "photo" | "video";

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

function SavedCard({ post }: { post: PostRead }) {
  const isVideo =
    post.media_type === "video" || post.media_type === "video_upload";
  const isCarousel =
    post.media_type === "carousel" && (post.media_urls?.length ?? 0) > 1;

  return (
    <View style={styles.propertyCard}>
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: post.media_url }}
          style={styles.propertyImagePlaceholder}
          contentFit="cover"
          transition={200}
        />
        {isVideo && (
          <View style={styles.typeBadge}>
            <Ionicons name="videocam" size={12} color="#FFF" />
          </View>
        )}
        {isCarousel && (
          <View style={styles.typeBadge}>
            <Ionicons name="copy-outline" size={12} color="#FFF" />
          </View>
        )}
      </View>
      <View style={styles.propertyFooter}>
        <View style={styles.uploaderInfo}>
          <View style={styles.uploaderAvatar}>
            <Ionicons name="person" size={16} color="#666666" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadedByLabel} numberOfLines={1}>
              @{post.author_id.slice(0, 8)}
            </Text>
            <Text style={styles.timeLabel}>
              {formatRelativeTime(post.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: bookmarks = [], isLoading } = useBookmarks();

  const filtered = bookmarks.filter((post) => {
    const matchesSearch =
      !query ||
      post.caption?.toLowerCase().includes(query.toLowerCase()) ||
      post.author_id.toLowerCase().includes(query.toLowerCase());
    const isPhoto =
      post.media_type === "image" || post.media_type === "carousel";
    const isVideo =
      post.media_type === "video" || post.media_type === "video_upload";
    const matchesType =
      activeFilter === "all" ||
      (activeFilter === "photo" && isPhoto) ||
      (activeFilter === "video" && isVideo);
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved"
        showMenuButton={false}
        showBackButton={false}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Search Bar */}
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
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#666666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
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
              <Ionicons name="tv-outline" size={24} color="#FF2D55" />
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
              <Ionicons name="videocam-outline" size={24} color="#FFD700" />
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
        </View>

        {/* Bookmarks Section */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Properties</Text>
            {bookmarks.length > 0 && (
              <Text style={styles.sectionCount}>{filtered.length}</Text>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginTop: 20 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={40} color="#3A3A3C" />
              <Text style={styles.emptyStateText}>
                {query
                  ? "No saved posts match your search"
                  : bookmarks.length === 0
                    ? "You haven't saved anything yet"
                    : "No posts match this filter"}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.propertiesList}
            >
              {filtered.map((post) => (
                <SavedCard key={post.id} post={post} />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  categoriesRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    height: 80,
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
  propertiesList: {
    gap: 16,
  },
  propertyCard: {
    width: width * 0.7,
  },
  cardImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2C2C2E",
    marginBottom: 12,
    position: "relative",
  },
  propertyImagePlaceholder: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 4,
  },
  propertyFooter: {
    paddingHorizontal: 4,
  },
  uploaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3A3A3C",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  uploadedByLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
    textAlign: "center",
  },
});
