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
    if (!activeVideoId || !activeVideoUrl) {
      player.pause();
      return;
    }

    if (lastIdRef.current === activeVideoId) {
      // Resume: same source already loaded (e.g. returning from another screen).
      useVideoStore.getState().setReadyVideoId(activeVideoId);
      player.play();
      return;
    }

    const postId = activeVideoId;
    const url = activeVideoUrl;
    lastIdRef.current = postId;

    // Stop current video immediately — cuts audio and prevents the old
    // frame from being visible while replaceAsync loads the new source.
    player.pause();

    let cancelled = false;
    (async () => {
      try {
        await player.replaceAsync({ uri: url });
      } catch (e) {
        // Log so we can diagnose bad URLs / codec issues in dev. Don't crash
        // the feed — the thumbnail cover stays visible (isVideoReady stays false).
        console.warn("[FeedVideoPlayer] replaceAsync failed:", e);
        return;
      }
      if (cancelled) return;
      // Source is ready — signal PostCard to drop its cover, then play.
      useVideoStore.getState().setReadyVideoId(postId);
      player.play();
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
