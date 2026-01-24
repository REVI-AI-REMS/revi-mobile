import SocialLogo from "@/assets/svgs/socialreviai.svg";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SocialHeaderProps {
  onAddPress?: () => void;
  onNotificationPress?: () => void;
  title?: string;
}

export default function SocialHeader({
  onAddPress,
  onNotificationPress,
  title = "ReviAi",
}: SocialHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.headerContainer}>
      <View style={styles.headerInner}>
        <TouchableOpacity style={styles.headerButton} onPress={onAddPress}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.center}>
          <SocialLogo width={68} height={25} />
          {/* <Text style={styles.headerTitle}>{title}</Text> */}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
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
    paddingVertical: 12,
    borderBottomColor: "#181818",
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 32,
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
});
