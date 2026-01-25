import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function MyProfileScreen() {
    const router = useRouter();

    const handleBackPress = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Profile"
                onBackPress={handleBackPress}
                showBackButton={true}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Profile Header Section */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            {/* Placeholder for actual image, using a gray background for now */}
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={50} color="#666666" />
                            </View>
                            {/* Camera Icon Overlay */}
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera-outline" size={16} color="#FF2D55" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.username}>@victory_paul</Text>
                    <Text style={styles.displayName}>Victory Paul</Text>

                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => router.push("/profile/edit-profile")}
                    >
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                        <Ionicons name="pencil" size={14} color="#000000" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    {/* Stats Row */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>182.1k</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>182</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>50</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                    </View>
                </View>

                {/* Feed Section - Mock Post */}
                <View style={styles.feedSection}>
                    <View style={styles.postHeader}>
                        <View style={styles.postUserRow}>
                            <View style={styles.smallAvatar}>
                                <Ionicons name="person" size={16} color="#666666" />
                            </View>
                            <Text style={styles.postUsername}>Victory Paul</Text>
                            <Text style={styles.postTime}>• 10h</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="ellipsis-horizontal" size={20} color="#999999" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.postImageContainer}>
                        {/* Using a placeholder view for the house image */}
                        <View style={styles.postImagePlaceholder} />
                        <View style={styles.imageCountBadge}>
                            <Text style={styles.imageCountText}>1/12</Text>
                        </View>
                    </View>
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
        borderBottomWidth: 1,
        borderBottomColor: "#1C1C1E",
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatarWrapper: {
        position: "relative",
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#1C1C1E",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#0F0F10",
    },
    username: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#999999",
        marginBottom: 4,
    },
    displayName: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
        marginBottom: 16,
    },
    editProfileButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 24,
    },
    editProfileText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: "#000000",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        width: "100%",
        gap: 32,
    },
    statItem: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#666666",
    },
    feedSection: {
        marginTop: 0,
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    postUserRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    smallAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
    },
    postUsername: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
    postTime: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#666666",
    },
    postImageContainer: {
        width: width,
        height: width, // Square aspect ratio or adjust as needed
        backgroundColor: "#1C1C1E",
        position: "relative",
    },
    postImagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#2C2C2E", // Placeholder color
    },
    imageCountBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    imageCountText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
});
