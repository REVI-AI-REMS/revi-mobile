import { ScreenHeader } from "@/src/components";
import { colors, radius, spacing, typography } from "@/src/constants/design";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
    const router = useRouter();
    const [username, setUsername] = useState("victory_paul");
    const [displayName, setDisplayName] = useState("Victory Paul");
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Edit Profile"
                onBackPress={() => router.back()}
                showBackButton
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.body}>
                    {/* Avatar */}
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {image ? (
                            <ExpoImage
                                source={{ uri: image }}
                                style={styles.avatar}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={44} color={colors.textMuted} />
                            </View>
                        )}
                        <View style={styles.cameraButton}>
                            <Ionicons name="camera-outline" size={15} color="#FF2D55" />
                        </View>
                    </TouchableOpacity>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputRow}>
                                <Text style={styles.atSymbol}>@</Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="username"
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Display Name</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    placeholder="Display Name"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    body: {
        alignItems: "center",
        paddingTop: spacing.xl,
    },

    // Avatar
    avatarContainer: {
        marginBottom: spacing.xxl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: colors.bgSecondary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.bgTertiary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.bgSecondary,
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.bg,
    },

    // Form
    form: {
        width: "100%",
        paddingHorizontal: spacing.md,
        gap: spacing.lg,
        marginBottom: spacing.xxl,
    },
    inputGroup: {
        gap: spacing.xs,
    },
    label: {
        ...typography.labelMd,
        color: colors.textSecondary,
        marginLeft: spacing.xxs,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
    },
    atSymbol: {
        ...typography.bodyMd,
        color: colors.textMuted,
        marginRight: 2,
    },
    input: {
        flex: 1,
        ...typography.bodyMd,
        color: colors.textPrimary,
        height: "100%",
    },

    // Save
    saveButton: {
        backgroundColor: colors.white,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.xxl,
        borderRadius: radius.full,
        width: "90%",
        alignItems: "center",
    },
    saveButtonText: {
        ...typography.labelLg,
        color: "#000000",
    },
});
