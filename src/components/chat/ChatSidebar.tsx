import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Fonts } from "@/src/constants/theme";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { id: "1", icon: "home-outline", label: "Home" },
  { id: "2", icon: "chatbubble-outline", label: "Conversations" },
  { id: "3", icon: "bookmark-outline", label: "Saved" },
  { id: "4", icon: "time-outline", label: "History" },
  { id: "5", icon: "notifications-outline", label: "Notifications", badge: 3 },
  { id: "6", icon: "settings-outline", label: "Settings" },
];

export default function ChatSidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sidebar,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.profileSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.userName}>Angela</Text>
                    <Text style={styles.userEmail}>angela@reviAi.com</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <ScrollView
                style={styles.menuContainer}
                showsVerticalScrollIndicator={false}
              >
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => {
                      console.log("Menu item pressed:", item.label);
                      onClose();
                    }}
                  >
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#666666"
                      style={styles.chevron}
                    />
                  </TouchableOpacity>
                ))}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bottom Menu Items */}
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.menuLabel}>Help & Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                  </View>
                  <Text style={[styles.menuLabel, { color: "#FF3B30" }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#000000",
    borderRightWidth: 1,
    borderRightColor: "#1C1C1E",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  profileSection: {
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  closeButton: {
    padding: 4,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  chevron: {
    marginLeft: "auto",
  },
  divider: {
    height: 1,
    backgroundColor: "#1C1C1E",
    marginVertical: 8,
  },
});
