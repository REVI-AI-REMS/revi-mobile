import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ChatActionModalProps {
  visible: boolean;
  onClose: () => void;
  onActionPress: (action: string) => void;
}

export default function ChatActionModal({
  visible,
  onClose,
  onActionPress,
}: ChatActionModalProps) {
  const mediaActions = [
    { id: "camera", icon: "camera-outline", label: "Camera", action: "Camera" },
    { id: "photos", icon: "image-outline", label: "Photos", action: "Photos" },
    {
      id: "files",
      icon: "document-text-outline",
      label: "Files",
      action: "Files",
    },
  ] as const;

  const listActions = [
    {
      id: "report",
      icon: "flag-outline",
      title: "Report a Landlord",
      description: "Flag unfair practices and protect renters.",
    },
    {
      id: "find",
      icon: "home-outline",
      title: "Find a Property",
      description: "Discover verified homes you can trust.",
    },
    {
      id: "story",
      icon: "create-outline", // Changed from pencil to match "Tell Your Story" vibe better or stick to design
      title: "Tell Your Story",
      description: "Help others by telling what happened.",
    },
    {
      id: "around",
      icon: "location-outline",
      title: "Around You",
      description: "See reports and listings nearby.",
    },
  ] as const;

  return (
    <OverlayModal
      visible={visible}
      onClose={onClose}
      height={520}
      showCloseButton={false}
      dismissOnBackdrop={true}
    >
      <View style={styles.container}>
        {/* Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Media Actions */}
        <View style={styles.mediaRow}>
          {mediaActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.mediaButton}
              onPress={() => onActionPress(item.action)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={28} color="#FFFFFF" />
              <Text style={styles.mediaLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Actions */}
        <View style={styles.listContainer}>
          {listActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() => onActionPress(item.title)}
              activeOpacity={0.7}
            >
              <View style={styles.listIconContainer}>
                <Ionicons name={item.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </OverlayModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#3A3A3C",
    borderRadius: 2,
  },
  mediaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    aspectRatio: 1, // Make them square
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mediaLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: "#FFFFFF",
  },
  listContainer: {
    gap: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
});
