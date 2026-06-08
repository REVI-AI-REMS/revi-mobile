import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/theme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface TellStoryModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  onSuccess?: () => void;
}

export default function TellStoryModal({
  visible,
  onClose,
  title = "Tell Your Story",
  onSuccess,
}: TellStoryModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [email, setEmail] = useState("");
  const [story, setStory] = useState("");
  const [document, setDocument] = useState<{ name: string; uri: string } | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handlePickDocument = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setDocument({ name: asset.name, uri: asset.uri });
    } catch (error: any) {
      if (error.message?.includes("Different document picking in progress")) {
        Alert.alert(
          "System Busy",
          "Another file selection is already active. If this persists, please restart the app.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleSend = () => {
    onClose();
    onSuccess?.();
  };

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

  const snapPoints = useMemo(() => ["85%"], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enablePanDownToClose
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>Help others by telling what happened.</Text>
        </View>

        {/* Email */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Enter your email</Text>
          <View style={s.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={s.icon} />
            <TextInput
              style={s.input}
              placeholder="abcdef@gmail.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Story */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Your Story</Text>
          <View style={[s.inputContainer, s.textAreaContainer]}>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Share your experience..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
              value={story}
              onChangeText={setStory}
            />
          </View>
        </View>

        {/* File Upload */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Upload supporting documents/images (optional)</Text>
          <TouchableOpacity
            style={[s.uploadContainer, isPicking && { opacity: 0.5 }]}
            onPress={handlePickDocument}
            activeOpacity={0.7}
            disabled={isPicking}
          >
            <View style={s.uploadIconCircle}>
              <Ionicons name="document-text-outline" size={24} color="#000" />
            </View>
            <Text style={s.uploadTitle}>
              {document ? document.name : "Upload Document"}
            </Text>
            <Text style={s.uploadSubtitle}>PNG, JPG, PDF up to 10MB</Text>
            <View style={s.chooseFileButton}>
              <Text style={s.chooseFileText}>Choose File</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button
          title="Share Story"
          variant="primary"
          onPress={handleSend}
          style={s.sendButton}
        />
      </BottomSheetScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    paddingTop: 4,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    maxWidth: "80%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
    color: "#ccc",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 16,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  textAreaContainer: {
    height: 200,
    borderRadius: 20,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  textArea: {
    height: "100%",
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    borderStyle: "dashed",
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    padding: 24,
    marginTop: 8,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    color: "#666",
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  uploadSubtitle: {
    color: "#444",
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginBottom: 16,
  },
  chooseFileButton: {
    backgroundColor: "#444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chooseFileText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  sendButton: {
    borderRadius: 30,
    marginTop: 16,
  },
});
