import ChatActionModal from "@/components/chat/ChatActionModal";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/components/chat/ChatSessionsSidebar";
import { Fonts } from "@/constants/theme";
import {
  useChatMessages,
  useReactToMessageMutation,
  useSendMessageMutation,
} from "@/hooks/queries/use-ai-chat";
import type { ChatMessage } from "@/services/ai";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ─────────────────────────────────────────────────────────────────
// The backend stores each exchange as one row: prompt + response on the
// same ChatMessage. For the list we split it into two bubbles.

interface Bubble {
  id: string;
  type: "user" | "ai" | "pending";
  content: string;
  // For AI bubbles only — the backend chat row this message came from.
  chatId?: string;
  reaction?: string | null;
}

function splitIntoBubbles(messages: ChatMessage[]): Bubble[] {
  const out: Bubble[] = [];
  for (const m of messages) {
    if (m.prompt) {
      out.push({ id: `${m.id}-u`, type: "user", content: m.prompt });
    }
    if (m.response) {
      out.push({
        id: `${m.id}-a`,
        type: "ai",
        content: m.response,
        chatId: m.id,
        reaction: m.reaction,
      });
    }
  }
  return out;
}

// ─── Message bubble ────────────────────────────────────────────────────────

interface BubbleProps {
  item: Bubble;
  onReact?: (chatId: string, reaction: "like" | "dislike") => void;
  onRegenerate?: () => void;
}

const MessageBubble = memo(function MessageBubble({
  item,
  onReact,
  onRegenerate,
}: BubbleProps) {
  if (item.type === "user") {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{item.content}</Text>
      </View>
    );
  }

  if (item.type === "pending") {
    return (
      <View style={styles.aiBubble}>
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#666666" />
          <Text style={styles.typingText}>Revi is thinking…</Text>
        </View>
      </View>
    );
  }

  const liked = item.reaction === "like";
  const disliked = item.reaction === "dislike";

  return (
    <View style={styles.aiBubble}>
      <Text style={styles.aiText}>{item.content}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.6}
          onPress={() =>
            item.chatId && onReact?.(item.chatId, "like")
          }
        >
          <Ionicons
            name={liked ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={liked ? "#FFFFFF" : "#666666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.6}
          onPress={() =>
            item.chatId && onReact?.(item.chatId, "dislike")
          }
        >
          <Ionicons
            name={disliked ? "thumbs-down" : "thumbs-down-outline"}
            size={20}
            color={disliked ? "#FFFFFF" : "#666666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.6}
          onPress={onRegenerate}
        >
          <Ionicons name="refresh" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = (params.query as string) || "";
  const initialSessionId = (params.sessionId as string) || undefined;

  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [message, setMessage] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const listRef = useRef<FlatList<Bubble>>(null);

  const {
    data: history,
    isLoading: loadingHistory,
  } = useChatMessages(sessionId);

  const {
    mutate: sendMessage,
    isPending: sending,
    error: sendError,
    reset: resetSendError,
  } = useSendMessageMutation();

  const { mutate: reactToMessage } = useReactToMessageMutation(sessionId);

  // Auto-fire the first prompt if we landed here from a suggestion tap or
  // from the home screen's input. Guarded by a ref so it only runs once per
  // initialQuery / sessionId combination.
  const firstSendRef = useRef(false);
  useEffect(() => {
    if (firstSendRef.current) return;
    if (!initialQuery) return;
    if (sessionId) return; // already have a session → user is resuming
    firstSendRef.current = true;
    sendMessage(
      { prompt: initialQuery, sessionId: undefined },
      {
        onSuccess: (msg) => setSessionId(msg.session_id),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const historyBubbles = useMemo(
    () => (history ? splitIntoBubbles(history.results) : []),
    [history],
  );

  // Build the visible list: server history + an optimistic pending bubble
  // while a send is in flight. The optimistic bubble is only shown until
  // React Query invalidates and the real message arrives.
  const bubbles = useMemo<Bubble[]>(() => {
    const list: Bubble[] = [...historyBubbles];
    if (sending) {
      list.push({ id: "pending", type: "pending", content: "" });
    }
    return list;
  }, [historyBubbles, sending]);

  // When messages grow, scroll to the bottom.
  useEffect(() => {
    if (bubbles.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [bubbles.length, sending]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setMessage("");
    resetSendError();
    sendMessage(
      { prompt: trimmed, sessionId },
      {
        onSuccess: (msg) => {
          if (!sessionId) setSessionId(msg.session_id);
        },
      },
    );
  }, [message, sending, sendMessage, sessionId, resetSendError]);

  const handleReact = useCallback(
    (chatId: string, reaction: "like" | "dislike") => {
      reactToMessage({ chatId, reaction });
    },
    [reactToMessage],
  );

  const handleRegenerate = useCallback(() => {
    // Find the last user message and resend it. Backend will produce a
    // fresh response against the same session context.
    const lastUser = [...historyBubbles]
      .reverse()
      .find((b) => b.type === "user");
    if (!lastUser || sending) return;
    sendMessage({ prompt: lastUser.content, sessionId });
  }, [historyBubbles, sending, sendMessage, sessionId]);

  const handleActionPress = useCallback((action: string) => {
    setActionModalVisible(false);
    // Attachment actions aren't wired to the real upload yet — surface
    // this explicitly instead of silently discarding the pick.
    setTimeout(() => {
      // eslint-disable-next-line no-alert
      // Intentionally left as a Alert in a future commit — no-op for now.
    }, 100);
  }, []);

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Bubble }) => (
      <MessageBubble
        item={item}
        onReact={handleReact}
        onRegenerate={handleRegenerate}
      />
    ),
    [handleReact, handleRegenerate],
  );

  const keyExtractor = useCallback((item: Bubble) => item.id, []);

  const ListEmpty = () => {
    if (loadingHistory) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#666666" />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Ionicons name="sparkles-outline" size={40} color="#444" />
        <Text style={styles.emptyText}>Start the conversation below.</Text>
      </View>
    );
  };

  const showSendError = sendError && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // See ChatScreen for the reasoning — edge-to-edge Android stops
      // auto-resizing on keyboard, so the JS side has to shrink the view
      // or the input sits under the keyboard.
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <ChatHeader
          onMenuPress={() => setSidebarVisible(true)}
          onBackPress={() => router.push("/(tabs)/chat")}
          onMorePress={() => setActionModalVisible(true)}
          showBackButton
        />

        <ChatSessionsSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentSessionId={sessionId}
        />

        <ChatActionModal
          visible={actionModalVisible}
          onClose={() => setActionModalVisible(false)}
          onActionPress={handleActionPress}
        />

        <FlatList
          ref={listRef}
          data={bubbles}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={
            bubbles.length === 0 ? styles.emptyContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmpty}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        {showSendError && (
          <View style={styles.errorBar}>
            <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>
              Couldn't reach Revi. Check your connection and try again.
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            activeOpacity={0.6}
            onPress={() => setActionModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything real estate"
              placeholderTextColor="#666666"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              editable={!sending}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!message.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim() || sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#666666" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={message.trim() ? "#000000" : "#666666"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F10" },
  container: { flex: 1 },

  // Messages
  listContent: { padding: 16, gap: 20, paddingBottom: 24 },
  emptyContent: { flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#555",
  },

  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 16,
  },
  userText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  aiBubble: { maxWidth: "90%" },
  aiText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 12,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: { padding: 8 },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
  },

  // Error bar
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1C1C1E",
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FF6B6B",
    flex: 1,
  },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    // Leaves breathing room between the input and the keyboard top edge.
    paddingBottom: 12,
    borderTopColor: "#1C1C1E",
    gap: 8,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    maxHeight: 100,
  },
  sendBtn: {
    position: "absolute",
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#2C2C2E",
  },
});
