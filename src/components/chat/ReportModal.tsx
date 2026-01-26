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

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    onSuccess?: () => void;
}

const RATINGS = ["Worse", "Bad", "Average", "Good", "Very Good"];

export default function ReportModal({
    visible,
    onClose,
    title = "Report your Landlord",
    onSuccess,
}: ReportModalProps) {
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState(""); // State/Province
    const [reason, setReason] = useState("");
    const [rating, setRating] = useState("");
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
        // Validation could go here
        console.log({ email, address, city, state, reason, rating, document });
        onClose();
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <OverlayModal visible={visible} onClose={onClose} height="90%">
            <View style={styles.header}>
                {/* Close button handled by OverlayModal, but we can add title */}
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                    Tell us what happened — we're here to help.
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

                <Text style={styles.sectionLabel}>
                    Select a rating to describe your landlord experience
                </Text>

                {/* Property Address */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Property Address</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g No, 12 Admiralty Way"
                            placeholderTextColor="#666"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.halfInput]}>
                            <TextInput
                                style={styles.input}
                                placeholder="City"
                                placeholderTextColor="#666"
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.halfInput]}>
                            <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="#666"
                                value={state}
                                onChangeText={setState}
                            />
                        </View>
                    </View>
                </View>

                {/* Reason */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your reason for report</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe any issues you have faced with your landlord"
                            placeholderTextColor="#666"
                            multiline
                            textAlignVertical="top"
                            value={reason}
                            onChangeText={setReason}
                        />
                    </View>
                </View>

                {/* Rating */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Rate your landlord experience *</Text>
                    <View style={styles.ratingContainer}>
                        {RATINGS.map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.ratingChip,
                                    rating === r && styles.ratingChipSelected,
                                ]}
                                onPress={() => setRating(r)}
                            >
                                <Text
                                    style={[
                                        styles.ratingText,
                                        rating === r && styles.ratingTextSelected,
                                    ]}
                                >
                                    {r}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* File Upload */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Upload your utility bill or property{"\n"}document (image/PDF/document)
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
                            {document ? document.name : "Upload Property Document"}
                        </Text>
                        <Text style={styles.uploadSubtitle}>PNG, JPG, PDF up to 10MB</Text>
                        <View style={styles.chooseFileButton}>
                            <Text style={styles.chooseFileText}>Choose File</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    At least one file is required to submit your report
                </Text>

                <Button
                    title="Send"
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
        // color: "#CCCCC",
        marginBottom: 8,
        color: "#ccc",
    },
    sectionLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#666",
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        borderRadius: 30, // Rounded style as seen in screenshot (or 12 for boxy) - Screenshot looks very rounded for inputs
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
    row: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    halfInput: {
        flex: 1,
    },
    textAreaContainer: {
        height: 120,
        borderRadius: 20,
        alignItems: "flex-start",
        paddingTop: 12,
    },
    textArea: {
        height: "100%",
    },
    ratingContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    ratingChip: {
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#1C1C1E",
    },
    ratingChipSelected: {
        backgroundColor: "#333",
        borderColor: "#666",
    },
    ratingText: {
        color: "#999",
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
    ratingTextSelected: {
        color: "#FFF",
    },
    uploadContainer: {
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 20,
        borderStyle: "dashed", // React Native doesn't support dashed border well on View without external libs sometimes, but solid is fine or we try styling
        backgroundColor: "#1C1C1E", // Darker bg
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
    disclaimer: {
        color: "#444",
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginBottom: 24,
    },
    sendButton: {
        borderRadius: 30,
    },
});
