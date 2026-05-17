import { colors, spacing, typography } from "@/constants/design";
import { Fonts } from "@/constants/theme";
import { memo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatCount } from "../PostCard";
import { LikesSheet } from "../LikesSheet";

interface PostCaptionProps {
  postId: string;
  caption?: string | null;
  likeCount: number;
  isLiked: boolean;
}

export const PostCaption = memo(function PostCaption({
  postId,
  caption,
  likeCount,
  isLiked,
}: PostCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const count = Math.max(likeCount, isLiked ? 1 : 0);
  const others = isLiked ? count - 1 : count;

  return (
    <>
      {/* Liked by */}
      {count > 0 && (
        <View style={styles.likedByRow}>
          <Text style={styles.likedByText}>
            {"Liked by "}
            {isLiked ? (
              <>
                <Text style={styles.likedByBold}>you</Text>
                {others > 0 && (
                  <>
                    {" and "}
                    <Text
                      style={[styles.likedByBold, styles.likedByTappable]}
                      onPress={() => setShowLikes(true)}
                    >
                      {formatCount(others)} others
                    </Text>
                  </>
                )}
              </>
            ) : (
              <Text
                style={[styles.likedByBold, styles.likedByTappable]}
                onPress={() => setShowLikes(true)}
              >
                {formatCount(others)} others
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* Caption */}
      {caption ? (
        <View style={styles.postDescription}>
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 3}
            onPress={() => setExpanded((v) => !v)}
          >
            {caption}
          </Text>
          {!expanded && (caption?.length ?? 0) > 120 && (
            <Text style={styles.seeMore} onPress={() => setExpanded(true)}>
              more
            </Text>
          )}
        </View>
      ) : null}

      {showLikes && (
        <LikesSheet
          postId={postId}
          likeCount={count}
          onClose={() => setShowLikes(false)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  likedByRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  likedByText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  likedByBold: {
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },
  likedByTappable: {
    textDecorationLine: "underline",
    opacity: 0.9,
  },
  postDescription: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxs,
  },
  description: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  seeMore: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: 2,
    fontFamily: Fonts.semiBold,
  },
});
