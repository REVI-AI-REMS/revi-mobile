import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView edges={["top"]} style={styles.headerContainer}>
      <View style={styles.headerInner}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={showBackButton && onBackPress ? onBackPress : onMenuPress}
        >
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
              <Ionicons
                name="person-circle-outline"
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#0F0F10",
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#181818",
    borderBottomWidth: 1,
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
