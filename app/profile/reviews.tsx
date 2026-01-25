import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function ReviewsScreen() {
    const router = useRouter();

    const handleBackPress = () => {
        router.back();
    };

    const ReviewItem = ({
        name,
        date,
        rating,
        text
    }: {
        name: string;
        date: string;
        rating: number;
        text: string;
    }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color="#666666" />
                    </View>
                    <Text style={styles.reviewerName}>{name}</Text>
                </View>

                <View style={styles.ratingInfo}>
                    <View style={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                            <Ionicons
                                key={i}
                                name={i < rating ? "star" : "star-outline"}
                                size={14}
                                color="#FFD700"
                                style={styles.star}
                            />
                        ))}
                    </View>
                    <Text style={styles.reviewDate}>{date}</Text>
                </View>
            </View>

            <Text style={styles.reviewText}>{text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Reviews"
                onBackPress={handleBackPress}
                showBackButton={true}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <View style={styles.seeAllBadge}>
                        <Text style={styles.seeAllText}>See all (50)</Text>
                        <View style={styles.overlapAvatars}>
                            {[1, 2, 3].map((_, i) => (
                                <View key={i} style={[styles.miniAvatar, { marginLeft: -8 }]}>
                                    <Ionicons name="person" size={10} color="#666666" />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.reviewsList}>
                    <ReviewItem
                        name="John Ade"
                        date="9/10/2025"
                        rating={5}
                        text="Excellent work! John arrived on time and fixed my leaking pipe quickly and professionally. Very clean workspace and explained everything clearly."
                    />
                    <View style={styles.separator} />
                    <ReviewItem
                        name="John Ade"
                        date="9/10/2025"
                        rating={5}
                        text="Excellent work! John arrived on time and fixed my leaking pipe quickly and professionally. Very clean workspace and explained everything clearly."
                    />
                    <View style={styles.separator} />
                    <ReviewItem
                        name="John Ade"
                        date="9/10/2025"
                        rating={5}
                        text="Excellent work! John arrived on time and fixed my leaking pipe quickly and professionally. Very clean workspace and explained everything clearly."
                    />
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
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
    },
    seeAllBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2C2C2E",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
    },
    seeAllText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
    },
    overlapAvatars: {
        flexDirection: "row",
        paddingLeft: 8,
    },
    miniAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#3A3A3C",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#2C2C2E",
    },
    reviewsList: {
        paddingHorizontal: 16,
    },
    reviewItem: {
        paddingVertical: 16,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E5C8A8", // Placeholder skin tone color
        alignItems: "center",
        justifyContent: "center",
    },
    reviewerName: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
    },
    ratingInfo: {
        alignItems: "flex-end",
        gap: 4,
    },
    stars: {
        flexDirection: "row",
        backgroundColor: "#1C1C1E",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    star: {
        marginHorizontal: 1,
    },
    reviewDate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#666666",
    },
    reviewText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#A0A0A0",
        lineHeight: 22,
    },
    separator: {
        height: 1,
        backgroundColor: "#1C1C1E",
        width: "100%",
    },
});
