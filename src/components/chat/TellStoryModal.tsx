import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
    Alert,
    ScrollView,
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
    const [email, setEmail] = useState("");
    const [story, setStory] = useState("");
    const [document, setDocument] = useState<{ name: string; uri: string } | null>(null);
    const [isPicking, setIsPicking] = useState(false);

    const handlePickDocument = async () => {
        if (isPicking) return;
        setIsPicking(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];
            setDocument({ name: asset.name, uri: asset.uri });
        } catch (error: any) {
            console.error("Error picking document:", error);
            if (error.message && error.message.includes("Different document picking in progress")) {
                Alert.alert(
                    "System Busy",
                    "Another file selection is already active. If this persists, please restart the app.",
                    [{ text: "OK" }]
                );
            }
        } finally {
            setIsPicking(false);
        }
    };

    const handleSend = () => {
        // Validation logic
        console.log({ email, story, document });
        onClose();
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <OverlayModal visible={visible} onClose={onClose} height="90%">
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                    Help others by telling what happened.
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Email */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Enter your email</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.input}
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
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your Story</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
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
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Upload supporting documents/images (optional)
                    </Text>
                    <TouchableOpacity
                        style={[styles.uploadContainer, isPicking && { opacity: 0.5 }]}
                        onPress={handlePickDocument}
                        activeOpacity={0.7}
                        disabled={isPicking}
                    >
                        <View style={styles.uploadIconCircle}>
                            <Ionicons name="document-text-outline" size={24} color="#000" />
                        </View>
                        <Text style={styles.uploadTitle}>
                            {document ? document.name : "Upload Document"}
                        </Text>
                        <Text style={styles.uploadSubtitle}>PNG, JPG, PDF up to 10MB</Text>
                        <View style={styles.chooseFileButton}>
                            <Text style={styles.chooseFileText}>Choose File</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Button
                    title="Share Story"
                    variant="primary"
                    onPress={handleSend}
                    style={styles.sendButton}
                />
            </ScrollView>
        </OverlayModal>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
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
    scrollContent: {
        paddingBottom: 40,
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
        height: 200, // Taller for story
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
