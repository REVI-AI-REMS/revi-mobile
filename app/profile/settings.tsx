import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
    const router = useRouter();

    const handleBackPress = () => {
        router.back();
    };

    const SettingsItem = ({
        icon,
        title,
        action,
        isDestructive = false,
        onPress
    }: {
        icon: any;
        title: string;
        action: React.ReactNode;
        isDestructive?: boolean;
        onPress?: () => void;
    }) => (
        <View style={styles.settingsItem}>
            <View style={styles.itemLeft}>
                <Ionicons
                    name={icon}
                    size={20}
                    color="#FFFFFF"
                    style={styles.itemIcon}
                />
                <Text style={styles.itemTitle}>{title}</Text>
            </View>
            <View>{action}</View>
        </View>
    );

    const ActionButton = ({
        title,
        variant = "default",
        onPress
    }: {
        title: string;
        variant?: "default" | "destructive" | "outline-destructive";
        onPress?: () => void;
    }) => {
        let bg = "#1C1C1E";
        let text = "#FFFFFF";
        let border = "transparent";

        if (variant === "destructive") {
            bg = "#FF3B30";
        } else if (variant === "outline-destructive") {
            bg = "transparent";
            text = "#FF3B30";
            border = "#FF3B30";
        }

        return (
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    { backgroundColor: bg, borderColor: border, borderWidth: border !== "transparent" ? 1 : 0 }
                ]}
                onPress={onPress}
            >
                <Text style={[styles.actionButtonText, { color: text }]}>{title}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Settings"
                onBackPress={handleBackPress}
                showBackButton={true}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>General</Text>
                    <SettingsItem
                        icon="lock-closed-outline" // Using Lock as discussed
                        title="Change Password"
                        action={<ActionButton title="Change" />}
                    />
                </View>

                {/* Delete Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Delete Account</Text>
                    <Text style={styles.sectionDescription}>
                        Once you delete your account, there is no going{"\n"}back. Please be certain.
                    </Text>

                    <View style={styles.deleteOptions}>
                        <SettingsItem
                            icon="trash-outline"
                            title="Delete all chats"
                            action={<ActionButton title="Delete all" variant="outline-destructive" />}
                        />

                        <SettingsItem
                            icon="trash-outline"
                            title="Permantly Delete account"
                            action={<ActionButton title="Delete all" variant="destructive" />}
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: Fonts.regular, // Using regular/medium based on design
        color: "#FFFFFF",
        marginBottom: 16,
    },
    sectionDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#666666",
        marginBottom: 24,
        lineHeight: 20,
    },
    deleteOptions: {
        gap: 24,
    },
    settingsItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    itemIcon: {
        width: 20,
    },
    itemTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 80,
        alignItems: "center",
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
});
