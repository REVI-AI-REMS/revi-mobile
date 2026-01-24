import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    time: string;
  };
  images: string[];
  likes: string;
  comments: number;
  shares: number;
  views: string;
  likedBy: string;
  description: string;
}

const DUMMY_POSTS: Post[] = [
  {
    id: "1",
    user: {
      name: "Victory Paul",
      avatar: "",
      time: "10h",
    },
    images: [""],
    likes: "17k",
    comments: 292,
    shares: 192,
    views: "10.1K",
    likedBy: "Sam123",
    description:
      "Victory Paul Modern 3-Bedroom Apartment in Lekki - Spacious living room, en-suite bedrooms, fully fitted kitchen, pool, secure estate. Perfect for family living or investment. Location: Lekki Phase 1, Lagos.",
  },
  {
    id: "2",
    user: {
      name: "Sarah Chen",
      avatar: "",
      time: "5h",
    },
    images: ["", ""],
    likes: "8.2k",
    comments: 156,
    shares: 89,
    views: "5.8K",
    likedBy: "Mike_R",
    description:
      "Luxury 4-Bedroom Duplex in Ikoyi - Premium finishes, smart home features, private gym, rooftop terrace with city views. Gated community with 24/7 security. Price negotiable.",
  },
  {
    id: "3",
    user: {
      name: "James Okafor",
      avatar: "",
      time: "12h",
    },
    images: ["", "", ""],
    likes: "23k",
    comments: 445,
    shares: 312,
    views: "18.5K",
    likedBy: "PropertyKing",
    description:
      "Investment Opportunity! 2-Bedroom Flat in Victoria Island - High ROI, close to major business districts, excellent rental demand. Ideal for investors. Contact for viewing.",
  },
  {
    id: "4",
    user: {
      name: "Angela Martinez",
      avatar: "",
      time: "1d",
    },
    images: [""],
    likes: "5.9k",
    comments: 98,
    shares: 67,
    views: "4.2K",
    likedBy: "HomeSeekers",
    description:
      "Cozy Studio Apartment in Yaba - Perfect for young professionals, close to tech hubs, affordable rent, modern amenities. Available immediately. DM for details.",
  },
  {
    id: "5",
    user: {
      name: "David Adeyemi",
      avatar: "",
      time: "2d",
    },
    images: ["", "", "", ""],
    likes: "31k",
    comments: 678,
    shares: 421,
    views: "25.3K",
    likedBy: "RealEstateHub",
    description:
      "Massive 5-Bedroom Mansion in Banana Island - Waterfront property, private dock, infinity pool, cinema room, wine cellar. Ultimate luxury living. Serious inquiries only.",
  },
  {
    id: "6",
    user: {
      name: "Chioma Nwosu",
      avatar: "",
      time: "3d",
    },
    images: ["", ""],
    likes: "12k",
    comments: 234,
    shares: 145,
    views: "9.7K",
    likedBy: "LagosHomes",
    description:
      "Family Home in Surulere - 3 bedrooms, spacious compound, good neighborhood, close to schools and markets. Well maintained property. Call to schedule viewing.",
  },
];

export default function SocialsScreen() {
  const [activeTab, setActiveTab] = useState("trending");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ReviAi</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Property Update Banner */}
      <View style={styles.updateBanner}>
        <View style={styles.updateContent}>
          <View style={styles.avatarPlaceholder} />
          <Text style={styles.updateText}>Property Update</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={20} color="#999999" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "trending" && styles.activeTab]}
          onPress={() => setActiveTab("trending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "trending" && styles.activeTabText,
            ]}
          >
            Trending Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "featured" && styles.activeTab]}
          onPress={() => setActiveTab("featured")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "featured" && styles.activeTabText,
            ]}
          >
            Featured Properties
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "neighborhoods" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("neighborhoods")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "neighborhoods" && styles.activeTabText,
            ]}
          >
            Neighborhoods
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
      >
        {DUMMY_POSTS.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.postUser}>
                <View style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{post.user.name}</Text>
                  <Text style={styles.postTime}>{post.user.time}</Text>
                </View>
              </View>
              <View style={styles.postHeaderActions}>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Post Image */}
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={60} color="#3A3A3C" />
              </View>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  1/{post.images.length}
                </Text>
              </View>
              <TouchableOpacity style={styles.fullscreenButton}>
                <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
                <Text style={styles.actionText}>{post.shares}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>{post.views}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Ionicons name="bookmark-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Post Description */}
            <View style={styles.postDescription}>
              <Text style={styles.likedBy}>
                Liked by <Text style={styles.likedByName}>{post.likedBy}</Text>{" "}
                and others
              </Text>
              <Text style={styles.description} numberOfLines={3}>
                {post.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  updateBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  updateContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2C2C2E",
  },
  updateText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  tab: {
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postCard: {
    marginTop: 16,
    backgroundColor: "#0F0F10",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
  },
  userInfo: {
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  postTime: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  postHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#2C2C2E",
    borderRadius: 6,
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: "#1C1C1E",
    position: "relative",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  fullscreenButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 20,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  bookmarkButton: {
    marginLeft: "auto",
  },
  postDescription: {
    paddingHorizontal: 16,
    gap: 4,
  },
  likedBy: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
  likedByName: {
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    lineHeight: 18,
  },
});
