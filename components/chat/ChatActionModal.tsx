import { Fonts } from "@/constants/theme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ChatActionModalProps {
  visible: boolean;
  onClose: () => void;
  onActionPress: (action: string) => void;
}

const mediaActions = [
  { id: "camera", icon: "camera-outline", label: "Camera", action: "Camera" },
  { id: "photos", icon: "image-outline", label: "Photos", action: "Photos" },
  { id: "files", icon: "document-text-outline", label: "Files", action: "Files" },
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
    icon: "create-outline",
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

export default function ChatActionModal({
  visible,
  onClose,
  onActionPress,
}: ChatActionModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enablePanDownToClose
    >
      <BottomSheetView style={s.container}>
        {/* Media row */}
        <View style={s.mediaRow}>
          {mediaActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.mediaButton}
              onPress={() => onActionPress(item.action)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={28} color="#FFFFFF" />
              <Text style={s.mediaLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List actions */}
        <View style={s.listContainer}>
          {listActions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.listItem}
              onPress={() => onActionPress(item.title)}
              activeOpacity={0.7}
            >
              <View style={s.listIconContainer}>
                <Ionicons name={item.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={s.listContent}>
                <Text style={s.listTitle}>{item.title}</Text>
                <Text style={s.listDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#111111",
  },
  handle: {
    backgroundColor: "#3A3A3C",
    width: 36,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  mediaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    aspectRatio: 1,
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
