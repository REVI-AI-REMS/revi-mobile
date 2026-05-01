import ChatActionModal from "@/components/chat/ChatActionModal";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/components/chat/ChatSessionsSidebar";
import ReportModal from "@/components/chat/ReportModal";
import TellStoryModal from "@/components/chat/TellStoryModal";
import SuccessModal from "@/components/common/SuccessModal";
import { Fonts } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface SuggestionCard {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const suggestions: SuggestionCard[] = [
  {
    id: "1",
    icon: "flag-outline",
    title: "Report a Landlord",
    description: "Flag unfair practices and protect renters.",
  },
  {
    id: "2",
    icon: "home-outline",
    title: "Find a Property",
    description: "Discover verified homes you can trust.",
  },
  {
    id: "3",
    icon: "chatbubble-outline",
    title: "Tell Your Story",
    description: "Help others by telling what happened.",
  },
  {
    id: "4",
    icon: "location-outline",
    title: "Around You",
    description: "See reports and listings nearby.",
  },
];

export default function ChatHomeScreen() {
  const [message, setMessage] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [tellStoryModalVisible, setTellStoryModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [reportModalTitle, setReportModalTitle] = useState(
    "Report your Landlord",
  );
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const greetingName = user?.first_name?.trim() || "there";

  // Perplexity-style backdrop depth: scale + round + dim the background when
  // any bottom sheet opens, making it recede visually behind the sheet.
  const sheetDepth = useSharedValue(0);
  const anySheetOpen = actionModalVisible || reportModalVisible || tellStoryModalVisible;

  useEffect(() => {
    sheetDepth.value = withSpring(anySheetOpen ? 1 : 0, {
      damping: 20,
      stiffness: 180,
    });
  }, [anySheetOpen, sheetDepth]);

  const bgDepthStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: 1 - 0.08 * sheetDepth.value }],
    borderRadius: 24 * sheetDepth.value,
    overflow: "hidden",
    opacity: 1 - 0.3 * sheetDepth.value,
  }));

  // Android hardware back — chat home is a root tab, nothing to go back to.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  // Track keyboard visibility so the input spacing can adapt. Not currently
  // used in render, but keeping the listener avoids leaking it when the tab
  // is hot-reloaded.
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {},
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {},
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ─── Navigation helpers ────────────────────────────────────────────────

  const startConversation = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      router.push({
        pathname: "/(tabs)/conversation",
        params: { query: query.trim() },
      });
    },
    [router],
  );

  const handleSuggestionPress = (title: string) => {
    if (actionModalVisible) setActionModalVisible(false);

    if (title === "Report a Landlord") {
      setReportModalTitle("Report your Landlord");
      setReportModalVisible(true);
      return;
    }
    if (title === "Tell Your Story") {
      setTellStoryModalVisible(true);
      return;
    }
    startConversation(title);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    startConversation(message);
    setMessage("");
  };

  const handleSuccess = () => setSuccessModalVisible(true);

  // ─── Header actions ────────────────────────────────────────────────────

  const handleNewChat = () => {
    // A "new chat" from the home screen just clears the input and focuses
    // it. Sessions get created on first send, so there's nothing to
    // pre-provision on the backend.
    setMessage("");
    Alert.alert("New chat", "Type your first message to begin.", undefined, {
      cancelable: true,
    });
  };

  const handleMore = () => setActionModalVisible(true);

  const handleProfile = () => {
    router.push("/profile/my-profile");
  };

  // ─── Attach modal plumbing ──────────────────────────────────────────────
  // File uploads need an active session, so instead of picking media here
  // (where there's no session yet), we just tell the user to open a chat
  // first. Attach from ConversationScreen does the full multipart upload.
  const handleActionPress = useCallback(
    (action: string) => {
      setActionModalVisible(false);
      setTimeout(() => {
        switch (action) {
          case "Camera":
          case "Photos":
          case "Files":
            Alert.alert(
              "Open a chat first",
              "Attachments are sent as part of a conversation. Ask something, then tap the + inside the chat.",
            );
            break;
          case "Report a Landlord":
            setReportModalTitle("Report your Landlord");
            setReportModalVisible(true);
            break;
          case "Tell Your Story":
            setTellStoryModalVisible(true);
            break;
          default:
            handleSuggestionPress(action);
            break;
        }
      }, 250);
    },
    // handleSuggestionPress uses state setters that are stable, so no dep on it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000000" }}
      // iOS: padding slides the view up. Android: "height" shrinks the
      // KeyboardAvoidingView itself by the keyboard height. With edge-to-edge
      // enabled on Android 15+, the OS stops auto-resizing the window, so we
      // have to do it in JS — otherwise the input bar gets hidden under
      // the keyboard (which is what the "missing input" screenshot showed).
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Animated.View style={[{ flex: 1 }, bgDepthStyle]}>
          <ChatHeader
            onMenuPress={() => setSidebarVisible(true)}
            onNewChatPress={handleNewChat}
            onMorePress={handleMore}
            onProfilePress={handleProfile}
          />

          <ChatSessionsSidebar
            visible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
          />

          {actionModalVisible && (
            <ChatActionModal
              visible={actionModalVisible}
              onClose={() => setActionModalVisible(false)}
              onActionPress={handleActionPress}
            />
          )}

          {reportModalVisible && (
            <ReportModal
              visible={reportModalVisible}
              onClose={() => setReportModalVisible(false)}
              title={reportModalTitle}
              onSuccess={handleSuccess}
            />
          )}

          {tellStoryModalVisible && (
            <TellStoryModal
              visible={tellStoryModalVisible}
              onClose={() => setTellStoryModalVisible(false)}
              onSuccess={handleSuccess}
            />
          )}

          <SuccessModal
            visible={successModalVisible}
            onClose={() => setSuccessModalVisible(false)}
          />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>Hi {greetingName},</Text>
              <Text style={styles.question}>Where should we start?</Text>
            </View>

            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestionPress(suggestion.title)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons
                      name={suggestion.icon}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{suggestion.title}</Text>
                    <Text style={styles.cardDescription}>
                      {suggestion.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setActionModalVisible(true)}
              activeOpacity={0.6}
            >
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
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!message.trim()}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={message.trim() ? "#000000" : "#666666"}
                />
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "android" ? 16 : 20,
    justifyContent: "flex-start",
  },
  greetingSection: {
    marginBottom: Platform.OS === "android" ? 24 : 32,
    marginTop: Platform.OS === "android" ? 20 : 0,
  },
  greeting: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginBottom: 8,
  },
  question: {
    fontSize: Platform.OS === "android" ? 24 : 28,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  suggestionsContainer: {
    gap: 16,
  },
  suggestionCard: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 10,
    borderColor: "#2C2C2E",
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    // Breathing room between the input and the keyboard top edge. When the
    // keyboard is dismissed the tab bar sits below this so the bottom gap
    // still looks natural.
    paddingBottom: 12,
    gap: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
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
    paddingVertical: 10,
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
  sendButtonDisabled: {
    backgroundColor: "#2C2C2E",
  },
});
