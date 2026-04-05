import { ScreenHeader } from "@/src/components";
import { colors, radius, spacing, typography } from "@/src/constants/design";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Sub-components ──────────────────────────────────────────────────────────

const PlanCard = memo(function PlanCard({
    title,
    tokens,
    price,
    isPopular = false,
}: {
    title: string;
    tokens: string;
    price: string;
    isPopular?: boolean;
}) {
    return (
        <View style={[styles.planCard, isPopular && styles.planCardPopular]}>
            {isPopular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
            )}
            <View style={styles.planHeader}>
                <View>
                    <Text style={[styles.planTitle, isPopular && styles.planTitlePopular]}>
                        {title}
                    </Text>
                    <View style={styles.tokenRow}>
                        <Text style={styles.tokenAmount}>{tokens}</Text>
                        <Text style={styles.tokenLabel}> Tokens</Text>
                    </View>
                </View>
                <Text style={[styles.planPrice, isPopular && styles.planPricePopular]}>{price}</Text>
            </View>

            <TouchableOpacity
                style={[styles.buyButton, isPopular && styles.buyButtonPopular]}
                activeOpacity={0.7}
            >
                <Text style={[styles.buyButtonText, isPopular && styles.buyButtonTextPopular]}>
                    Buy Now
                </Text>
            </TouchableOpacity>
        </View>
    );
});

// ─── Screen ──────────────────────────────────────────────────────────────────

const PLANS = [
    { title: "Basic Plan", tokens: "10", price: "₦8,000", isPopular: false },
    { title: "Popular Plan", tokens: "25", price: "₦18,500", isPopular: true },
    { title: "Best Value Plan", tokens: "60", price: "₦35,500", isPopular: false },
];

export default function TokenBalanceScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Token Balance"
                onBackPress={() => router.back()}
                showBackButton
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceIconWrapper}>
                        <Ionicons name="flash" size={28} color="#FFD700" />
                    </View>
                    <Text style={styles.balanceAmount}>100</Text>
                    <Text style={styles.balanceLabel}>Token Balance</Text>
                    {user?.username && (
                        <Text style={styles.balanceUser}>@{user.username}</Text>
                    )}
                </View>

                {/* Plans */}
                <View style={styles.plansSection}>
                    <Text style={styles.plansTitle}>Select your Plan</Text>
                    <Text style={styles.plansSubtitle}>
                        Cancel anytime. All plans include our core features.
                    </Text>

                    <View style={styles.plansList}>
                        {PLANS.map((plan) => (
                            <PlanCard key={plan.title} {...plan} />
                        ))}
                    </View>
                </View>
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
        paddingBottom: 48,
    },

    // Balance card
    balanceCard: {
        alignItems: "center",
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.lg,
        paddingVertical: spacing.xxl,
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
        gap: spacing.xxs,
    },
    balanceIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "rgba(255,215,0,0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xs,
    },
    balanceAmount: {
        ...typography.displayLg,
        color: colors.textPrimary,
    },
    balanceLabel: {
        ...typography.bodyMd,
        color: colors.textSecondary,
    },
    balanceUser: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.xxs,
    },

    // Plans section
    plansSection: {
        gap: spacing.xs,
    },
    plansTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: "center",
    },
    plansSubtitle: {
        ...typography.bodyMd,
        color: colors.textTertiary,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    plansList: {
        gap: spacing.md,
    },

    // Plan card
    planCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    planCardPopular: {
        borderColor: colors.accent,
        borderWidth: 1.5,
    },
    popularBadge: {
        alignSelf: "flex-start",
        backgroundColor: colors.accent,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        marginBottom: spacing.sm,
    },
    popularBadgeText: {
        ...typography.caption,
        color: colors.white,
    },
    planHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.lg,
    },
    planTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    planTitlePopular: {
        color: colors.accent,
    },
    tokenRow: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    tokenAmount: {
        ...typography.displaySm,
        color: colors.textPrimary,
    },
    tokenLabel: {
        ...typography.bodyMd,
        color: colors.textTertiary,
    },
    planPrice: {
        ...typography.h1,
        color: colors.textPrimary,
    },
    planPricePopular: {
        color: colors.accent,
    },
    buyButton: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: radius.full,
        paddingVertical: spacing.sm,
        alignItems: "center",
        backgroundColor: colors.bgTertiary,
    },
    buyButtonPopular: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    buyButtonText: {
        ...typography.labelLg,
        color: colors.textPrimary,
    },
    buyButtonTextPopular: {
        color: colors.white,
    },
});
