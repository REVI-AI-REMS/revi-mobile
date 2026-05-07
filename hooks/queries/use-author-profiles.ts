import { api } from "@/scripts/services/api";
import type { UserSync } from "@/scripts/services/social/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthorProfileMap = Map<string, UserSync>;

// ─── Service ──────────────────────────────────────────────────────────────────

async function fetchUserProfile(userId: string): Promise<UserSync | null> {
  try {
    const { data } = await api.get<UserSync>(`/api/v1/users/${userId}`);
    return data;
  } catch {
    return null;
  }
}

async function fetchAuthorProfiles(authorIds: string[]): Promise<AuthorProfileMap> {
  const map = new Map<string, UserSync>();
  if (authorIds.length === 0) return map;

  // Fetch all profiles in parallel — the social service handles each quickly.
  // We cap at 20 concurrent to avoid overloading.
  const BATCH_SIZE = 20;
  for (let i = 0; i < authorIds.length; i += BATCH_SIZE) {
    const batch = authorIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) => fetchUserProfile(id)),
    );
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        map.set(batch[idx], result.value);
      }
    });
  }
  return map;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Batch-loads user profiles for a list of author IDs.
 * Returns a Map<authorId, UserSync> for efficient O(1) lookup in PostCard.
 *
 * - Deduplicates IDs before fetching
 * - Caches for 5 minutes (profiles change rarely)
 * - Fetches lazily when authorIds becomes non-empty
 * - Uses a stable query key derived from sorted author IDs
 */
export function useAuthorProfiles(authorIds: string[]): AuthorProfileMap {
  // Deduplicate and sort for a stable query key
  const uniqueIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of authorIds) {
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out.sort();
  }, [authorIds]);

  const { data } = useQuery({
    queryKey: ["author-profiles", uniqueIds],
    queryFn: () => fetchAuthorProfiles(uniqueIds),
    enabled: uniqueIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  const emptyMapRef = useRef<AuthorProfileMap>(new Map());
  // Keep a ref to the latest resolved map so renderItem callbacks can read
  // it without stale-closure crashes when data transitions through undefined.
  const latestRef = useRef<AuthorProfileMap>(emptyMapRef.current);
  if (data instanceof Map) latestRef.current = data;
  return latestRef.current;
}
