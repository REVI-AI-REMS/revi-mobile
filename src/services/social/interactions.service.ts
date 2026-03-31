import { api } from "@/src/services/api";
import type { CommentCreate, CommentRead, LikeCreate, LikeRead } from "./types";

/**
 * POST   /api/v1/interactions/likes
 * DELETE /api/v1/interactions/likes/{post_id}
 * POST   /api/v1/interactions/comments
 * GET    /api/v1/interactions/comments/{post_id}
 * POST   /api/v1/interactions/comments/{comment_id}/like
 * DELETE /api/v1/interactions/comments/{comment_id}/like
 */
export const interactionsService = {
  /**
   * POST /api/v1/interactions/likes
   * Body: { post_id }
   */
  likePost: async (postId: string): Promise<LikeRead> => {
    const payload: LikeCreate = { post_id: postId };
    const { data } = await api.post<LikeRead>(
      "/api/v1/interactions/likes",
      payload,
    );
    return data;
  },

  /** DELETE /api/v1/interactions/likes/{post_id} */
  unlikePost: async (postId: string): Promise<void> => {
    await api.delete(`/api/v1/interactions/likes/${postId}`);
  },

  /**
   * POST /api/v1/interactions/comments
   * Body: { content, post_id, parent_id? }
   */
  createComment: async (payload: CommentCreate): Promise<CommentRead> => {
    const { data } = await api.post<CommentRead>(
      "/api/v1/interactions/comments",
      payload,
    );
    return data;
  },

  /**
   * GET /api/v1/interactions/comments/{post_id}
   * Offset-based pagination (skip + limit, default 0 + 50).
   */
  getComments: async (
    postId: string,
    skip = 0,
    limit = 50,
  ): Promise<CommentRead[]> => {
    const { data } = await api.get<CommentRead[]>(
      `/api/v1/interactions/comments/${postId}`,
      { params: { skip, limit } },
    );
    return data;
  },

  /** POST /api/v1/interactions/comments/{comment_id}/like */
  likeComment: async (commentId: string): Promise<void> => {
    await api.post(`/api/v1/interactions/comments/${commentId}/like`);
  },

  /** DELETE /api/v1/interactions/comments/{comment_id}/like */
  unlikeComment: async (commentId: string): Promise<void> => {
    await api.delete(`/api/v1/interactions/comments/${commentId}/like`);
  },

  /** DELETE /api/v1/interactions/comments/{comment_id} */
  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/api/v1/interactions/comments/${commentId}`);
  },
};
