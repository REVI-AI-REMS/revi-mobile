import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

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

  // On Android, enableDynamicSizing (iOS path) fails — content measurement
  // returns garbage and the sheet expands to full screen. We instead measure
  // the content ourselves via onLayout and feed the real pixel height as the
  // snap point. Start with a safe default (400px) until measurement arrives.
  const [androidAutoHeight, setAndroidAutoHeight] = useState(400);

  const isAndroidAuto = Platform.OS === "android" && height === "auto";
  const isAutoHeight = height === "auto" && !isAndroidAuto; // iOS only

  const snapPoints = useMemo(() => {
    if (isAutoHeight) return undefined; // iOS: enableDynamicSizing handles it
    if (isAndroidAuto) return [androidAutoHeight]; // Android: measured height
    return [height as string | number]; // explicit fixed height
  }, [isAutoHeight, isAndroidAuto, androidAutoHeight, height]);

  const onAndroidContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const measured = e.nativeEvent.layout.height;
      if (measured > 50 && measured !== androidAutoHeight) {
        setAndroidAutoHeight(measured);
      }
    },
    [androidAutoHeight],
  );

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

  const content =
    isAutoHeight ? (
      // iOS auto-height: enableDynamicSizing measures content
      <BottomSheetView style={styles.content}>
        {closeButton}
        {children}
      </BottomSheetView>
    ) : isAndroidAuto ? (
      // Android auto-height: measure via onLayout, use as snap point
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        scrollEnabled={false}
      >
        <BottomSheetView onLayout={onAndroidContentLayout}>
          {closeButton}
          {children}
        </BottomSheetView>
      </BottomSheetScrollView>
    ) : (
      // Fixed height: scrollable
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {closeButton}
        {children}
      </BottomSheetScrollView>
    );

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
      {content}
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
