import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, // Changed from Text to TextInput
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
    const router = useRouter();

    // State for form fields
    const [username, setUsername] = useState("victory_paul");
    const [displayName, setDisplayName] = useState("Victory Paul");
    const [image, setImage] = useState<string | null>(null);

    const handleBackPress = () => {
        router.back();
    };

    const handleSave = () => {
        // Implement save logic here
        console.log("Saving profile:", { username, displayName, image });
        router.back();
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Edit Profile"
                onBackPress={handleBackPress}
                showBackButton={true}
            // Optional: Add Save button to header if preferred, otherwise we use the button below
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Profile Header Section */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={50} color="#666666" />
                                </View>
                            )}

                            {/* Camera Icon Overlay */}
                            <View style={styles.cameraButton}>
                                <Ionicons name="camera-outline" size={16} color="#FF2D55" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.atSymbol}>@</Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="username"
                                    placeholderTextColor="#666666"
                                    autoCapitalize="none"
                                    includeFontPadding={false}
                                    textAlignVertical="center"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Display Name</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    placeholder="Display Name"
                                    placeholderTextColor="#666666"
                                    includeFontPadding={false}
                                    textAlignVertical="center"
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
        backgroundColor: "#0F0F10",
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 24,
    },
    avatarContainer: {
        marginBottom: 32,
    },
    avatarWrapper: {
        position: "relative",
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#1C1C1E",
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: "#1C1C1E",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#0F0F10",
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: "#999999",
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: "#2C2C2E",
    },
    atSymbol: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: "#666666",
        marginRight: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
        height: '100%',
    },
    saveButton: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '90%',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: "#000000",
    },
});
