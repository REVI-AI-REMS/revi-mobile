import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { useDeletePostMutation, useReportPostMutation } from "@/src/hooks/mutations/use-feed-mutations";
import type { PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PostOptionsSheetProps {
    post: PostRead | null;
    currentUserId: string;
    onClose: () => void;
}

type ReportReason = "spam" | "nudity" | "violence" | "misinformation" | "other";

const REPORT_REASONS: { key: ReportReason; label: string }[] = [
    { key: "spam", label: "Spam" },
    { key: "nudity", label: "Nudity or sexual content" },
    { key: "violence", label: "Violence or harmful acts" },
    { key: "misinformation", label: "Misinformation" },
    { key: "other", label: "Other" },
];

export function PostOptionsSheet({
    post,
    currentUserId,
    onClose,
}: PostOptionsSheetProps) {
    const [step, setStep] = useState<"menu" | "report" | "done">("menu");
    const isOwnPost = post?.author_id === currentUserId;
    const { mutate: deletePost, isPending: deleting } = useDeletePostMutation();
    const { mutate: reportPost, isPending: reporting } = useReportPostMutation();

    const handleClose = () => {
        onClose();
        // Reset step after modal animates out
        setTimeout(() => setStep("menu"), 300);
    };

    const handleDelete = () => {
        if (!post) return;
        deletePost(post.id, { onSuccess: handleClose });
    };

    const handleReport = (reason: ReportReason) => {
        if (!post) return;
        reportPost(
            { postId: post.id, reason },
            {
                onSuccess: () => setStep("done"),
            },
        );
    };

    const isBusy = deleting || reporting;

    return (
        <OverlayModal
            visible={Boolean(post)}
            onClose={handleClose}
            height="auto"
            showCloseButton={false}
            dismissOnBackdrop
        >
            <View style={optionStyles.handle} />

            {step === "menu" && (
                <>
                    <Text style={optionStyles.title}>Post options</Text>

                    {isOwnPost ? (
                        // ── Own post ──────────────────────────────────────────────────
                        <>
                            <TouchableOpacity
                                style={[
                                    optionStyles.option,
                                    isBusy && optionStyles.optionDisabled,
                                ]}
                                onPress={handleDelete}
                                disabled={isBusy}
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color="#FF3B30" />
                                ) : (
                                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                                )}
                                <Text
                                    style={[
                                        optionStyles.optionText,
                                        optionStyles.destructiveText,
                                    ]}
                                >
                                    Delete post
                                </Text>
                            </TouchableOpacity>
                            <View style={optionStyles.divider} />
                        </>
                    ) : (
                        // ── Other user's post ─────────────────────────────────────────
                        <>
                            <TouchableOpacity
                                style={optionStyles.option}
                                onPress={() => setStep("report")}
                            >
                                <Ionicons name="flag-outline" size={22} color="#FF9500" />
                                <Text style={optionStyles.optionText}>Report post</Text>
                            </TouchableOpacity>
                            <View style={optionStyles.divider} />
                            <TouchableOpacity style={optionStyles.option}>
                                <Ionicons name="link-outline" size={22} color="#FFFFFF" />
                                <Text style={optionStyles.optionText}>Copy link</Text>
                            </TouchableOpacity>
                            <View style={optionStyles.divider} />
                            <TouchableOpacity style={optionStyles.option}>
                                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                                <Text style={optionStyles.optionText}>Share</Text>
                            </TouchableOpacity>
                            <View style={optionStyles.divider} />
                            <TouchableOpacity style={optionStyles.option}>
                                <Ionicons name="eye-off-outline" size={22} color="#FFFFFF" />
                                <Text style={optionStyles.optionText}>Not interested</Text>
                            </TouchableOpacity>
                            <View style={optionStyles.divider} />
                        </>
                    )}

                    <TouchableOpacity
                        style={[optionStyles.option, optionStyles.cancelOption]}
                        onPress={handleClose}
                    >
                        <Text style={optionStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </>
            )}

            {step === "report" && (
                <>
                    <TouchableOpacity
                        style={optionStyles.backRow}
                        onPress={() => setStep("menu")}
                    >
                        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                        <Text style={optionStyles.backText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={optionStyles.title}>Report post</Text>
                    <Text style={optionStyles.subtitle}>
                        Why are you reporting this post?
                    </Text>
                    {REPORT_REASONS.map(({ key, label }) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                optionStyles.option,
                                reporting && optionStyles.optionDisabled,
                            ]}
                            onPress={() => handleReport(key)}
                            disabled={reporting}
                        >
                            {reporting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="chevron-forward" size={18} color="#666666" />
                            )}
                            <Text style={optionStyles.optionText}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {step === "done" && (
                <View style={optionStyles.doneBox}>
                    <Ionicons name="checkmark-circle" size={48} color="#30D158" />
                    <Text style={optionStyles.doneTitle}>Thanks for letting us know</Text>
                    <Text style={optionStyles.doneSubtitle}>
                        {
                            "We'll review this post and take action if it violates our guidelines."
                        }
                    </Text>
                    <TouchableOpacity
                        style={optionStyles.doneButton}
                        onPress={handleClose}
                    >
                        <Text style={optionStyles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            )}
        </OverlayModal>
    );
}

const optionStyles = StyleSheet.create({
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: "#666666",
        textAlign: "center",
        marginBottom: 16,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 16,
    },
    optionDisabled: {
        opacity: 0.5,
    },
    optionText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
    },
    destructiveText: {
        color: "#FF3B30",
    },
    divider: {
        height: 1,
        backgroundColor: "#2C2C2E",
    },
    cancelOption: {
        justifyContent: "center",
        marginTop: 8,
    },
    cancelText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: "#999999",
        textAlign: "center",
    },
    backRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 12,
    },
    backText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
    },
    doneBox: {
        alignItems: "center",
        gap: 12,
        paddingVertical: 16,
    },
    doneTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
        textAlign: "center",
    },
    doneSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#666666",
        textAlign: "center",
        lineHeight: 20,
    },
    doneButton: {
        marginTop: 8,
        paddingHorizontal: 40,
        paddingVertical: 12,
        backgroundColor: "#2C2C2E",
        borderRadius: 24,
    },
    doneButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
});
