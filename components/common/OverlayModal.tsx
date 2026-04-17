import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  DimensionValue,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface OverlayModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  height?: number | string;
  dismissOnBackdrop?: boolean;
  avoidKeyboard?: boolean;
}

export default function OverlayModal({
  visible,
  onClose,
  children,
  showCloseButton = true,
  height = "auto",
  dismissOnBackdrop = false,
  avoidKeyboard = true,
}: OverlayModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={avoidKeyboard && Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.backdrop}>
          {/* Backdrop - tap to close only if dismissOnBackdrop is true */}
          <Pressable
            style={styles.backdropPressable}
            onPress={dismissOnBackdrop ? onClose : undefined}
          />

          {/* Content Container */}
          <View style={styles.contentContainer}>
            <View
              style={[
                styles.content,
                height === "auto"
                  ? styles.contentAuto
                  : { height: height as DimensionValue },
              ]}
            >
              {/* Close Button - inside overlay */}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {children}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    width: 35,
    height: 35,
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
    paddingBottom: 40,
  },
  contentAuto: {
    paddingBottom: 48,
  },
});
