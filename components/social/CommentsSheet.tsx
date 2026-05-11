import OverlayModal from "@/components/common/OverlayModal";
import { Image } from "@/components/ExpoImage";
import { Fonts } from "@/constants/theme";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
} from "@/hooks/mutations/use-feed-mutations";
import { useAuthorProfiles } from "@/hooks/queries/use-author-profiles";
import { useComments } from "@/hooks/queries/use-feed";
import type { CommentRead } from "@/scripts/services/social/types";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  withSequence,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { formatRelativeTime } from "./PostCard";

function CommentSkeleton() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.commentRow}>
      <Animated.View style={[styles.avatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2C2C2E" }, animStyle]} />
      <View style={styles.commentBody}>
        <Animated.View style={[{ width: 120, height: 14, borderRadius: 4, backgroundColor: "#2C2C2E", marginBottom: 6 }, animStyle]} />
        <Animated.View style={[{ width: "90%", height: 12, borderRadius: 4, backgroundColor: "#2C2C2E", marginBottom: 4 }, animStyle]} />
        <Animated.View style={[{ width: "60%", height: 12, borderRadius: 4, backgroundColor: "#2C2C2E" }, animStyle]} />
      </View>
    </View>
  );
}

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
  const [imgFailed, setImgFailed] = useState(false);
  const fontSize = Math.round(size * 0.38);
  const letter = (username || authorId).charAt(0).toUpperCase();

  if (avatarUrl && !imgFailed) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        contentFit="cover"
        onError={() => setImgFailed(true)}
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
      <Text style={[styles.avatarText, { fontSize }]}>{letter}</Text>
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
    parentId: string; // always the top-level comment id (max 2 levels)
    author: string; // display label for the banner
  } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<any>>(null);

  const { data: comments = [], isLoading } = useComments(postId ?? "");
  const { mutate: addComment, isPending: submitting } = useAddCommentMutation();
  const { mutate: deleteComment } = useDeleteCommentMutation();
  const { mutate: likeComment } = useLikeCommentMutation();

  const currentUser = useAuthStore((s) => s.user);
  const router = useRouter();

  const handleAuthorPress = useCallback(
    (authorId: string) => {
      onClose();
      setTimeout(() => {
        if (authorId === currentUserId) {
          router.push("/profile/my-profile");
        } else {
          router.push({ pathname: "/profile/[userId]", params: { userId: authorId } });
        }
      }, 250);
    },
    [currentUserId, router, onClose],
  );

  // Collect unique author IDs so we can fetch their real avatars/usernames.
  const authorIds = useMemo(
    () => [...new Set(comments.map((c) => c.author_id))],
    [comments],
  );
  const authorProfiles = useAuthorProfiles(authorIds);
  const authorProfilesRef = useRef(authorProfiles);
  authorProfilesRef.current = authorProfiles;

  // Track which parent comments have their full reply list expanded.
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  const toggleReplies = useCallback((parentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(parentId) ? next.delete(parentId) : next.add(parentId);
      return next;
    });
  }, []);

  // Flat list items — discriminated union so we can insert "show more" rows.
  type ListItem =
    | { kind: "comment"; comment: CommentRead }
    | { kind: "expand"; parentId: string; hidden: number };

  const listItems = useMemo((): ListItem[] => {
    const topLevel = comments.filter((c) => !c.parent_id);
    const repliesMap = new Map<string, CommentRead[]>();
    for (const c of comments) {
      if (c.parent_id) {
        const arr = repliesMap.get(c.parent_id) ?? [];
        arr.push(c);
        repliesMap.set(c.parent_id, arr);
      }
    }
    const result: ListItem[] = [];
    for (const parent of topLevel) {
      result.push({ kind: "comment", comment: parent });
      const children = repliesMap.get(parent.id) ?? [];
      if (children.length === 0) continue;
      const isExpanded = expandedReplies.has(parent.id);
      if (isExpanded) {
        children.forEach((r) => result.push({ kind: "comment", comment: r }));
        result.push({ kind: "expand", parentId: parent.id, hidden: 0 }); // hide button
      } else {
        // Collapsed — show only the toggle button, no replies visible
        result.push({
          kind: "expand",
          parentId: parent.id,
          hidden: children.length,
        });
      }
    }
    // Orphaned replies go at the end
    for (const c of comments) {
      if (c.parent_id && !topLevel.find((p) => p.id === c.parent_id)) {
        result.push({ kind: "comment", comment: c });
      }
    }
    return result;
  }, [comments, expandedReplies]);

  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const topLevelCount = useMemo(
    () => comments.filter((c) => !c.parent_id).length,
    [comments],
  );

  // Base height on visible items (collapsed replies don't take space).
  const sheetHeight = useMemo(() => {
    const n = listItems.filter((i) => i.kind === "comment").length;
    if (n === 0) return "55%";
    if (n <= 3) return "65%";
    if (n <= 6) return "80%";
    return "90%";
  }, [listItems]);
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

  const handleReply = useCallback((comment: CommentRead) => {
    const profile = authorProfilesRef.current.get(comment.author_id);
    const label = profile?.username
      ? `@${profile.username}`
      : shortHandle(comment.author_id);
    // Keep nesting at 2 levels: if replying to a reply, use its parent_id
    // so all replies thread under the same top-level comment.
    const parentId = comment.parent_id ?? comment.id;
    setReplyTo({ parentId, author: label });
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
        parent_id: replyTo?.parentId ?? null,
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
    ({ item }: { item: any }) => {
      if (item.kind === "expand") {
        return (
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => toggleReplies(item.parentId)}
            activeOpacity={0.6}
          >
            <View style={styles.expandLine} />
            <Text style={styles.expandText}>
              {item.hidden > 0
                ? `View ${item.hidden} more ${item.hidden === 1 ? "reply" : "replies"}`
                : "Hide replies"}
            </Text>
          </TouchableOpacity>
        );
      }

      const c = item.comment;
      const isOwn = c.author_id === currentUserId;
      const isPending = c.id.startsWith("temp-");

      const profile = authorProfilesRef.current.get(c.author_id);
      const isCurrentUser = c.author_id === currentUserId;
      // For own comments use the auth-store avatar (most up-to-date).
      // For others fall back to API field → social-API profile → nothing.
      const avatarUrl = isCurrentUser
        ? (currentUser?.avatar ?? c.author_avatar ?? profile?.avatar ?? null)
        : (c.author_avatar ?? profile?.avatar ?? null);
      const username = c.author_username ?? profile?.username ?? null;

      const isReply = Boolean(c.parent_id);

      return (
        <View style={[styles.commentRow, isReply && styles.replyRow]}>
          {isReply && <View style={styles.replyThreadLine} />}
          <TouchableOpacity
            onPress={() => handleAuthorPress(c.author_id)}
            activeOpacity={0.7}
          >
            <Avatar
              authorId={c.author_id}
              username={username}
              avatarUrl={avatarUrl}
              size={isReply ? 28 : 36}
            />
          </TouchableOpacity>
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <TouchableOpacity
                onPress={() => handleAuthorPress(c.author_id)}
                activeOpacity={0.7}
              >
                <Text style={styles.commentAuthor} numberOfLines={1}>
                  {isOwn ? "You" : (username ?? shortHandle(c.author_id))}
                </Text>
              </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.commentAction}
                  activeOpacity={0.6}
                  onPress={() =>
                    likeComment({
                      postId: c.post_id,
                      commentId: c.id,
                      isLiked: c.is_liked ?? false,
                    })
                  }
                >
                  <Ionicons
                    name={c.is_liked ? "heart" : "heart-outline"}
                    size={15}
                    color={c.is_liked ? "#FF2D55" : "#555"}
                  />
                  {(c.like_count ?? 0) > 0 && (
                    <Text style={styles.likeCount}>{c.like_count}</Text>
                  )}
                </TouchableOpacity>
                {!isReply && (
                  <TouchableOpacity
                    style={styles.commentAction}
                    onPress={() => handleReply(c)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.replyText}>Reply</Text>
                  </TouchableOpacity>
                )}
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
    [
      currentUserId,
      handleReply,
      handleDelete,
      likeComment,
      toggleReplies,
      handleAuthorPress,
    ],
  );

  const keyExtractor = useCallback(
    (item: any) =>
      item.kind === "comment" ? item.comment.id : `expand-${item.parentId}`,
    [],
  );
  const sendEnabled = text.trim().length > 0 && !submitting;

  return (
    <OverlayModal
      visible={Boolean(postId)}
      onClose={onClose}
      height={sheetHeight}
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
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((key) => (
            <CommentSkeleton key={key} />
          ))}
        </View>
      ) : topLevelCount === 0 ? (
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
          data={listItems}
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
          username={currentUser?.username}
          avatarUrl={currentUser?.avatar}
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
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  replyRow: {
    marginLeft: 36,
    marginTop: -6,
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 52,
    marginBottom: 14,
    marginTop: -6,
    gap: 8,
  },
  expandLine: {
    width: 20,
    height: 1.5,
    backgroundColor: "#3A3A3C",
    borderRadius: 1,
  },
  expandText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#8E8E93",
  },
  replyThreadLine: {
    position: "absolute",
    left: -20,
    top: -12,
    bottom: 8,
    width: 1.5,
    backgroundColor: "#2C2C2E",
    borderRadius: 1,
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
  likeCount: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: "#8E8E93",
    marginLeft: 2,
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
