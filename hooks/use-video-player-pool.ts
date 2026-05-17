import { useVideoStore } from "@/stores/video.store";
import { useVideoPlayer, type VideoPlayer } from "expo-video";
import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Dual-player pool for zero-delay video transitions.
 *
 * Player A plays the current video. Player B pre-buffers the next video.
 * When the user scrolls to the next video, we swap: B becomes active
 * (instant playback), A starts pre-buffering whatever comes after.
 *
 * Falls back to replaceAsync on the active player if the user scrolls
 * past the pre-buffered video (e.g. fast fling).
 */

interface PlayerPoolReturn {
  /** The player currently bound to the visible VideoView. */
  activePlayer: VideoPlayer;
  /** Call this to tell the pool which video should be playing. */
  activateVideo: (postId: string | null, url: string | null) => void;
  /** Call this to pre-buffer the next video in the feed. */
  preloadNext: (postId: string, url: string) => void;
}

export function useVideoPlayerPool(): PlayerPoolReturn {
  const playerA = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 250;
  });

  const playerB = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 250;
  });

  // Track which player is active — useState so the parent re-renders with
  // the correct player reference after a swap.
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const activeSlotRef = useRef(activeSlot);
  activeSlotRef.current = activeSlot;

  const loadedOnA = useRef<string | null>(null);
  const loadedOnB = useRef<string | null>(null);
  const currentActiveId = useRef<string | null>(null);
  const preBufferedId = useRef<string | null>(null);
  const preBufferReady = useRef(false);

  const getActivePlayer = () =>
    activeSlotRef.current === "A" ? playerA : playerB;
  const getStandbyPlayer = () =>
    activeSlotRef.current === "A" ? playerB : playerA;
  const getLoadedOnActive = () =>
    activeSlotRef.current === "A" ? loadedOnA : loadedOnB;
  const getLoadedOnStandby = () =>
    activeSlotRef.current === "A" ? loadedOnB : loadedOnA;

  // ── Time tracking on whichever player is active ──
  useEffect(() => {
    const subA = playerA.addListener("timeUpdate", ({ currentTime }) => {
      if (activeSlotRef.current === "A" && currentActiveId.current && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(currentActiveId.current, currentTime * 1000);
      }
    });
    const subB = playerB.addListener("timeUpdate", ({ currentTime }) => {
      if (activeSlotRef.current === "B" && currentActiveId.current && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(currentActiveId.current, currentTime * 1000);
      }
    });
    return () => {
      subA?.remove?.();
      subB?.remove?.();
    };
  }, [playerA, playerB]);

  // ── Pre-buffer the next video on the standby player ──
  const preloadNext = useCallback(
    (postId: string, url: string) => {
      // Already pre-buffered this one.
      if (preBufferedId.current === postId) return;
      // Don't pre-buffer what's already playing.
      if (currentActiveId.current === postId) return;

      const standby = getStandbyPlayer();
      const standbyLoaded = getLoadedOnStandby();

      preBufferedId.current = postId;
      preBufferReady.current = false;
      standbyLoaded.current = postId;

      // Pause standby before swapping source.
      standby.pause();

      (async () => {
        try {
          await standby.replaceAsync({ uri: url });
          // Don't auto-play — just have it ready.
          if (preBufferedId.current === postId) {
            preBufferReady.current = true;
          }
        } catch (e) {
          console.warn("[PlayerPool] preload failed:", e);
          preBufferReady.current = false;
        }
      })();
    },
    [playerA, playerB],
  );

  // ── Activate a video (called when viewability changes) ──
  const activateVideo = useCallback(
    (postId: string | null, url: string | null) => {
      const store = useVideoStore.getState();

      // No video to play — just pause.
      if (!postId || !url) {
        getActivePlayer().pause();
        return;
      }

      // Same video re-activated (scroll back, tab return) — just resume.
      if (currentActiveId.current === postId) {
        store.setReadyVideoId(postId);
        getActivePlayer().play();
        return;
      }

      currentActiveId.current = postId;

      // ── Fast path: standby player already has this video pre-buffered ──
      if (
        preBufferedId.current === postId &&
        preBufferReady.current
      ) {
        // Pause old active player.
        getActivePlayer().pause();

        // Swap players — triggers re-render so parent gets the new activePlayer.
        const newSlot = activeSlotRef.current === "A" ? "B" : "A";
        activeSlotRef.current = newSlot;
        setActiveSlot(newSlot);
        preBufferedId.current = null;
        preBufferReady.current = false;

        // Signal ready and play instantly.
        store.setReadyVideoId(postId);
        const active = getActivePlayer();
        active.play();

        // Restore breadcrumb position.
        const saved = store.breadcrumbs[postId];
        if (saved) {
          active.currentTime = saved / 1000;
        }
        return;
      }

      // ── Slow path: need to load on the active player (fast fling case) ──
      const active = getActivePlayer();
      const activeLoaded = getLoadedOnActive();
      active.pause();
      activeLoaded.current = postId;

      (async () => {
        try {
          await active.replaceAsync({ uri: url });
        } catch (e) {
          console.warn("[PlayerPool] replaceAsync failed:", e);
          return;
        }
        // Check we haven't been superseded by another activateVideo call.
        if (currentActiveId.current !== postId) return;

        store.setReadyVideoId(postId);
        active.play();
        const saved = store.breadcrumbs[postId];
        if (saved) {
          active.currentTime = saved / 1000;
        }
      })();
    },
    [playerA, playerB],
  );

  return {
    activePlayer: activeSlot === "A" ? playerA : playerB,
    activateVideo,
    preloadNext,
  };
}
