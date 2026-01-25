import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [showSidebar, setShowSidebar] = useState(visible);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setShowSidebar(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSidebar(false));
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

  if (!showSidebar) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            marginTop: insets.top + 0,
            marginBottom: 0, // Approximate tab bar height
            borderTopRightRadius: 20, // Adding border radius for better aesthetics since it's detached
            borderBottomRightRadius: 0,
          },
        ]}
      >
        {/* Sidebar Header */}
        <View style={styles.sidebarHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Chat History</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
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
                <Text style={styles.sessionTimestamp}>
                  {session.timestamp}
                </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    paddingTop: 20,
    backgroundColor: "#0F0F10",
    borderRightWidth: 1,
    borderRightColor: "#1C1C1E",
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
