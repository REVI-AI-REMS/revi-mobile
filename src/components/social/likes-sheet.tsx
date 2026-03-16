import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface LikesSheetProps {
    postId: string | null;
    likeCount: number;
    onClose: () => void;
}

export function LikesSheet({ postId, likeCount, onClose }: LikesSheetProps) {
    return (
        <OverlayModal
            visible={Boolean(postId)}
            onClose={onClose}
            height="auto"
            showCloseButton={false}
            dismissOnBackdrop
        >
            {/* Handle */}
            <View style={s.handle} />

            {/* Title */}
            <Text style={s.title}>Likes</Text>

            <View style={s.body}>
                <Ionicons name="heart" size={40} color="#FF3B30" />
                <Text style={s.count}>
                    {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
                </Text>
                <Text style={s.note}>
                    A list of who liked this post is not available yet.
                </Text>
            </View>
        </OverlayModal>
    );
}

const s = StyleSheet.create({
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "#3A3A3C",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
        marginTop: -16,
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#2C2C2E",
        paddingBottom: 16,
    },
    body: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 12,
    },
    count: {
        fontSize: 22,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
    note: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: "#666666",
        textAlign: "center",
    },
});
