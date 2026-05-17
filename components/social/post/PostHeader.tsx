import { colors, spacing, typography } from "@/constants/design";
import type { PostRead } from "@/scripts/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "@/components/ExpoImage";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { shortAuthorId, formatRelativeTime } from "../PostCard";

interface PostHeaderProps {
  post: PostRead;
  isOwnPost: boolean;
  isFollowing: boolean;
  authorName?: string | null;
  onFollow: (authorId: string, isFollowing: boolean) => void;
  onMore: (post: PostRead) => void;
  onAuthorPress?: (authorId: string) => void;
}

export const PostHeader = memo(function PostHeader({
  post,
  isOwnPost,
  isFollowing,
  authorName,
  onFollow,
  onMore,
  onAuthorPress,
}: PostHeaderProps) {
  return (
    <View style={styles.postHeader}>
      <TouchableOpacity
        style={styles.postUser}
        activeOpacity={0.7}
        onPress={() => onAuthorPress?.(post.author_id)}
      >
        {post.author_avatar ? (
          <Image
            source={{ uri: post.author_avatar }}
            style={styles.userAvatarImage}
            contentFit="cover"
            recyclingKey={post.author_avatar}
          />
        ) : (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarInitial}>
              {(post.author_username ?? post.author_id).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {authorName ?? post.author_username ?? shortAuthorId(post.author_id)}
          </Text>
          <Text style={styles.postTime}>
            {formatRelativeTime(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.postHeaderActions}>
        {!isOwnPost && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => onFollow(post.author_id, isFollowing)}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onMore(post)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    height: 44,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2C2C2E",
  },
  userAvatarInitial: {
    fontSize: 11,
    fontFamily: "System",
    fontWeight: "600",
    color: colors.textSecondary,
  },
  userInfo: {
    gap: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  postTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  postHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  followButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
  },
  followingButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  followButtonText: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  moreButton: {
    padding: spacing.xxs,
  },
});
