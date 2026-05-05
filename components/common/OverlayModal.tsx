import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface OverlayModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  height?: number | string;
  dismissOnBackdrop?: boolean;
  /** Pass false when children already contain a scroll/list component (e.g. FlatList).
   *  Avoids the "VirtualizedList nested inside ScrollView" warning. */
  scrollable?: boolean;
}

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

function resolveMaxHeight(height: number | string | undefined): number {
  if (height === undefined || height === "auto") return WINDOW_HEIGHT * 0.9;
  if (typeof height === "string" && height.endsWith("%")) {
    return (WINDOW_HEIGHT * parseFloat(height)) / 100;
  }
  return Number(height);
}

export default function OverlayModal({
  visible,
  onClose,
  children,
  showCloseButton = true,
  height = "auto",
  dismissOnBackdrop = false,
  scrollable = true,
}: OverlayModalProps) {
  const insets = useSafeAreaInsets();
  const maxHeight = resolveMaxHeight(height);

  const content = (
    <View
      style={[
        styles.sheetContent,
        { paddingBottom: Math.max(insets.bottom, 20) },
        scrollable ? { maxHeight } : { height: maxHeight },
      ]}
      collapsable={false}
    >
      {/* Drag handle indicator */}
      <View style={styles.handle} />

      {showCloseButton && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      {scrollable ? (
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.directContent}>
          {children}
        </View>
      )}
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : Keyboard.dismiss}>
          <View style={styles.backdropFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={0}
          style={styles.kav}
        >
          {/* Flex spacer fills all space above the sheet. minHeight: 80 means
              at least 80px of backdrop is always visible above the sheet —
              the sheet never reaches the very top of the screen. */}
          <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : Keyboard.dismiss}>
            <View style={styles.spacer} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.sheetWrapper}>
              {Platform.OS === "ios" ? (
                <BlurView intensity={60} tint="dark" style={styles.blur}>
                  {content}
                </BlurView>
              ) : (
                <View style={styles.androidSheet}>
                  <View style={styles.androidOverlay} />
                  {content}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdropFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  kav: {
    flex: 1,
  },
  spacer: {
    flex: 1,
    minHeight: 80,
  },
  sheetWrapper: {
    width: "100%",
  },
  blur: {
    width: "100%",
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    overflow: "hidden",
  },
  androidSheet: {
    width: "100%",
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.85)",
    elevation: 24,
  },
  androidOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(31,31,31,0.3)",
  },
  sheetContent: {
    width: "100%",
    backgroundColor:
      Platform.OS === "ios" ? "rgba(28,28,30,0.75)" : "transparent",
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingTop: 32,
    paddingHorizontal: 24,
    minHeight: 200,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  directContent: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
