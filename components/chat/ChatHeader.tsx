import { Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChatHeaderProps {
  onMenuPress: () => void;
  onBackPress?: () => void;
  onNewChatPress?: () => void;
  onMorePress?: () => void;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  title?: string;
}

export default function ChatHeader({
  onMenuPress,
  onBackPress,
  onNewChatPress,
  onMorePress,
  onProfilePress,
  showBackButton = false,
  title = "Revi ai",
}: ChatHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.headerContainer}>
      <View style={styles.headerInner}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={showBackButton && onBackPress ? onBackPress : onMenuPress}
          hitSlop={12}
        >
          <Ionicons
            name={showBackButton ? "arrow-back" : "menu"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight}>
          {onNewChatPress ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onNewChatPress}
              hitSlop={12}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          {onMorePress ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onMorePress}
              hitSlop={12}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          {!showBackButton && onProfilePress ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onProfilePress}
              hitSlop={12}
            >
              <Ionicons
                name="person-circle-outline"
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : null}
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
