import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { useAddCommentMutation } from "@/src/hooks/mutations/use-feed-mutations";
import { useComments } from "@/src/hooks/queries/use-feed";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { formatRelativeTime } from "./post-card";

interface CommentsSheetProps {
    postId: string | null;
    currentUserId: string;
    onClose: () => void;
}

export function CommentsSheet({ postId, currentUserId, onClose }: CommentsSheetProps) {
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(
        null,
    );
    const inputRef = useRef<TextInput>(null);
    const { data: comments = [], isLoading } = useComments(postId ?? "");
    const { mutate: addComment, isPending: submitting } = useAddCommentMutation();

    const handleReply = (commentId: string, authorId: string) => {
        setReplyTo({ id: commentId, author: `@${authorId.slice(0, 8)}` });
        setText("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleCancelReply = () => {
        setReplyTo(null);
        setText("");
    };

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || !postId) return;
        addComment(
            {
                content: trimmed,
                post_id: postId,
                parent_id: replyTo?.id ?? null,
            },
            {
                onSuccess: () => {
                    setText("");
                    setReplyTo(null);
                },
            },
        );
    };

    return (
        <OverlayModal
            visible={Boolean(postId)}
            onClose={onClose}
            height="80%"
            showCloseButton={false}
            dismissOnBackdrop
        >
            {/* Handle bar */}
            <View style={commentStyles.handle} />

            {/* Title */}
            <Text style={commentStyles.title}>Comments</Text>

            {/* Comments list */}
            {isLoading ? (
                <View style={commentStyles.loadingBox}>
                    <ActivityIndicator color="#FFFFFF" />
                </View>
            ) : comments.length === 0 ? (
                <View style={commentStyles.loadingBox}>
                    <Ionicons name="chatbubble-outline" size={36} color="#3A3A3C" />
                    <Text style={commentStyles.emptyText}>No comments yet</Text>
                </View>
            ) : (
                <ScrollView
                    style={commentStyles.list}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {comments.map((c) => (
                        <View key={c.id} style={commentStyles.commentRow}>
                            <View style={commentStyles.commentAvatar} />
                            <View style={commentStyles.commentBody}>
                                <View style={commentStyles.commentMeta}>
                                    <Text style={commentStyles.commentAuthor}>
                                        @{c.author_id.slice(0, 8)}
                                    </Text>
                                    <Text style={commentStyles.commentTime}>
                                        {formatRelativeTime(c.created_at)}
                                    </Text>
                                </View>
                                <Text style={commentStyles.commentText}>{c.content}</Text>
                                <View style={commentStyles.commentActions}>
                                    <TouchableOpacity style={commentStyles.commentAction}>
                                        <Ionicons name="heart-outline" size={15} color="#666666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={commentStyles.commentAction}
                                        onPress={() => handleReply(c.id, c.author_id)}
                                    >
                                        <Text style={commentStyles.replyText}>Reply</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={commentStyles.commentAction}>
                                        <Ionicons
                                            name="ellipsis-horizontal"
                                            size={15}
                                            color="#666666"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Input bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={20}
            >
                {replyTo && (
                    <View style={commentStyles.replyBanner}>
                        <Text style={commentStyles.replyBannerText}>
                            Replying to{" "}
                            <Text style={commentStyles.replyBannerHandle}>
                                {replyTo.author}
                            </Text>
                        </Text>
                        <TouchableOpacity onPress={handleCancelReply}>
                            <Ionicons name="close" size={16} color="#999999" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={commentStyles.inputRow}>
                    <View style={commentStyles.inputAvatar} />
                    <TextInput
                        ref={inputRef}
                        style={commentStyles.input}
                        placeholder={
                            replyTo ? `Reply to ${replyTo.author}...` : "Comment on this post"
                        }
                        placeholderTextColor="#666666"
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={500}
                        editable={!submitting}
                    />
                    <TouchableOpacity
                        style={[
                            commentStyles.sendButton,
                            (!text.trim() || submitting) && commentStyles.sendButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!text.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={18} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </OverlayModal>
    );
}

const commentStyles = StyleSheet.create({
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
    loadingBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#666666",
    },
    list: {
        flex: 1,
    },
    commentRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#2C2C2E",
        flexShrink: 0,
    },
    commentBody: {
        flex: 1,
        gap: 4,
    },
    commentMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    commentAuthor: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
    commentTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#666666",
    },
    commentText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#E5E7EB",
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginTop: 4,
    },
    commentAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    replyText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: "#666666",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#2C2C2E",
    },
    inputAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#2C2C2E",
        flexShrink: 0,
    },
    input: {
        flex: 1,
        backgroundColor: "#2C2C2E",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#FFFFFF",
        maxHeight: 80,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#007AFF",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    sendButtonDisabled: {
        backgroundColor: "#2C2C2E",
    },
    replyBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#2C2C2E",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyBannerText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: "#999999",
    },
    replyBannerHandle: {
        fontFamily: Fonts.semiBold,
        color: "#FFFFFF",
    },
});
