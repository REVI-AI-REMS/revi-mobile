import { CommentsSheet } from "@/src/components/social/comments-sheet";
import {
    PostCard,
    PostCardSkeleton,
} from "@/src/components/social/post-card";
import { PostOptionsSheet } from "@/src/components/social/post-options-sheet";
import { Fonts } from "@/src/constants/theme";
import {
    useFollowMutation,
    useLikePostMutation
} from "@/src/hooks/mutations/use-feed-mutations";
import { usePost } from "@/src/hooks/queries/use-feed";
import { useUserFollowing } from "@/src/hooks/queries/use-relationships";
import { PostRead } from "@/src/services/social/types";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const currentUserId = process.env.EXPO_PUBLIC_DEV_USER_ID || "dev-user";

    const { data: post, isLoading, error, refetch } = usePost(id);
    const { data: following = [] } = useUserFollowing(currentUserId);

    const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
    const [optionsPost, setOptionsPost] = useState<PostRead | null>(null);

    const { mutate: likePost, isPending: likePending } = useLikePostMutation();
    const { mutate: followUser } = useFollowMutation();

    const isFollowing = post
        ? following.some(f => f.following_id === post.author_id)
        : false;

    const handleLike = (postId: string, currentlyLiked: boolean) => {
        likePost({ postId, isLiked: currentlyLiked });
    };

    const handleFollow = (authorId: string, currentlyFollowing: boolean) => {
        followUser({ userId: authorId, isFollowing: currentlyFollowing });
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: "Post", headerTitleStyle: styles.headerTitle }} />
                <PostCardSkeleton />
            </View>
        );
    }

    if (error || !post) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "Error", headerTitleStyle: styles.headerTitle }} />
                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>Post not found or failed to load</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Post",
                    headerShown: true,
                    headerTransparent: false,
                    headerStyle: { backgroundColor: "#0F0F10" },
                    headerTintColor: "#FFFFFF",
                    headerTitleStyle: styles.headerTitle,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    isFollowing={isFollowing}
                    likePending={likePending}
                    onLike={handleLike}
                    onFollow={handleFollow}
                    onComment={(postId) => setCommentsPostId(postId)}
                    onMore={(p) => setOptionsPost(p)}
                />
            </ScrollView>

            <CommentsSheet
                postId={commentsPostId}
                currentUserId={currentUserId}
                onClose={() => setCommentsPostId(null)}
            />

            <PostOptionsSheet
                post={optionsPost}
                currentUserId={currentUserId}
                onClose={() => setOptionsPost(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F0F10",
    },
    headerTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: 17,
        color: "#FFFFFF",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F0F10",
        gap: 12,
    },
    errorText: {
        color: "#666666",
        fontFamily: Fonts.regular,
        fontSize: 15,
    },
    retryButton: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: "#2C2C2E",
        borderRadius: 20,
    },
    retryText: {
        color: "#FFFFFF",
        fontFamily: Fonts.semiBold,
        fontSize: 14,
    },
});
