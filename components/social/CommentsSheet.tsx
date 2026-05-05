import OverlayModal from "@/components/common/OverlayModal";
import { Fonts } from "@/constants/theme";
import {
    useAddCommentMutation,
    useDeleteCommentMutation,
} from "@/hooks/mutations/use-feed-mutations";
import { useComments } from "@/hooks/queries/use-feed";
import type { CommentRead } from "@/scripts/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { formatRelativeTime } from "./PostCard";

interface CommentsSheetProps {
  postId: string | null;
  currentUserId: string;
  onClose: () => void;
}

const MAX_LEN = 500;

// ─── Avatar ────────────────────────────────────────────────────────────────
// No backend avatar URLs yet. Keep it neutral — dark grey disc with the
// first two UUID chars. No rainbow hashing; the point is presence, not
// decoration.

function initialsFor(id: string): string {
  return id.slice(0, 2).toUpperCase();
}

const Avatar = memo(function Avatar({
  size = 36,
  authorId,
  username,
  avatarUrl,
}: {
  size?: number;
  authorId: string;
  username?: string | null;
  avatarUrl?: string | null;
}) {
  const fontSize = Math.round(size * 0.38);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize }]}>
        {(username || authorId).charAt(0).toUpperCase()}
      </Text>
    </View>
  );
});

function shortHandle(id: string) {
  return `@${id.slice(0, 8)}`;
}

export function CommentsSheet({
  postId,
  currentUserId,
  onClose,
}: CommentsSheetProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    author: string;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<CommentRead>>(null);

  const { data: comments = [], isLoading } = useComments(postId ?? "");
  const { mutate: addComment, isPending: submitting } = useAddCommentMutation();
  const { mutate: deleteComment } = useDeleteCommentMutation();

  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const countLabel = useMemo(() => {
    const n = comments.length;
    if (n === 0) return null;
    if (n < 1000) return String(n);
    return `${(n / 1000).toFixed(1)}k`;
  }, [comments.length]);

  const handleDelete = useCallback(
    (commentId: string) => {
      if (!postId) return;
      Alert.alert("Delete comment", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment({ postId, commentId }),
        },
      ]);
    },
    [postId, deleteComment],
  );

  const handleReply = useCallback((commentId: string, authorId: string) => {
    setReplyTo({ id: commentId, author: shortHandle(authorId) });
    setText("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
    setText("");
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !postId) return;
    sendScale.value = withSpring(0.88, { damping: 10 }, () => {
      sendScale.value = withSpring(1, { damping: 8 });
    });
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
          setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 50);
        },
      },
    );
  }, [text, postId, replyTo, addComment, sendScale]);

  const renderItem = useCallback(
    ({ item: c }: { item: CommentRead }) => {
      const isOwn = c.author_id === currentUserId;
      const isPending = c.id.startsWith("temp-");

      return (
        <View style={styles.commentRow}>
          <Avatar 
            authorId={c.author_id} 
            username={c.author_username} 
            avatarUrl={c.author_avatar} 
          />
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor} numberOfLines={1}>
                {isOwn ? "You" : (c.author_username ? `@${c.author_username}` : shortHandle(c.author_id))}
              </Text>
              <Text style={styles.commentTime}>
                {isPending ? "sending…" : formatRelativeTime(c.created_at)}
              </Text>
            </View>
            <Text
              style={[
                styles.commentText,
                isPending && styles.commentTextPending,
              ]}
            >
              {c.content}
            </Text>
            {!isPending && (
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.commentAction} disabled>
                  <Ionicons name="heart-outline" size={15} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={() => handleReply(c.id, c.author_id)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.replyText}>Reply</Text>
                </TouchableOpacity>
                {isOwn && (
                  <TouchableOpacity
                    style={styles.commentAction}
                    onPress={() => handleDelete(c.id)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="trash-outline" size={14} color="#888" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      );
    },
    [currentUserId, handleReply, handleDelete],
  );

  const keyExtractor = useCallback((c: CommentRead) => c.id, []);
  const sendEnabled = text.trim().length > 0 && !submitting;

  return (
    <OverlayModal
      visible={Boolean(postId)}
      onClose={onClose}
      height="80%"
      showCloseButton={false}
      scrollable={false}
      dismissOnBackdrop
    >

      {/* Title + count */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Comments</Text>
        {countLabel && <Text style={styles.countLabel}>{countLabel}</Text>}
      </View>
      <View style={styles.divider} />

      {/* Body */}
      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.stateBox}>
          <View style={styles.emptyHalo}>
            <Ionicons name="chatbubble-outline" size={28} color="#8E8E93" />
          </View>
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to say something
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={comments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* Reply banner — thin white stripe, neutral background */}
      {replyTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyAccent} />
          <Text style={styles.replyBannerText}>
            Replying to{" "}
            <Text style={styles.replyBannerHandle}>{replyTo.author}</Text>
          </Text>
          <TouchableOpacity
            onPress={handleCancelReply}
            hitSlop={8}
            style={styles.replyCloseBtn}
          >
            <Ionicons name="close" size={14} color="#D4D4D8" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <Avatar 
          authorId={currentUserId} 
          size={30} 
        />
        <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={
              replyTo ? `Reply to ${replyTo.author}…` : "Add a comment…"
            }
            placeholderTextColor="#6B6B70"
            value={text}
            onChangeText={setText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={MAX_LEN}
            editable={!submitting}
          />
          {text.length >= MAX_LEN - 50 && (
            <Text
              style={[
                styles.counter,
                text.length >= MAX_LEN - 20 && styles.counterWarn,
              ]}
            >
              {text.length}/{MAX_LEN}
            </Text>
          )}
        </View>
        <Animated.View style={sendAnimStyle}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!sendEnabled}
            activeOpacity={0.7}
            style={[
              styles.sendButton,
              sendEnabled ? styles.sendButtonActive : styles.sendButtonIdle,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0F0F10" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={18}
                color={sendEnabled ? "#0F0F10" : "#555"}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </OverlayModal>
  );
}

const styles = StyleSheet.create({
  // Title row
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  countLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#6B6B70",
  },
  divider: {
    height: 1,
    backgroundColor: "#242426",
    marginBottom: 10,
  },

  // Loading / empty
  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 40,
  },
  emptyHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: "#E5E7EB",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#6B6B70",
  },

  // List
  list: { flex: 1 },
  listContent: { paddingBottom: 12 },

  // Avatar
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "#242428",
    borderWidth: 1,
    borderColor: "#2F2F33",
  },
  avatarText: {
    color: "#CBCBD0",
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },

  // Comment row
  commentRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
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
    maxWidth: 180,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: "#6B6B70",
  },
  commentText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#E5E7EB",
    lineHeight: 20,
  },
  commentTextPending: {
    color: "#8E8E93",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 4,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  replyText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#8E8E93",
  },

  // Reply banner — dark neutral with white stripe on the left
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#242426",
    overflow: "hidden",
  },
  replyAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#FFFFFF",
  },
  replyBannerText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#A1A1AA",
    flex: 1,
  },
  replyBannerHandle: {
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  replyCloseBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2A2A2D",
    alignItems: "center",
    justifyContent: "center",
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#242426",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#18181B",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#242426",
    maxHeight: 120,
  },
  inputWrapFocused: {
    borderColor: "#3A3A3F",
    backgroundColor: "#1D1D21",
  },
  input: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    padding: 0,
    maxHeight: 80,
    minHeight: 20,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: "#6B6B70",
    marginTop: 2,
  },
  counterWarn: {
    color: "#E8B430",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  sendButtonIdle: {
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
});
