import { useVideoStore } from "@/stores/video.store";
import { useVideoPlayer, type VideoPlayer } from "expo-video";
import { useEffect, useRef } from "react";

/**
 * Hoisted video player for a feed. One player, many views.
 *
 * Instead of mounting a native Video component per post (which burns
 * memory + decoder threads), we keep a single player at the screen level
 * and swap its source to whichever post is currently active. Cards render
 * a lightweight `<VideoView player={...}>` when — and only when — they're
 * the active card. Everything else shows a still thumbnail.
 *
 * This mirrors how Instagram/TikTok feeds work and is the main reason
 * expo-video is the right target: expo-av doesn't support sharing one
 * player instance across views.
 *
 * Resume-where-you-left-off is preserved via the existing breadcrumbs
 * store — we seek on source swap and save the current position ~once
 * per second while playing.
 */
export function useFeedVideoPlayer(
  activeVideoId: string | null,
  activeVideoUrl: string | null,
): VideoPlayer {
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    // 1s cadence is enough for a breadcrumb save; smaller values spam JS
    p.timeUpdateEventInterval = 1;
  });

  // Track which post is currently loaded so we don't reload on every render.
  const lastIdRef = useRef<string | null>(null);

  // Swap source + seek to saved position when the active post changes.
  // We use replaceAsync (not replace) — replace loads the asset
  // synchronously on the main thread on iOS and will be deprecated.
  // replaceAsync resolves once the source is ready to play.
  useEffect(() => {
    if (!activeVideoId || !activeVideoUrl) {
      player.pause();
      return;
    }
    if (lastIdRef.current === activeVideoId) return;
    const postId = activeVideoId;
    const url = activeVideoUrl;
    lastIdRef.current = postId;

    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync({ uri: url });
      } catch {
        // Asset failed to load — user may have scrolled away, or the URL
        // is bad. Nothing to clean up; next source change will retry.
        return;
      }
      if (cancelled) return;
      player.play();
      const saved = useVideoStore.getState().breadcrumbs[postId];
      if (saved) {
        player.currentTime = saved / 1000;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeVideoId, activeVideoUrl, player]);

  // Persist the current playback position while active so the user can
  // scroll away and back without losing their spot.
  useEffect(() => {
    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      const id = lastIdRef.current;
      if (id && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(id, currentTime * 1000);
      }
    });
    return () => {
      sub?.remove?.();
    };
  }, [player]);

  return player;
}
