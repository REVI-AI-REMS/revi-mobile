import { ScreenHeader } from "@/src/components";
import { colors, layout, radius, spacing, typography } from "@/src/constants/design";
import { formatCount } from "@/src/data/mock";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=333&color=fff&name=U";

export default function MyProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "No name set";

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Profile"
                onBackPress={() => router.back()}
                showBackButton
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => router.push("/profile/edit-profile")}
                        activeOpacity={0.8}
                    >
                        <ExpoImage
                            source={{ uri: user?.avatar ?? DEFAULT_AVATAR }}
                            style={styles.avatar}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                        <View style={styles.cameraButton}>
                            <Ionicons name="camera-outline" size={14} color="#FF2D55" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.handle}>@{user?.username ?? "—"}</Text>
                    <Text style={styles.displayName}>{displayName}</Text>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push("/profile/edit-profile")}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                        <Ionicons name="pencil" size={13} color="#000000" />
                    </TouchableOpacity>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{formatCount(0)}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{formatCount(0)}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{formatCount(0)}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                    </View>
                </View>

                {/* Posts Grid Placeholder */}
                <View style={styles.gridDivider}>
                    <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
                </View>

                <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No posts yet</Text>
                    <Text style={styles.emptySubtitle}>Your posts will appear here</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const AVATAR_SIZE = 90;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        paddingBottom: 48,
    },

    // Profile header
    profileHeader: {
        alignItems: "center",
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    avatarContainer: {
        marginBottom: spacing.sm,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: colors.bgTertiary,
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.bg,
    },
    handle: {
        ...typography.bodySm,
        color: colors.textTertiary,
        marginBottom: spacing.xxs,
    },
    displayName: {
        ...typography.h1,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        backgroundColor: colors.white,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.full,
        marginBottom: spacing.xl,
    },
    editButtonText: {
        ...typography.labelMd,
        color: "#000000",
    },

    // Stats
    statsRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 32,
    },
    statItem: {
        alignItems: "center",
        gap: spacing.xxs,
    },
    statNumber: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textTertiary,
    },

    // Grid
    gridDivider: {
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.section,
        gap: spacing.sm,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    emptySubtitle: {
        ...typography.bodySm,
        color: colors.textMuted,
    },
});
