import { Fonts } from "@/constants/theme";
import {
    useChatSessions,
    useDeleteAllSessionsMutation,
    useDeleteSessionMutation,
    useRenameSessionMutation,
} from "@/hooks/queries/use-ai-chat";
import type { ChatSession } from "@/scripts/services/ai";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString();
}

function sessionDisplayTitle(s: ChatSession): string {
  return s.chat_title?.trim() || s.title?.trim() || "New conversation";
}

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

  const { data, isLoading, isError, refetch } = useChatSessions();
  const sessions = data?.results ?? [];

  const { mutate: renameSession, isPending: renaming } =
    useRenameSessionMutation();
  const { mutate: deleteSession } = useDeleteSessionMutation();
  const { mutate: deleteAllSessions, isPending: clearingAll } =
    useDeleteAllSessionsMutation();

  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameText, setRenameText] = useState("");

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
  }, [visible, slideAnim, fadeAnim]);

  const handleSessionPress = (sessionId: string) => {
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

  const handleSessionMenu = (session: ChatSession) => {
    Alert.alert(
      sessionDisplayTitle(session),
      undefined,
      [
        {
          text: "Rename",
          onPress: () => {
            setRenameText(sessionDisplayTitle(session));
            setRenameTarget(session);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(session),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const confirmDelete = (session: ChatSession) => {
    Alert.alert(
      "Delete conversation?",
      `"${sessionDisplayTitle(session)}" will be removed permanently.`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSession(session.id),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleClearAll = () => {
    if (sessions.length === 0) return;
    Alert.alert(
      "Clear all history?",
      "Every conversation will be permanently deleted. This can't be undone.",
      [
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => deleteAllSessions(),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const trimmed = renameText.trim();
    if (!trimmed) return;
    renameSession(
      { id: renameTarget.id, title: trimmed },
      {
        onSettled: () => {
          setRenameTarget(null);
          setRenameText("");
        },
      },
    );
  };

  if (!showSidebar) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            marginTop: insets.top,
            borderTopRightRadius: 20,
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
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sessionsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Recent</Text>

          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator color="#666666" />
            </View>
          )}

          {isError && !isLoading && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>Couldn't load conversations.</Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !isError && sessions.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No conversations yet.</Text>
              <Text style={styles.emptySub}>Ask Revi anything to start.</Text>
            </View>
          )}

          {sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionItem,
                currentSessionId === session.id && styles.activeSession,
              ]}
              onPress={() => handleSessionPress(session.id)}
            >
              <View style={styles.sessionIconContainer}>
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.sessionContent}>
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {sessionDisplayTitle(session)}
                </Text>
                <Text style={styles.sessionTimestamp}>
                  {formatRelative(session.updated_at)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sessionMenuButton}
                hitSlop={12}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSessionMenu(session);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#666666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {sessions.length > 0 && <View style={styles.divider} />}
          {sessions.length > 0 && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleClearAll}
              disabled={clearingAll}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionText, { color: "#FF3B30" }]}>
                {clearingAll ? "Clearing…" : "Clear All History"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>

      {/* Rename modal */}
      <Modal
        visible={!!renameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <View style={styles.renameBackdrop}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename conversation</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              style={styles.renameInput}
              placeholder="Conversation name"
              placeholderTextColor="#666"
              autoFocus
              onSubmitEditing={submitRename}
              returnKeyType="done"
              maxLength={80}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameBtn, styles.renameBtnGhost]}
                onPress={() => setRenameTarget(null)}
                disabled={renaming}
              >
                <Text style={styles.renameBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renameBtn,
                  !renameText.trim() && styles.renameBtnDisabled,
                ]}
                onPress={submitRename}
                disabled={!renameText.trim() || renaming}
              >
                <Text style={styles.renameBtnText}>
                  {renaming ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FF6B6B",
  },
  retryText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#AAAAAA",
  },
  emptySub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#666666",
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

  // Rename modal
  renameBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  renameCard: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  renameTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  renameInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  renameBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  renameBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#000000",
  },
  renameBtnGhost: {
    backgroundColor: "transparent",
  },
  renameBtnGhostText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#AAAAAA",
  },
  renameBtnDisabled: {
    backgroundColor: "#2C2C2E",
  },
});
