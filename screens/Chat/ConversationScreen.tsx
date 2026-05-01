import ChatActionModal from "@/components/chat/ChatActionModal";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/components/chat/ChatSessionsSidebar";
import { Fonts } from "@/constants/theme";
import {
    useChatMessages,
    useReactToMessageMutation,
    useSendMessageMutation,
} from "@/hooks/queries/use-ai-chat";
import type { ChatMessage } from "@/scripts/services/ai";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
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

interface Bubble {
  id: string;
  type: "user" | "ai" | "pending";
  content: string;
  chatId?: string;
  reaction?: string | null;
  /** True only for the most recently received AI response — triggers typewriter */
  animate?: boolean;
}

function splitIntoBubbles(messages: ChatMessage[]): Bubble[] {
  const out: Bubble[] = [];
  for (const m of messages) {
    if (m.prompt) out.push({ id: `${m.id}-u`, type: "user", content: m.prompt });
    if (m.response) {
      out.push({ id: `${m.id}-a`, type: "ai", content: m.response, chatId: m.id, reaction: m.reaction });
    }
  }
  return out;
}

// ─── Typewriter hook ───────────────────────────────────────────────────────
// Reveals `text` character by character. Adaptive chunk size so any response
// completes in roughly 1–2 seconds, matching the feel of ChatGPT streaming.

function useTypewriter(text: string, enabled: boolean) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let index = 0;
    // Target ~80 ticks to complete regardless of response length
    const chunk = Math.max(1, Math.ceil(text.length / 80));
    const timer = setInterval(() => {
      index = Math.min(index + chunk, text.length);
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 16); // ~60 fps
    return () => clearInterval(timer);
  }, [text, enabled]);

  return { displayed, done };
}

// ─── AI bubble with optional typewriter animation ──────────────────────────

interface AIBubbleProps {
  item: Bubble;
  onReact?: (chatId: string, reaction: "like" | "dislike") => void;
  onRegenerate?: () => void;
  onAnimationDone?: () => void;
}

const AIBubble = memo(function AIBubble({ item, onReact, onRegenerate, onAnimationDone }: AIBubbleProps) {
  const { displayed, done } = useTypewriter(item.content, item.animate ?? false);

  useEffect(() => {
    if (done && item.animate) onAnimationDone?.();
  }, [done, item.animate, onAnimationDone]);

  const liked = item.reaction === "like";
  const disliked = item.reaction === "dislike";

  return (
    <View style={styles.aiBubble}>
      <Text style={styles.aiText}>{displayed}</Text>
      {/* Cursor blink while animating */}
      {!done && <Text style={styles.cursor}>▌</Text>}
      {/* Actions only appear after animation completes */}
      {done && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}
            onPress={() => item.chatId && onReact?.(item.chatId, "like")}
          >
            <Ionicons name={liked ? "thumbs-up" : "thumbs-up-outline"} size={20}
              color={liked ? "#FFFFFF" : "#666666"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}
            onPress={() => item.chatId && onReact?.(item.chatId, "dislike")}
          >
            <Ionicons name={disliked ? "thumbs-down" : "thumbs-down-outline"} size={20}
              color={disliked ? "#FFFFFF" : "#666666"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={onRegenerate}>
            <Ionicons name="refresh" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// ─── Message bubble ────────────────────────────────────────────────────────

interface BubbleProps {
  item: Bubble;
  onReact?: (chatId: string, reaction: "like" | "dislike") => void;
  onRegenerate?: () => void;
  onAnimationDone?: () => void;
}

const MessageBubble = memo(function MessageBubble({ item, onReact, onRegenerate, onAnimationDone }: BubbleProps) {
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
  return <AIBubble item={item} onReact={onReact} onRegenerate={onRegenerate} onAnimationDone={onAnimationDone} />;
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
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  // Optimistic user bubble — shown immediately on send, before the backend
  // confirms. Cleared once the real message appears in history.
  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const listRef = useRef<FlatList<Bubble>>(null);

  // Typewriter tracking
  const sheetDepth = useSharedValue(0);
  useEffect(() => {
    sheetDepth.value = withSpring(actionModalVisible ? 1 : 0, {
      damping: 20,
      stiffness: 180,
    });
  }, [actionModalVisible, sheetDepth]);
  const bgDepthStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: 1 - 0.08 * sheetDepth.value }],
    borderRadius: 24 * sheetDepth.value,
    overflow: "hidden",
    opacity: 1 - 0.3 * sheetDepth.value,
  }));

  const seenAiIds = useRef(new Set<string>());
  // true while waiting for an AI response to a send — marks next history
  // refresh as "has new response to animate"
  const pendingResponseRef = useRef(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const { data: history, isLoading: loadingHistory } =
    useChatMessages(sessionId);

  const {
    mutate: sendMessage,
    isPending: sending,
    error: sendError,
    reset: resetSendError,
  } = useSendMessageMutation();

  const { mutate: reactToMessage } = useReactToMessageMutation(sessionId);

  // Auto-fire initial query from the home screen or suggestion cards.
  // lastProcessedQuery tracks which query we already fired so we never
  // double-send, but ALSO resets for a new conversation when the query changes.
  const lastProcessedQuery = useRef<string>("");
  useEffect(() => {
    if (!initialQuery) return;
    if (lastProcessedQuery.current === initialQuery) return; // already handled

    lastProcessedQuery.current = initialQuery;

    // New conversation — wipe the previous session so history reloads fresh
    setSessionId(undefined);
    seenAiIds.current.clear();
    pendingResponseRef.current = true;

    setOptimisticMessage(initialQuery);
    sendMessage(
      { prompt: initialQuery, sessionId: undefined },
      {
        onSuccess: (msg) => setSessionId(msg.session_id),
        onError: () => { setOptimisticMessage(null); pendingResponseRef.current = false; },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Detect new AI messages to animate.
  // pendingResponseRef distinguishes "resumed session load" (no animation)
  // from "response to a send we just made" (animate).
  useEffect(() => {
    if (!history) return;
    let latestNewId: string | null = null;
    for (const m of history.results) {
      if (!seenAiIds.current.has(m.id)) {
        seenAiIds.current.add(m.id);
        if (m.response) latestNewId = m.id;
      }
    }
    if (latestNewId && pendingResponseRef.current) {
      setAnimatingId(latestNewId);
    }
    pendingResponseRef.current = false;
  }, [history]);

  const historyBubbles = useMemo(
    () => (history ? splitIntoBubbles(history.results) : []),
    [history],
  );

  // Once the server history contains the optimistic message, clear it so we
  // don't show a duplicate alongside the real bubble.
  useEffect(() => {
    if (!optimisticMessage) return;
    const alreadyInHistory = historyBubbles.some(
      (b) => b.type === "user" && b.content === optimisticMessage,
    );
    if (alreadyInHistory) setOptimisticMessage(null);
  }, [historyBubbles, optimisticMessage]);

  const bubbles = useMemo<Bubble[]>(() => {
    const list: Bubble[] = historyBubbles.map((b) => ({
      ...b,
      animate: b.type === "ai" && b.chatId === animatingId,
    }));
    if (optimisticMessage) {
      const alreadyInHistory = historyBubbles.some(
        (b) => b.type === "user" && b.content === optimisticMessage,
      );
      if (!alreadyInHistory) {
        list.push({ id: "optimistic-user", type: "user", content: optimisticMessage });
      }
    }
    if (sending) {
      list.push({ id: "pending", type: "pending", content: "" });
    }
    return list;
  }, [historyBubbles, animatingId, optimisticMessage, sending]);

  // Scroll to bottom when new content arrives or list grows.
  useEffect(() => {
    if (bubbles.length === 0) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [bubbles.length, sending]);

  // Keep scrolling to bottom while the typewriter animation is running.
  useEffect(() => {
    if (!animatingId) return;
    const id = setInterval(() => listRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearInterval(id);
  }, [animatingId]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if ((!trimmed && !pendingImage) || sending) return;
    const img = pendingImage;
    const prompt = trimmed || "What can you tell me about this?";
    setMessage("");
    setPendingImage(null);
    setOptimisticMessage(prompt);
    pendingResponseRef.current = true; // next history refresh has a new response to animate
    resetSendError();
    sendMessage(
      {
        prompt,
        sessionId,
        ...(img && {
          file: { uri: img.uri, name: img.name, type: "image/jpeg" },
        }),
      },
      {
        onSuccess: (msg) => {
          if (!sessionId) setSessionId(msg.session_id);
          // optimisticMessage cleared by the useEffect once history refreshes
        },
        onError: () => {
          setOptimisticMessage(null); // message didn't send — remove the bubble
        },
      },
    );
  }, [message, pendingImage, sending, sendMessage, sessionId, resetSendError]);

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

  const handleActionPress = useCallback(
    (action: string) => {
      setActionModalVisible(false);
      setTimeout(async () => {
        switch (action) {
          case "Camera": {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Permission required",
                "Camera access is needed to take a photo.",
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              setPendingImage({
                uri: asset.uri,
                name: `photo-${Date.now()}.jpg`,
              });
            }
            break;
          }
          case "Photos": {
            const perm =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Permission required",
                "Photo library access is needed.",
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
              allowsEditing: false,
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              const name = asset.fileName ?? `image-${Date.now()}.jpg`;
              setPendingImage({ uri: asset.uri, name });
            }
            break;
          }
          case "Files":
            Alert.alert(
              "Coming soon",
              "File attachments will be available in a future update.",
            );
            break;
          case "Report a Landlord":
          case "Tell Your Story":
            router.push("/(tabs)/chat");
            break;
          default:
            break;
        }
      }, 250);
    },
    [router],
  );

  // ─── Render helpers ────────────────────────────────────────────────────

  // Android hardware back button — navigate to chat home instead of
  // dispatching GO_BACK which crashes when the tab has no back stack.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.push("/(tabs)/chat");
      return true; // prevent default GO_BACK dispatch
    });
    return () => sub.remove();
  }, [router]);

  const handleAnimationDone = useCallback(() => setAnimatingId(null), []);

  const renderItem = useCallback(
    ({ item }: { item: Bubble }) => (
      <MessageBubble
        item={item}
        onReact={handleReact}
        onRegenerate={handleRegenerate}
        onAnimationDone={handleAnimationDone}
      />
    ),
    [handleReact, handleRegenerate, handleAnimationDone],
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
      style={[styles.root, { backgroundColor: "#000000" }]}
      // See ChatScreen for the reasoning — edge-to-edge Android stops
      // auto-resizing on keyboard, so the JS side has to shrink the view
      // or the input sits under the keyboard.
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <Animated.View style={[styles.container, bgDepthStyle]}>
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

        {actionModalVisible && (
          <ChatActionModal
            visible={actionModalVisible}
            onClose={() => setActionModalVisible(false)}
            onActionPress={handleActionPress}
          />
        )}

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

        {pendingImage && (
          <View style={styles.attachmentPreview}>
            <ExpoImage
              source={{ uri: pendingImage.uri }}
              style={styles.attachmentThumb}
              contentFit="cover"
            />
            <TouchableOpacity
              style={styles.attachmentRemove}
              onPress={() => setPendingImage(null)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
                ((!message.trim() && !pendingImage) || sending) &&
                  styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={(!message.trim() && !pendingImage) || sending}
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
      </Animated.View>
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
  cursor: {
    fontSize: 15,
    color: "#888888",
    marginTop: 2,
  },
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

  // Attachment preview
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  attachmentThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
  },
  attachmentRemove: {
    position: "absolute",
    top: -6,
    left: 54,
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
