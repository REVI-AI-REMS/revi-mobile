import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface NotificationItem {
  id: string;
  type: "like" | "comment" | "post_attention" | "multiple_likes";
  user: {
    name: string;
    avatar: string;
  };
  message: string;
  time: string;
  postImage?: string;
  additionalUsers?: { name: string; avatar: string }[];
}

const TODAY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "like",
    user: { name: "Ada", avatar: "" },
    message: "Ada liked your post.",
    time: "1h",
    postImage: "",
  },
  {
    id: "2",
    type: "comment",
    user: { name: "John", avatar: "" },
    message: "John commented on your post.",
    time: "2h",
    postImage: "",
  },
  {
    id: "3",
    type: "multiple_likes",
    user: { name: "", avatar: "" },
    message: "2 people liked your post about Lekki Phase 1.",
    time: "2h",
    postImage: "",
  },
  {
    id: "4",
    type: "post_attention",
    user: { name: "", avatar: "" },
    message: "Your post is getting attention.",
    time: "4h",
    postImage: "",
    additionalUsers: [
      { name: "User1", avatar: "" },
      { name: "User2", avatar: "" },
      { name: "User3", avatar: "" },
      { name: "User4", avatar: "" },
      { name: "User5", avatar: "" },
      { name: "User6", avatar: "" },
    ],
  },
  {
    id: "5",
    type: "like",
    user: { name: "Ada", avatar: "" },
    message: "Ada liked your post.",
    time: "10h",
    postImage: "",
  },
];

const YESTERDAY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "6",
    type: "like",
    user: { name: "Ada", avatar: "" },
    message: "Ada liked your post.",
    time: "1h",
    postImage: "",
  },
  {
    id: "7",
    type: "comment",
    user: { name: "John", avatar: "" },
    message: "John commented on your post.",
    time: "2h",
    postImage: "",
  },
  {
    id: "8",
    type: "multiple_likes",
    user: { name: "", avatar: "" },
    message: "2 people liked your post about Lekki Phase 1.",
    time: "2h",
    postImage: "",
  },
  {
    id: "9",
    type: "post_attention",
    user: { name: "", avatar: "" },
    message: "Your post is getting attention.",
    time: "4h",
    postImage: "",
    additionalUsers: [
      { name: "User1", avatar: "" },
      { name: "User2", avatar: "" },
      { name: "User3", avatar: "" },
      { name: "User4", avatar: "" },
      { name: "User5", avatar: "" },
      { name: "User6", avatar: "" },
    ],
  },
];

export default function NotificationScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return (
          <View style={[styles.iconBadge, styles.likeBadge]}>
            <Ionicons name="heart" size={12} color="#FFFFFF" />
          </View>
        );
      case "comment":
        return (
          <View style={[styles.iconBadge, styles.commentBadge]}>
            <Ionicons name="chatbubble" size={12} color="#FFFFFF" />
          </View>
        );
      default:
        return null;
    }
  };

  const renderNotificationItem = (item: NotificationItem) => (
    <TouchableOpacity key={item.id} style={styles.notificationItem}>
      <View style={styles.leftContent}>
        {item.type === "post_attention" ? (
          <View style={styles.multipleAvatars}>
            {item.additionalUsers?.slice(0, 6).map((user, index) => (
              <View
                key={index}
                style={[
                  styles.avatar,
                  styles.smallAvatar,
                  { marginLeft: index > 0 ? -8 : 0 },
                ]}
              >
                <Ionicons name="person" size={12} color="#666666" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#666666" />
            </View>
            {renderNotificationIcon(item.type)}
          </View>
        )}
      </View>

      <View style={styles.middleContent}>
        <Text style={styles.notificationText}>{item.message}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={styles.postThumbnail}>
          <Ionicons name="home" size={24} color="#666666" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        onBackPress={handleBackPress}
        showMenuButton={false}
        backIcon="arrow-back"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {TODAY_NOTIFICATIONS.map(renderNotificationItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yesterday</Text>
          {YESTERDAY_NOTIFICATIONS.map(renderNotificationItem)}
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
  section: {
    paddingHorizontal: 16,
    // paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  leftContent: {
    marginRight: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  multipleAvatars: {
    flexDirection: "row",
    width: 60,
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F0F10",
  },
  likeBadge: {
    backgroundColor: "#FF3B30",
  },
  commentBadge: {
    backgroundColor: "#007AFF",
  },
  middleContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  rightContent: {},
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
});
