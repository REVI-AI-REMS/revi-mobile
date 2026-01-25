import ChatHeader from "@/src/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/src/components/chat/ChatSessionsSidebar";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function ChatConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = (params.query as string) || "";
  const sessionId = params.sessionId as string;

  const [message, setMessage] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "user",
      content: initialQuery || "What is it like renting in Lekki Phase 1?",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "ai",
      content:
        "Renting in Lekki Phase 1 is generally considered premium. Rent prices are higher than most parts of Lagos, and power supply is more stable in many streets. Flooding can be an issue in some areas during heavy rainfall, so it's important to confirm drainage and road access. Most landlords require one to two years' rent upfront, and service charges vary depending on the estate. Experiences differ by street, so checking past tenant reviews is recommended",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      // Simulate AI response (in real app, this would be an API call)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content:
            "I'm processing your request. This is a placeholder response for the UI flow.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F0F10" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <ChatHeader
          onMenuPress={() => setSidebarVisible(true)}
          onBackPress={() => router.push("/(tabs)/chat")}
          showBackButton={true}
        />

        {/* Sidebar */}
        <ChatSessionsSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentSessionId={sessionId}
        />

        {/* Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              {msg.type === "user" ? (
                <View style={styles.userMessageContainer}>
                  <Text style={styles.userMessage}>{msg.content}</Text>
                </View>
              ) : (
                <View style={styles.aiMessageContainer}>
                  <Text style={styles.aiMessage}>{msg.content}</Text>
                  <View style={styles.messageActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#666666"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="thumbs-up-outline"
                        size={20}
                        color="#666666"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="thumbs-down-outline"
                        size={20}
                        color="#666666"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="refresh" size={20} color="#666666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Bottom Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything real estate"
              placeholderTextColor="#666666"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 20,
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 16,
  },
  userMessage: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  aiMessageContainer: {
    maxWidth: "90%",
  },
  aiMessage: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopColor: "#1C1C1E",
    gap: 10,
  },
  attachButton: {
    width: 50,
    height: 50,
    borderRadius: 100,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1C1C1E",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
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
  sendButton: {
    position: "absolute",
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
