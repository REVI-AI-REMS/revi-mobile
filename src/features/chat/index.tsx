import ChatHeader from "@/src/components/chat/ChatHeader";
import ChatSessionsSidebar from "@/src/components/chat/ChatSessionsSidebar";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatActionModal from "@/src/components/chat/ChatActionModal";
import ReportModal from "@/src/components/chat/ReportModal";
import TellStoryModal from "@/src/components/chat/TellStoryModal";
import SuccessModal from "@/src/components/common/SuccessModal";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSuggestionPress = (title: string) => {
    console.log("Suggestion pressed:", title);
    // Close modal if open
    if (actionModalVisible) {
      setActionModalVisible(false);
    }

    if (title === "Report a Landlord") {
      setReportModalTitle("Report your Landlord");
      setReportModalVisible(true);
      return;
    }

    if (title === "Tell Your Story") {
      setTellStoryModalVisible(true);
      return;
    }

    router.push({
      pathname: "/(tabs)/conversation",
      params: { query: title },
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      router.push({
        pathname: "/(tabs)/conversation",
        params: { query: message },
      });
      setMessage("");
    }
  };

  const handleSuccess = () => {
    setSuccessModalVisible(true);
  };

  const handleCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("You've refused to allow this app to access your camera!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync();

      if (!result.canceled) {
        console.log("Camera result:", result.assets[0]);
        // Handle the image (e.g., upload or add to message)
      }
    } catch (error) {
      console.log("Camera error:", error);
      alert("Camera not available on this device/simulator.");
    }
  };

  const handlePhotos = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "You've refused to allow this app to access your photos!",
        );
        return;
      }

      console.log("Opening gallery...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Correct usage: array of strings or single string 'images'
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        console.log("Photo result:", result.assets[0]);
        // Handle the image
      }
    } catch (error) {
      console.error("Error picking photo:", error);
      Alert.alert("Error", "Failed to open photos. Please try again.");
    }
  };

  const handleFiles = async () => {
    // causing trouble? removing for now: if (isLoading) return;
    // setIsLoading(true);
    console.log("Opening file picker...");
    try {
      const result = await DocumentPicker.getDocumentAsync({});

      if (!result.canceled) {
        console.log("File result:", result.assets[0]);
        // Handle the file
      }
    } catch (err: any) {
      console.error("Document picker error:", err);
      if (
        err.message &&
        err.message.includes("Different document picking in progress")
      ) {
        Alert.alert(
          "System Busy",
          "Another file selection is active. Please restart the app if this persists.",
        );
      } else {
        Alert.alert("Error", "Failed to pick file.");
      }
    } finally {
      // setIsLoading(false);
    }
  };

  const handleActionPress = (action: string) => {
    console.log("Action pressed:", action);
    setActionModalVisible(false);

    // Add a delay to allow modal to close before opening native pickers
    setTimeout(() => {
      switch (action) {
        case "Camera":
          handleCamera();
          break;
        case "Photos":
          handlePhotos();
          break;
        case "Files":
          handleFiles();
          break;
        case "Report a Landlord":
          setReportModalTitle("Report your Landlord");
          setReportModalVisible(true);
          break;
        case "Tell Your Story":
          setTellStoryModalVisible(true);
          break;
        default:
          // Handle suggestions (Report, Find, etc.)
          handleSuggestionPress(action);
          break;
      }
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F0F10" }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* Header */}
        <ChatHeader onMenuPress={() => setSidebarVisible(true)} />

        {/* Sidebar */}
        <ChatSessionsSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />

        {/* Action Modal */}
        <ChatActionModal
          visible={actionModalVisible}
          onClose={() => setActionModalVisible(false)}
          onActionPress={handleActionPress}
        />

        {/* Report Modal */}
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          title={reportModalTitle}
          onSuccess={handleSuccess}
        />

        {/* Tell Story Modal */}
        <TellStoryModal
          visible={tellStoryModalVisible}
          onClose={() => setTellStoryModalVisible(false)}
          onSuccess={handleSuccess}
        />

        {/* Success Modal */}
        <SuccessModal
          visible={successModalVisible}
          onClose={() => setSuccessModalVisible(false)}
        />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Hi Angela,</Text>
            <Text style={styles.question}>Where should we start?</Text>
          </View>

          {/* Suggestion Cards */}
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionCard}
                onPress={() => handleSuggestionPress(suggestion.title)}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name={suggestion.icon} size={24} color="#FFFFFF" />
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

        {/* Bottom Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setActionModalVisible(true)}
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
              includeFontPadding={false}
              textAlignVertical="center"
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
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetingSection: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginBottom: 8,
  },
  question: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  suggestionsContainer: {
    gap: 16,
  },
  suggestionCard: {
    flexDirection: "row",
    // backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 10,
    // borderWidth: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderTopWidth: 1,
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
    paddingVertical: 10,
    paddingRight: 48,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    maxHeight: 100,
    includeFontPadding: false,
    textAlignVertical: "center",
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
