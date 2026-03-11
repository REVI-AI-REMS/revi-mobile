import { searchService } from "@/src/services/social/search.service";
import type { SearchResult } from "@/src/services/social/search.service";
import { useQuery } from "@tanstack/react-query";

export const searchKeys = {
  all: ["search"] as const,
  results: (q: string) => [...searchKeys.all, q] as const,
};

/**
 * Runs a search query when `q` is at least 2 characters.
 * Automatically cached per query string; stale after 30 s.
 */
export function useSearch(q: string) {
  const trimmed = q.trim();
  return useQuery<SearchResult>({
    queryKey: searchKeys.results(trimmed),
    queryFn: () => searchService.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
