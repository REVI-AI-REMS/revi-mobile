import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  backIcon?: keyof typeof Ionicons.glyphMap;
  menuIcon?: keyof typeof Ionicons.glyphMap;
}

export default function ScreenHeader({
  title,
  onBackPress,
  onMenuPress,
  showBackButton = true,
  showMenuButton = true,
  backIcon = "arrow-back",
  menuIcon = "ellipsis-horizontal",
}: ScreenHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.headerContainer}>
      <View style={styles.headerInner}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBackPress}
          disabled={!showBackButton}
        >
          {showBackButton && (
            <Ionicons name={backIcon} size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onMenuPress}
          disabled={!showMenuButton}
        >
          {showMenuButton && (
            <Ionicons name={menuIcon} size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
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
    // height: 56,
    paddingVertical: 12,
    borderBottomColor: "#181818",
    borderBottomWidth: 1,
    // borderTopColor: "#2C2C2E",
    // borderTopWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
});
