import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function TokenBalanceScreen() {
    const router = useRouter();

    const handleBackPress = () => {
        router.back();
    };

    const PlanCard = ({
        title,
        tokens,
        price,
        isPopular = false
    }: {
        title: string;
        tokens: string;
        price: string;
        isPopular?: boolean;
    }) => (
        <View style={styles.planCard}>
            <View style={styles.planHeader}>
                <View>
                    <Text style={styles.planTitle}>{title}</Text>
                    <View style={styles.tokenRow}>
                        <Text style={styles.tokenAmount}>{tokens}</Text>
                        <Text style={styles.tokenLabel}>/Tokens</Text>
                    </View>
                </View>
                <Text style={styles.planPrice}>{price}</Text>
            </View>

            <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Token Balance"
                onBackPress={handleBackPress}
                showBackButton={true}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceAmount}>100</Text>
                    <Text style={styles.balanceLabel}>Token Balance</Text>

                    <View style={styles.avatarBubble}>
                        <Ionicons name="person" size={24} color="#666666" />
                    </View>
                </View>

                <View style={styles.plansSection}>
                    <Text style={styles.plansTitle}>Select your Plan</Text>
                    <Text style={styles.plansSubtitle}>
                        Cancel anytime. All plans include our{"\n"}core features
                    </Text>

                    <View style={styles.plansList}>
                        <PlanCard
                            title="Basic Plan"
                            tokens="10"
                            price="₦8,000"
                        />
                        <PlanCard
                            title="Popular Plan"
                            tokens="25"
                            price="₦18,500"
                            isPopular={true}
                        />
                        <PlanCard
                            title="Best Value Plan"
                            tokens="60"
                            price="₦35,500"
                        />
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
    balanceSection: {
        alignItems: "center",
        paddingVertical: 32,
        position: "relative",
    },
    balanceAmount: {
        fontSize: 32,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
        marginBottom: 8,
    },
    balanceLabel: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#999999",
    },
    avatarBubble: {
        position: "absolute",
        right: 40,
        bottom: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#1C1C1E",
    },
    plansSection: {
        paddingHorizontal: 16,
    },
    plansTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 8,
    },
    plansSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#999999",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    plansList: {
        gap: 16,
    },
    planCard: {
        backgroundColor: "#1C1C1E",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#2C2C2E",
    },
    planHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
    },
    planTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
        marginBottom: 8,
    },
    tokenRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    tokenAmount: {
        fontSize: 24,
        fontFamily: Fonts.regular, // Looks like regular/light in screenshot
        color: "#FFFFFF",
    },
    tokenLabel: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#999999",
    },
    planPrice: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },
    buyButton: {
        borderWidth: 1,
        borderColor: "#3A3A3C",
        borderRadius: 24,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: "#222224", // Slightly lighter than background
    },
    buyButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },
});
