import { Image } from "@/components/ExpoImage";
import { Fonts } from "@/constants/theme";
import { useFollowMutation } from "@/hooks/mutations/use-feed-mutations";
import { useAuthorProfiles } from "@/hooks/queries/use-author-profiles";
import { useUserFollowers, useUserFollowing } from "@/hooks/queries/use-relationships";
import { useAuthStore } from "@/stores/auth.store";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
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
  withSpring,
  withTiming,
} from "react-native-reanimated";

export type FollowersSheetMode = "followers" | "following";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function RowSkeleton() {
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
      <View style={{ flex: 1, gap: 7 }}>
        <Animated.View style={[{ width: 100, height: 13, borderRadius: 6, backgroundColor: "#2C2C2E" }, animStyle]} />
        <Animated.View style={[{ width: 65, height: 11, borderRadius: 6, backgroundColor: "#2C2C2E" }, animStyle]} />
      </View>
      <Animated.View style={[{ width: 78, height: 32, borderRadius: 20, backgroundColor: "#2C2C2E" }, animStyle]} />
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

// ─── UserRow ─────────────────────────────────────────────────────────────────

const UserRow = memo(function UserRow({
  userId,
  currentUserId,
  username,
  avatarUrl,
  isFollowing,
  isPending,
  onPress,
  onFollow,
}: {
  userId: string;
  currentUserId?: string;
  username?: string | null;
  avatarUrl?: string | null;
  isFollowing: boolean;
  isPending: boolean;
  onPress: (userId: string) => void;
  onFollow: (userId: string, isFollowing: boolean) => void;
}) {
  const name = username || (userId ?? "").slice(0, 8);
  const isSelf = currentUserId === userId;

  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => onPress(userId)}
      activeOpacity={0.65}
    >
      <Avatar userId={userId} username={username} avatarUrl={avatarUrl} />
      <View style={{ flex: 1 }}>
        <Text style={s.username} numberOfLines={1}>{name}</Text>
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[s.followBtn, isFollowing && s.followBtnGhost]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFollow(userId, isFollowing);
          }}
          disabled={isPending}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={isFollowing ? "#AEAEB2" : "#FFF"} />
          ) : (
            <Text style={[s.followBtnText, isFollowing && s.followBtnTextGhost]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

// ─── Tab indicator ───────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");

function TabBar({
  active,
  followerCount,
  followingCount,
  onChange,
}: {
  active: FollowersSheetMode;
  followerCount: number;
  followingCount: number;
  onChange: (t: FollowersSheetMode) => void;
}) {
  const indicatorX = useSharedValue(active === "followers" ? 0 : 1);

  useEffect(() => {
    indicatorX.value = withSpring(active === "followers" ? 0 : 1, {
      damping: 20,
      stiffness: 260,
    });
  }, [active, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value * (SCREEN_W / 2) }],
  }));

  return (
    <View style={s.tabBar}>
      <TouchableOpacity
        style={s.tab}
        onPress={() => { Haptics.selectionAsync(); onChange("followers"); }}
        activeOpacity={0.7}
      >
        <Text style={[s.tabText, active === "followers" && s.tabTextActive]}>
          {followerCount.toLocaleString()} Followers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.tab}
        onPress={() => { Haptics.selectionAsync(); onChange("following"); }}
        activeOpacity={0.7}
      >
        <Text style={[s.tabText, active === "following" && s.tabTextActive]}>
          {followingCount.toLocaleString()} Following
        </Text>
      </TouchableOpacity>

      {/* sliding underline */}
      <Animated.View style={[s.tabIndicatorTrack, indicatorStyle]}>
        <View style={s.tabIndicator} />
      </Animated.View>
    </View>
  );
}

// ─── FollowersSheet ───────────────────────────────────────────────────────────

interface FollowersSheetProps {
  userId: string | null;
  initialTab: FollowersSheetMode;
  followerCount: number;
  followingCount: number;
  onClose: () => void;
}

export function FollowersSheet({
  userId,
  initialTab,
  followerCount,
  followingCount,
  onClose,
}: FollowersSheetProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<FollowersSheetMode>(initialTab);

  // Present / dismiss in sync with userId
  useEffect(() => {
    if (userId) {
      setActiveTab(initialTab);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [userId, initialTab]);

  const { data: followers = [], isLoading: loadingFollowers } = useUserFollowers(userId);
  const { data: following = [], isLoading: loadingFollowing } = useUserFollowing(userId);
  const { data: myFollowing = [] } = useUserFollowing(currentUserId);
  const { mutate: toggleFollow, isPending } = useFollowMutation();

  const list = activeTab === "followers" ? followers : following;
  const isLoading = activeTab === "followers" ? loadingFollowers : loadingFollowing;

  const userIds = useMemo(
    () =>
      list.map((f) =>
        activeTab === "followers" ? f.follower_id : f.following_id,
      ),
    [list, activeTab],
  );
  const profiles = useAuthorProfiles(userIds);

  const myFollowingSet = useMemo(
    () => new Set(myFollowing.map((f) => f.following_id)),
    [myFollowing],
  );

  const handlePress = useCallback(
    (uid: string) => {
      sheetRef.current?.dismiss();
      setTimeout(() => {
        router.push({ pathname: "/profile/[userId]", params: { userId: uid } });
      }, 280);
    },
    [router],
  );

  const handleFollow = useCallback(
    (uid: string, isCurrentlyFollowing: boolean) => {
      toggleFollow({ userId: uid, isFollowing: isCurrentlyFollowing });
    },
    [toggleFollow],
  );

  const renderItem = useCallback(
    ({ item }: { item: typeof list[0] }) => {
      const uid = activeTab === "followers" ? item.follower_id : item.following_id;
      const profile = profiles.get(uid);
      return (
        <UserRow
          userId={uid}
          currentUserId={currentUserId}
          username={profile?.username}
          avatarUrl={profile?.avatar}
          isFollowing={myFollowingSet.has(uid)}
          isPending={isPending}
          onPress={handlePress}
          onFollow={handleFollow}
        />
      );
    },
    [activeTab, profiles, currentUserId, myFollowingSet, isPending, handlePress, handleFollow],
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

  const snapPoints = useMemo(() => ["78%"], []);

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
      {/* Single child: FlatList with sticky TabBar as ListHeaderComponent */}
      {isLoading || list.length === 0 ? (
        <BottomSheetView style={{ flex: 1 }}>
          <TabBar
            active={activeTab}
            followerCount={followerCount}
            followingCount={followingCount}
            onChange={setActiveTab}
          />
          {isLoading ? (
            <View style={s.skeletonWrap}>
              {Array.from({ length: 7 }).map((_, i) => <RowSkeleton key={i} />)}
            </View>
          ) : (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={44} color="#3A3A3C" />
              <Text style={s.emptyText}>
                {activeTab === "followers" ? "No followers yet" : "Not following anyone"}
              </Text>
            </View>
          )}
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={list}
          keyExtractor={(item, idx) =>
            (activeTab === "followers" ? item.follower_id : item.following_id) ?? String(idx)
          }
          renderItem={renderItem}
          ListHeaderComponent={
            <TabBar
              active={activeTab}
              followerCount={followerCount}
              followingCount={followingCount}
              onChange={setActiveTab}
            />
          }
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
  // Tab bar
  tabBar: {
    flexDirection: "row",
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: "#636366",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabIndicatorTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: SCREEN_W / 2,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: "#A855F7",
    marginHorizontal: 24,
    borderRadius: 1,
  },

  // List
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2C2C2E",
    marginLeft: 70,
  },
  listContent: {
    paddingBottom: 40,
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
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: "#FFFFFF",
  },

  // Follow button
  followBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#A855F7",
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  followBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  followBtnTextGhost: {
    color: "#636366",
  },

  skeletonWrap: {
    paddingTop: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 14,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: "#48484A",
  },
});
