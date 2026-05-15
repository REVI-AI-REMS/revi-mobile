import type { PostRead } from "@/scripts/services/social/types";
import { useVideoStore } from "@/stores/video.store";
import { useVideoPlayer, type VideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";

function findNextVideoId(posts: PostRead[], currentId: string): string | null {
  const idx = posts.findIndex((p) => p.id === currentId);
  if (idx === -1) return null;
  for (let i = idx + 1; i < posts.length; i++) {
    const p = posts[i];
    if (
      p.media_type === "video" ||
      p.media_type === "video_upload" ||
      p.media_url?.includes(".m3u8")
    ) {
      return p.id;
    }
  }
  return null;
}

// Tells expo-video the exact container format instead of forcing auto-detection.
// HLS (.m3u8) is the most common in this feed; everything else is progressive.
function makeSource(url: string) {
  return url.includes(".m3u8")
    ? ({ uri: url, contentType: "hls" } as const)
    : ({ uri: url } as const);
}

function setupPlayer(p: VideoPlayer) {
  p.loop = true;
  p.muted = true;
  // 5s forward buffer is enough to feel instant without saturating
  // bandwidth — preloading 10s on two players concurrently was starving
  // the active player and stalling further-down videos.
  // waitsToMinimizeStalling=false lets the player start on the first
  // available frame instead of holding for a fuller buffer.
  p.bufferOptions = {
    preferredForwardBufferDuration: 5,
    waitsToMinimizeStalling: false,
  };
}

/**
 * Two-player pool for the social feed.
 *
 * currentPlayer plays the active video; preloadPlayer silently buffers the
 * next video in the feed. When the user scrolls to that video, it starts
 * instantly from the preloaded buffer — no replaceAsync wait.
 *
 * Mount preloadPlayer in a hidden 1×1 VideoView so AVPlayer has a render
 * target and buffers on all expo-video versions.
 */
export function useFeedVideoPool(
  posts: PostRead[],
  activeVideoId: string | null,
  muted: boolean,
): { currentPlayer: VideoPlayer; preloadPlayer: VideoPlayer } {
  const playerA = useVideoPlayer(null, setupPlayer);
  const playerB = useVideoPlayer(null, setupPlayer);

  // 0 = playerA is current, 1 = playerB is current.
  const currentSlotRef = useRef<0 | 1>(0);
  // Which post ID is loaded into each slot.
  const loadedIdsRef = useRef<[string | null, string | null]>([null, null]);
  // Last activeVideoId processed — prevents re-running for the same id.
  const handledIdRef = useRef<string | null>(null);

  // React state so a player swap causes a re-render and the caller gets
  // the updated player reference.
  const [currentSlot, setCurrentSlot] = useState<0 | 1>(0);

  // Sync muted to both players whenever it toggles.
  useEffect(() => {
    playerA.muted = muted;
    playerB.muted = muted;
  }, [muted, playerA, playerB]);

  // Warm-up: as soon as posts arrive, start loading the first two videos
  // into the players BEFORE any scrolling. By the time the user reaches the
  // first video at the viewability threshold, it's already buffered —
  // same "instant" feel as opening the .m3u8 URL directly in a browser.
  useEffect(() => {
    if (posts.length === 0) return;
    if (handledIdRef.current) return; // user already scrolled — skip warm-up

    const firstVideo = posts.find(
      (p) =>
        p.media_type === "video" ||
        p.media_type === "video_upload" ||
        p.media_url?.includes(".m3u8"),
    );
    if (!firstVideo?.media_url) return;

    if (
      loadedIdsRef.current[0] !== firstVideo.id &&
      loadedIdsRef.current[1] !== firstVideo.id
    ) {
      const firstId = firstVideo.id;
      loadedIdsRef.current[0] = firstId;
      playerA.replaceAsync(makeSource(firstVideo.media_url)).catch(() => {
        // Roll back the slot marker so a later play attempt falls through
        // to the slow path instead of trying to play an empty player.
        if (loadedIdsRef.current[0] === firstId) loadedIdsRef.current[0] = null;
      });
    }

    const secondId = findNextVideoId(posts, firstVideo.id);
    if (secondId) {
      const secondUrl = posts.find((p) => p.id === secondId)?.media_url ?? null;
      if (
        secondUrl &&
        loadedIdsRef.current[0] !== secondId &&
        loadedIdsRef.current[1] !== secondId
      ) {
        loadedIdsRef.current[1] = secondId;
        playerB.replaceAsync(makeSource(secondUrl)).catch(() => {
          if (loadedIdsRef.current[1] === secondId) loadedIdsRef.current[1] = null;
        });
      }
    }
  }, [posts, playerA, playerB]);

  useEffect(() => {
    if (activeVideoId === handledIdRef.current) return;
    handledIdRef.current = activeVideoId;

    if (!activeVideoId) {
      playerA.pause();
      playerB.pause();
      return;
    }

    const ps: [VideoPlayer, VideoPlayer] = [playerA, playerB];
    const slot = currentSlotRef.current;
    const other: 0 | 1 = slot === 0 ? 1 : 0;

    const activeUrl = posts.find((p) => p.id === activeVideoId)?.media_url ?? null;
    if (!activeUrl) return;

    const nextId = findNextVideoId(posts, activeVideoId);

    // Figure out which slot (if any) already has the active video buffered.
    let preloadedSlot: 0 | 1 | null = null;
    if (loadedIdsRef.current[0] === activeVideoId) preloadedSlot = 0;
    else if (loadedIdsRef.current[1] === activeVideoId) preloadedSlot = 1;

    if (preloadedSlot !== null) {
      // ── Fast path: a slot has this video buffered. Make it current. ───────
      if (preloadedSlot !== slot) {
        currentSlotRef.current = preloadedSlot;
        setCurrentSlot(preloadedSlot);
      }
      ps[preloadedSlot].play();
      const saved = useVideoStore.getState().breadcrumbs[activeVideoId];
      if (saved) ps[preloadedSlot].currentTime = saved / 1000;

      // Pause and repurpose the other slot to preload what's next.
      const otherSlot: 0 | 1 = preloadedSlot === 0 ? 1 : 0;
      ps[otherSlot].pause();
      if (nextId && loadedIdsRef.current[otherSlot] !== nextId) {
        const nextUrl = posts.find((p) => p.id === nextId)?.media_url ?? null;
        if (nextUrl) {
          const targetId = nextId;
          loadedIdsRef.current[otherSlot] = targetId;
          ps[otherSlot].replaceAsync(makeSource(nextUrl)).catch(() => {
            if (loadedIdsRef.current[otherSlot] === targetId) {
              loadedIdsRef.current[otherSlot] = null;
            }
          });
        }
      }
    } else {
      // ── Slow path: video not preloaded anywhere. Load into current slot. ─
      loadedIdsRef.current[slot] = activeVideoId;
      ps[slot].pause();

      const capturedId = activeVideoId;
      ps[slot]
        .replaceAsync(makeSource(activeUrl))
        .then(() => {
          if (handledIdRef.current !== capturedId) return;
          ps[slot].play();
          const saved = useVideoStore.getState().breadcrumbs[capturedId];
          if (saved) ps[slot].currentTime = saved / 1000;
        })
        .catch(() => {});

      // Preload the next video into the other slot in the background.
      if (nextId && loadedIdsRef.current[other] !== nextId) {
        const nextUrl = posts.find((p) => p.id === nextId)?.media_url ?? null;
        if (nextUrl) {
          const targetId = nextId;
          loadedIdsRef.current[other] = targetId;
          ps[other].replaceAsync(makeSource(nextUrl)).catch(() => {
            if (loadedIdsRef.current[other] === targetId) {
              loadedIdsRef.current[other] = null;
            }
          });
        }
      }
    }
  }, [activeVideoId, posts, playerA, playerB]);

  // Breadcrumb tracking so position is restored when scrolling back.
  useEffect(() => {
    const sub = playerA.addListener("timeUpdate", ({ currentTime }) => {
      const id = loadedIdsRef.current[0];
      if (id && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(id, currentTime * 1000);
      }
    });
    return () => { sub?.remove?.(); };
  }, [playerA]);

  useEffect(() => {
    const sub = playerB.addListener("timeUpdate", ({ currentTime }) => {
      const id = loadedIdsRef.current[1];
      if (id && currentTime > 0) {
        useVideoStore.getState().setBreadcrumb(id, currentTime * 1000);
      }
    });
    return () => { sub?.remove?.(); };
  }, [playerB]);

  return {
    currentPlayer: currentSlot === 0 ? playerA : playerB,
    preloadPlayer: currentSlot === 0 ? playerB : playerA,
  };
}
