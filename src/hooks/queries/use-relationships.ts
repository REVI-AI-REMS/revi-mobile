import { relationshipsService } from "@/src/services/social/relationships.service";
import { useQuery } from "@tanstack/react-query";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

export const relationshipKeys = {
  all: ["relationships"] as const,
  following: (userId: string) =>
    [...relationshipKeys.all, "following", userId] as const,
  followers: (userId: string) =>
    [...relationshipKeys.all, "followers", userId] as const,
  stats: (userId: string) =>
    [...relationshipKeys.all, "stats", userId] as const,
};

// ─── Who does `userId` follow? ────────────────────────────────────────────────
// Used in social.tsx to seed the initial followingIds Set.
// Returns FollowRead[] — map to following_id for the Set.

export function useUserFollowing(userId: string | null | undefined) {
  return useQuery({
    queryKey: relationshipKeys.following(userId ?? ""),
    queryFn: () => relationshipsService.getFollowing(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 2000,
  });
}

// ─── Who follows `userId`? ────────────────────────────────────────────────────

export function useUserFollowers(userId: string | null | undefined) {
  return useQuery({
    queryKey: relationshipKeys.followers(userId ?? ""),
    queryFn: () => relationshipsService.getFollowers(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 2000,
  });
}

// ─── Follower / following counts for `userId` ────────────────────────────────

export function useUserStats(userId: string | null | undefined) {
  return useQuery({
    queryKey: relationshipKeys.stats(userId ?? ""),
    queryFn: () => relationshipsService.getUserStats(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
    retry: 2,
    retryDelay: 2000,
  });
}
