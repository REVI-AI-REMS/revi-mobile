import { useVideoStore } from "@/stores/video.store";
import { useVideoPlayer, type VideoPlayer } from "expo-video";
import { useEffect, useRef } from "react";

export function useFeedVideoPlayer(
  activeVideoId: string | null,
  activeVideoUrl: string | null,
): VideoPlayer {
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 250;
  });

  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // No active video — just pause. DON'T clear the source so the last
    // frame stays visible in the VideoView (matches Instagram behaviour).
    if (!activeVideoId || !activeVideoUrl) {
      player.pause();
      return;
    }

    // Same video re-activated (scrolled back into view, or tab-return).
    // The player already has this source loaded — just resume playback.
    if (lastIdRef.current === activeVideoId) {
      useVideoStore.getState().setReadyVideoId(activeVideoId);
      player.play();
      return;
    }

    // Different video — need to load a new source.
    const postId = activeVideoId;
    const url = activeVideoUrl;
    lastIdRef.current = postId;

    // Stop current audio immediately while loading the new source.
    player.pause();

    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync({ uri: url });
      } catch (e) {
        console.warn("[FeedVideoPlayer] replaceAsync failed:", e);
        return;
      }
      if (cancelled) return;
      // Source loaded — signal PostCard to drop its thumbnail cover.
      useVideoStore.getState().setReadyVideoId(postId);
      player.play();
      // Restore breadcrumb position if the user saw this video earlier.
      const saved = useVideoStore.getState().breadcrumbs[postId];
      if (saved) {
        player.currentTime = saved / 1000;
      }
    })();

    return () => { cancelled = true; };
  }, [activeVideoId, activeVideoUrl, player]);

  useEffect(() => {
    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      const id = lastIdRef.current;
      if (id && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(id, currentTime * 1000);
      }
    });
    return () => { sub?.remove?.(); };
  }, [player]);

  return player;
}
