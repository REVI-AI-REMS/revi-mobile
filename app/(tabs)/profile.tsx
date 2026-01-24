import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const handleBackPress = () => {
    // Handle back navigation
    console.log("Back pressed");
  };

  const handleMenuPress = () => {
    // Handle menu press
    console.log("Menu pressed");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Profile"
        onBackPress={handleBackPress}
        onMenuPress={handleMenuPress}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#666666" />
            </View>
          </View>
          <Text style={styles.username}>@victory_paul</Text>
          <Text style={styles.name}>Victory Paul</Text>
          <Text style={styles.email}>E-mail: 123victoryps@gmail.com</Text>
          <TouchableOpacity style={styles.viewProfileButton}>
            <Text style={styles.viewProfileButtonText}>View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Become an Agent Banner */}
        <LinearGradient
          colors={["#FF9500", "#FF2D55"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.agentBanner}
        >
          <View style={styles.agentBannerContent}>
            <Text style={styles.agentBannerTitle}>Become an agent</Text>
            <Text style={styles.agentBannerSubtitle}>
              Start your journey today
            </Text>
          </View>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="wallet-outline" size={20} color="#FF9500" />
              </View>
              <Text style={styles.menuItemText}>Token balance</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>100</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="star-outline" size={20} color="#FFD700" />
              </View>
              <Text style={styles.menuItemText}>Reviews</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="settings-outline" size={20} color="#0A84FF" />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.settingsAvatar}>
                <Ionicons name="person" size={16} color="#666666" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  email: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#666666",
    marginBottom: 16,
  },
  viewProfileButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#000000",
  },
  agentBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agentBannerContent: {
    flex: 1,
  },
  agentBannerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  agentBannerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  applyButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  applyButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FF2D55",
  },
  menuSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tokenBadge: {
    backgroundColor: "#FF2D55",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tokenBadgeText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  settingsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FF3B30",
  },
});
