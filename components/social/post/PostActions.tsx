import { colors, spacing, typography } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { memo, useCallback } from "react";
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { formatCount, shortAuthorId } from "../PostCard";

interface PostActionsProps {
  postId: string;
  authorId: string;
  caption?: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  onComment: (postId: string) => void;
  onBookmark?: (postId: string, isBookmarked: boolean) => void;
}

export const PostActions = memo(function PostActions({
  postId,
  authorId,
  caption,
  likeCount,
  commentCount,
  viewCount,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onBookmark,
}: PostActionsProps) {
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikeTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 4 }),
      withSpring(1, { damping: 6 }),
    );
    onLike(postId, isLiked);
  }, [postId, isLiked, onLike, heartScale]);

  const handleShare = useCallback(async () => {
    try {
      const lines: string[] = [];
      if (caption) lines.push(`"${caption}"`);
      lines.push(`— ${shortAuthorId(authorId)} on Revi AI`);
      const message = lines.join("\n\n");
      const url = `reviaimobile://post/${postId}`;
      await Share.share(
        Platform.OS === "ios"
          ? { url, message }
          : { message: `${message}\n${url}` },
        { dialogTitle: "Share this post" },
      );
    } catch {
      // User cancelled
    }
  }, [postId, authorId, caption]);

  return (
    <View style={styles.postActions}>
      <Animated.View style={heartAnimStyle}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikeTap}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF3B30" : "#FFFFFF"}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {formatCount(likeCount)}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onComment(postId)}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
        <Text style={styles.actionText}>{formatCount(commentCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleShare}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
        <Text style={styles.actionText}>{formatCount(viewCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bookmarkButton}
        onPress={() => onBookmark?.(postId, isBookmarked)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isBookmarked ? "bookmark" : "bookmark-outline"}
          size={22}
          color={isBookmarked ? "#007AFF" : "#FFFFFF"}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  actionText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.error,
  },
  bookmarkButton: {
    marginLeft: "auto",
  },
});
