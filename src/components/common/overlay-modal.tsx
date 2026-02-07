import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  DimensionValue,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OverlayModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  height?: number | string;
  dismissOnBackdrop?: boolean;
}

export default function OverlayModal({
  visible,
  onClose,
  children,
  showCloseButton = true,
  height = "auto",
  dismissOnBackdrop = false,
}: OverlayModalProps) {
  const insets = useSafeAreaInsets();

  // Android navigation bar is often not captured by insets, so we add extra padding
  const bottomPadding = Platform.OS === 'android'
    ? insets.bottom
    : Math.max(insets.bottom, 10);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Backdrop - tap to close only if dismissOnBackdrop is true */}
        <Pressable
          style={styles.backdropPressable}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <View style={[
            styles.content,
            {
              maxHeight: height as DimensionValue,
              paddingBottom: bottomPadding,
            }
          ]}>
            {/* Close Button - inside overlay */}
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {children}
          </View>
        </View>
      </View>
    </Modal >
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 15, 16, 0.7)",
  },
  backdropPressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
});

