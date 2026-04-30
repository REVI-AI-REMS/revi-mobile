import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

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
  const ref = useRef<BottomSheetModal>(null);
  const isProgrammaticDismiss = useRef(false);
  const hasEverPresented = useRef(false);

  // Android's enableDynamicSizing has a known bug where content measurement
  // fails and the sheet expands to fill the entire screen. Fall back to a
  // fixed 75% height on Android so the sheet always renders correctly.
  const effectiveHeight =
    height === "auto" && Platform.OS === "android" ? "75%" : height;
  const isAutoHeight = effectiveHeight === "auto";

  useEffect(() => {
    if (visible) {
      hasEverPresented.current = true;
      isProgrammaticDismiss.current = false;
      ref.current?.present();
    } else if (hasEverPresented.current) {
      isProgrammaticDismiss.current = true;
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleCloseButton = useCallback(() => {
    isProgrammaticDismiss.current = true;
    ref.current?.dismiss();
    onClose();
  }, [onClose]);

  const handleDismiss = useCallback(() => {
    if (isProgrammaticDismiss.current) {
      isProgrammaticDismiss.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  const snapPoints = useMemo(
    () => (isAutoHeight ? undefined : [effectiveHeight as string | number]),
    [effectiveHeight, isAutoHeight],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior={dismissOnBackdrop ? "close" : "none"}
        opacity={0.65}
      />
    ),
    [dismissOnBackdrop],
  );

  // The close button is placed INSIDE the content wrapper (not as a sibling to
  // BottomSheetScrollView). Auth screens' back buttons work for the same reason:
  // they live inside the content. Buttons that are siblings to
  // BottomSheetScrollView fall into @gorhom's gesture zone and lose touches.
  const closeButton = showCloseButton ? (
    <TouchableOpacity
      style={styles.closeButton}
      onPress={handleCloseButton}
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="close" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  ) : null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={isAutoHeight}
      enablePanDownToClose={false}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      handleStyle={styles.handleArea}
      android_keyboardInputMode="adjustResize"
    >
      {isAutoHeight ? (
        <BottomSheetView style={styles.content}>
          {closeButton}
          {children}
        </BottomSheetView>
      ) : (
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {closeButton}
          {children}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  handleArea: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  handle: {
    backgroundColor: "#3A3A3C",
    width: 40,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
  },
});
