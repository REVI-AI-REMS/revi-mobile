import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Fonts } from "@/src/constants/theme";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

interface ChatSessionsSidebarProps {
  visible: boolean;
  onClose: () => void;
  currentSessionId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  isActive?: boolean;
}

// Dummy chat sessions - replace with actual data later
const dummySessions: ChatSession[] = [
  {
    id: "1",
    title: "Lekki Phase 1 Renting",
    preview: "What is it like renting in Lekki Phase 1?",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    title: "Property in Victoria Island",
    preview: "Looking for affordable properties in VI",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    title: "Landlord Issues",
    preview: "Need help with landlord dispute",
    timestamp: "3 days ago",
  },
  {
    id: "4",
    title: "Ikeja Apartments",
    preview: "Best areas to rent in Ikeja?",
    timestamp: "1 week ago",
  },
  {
    id: "5",
    title: "Rent Negotiation Tips",
    preview: "How to negotiate rent prices",
    timestamp: "2 weeks ago",
  },
];

export default function ChatSessionsSidebar({
  visible,
  onClose,
  currentSessionId,
}: ChatSessionsSidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSessionPress = (sessionId: string) => {
    console.log("Opening session:", sessionId);
    router.push({
      pathname: "/(tabs)/conversation",
      params: { sessionId },
    });
    onClose();
  };

  const handleNewChat = () => {
    router.push("/(tabs)/chat");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sidebar,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.headerTop}>
                  <Text style={styles.headerTitle}>Chat History</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.newChatText}>New Chat</Text>
                </TouchableOpacity>
              </View>

              {/* Chat Sessions */}
              <ScrollView
                style={styles.sessionsContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sectionTitle}>Recent</Text>
                {dummySessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      currentSessionId === session.id && styles.activeSession,
                    ]}
                    onPress={() => handleSessionPress(session.id)}
                  >
                    <View style={styles.sessionIconContainer}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.sessionContent}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text style={styles.sessionPreview} numberOfLines={1}>
                        {session.preview}
                      </Text>
                      <Text style={styles.sessionTimestamp}>{session.timestamp}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.sessionMenuButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log("Session menu:", session.id);
                      }}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={16}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                {/* Bottom Actions */}
                <View style={styles.divider} />
                <TouchableOpacity style={styles.actionItem}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, { color: "#FF3B30" }]}>
                    Clear All History
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#000000",
    borderRightWidth: 1,
    borderRightColor: "#1C1C1E",
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2C2E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  newChatText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  sessionsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#666666",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  activeSession: {
    backgroundColor: "#1C1C1E",
  },
  sessionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionContent: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  sessionPreview: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
  sessionTimestamp: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  sessionMenuButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#1C1C1E",
    marginVertical: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
});
