import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Fonts } from "@/src/constants/theme";

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

  const handleSuggestionPress = (title: string) => {
    console.log("Suggestion pressed:", title);
    // Handle suggestion action
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      // Handle message send
      setMessage("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revi ai</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
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
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
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
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    gap: 12,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
