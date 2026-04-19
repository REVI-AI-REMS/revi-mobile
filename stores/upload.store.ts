import { create } from "zustand";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "creating"
  | "processing"
  | "done"
  | "error";

interface UploadState {
  status: UploadStatus;
  /** 0–100 */
  progress: number;
  /** Local file:// URI of the first selected media — used as thumbnail */
  thumbnailUri: string | null;
  /** true when media is video (shows "Processing…" stage) */
  isVideo: boolean;
  /** Error message when status === "error" */
  errorMessage: string | null;

  // ─── Actions ─────────────────────────────────────────────────────────────
  startUpload: (thumbnailUri: string, isVideo: boolean) => void;
  setProgress: (progress: number) => void;
  setStatus: (status: UploadStatus) => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  status: "idle",
  progress: 0,
  thumbnailUri: null,
  isVideo: false,
  errorMessage: null,

  startUpload: (thumbnailUri, isVideo) =>
    set({
      status: "uploading",
      progress: 0,
      thumbnailUri,
      isVideo,
      errorMessage: null,
    }),

  setProgress: (progress) => set({ progress }),

  setStatus: (status) => set({ status }),

  setError: (message) => set({ status: "error", errorMessage: message }),

  reset: () =>
    set({
      status: "idle",
      progress: 0,
      thumbnailUri: null,
      isVideo: false,
      errorMessage: null,
    }),
}));
