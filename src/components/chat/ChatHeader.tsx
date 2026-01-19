import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "@/src/constants/theme";

interface ChatHeaderProps {
  onMenuPress: () => void;
  onBackPress?: () => void;
  showBackButton?: boolean;
  title?: string;
}

export default function ChatHeader({
  onMenuPress,
  onBackPress,
  showBackButton = false,
  title = "Revi ai",
}: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={showBackButton && onBackPress ? onBackPress : onMenuPress}>
        <Ionicons
          name={showBackButton ? "arrow-back" : "menu"}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        {!showBackButton && (
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
    backgroundColor: "#000000",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    marginLeft: 4,
  },
});
