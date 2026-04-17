import { create } from "zustand";

interface DraftPost {
  content: string;
  media: string[];
}

interface UIState {
  // --- Modals & Sheets ---
  isNewPostModalOpen: boolean;
  isShareSheetOpen: boolean;
  activeBottomSheet: string | null;

  // --- Draft post state ---
  draftPost: DraftPost;

  // --- Actions ---
  openNewPostModal: () => void;
  closeNewPostModal: () => void;
  openShareSheet: () => void;
  closeShareSheet: () => void;
  setActiveBottomSheet: (sheet: string | null) => void;

  setDraftPost: (draft: Partial<DraftPost>) => void;
  clearDraftPost: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isNewPostModalOpen: false,
  isShareSheetOpen: false,
  activeBottomSheet: null,
  draftPost: { content: "", media: [] },

  openNewPostModal: () => set({ isNewPostModalOpen: true }),
  closeNewPostModal: () => set({ isNewPostModalOpen: false }),
  openShareSheet: () => set({ isShareSheetOpen: true }),
  closeShareSheet: () => set({ isShareSheetOpen: false }),

  setActiveBottomSheet: (sheet) => set({ activeBottomSheet: sheet }),

  setDraftPost: (draft) =>
    set((state) => ({
      draftPost: { ...state.draftPost, ...draft },
    })),

  clearDraftPost: () => set({ draftPost: { content: "", media: [] } }),
}));
