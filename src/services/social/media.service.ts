import { api } from "@/src/services/api";
import type { UploadResponse } from "./types";

/**
 * GET /api/v1/media/upload-url
 *
 * 3-step media upload flow:
 *   1. Call getUploadUrl(fileName, contentType) → { upload_url, blob_url, requires_transcoding }
 *   2. PUT the raw file bytes directly to upload_url (SAS token — no backend proxy)
 *      Headers required: Content-Type: <contentType>, x-ms-blob-type: BlockBlob
 *   3. Use blob_url as media_url in postsService.createPost()
 *
 * Images: requires_transcoding = false → use blob_url immediately
 * Videos: requires_transcoding = true → Celery transcodes to HLS in ~15-30s
 */
export const mediaService = {
  getUploadUrl: async (
    fileName: string,
    contentType = "image/jpeg",
  ): Promise<UploadResponse> => {
    const { data } = await api.get<UploadResponse>("/api/v1/media/upload-url", {
      params: { file_name: fileName, content_type: contentType },
    });
    return data;
  },
};
