import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/src/hooks/queries/use-notifications";
import { NotificationRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

export default function NotificationScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const handleBackPress = () => {
    router.back();
  };

  const handleNotificationPress = (item: NotificationRead) => {
    if (!item.is_read) {
      markRead(item.id);
    }
    // Navigate based on entity_id/type if needed
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
        return (
          <View style={[styles.iconBadge, { backgroundColor: "#666" }]}>
            <Ionicons name="notifications" size={12} color="#FFFFFF" />
          </View>
        );
    }
  };

  const getNotificationMessage = (item: NotificationRead) => {
    // Basic mapping since we don't have user info in the notification object directly
    // Ideally the backend returns a pre-formatted message or we fetch actor info
    switch (item.type) {
      case "like":
        return "Someone liked your post";
      case "comment":
        return "Someone commented on your post";
      case "follow":
        return "Someone started following you";
      default:
        return "You have a new notification";
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationRead }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.leftContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#666666" />
          </View>
          {renderNotificationIcon(item.type)}
        </View>
      </View>

      <View style={styles.middleContent}>
        <Text style={styles.notificationText}>
          {getNotificationMessage(item)}
        </Text>
        <Text style={styles.timeText}>{dayjs(item.created_at).fromNow()}</Text>
      </View>

      {item.entity_id && (
        <View style={styles.rightContent}>
          <View style={styles.postThumbnail}>
            <Ionicons name="home" size={24} color="#666666" />
          </View>
        </View>
      )}
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

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  unreadItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
