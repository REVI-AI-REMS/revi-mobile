import { create } from "zustand";

interface VideoState {
  breadcrumbs: Record<string, number>; // postId -> positionMillis
  thumbnails: Record<string, string>; // postId -> thumbnailUri
  activeVideoId: string | null;
  /** Set to a postId once the player has finished loading that post's source
   *  (replaceAsync resolved). PostCard reads this to know when it's safe to
   *  hide the thumbnail cover and expose the VideoView. */
  readyVideoId: string | null;
  visiblePostIds: Set<string>;
  preloadVideoIds: Set<string>;
  activeWindowIds: Set<string>;
  setBreadcrumb: (postId: string, time: number) => void;
  setThumbnail: (postId: string, uri: string) => void;
  setActiveVideoId: (id: string | null) => void;
  setReadyVideoId: (id: string | null) => void;
  setVisiblePostIds: (ids: string[]) => void;
  setPreloadVideoIds: (ids: string[]) => void;
  setActiveWindowIds: (ids: string[]) => void;
  clearBreadcrumbs: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  breadcrumbs: {},
  thumbnails: {},
  activeVideoId: null,
  readyVideoId: null,
  visiblePostIds: new Set(),
  preloadVideoIds: new Set(),
  activeWindowIds: new Set(),

  setBreadcrumb: (postId, time) =>
    set((state) => ({
      breadcrumbs: { ...state.breadcrumbs, [postId]: time },
    })),

  setThumbnail: (postId, uri) =>
    set((state) => {
      if (state.thumbnails[postId] === uri) return state;
      return { thumbnails: { ...state.thumbnails, [postId]: uri } };
    }),

  // Don't reset readyVideoId when switching active videos.
  // The old video's VideoView stays mounted showing its last frame (like
  // Instagram's pause-in-place). readyVideoId only changes when the
  // player finishes loading the NEW video's source (via setReadyVideoId).
  setActiveVideoId: (id) =>
    set((state) => {
      if (state.activeVideoId === id) return state;
      return { activeVideoId: id };
    }),

  setReadyVideoId: (id) =>
    set((state) =>
      state.readyVideoId === id ? state : { readyVideoId: id },
    ),

  setVisiblePostIds: (ids) =>
    set((state) => {
      const next = new Set(ids);
      if (state.visiblePostIds.size === next.size) {
        let same = true;
        for (const id of next) {
          if (!state.visiblePostIds.has(id)) { same = false; break; }
        }
        if (same) return state;
      }
      return { visiblePostIds: next };
    }),

  setPreloadVideoIds: (ids) =>
    set((state) => {
      const next = new Set(ids);
      if (state.preloadVideoIds.size === next.size) {
        let same = true;
        for (const id of next) {
          if (!state.preloadVideoIds.has(id)) { same = false; break; }
        }
        if (same) return state;
      }
      return { preloadVideoIds: next };
    }),

  setActiveWindowIds: (ids) =>
    set((state) => {
      const next = new Set(ids);
      if (state.activeWindowIds.size === next.size) {
        let same = true;
        for (const id of next) {
          if (!state.activeWindowIds.has(id)) { same = false; break; }
        }
        if (same) return state;
      }
      return { activeWindowIds: next };
    }),

  clearBreadcrumbs: () =>
    set({
      breadcrumbs: {},
      thumbnails: {},
      visiblePostIds: new Set(),
      preloadVideoIds: new Set(),
    }),
}));
