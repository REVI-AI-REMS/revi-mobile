import ChatHeader from "@/src/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/src/components/chat/ChatSessionsSidebar";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
}

// ─── AI Action Buttons ───────────────────────────────────────────────────────

const AI_ACTIONS: { icon: keyof typeof Ionicons.glyphMap }[] = [
  { icon: "chatbubble-outline" },
  { icon: "thumbs-up-outline" },
  { icon: "thumbs-down-outline" },
  { icon: "refresh" },
];

// ─── Message Bubble ──────────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({ item }: { item: Message }) {
  if (item.type === "user") {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{item.content}</Text>
      </View>
    );
  }

  return (
    <View style={styles.aiBubble}>
      <Text style={styles.aiText}>{item.content}</Text>
      <View style={styles.actions}>
        {AI_ACTIONS.map(({ icon }) => (
          <TouchableOpacity key={icon} style={styles.actionBtn} activeOpacity={0.6}>
            <Ionicons name={icon} size={20} color="#666666" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = (params.query as string) || "";
  const sessionId = params.sessionId as string;

  const [message, setMessage] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "user",
      content: initialQuery || "What is it like renting in Lekki Phase 1?",
    },
    {
      id: "2",
      type: "ai",
      content:
        "Renting in Lekki Phase 1 is generally considered premium. Rent prices are higher than most parts of Lagos, and power supply is more stable in many streets. Flooding can be an issue in some areas during heavy rainfall, so it's important to confirm drainage and road access. Most landlords require one to two years' rent upfront, and service charges vary depending on the estate. Experiences differ by street, so checking past tenant reviews is recommended",
    },
  ]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");

    // Simulate AI response — replace with actual API call
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "I'm processing your request. This is a placeholder response for the UI flow.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  }, [message]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <MessageBubble item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ChatHeader
          onMenuPress={() => setSidebarVisible(true)}
          onBackPress={() => router.push("/(tabs)/chat")}
          showBackButton
        />

        <ChatSessionsSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentSessionId={sessionId}
        />

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.6}>
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
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={20} color={message.trim() ? "#000000" : "#666666"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F10" },
  container: { flex: 1 },

  // Messages
  listContent: { padding: 16, gap: 20 },
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

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
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
