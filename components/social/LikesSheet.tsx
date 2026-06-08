import { Image } from "@/components/ExpoImage";
import { Fonts } from "@/constants/theme";
import { useLikes } from "@/hooks/queries/use-feed";
import { useAuthorProfiles } from "@/hooks/queries/use-author-profiles";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function LikerSkeleton() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={s.row}>
      <Animated.View style={[s.avatar, { backgroundColor: "#2C2C2E" }, animStyle]} />
      <Animated.View style={[{ flex: 1, height: 13, borderRadius: 6, backgroundColor: "#2C2C2E" }, animStyle]} />
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = memo(function Avatar({
  userId,
  username,
  avatarUrl,
}: {
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const letter = (username || userId || "?").charAt(0).toUpperCase();

  if (avatarUrl && !imgFailed) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={s.avatar}
        contentFit="cover"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <View style={[s.avatar, s.avatarFallback]}>
      <Text style={s.avatarLetter}>{letter}</Text>
    </View>
  );
});

// ─── LikerRow ────────────────────────────────────────────────────────────────

const LikerRow = memo(function LikerRow({
  userId,
  username,
  avatarUrl,
  onPress,
}: {
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  onPress: (userId: string) => void;
}) {
  const name = username || (userId ?? "").slice(0, 8);
  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => onPress(userId)}
      activeOpacity={0.6}
    >
      <Avatar userId={userId} username={username} avatarUrl={avatarUrl} />
      <Text style={s.username} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
});

// ─── LikesSheet ──────────────────────────────────────────────────────────────

interface LikesSheetProps {
  postId: string | null;
  likeCount: number;
  onClose: () => void;
}

export function LikesSheet({ postId, likeCount, onClose }: LikesSheetProps) {
  const router = useRouter();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (postId) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [postId]);

  const { data: likes = [], isLoading } = useLikes(postId);
  const authorIds = useMemo(() => likes.map((l) => l.user_id).filter(Boolean), [likes]);
  const profiles = useAuthorProfiles(authorIds);

  const handlePress = useCallback(
    (uid: string) => {
      sheetRef.current?.dismiss();
      setTimeout(() => {
        router.push({ pathname: "/profile/[userId]", params: { userId: uid } });
      }, 280);
    },
    [router],
  );

  const ListHeader = useMemo(
    () => (
      <View style={s.header}>
        <View style={s.heartBadge}>
          <Ionicons name="heart" size={15} color="#FF3B30" />
        </View>
        <Text style={s.title}>
          {likeCount.toLocaleString()} {likeCount === 1 ? "Like" : "Likes"}
        </Text>
      </View>
    ),
    [likeCount],
  );

  const renderItem = useCallback(
    ({ item }: { item: { user_id: string } }) => {
      const profile = profiles.get(item.user_id);
      return (
        <LikerRow
          userId={item.user_id}
          username={profile?.username}
          avatarUrl={profile?.avatar}
          onPress={handlePress}
        />
      );
    },
    [profiles, handlePress],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  const snapPoints = useMemo(() => ["50%"], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enablePanDownToClose
    >
      {isLoading ? (
        <BottomSheetView style={s.padded}>
          {ListHeader}
          {Array.from({ length: 4 }).map((_, i) => <LikerSkeleton key={i} />)}
        </BottomSheetView>
      ) : likes.length === 0 ? (
        <BottomSheetView style={s.padded}>
          {ListHeader}
          <View style={s.empty}>
            <Ionicons name="heart-outline" size={40} color="#2C2C2E" />
            <Text style={s.emptyText}>Be the first to like this</Text>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={likes}
          keyExtractor={(item, idx) => item.user_id ?? String(idx)}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      )}
    </BottomSheetModal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#111111",
  },
  handle: {
    backgroundColor: "#3A3A3C",
    width: 36,
  },

  // Header (used as ListHeaderComponent)
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2C2C2E",
    marginBottom: 4,
  },
  heartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2C1010",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },

  padded: {
    paddingBottom: 32,
  },

  // List
  listContent: {
    paddingBottom: 48,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2C2C2E",
    marginLeft: 68,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 9,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: "#AEAEB2",
  },
  username: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: "#FFFFFF",
  },

  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "#48484A",
  },
});
