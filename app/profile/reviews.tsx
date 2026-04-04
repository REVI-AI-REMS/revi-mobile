import { ScreenHeader } from "@/src/components";
import { colors, radius, spacing, typography } from "@/src/constants/design";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// ─── Sub-components ──────────────────────────────────────────────────────────

const StarRating = memo(function StarRating({ rating }: { rating: number }) {
    return (
        <View style={styles.stars}>
            {Array.from({ length: 5 }, (_, i) => (
                <Ionicons
                    key={i}
                    name={i < rating ? "star" : "star-outline"}
                    size={13}
                    color="#FFD700"
                />
            ))}
        </View>
    );
});

const ReviewItem = memo(function ReviewItem({
    name,
    date,
    rating,
    text,
}: {
    name: string;
    date: string;
    rating: number;
    text: string;
}) {
    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={18} color={colors.textMuted} />
                    </View>
                    <Text style={styles.reviewerName}>{name}</Text>
                </View>
                <View style={styles.ratingInfo}>
                    <StarRating rating={rating} />
                    <Text style={styles.reviewDate}>{date}</Text>
                </View>
            </View>
            <Text style={styles.reviewText}>{text}</Text>
        </View>
    );
});

// ─── Screen ──────────────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
    {
        id: "1",
        name: "John Ade",
        date: "9/10/2025",
        rating: 5,
        text: "Excellent work! John arrived on time and fixed my leaking pipe quickly and professionally. Very clean workspace and explained everything clearly.",
    },
    {
        id: "2",
        name: "Sarah O.",
        date: "8/25/2025",
        rating: 4,
        text: "Great service overall. Very professional and thorough. Would definitely recommend and use again.",
    },
    {
        id: "3",
        name: "Mike T.",
        date: "8/12/2025",
        rating: 5,
        text: "Outstanding experience from start to finish. Prompt, knowledgeable, and left the place spotless.",
    },
];

export default function ReviewsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Reviews"
                onBackPress={() => router.back()}
                showBackButton
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Row */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <View style={styles.countBadge}>
                        <View style={styles.overlapAvatars}>
                            {[0, 1, 2].map((i) => (
                                <View key={i} style={[styles.miniAvatar, i > 0 && { marginLeft: -8 }]}>
                                    <Ionicons name="person" size={10} color={colors.textMuted} />
                                </View>
                            ))}
                        </View>
                        <Text style={styles.countText}>See all ({MOCK_REVIEWS.length * 17})</Text>
                    </View>
                </View>

                {/* Reviews List */}
                <View style={styles.reviewsList}>
                    {MOCK_REVIEWS.map((review, index) => (
                        <View key={review.id}>
                            {index > 0 && <View style={styles.separator} />}
                            <ReviewItem
                                name={review.name}
                                date={review.date}
                                rating={review.rating}
                                text={review.text}
                            />
                        </View>
                    ))}
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
        paddingBottom: 48,
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    countBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgTertiary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: radius.full,
        gap: spacing.xs,
    },
    countText: {
        ...typography.bodySm,
        color: colors.textPrimary,
    },
    overlapAvatars: {
        flexDirection: "row",
    },
    miniAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.bgSecondary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.bgTertiary,
    },

    // Reviews
    reviewsList: {
        paddingHorizontal: spacing.md,
    },
    reviewItem: {
        paddingVertical: spacing.md,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    reviewerInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#E5C8A8",
        alignItems: "center",
        justifyContent: "center",
    },
    reviewerName: {
        ...typography.labelMd,
        color: colors.textPrimary,
    },
    ratingInfo: {
        alignItems: "flex-end",
        gap: spacing.xxs,
    },
    stars: {
        flexDirection: "row",
        gap: 1,
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radius.sm,
    },
    reviewDate: {
        ...typography.caption,
        color: colors.textMuted,
    },
    reviewText: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
});
