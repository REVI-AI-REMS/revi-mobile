import { create } from "zustand";

interface VideoState {
    breadcrumbs: Record<string, number>; // postId -> positionMillis
    thumbnails: Record<string, string>; // postId -> thumbnailUri
    activeVideoId: string | null;
    visiblePostIds: Set<string>;
    setBreadcrumb: (postId: string, time: number) => void;
    setThumbnail: (postId: string, uri: string) => void;
    setActiveVideoId: (id: string | null) => void;
    setVisiblePostIds: (ids: string[]) => void;
    clearBreadcrumbs: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
    breadcrumbs: {},
    thumbnails: {},
    activeVideoId: null,
    visiblePostIds: new Set(),

    setBreadcrumb: (postId, time) =>
        set((state) => ({
            breadcrumbs: {
                ...state.breadcrumbs,
                [postId]: time,
            },
        })),

    setThumbnail: (postId, uri) =>
        set((state) => {
            if (state.thumbnails[postId] === uri) return state;
            return {
                thumbnails: {
                    ...state.thumbnails,
                    [postId]: uri,
                },
            };
        }),

    setActiveVideoId: (id) =>
        set((state) => (state.activeVideoId === id ? state : { activeVideoId: id })),

    setVisiblePostIds: (ids) =>
        set((state) => {
            const next = new Set(ids);
            if (state.visiblePostIds.size === next.size) {
                let same = true;
                for (const id of next) {
                    if (!state.visiblePostIds.has(id)) {
                        same = false;
                        break;
                    }
                }
                if (same) return state;
            }
            return { visiblePostIds: next };
        }),

    clearBreadcrumbs: () =>
        set({ breadcrumbs: {}, thumbnails: {}, visiblePostIds: new Set() }),
}));
