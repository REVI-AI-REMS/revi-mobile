import { ScreenHeader } from "@/src/components";
import { colors, radius, spacing, typography } from "@/src/constants/design";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=333&color=fff&name=U";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SettingsRow({
    icon,
    title,
    subtitle,
    trailing,
    onPress,
    destructive,
}: {
    icon: string;
    title: string;
    subtitle?: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
    destructive?: boolean;
}) {
    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.5 : 1}
            disabled={!onPress}
        >
            <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
                <Ionicons
                    name={icon as any}
                    size={18}
                    color={destructive ? colors.error : colors.textSecondary}
                />
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>
                    {title}
                </Text>
                {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
            </View>
            {trailing ?? (onPress ? (
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            ) : null)}
        </TouchableOpacity>
    );
}

function Chip({
    title,
    variant = "default",
    onPress,
}: {
    title: string;
    variant?: "default" | "destructive" | "outline-destructive";
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.chip,
                variant === "destructive" && styles.chipDestructive,
                variant === "outline-destructive" && styles.chipOutlineDestructive,
            ]}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <Text
                style={[
                    styles.chipText,
                    variant === "destructive" && styles.chipTextDestructive,
                    variant === "outline-destructive" && styles.chipTextOutlineDestructive,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "No name set";

    return (
        <View style={styles.container}>
            <ScreenHeader title="Settings" onBackPress={() => router.back()} showBackButton showMenuButton={false} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── Account Card ─────────────────────────────────── */}
                <View style={styles.accountCard}>
                    <ExpoImage
                        source={{ uri: user?.avatar ?? DEFAULT_AVATAR }}
                        style={styles.accountAvatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{displayName}</Text>
                        <Text style={styles.accountHandle}>@{user?.username ?? "—"}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => router.push("/profile/edit-profile")}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── General ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>GENERAL</Text>
                    <View style={styles.card}>
                        <SettingsRow
                            icon="lock-closed-outline"
                            title="Change Password"
                            onPress={() =>
                                Alert.alert("Change Password", "A password reset link will be sent to your email.", [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Send Link" },
                                ])
                            }
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="shield-checkmark-outline"
                            title="Two-Factor Authentication"
                            subtitle="Add extra security to your account"
                            onPress={() => Alert.alert("2FA", "Two-factor authentication will be available soon.")}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="document-text-outline"
                            title="Privacy Policy"
                            onPress={() => router.push("/profile/privacy-policy")}
                        />
                    </View>
                </View>

                {/* ─── Support ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>SUPPORT</Text>
                    <View style={styles.card}>
                        <SettingsRow
                            icon="help-circle-outline"
                            title="Help Centre"
                            onPress={() => {}}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="chatbubble-ellipses-outline"
                            title="Send Feedback"
                            onPress={() => {}}
                        />
                    </View>
                </View>

                {/* ─── Account ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ACCOUNT</Text>
                    <View style={styles.card}>
                        <SettingsRow
                            icon="log-out-outline"
                            title="Log Out"
                            onPress={() =>
                                Alert.alert("Log Out", "Are you sure?", [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Log Out", style: "destructive", onPress: () => logout() },
                                ])
                            }
                        />
                    </View>
                </View>

                {/* ─── Danger Zone ──────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.error }]}>DANGER ZONE</Text>
                    <View style={[styles.card, styles.cardDanger]}>
                        <Text style={styles.dangerDescription}>
                            These actions are permanent and cannot be undone.
                        </Text>
                        <View style={styles.dangerActions}>
                            <Chip
                                title="Delete all chats"
                                variant="outline-destructive"
                                onPress={() =>
                                    Alert.alert("Delete All Chats", "This action cannot be undone.", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Delete", style: "destructive" },
                                    ])
                                }
                            />
                            <Chip
                                title="Delete account"
                                variant="destructive"
                                onPress={() =>
                                    Alert.alert(
                                        "Delete Account",
                                        "This will permanently delete your account and all data.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive" },
                                        ],
                                    )
                                }
                            />
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.version}>ReviAI v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: 60,
    },

    // Account card
    accountCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.xxl,
    },
    accountAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.bgTertiary,
    },
    accountInfo: {
        flex: 1,
        gap: 2,
    },
    accountName: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    accountHandle: {
        ...typography.bodySm,
        color: colors.textTertiary,
    },
    editBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs + 2,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    editBtnText: {
        ...typography.labelSm,
        color: colors.textSecondary,
    },

    // Sections
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        ...typography.labelSm,
        color: colors.textMuted,
        letterSpacing: 0.8,
        marginBottom: spacing.xs,
        marginLeft: spacing.xxs,
    },

    // Card
    card: {
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.md,
        overflow: "hidden",
    },
    cardDanger: {
        borderWidth: 1,
        borderColor: "rgba(255, 59, 48, 0.15)",
    },

    // Row
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        gap: spacing.sm,
        minHeight: 52,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        backgroundColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    rowIconDestructive: {
        backgroundColor: "rgba(255, 59, 48, 0.1)",
    },
    rowContent: {
        flex: 1,
        gap: 1,
    },
    rowTitle: {
        ...typography.bodyMd,
        color: colors.textPrimary,
    },
    rowTitleDestructive: {
        color: colors.error,
    },
    rowSubtitle: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: 32 + spacing.md + spacing.sm, // icon width + padding + gap
    },

    // Danger zone
    dangerDescription: {
        ...typography.bodySm,
        color: colors.textTertiary,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
    },
    dangerActions: {
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },

    // Chips
    chip: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: colors.bgTertiary,
    },
    chipDestructive: {
        backgroundColor: colors.error,
    },
    chipOutlineDestructive: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.error,
    },
    chipText: {
        ...typography.labelSm,
        color: colors.textPrimary,
    },
    chipTextDestructive: {
        color: colors.white,
    },
    chipTextOutlineDestructive: {
        color: colors.error,
    },

    // Footer
    version: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: spacing.lg,
    },
});
