import { api } from "@/src/services/api";
import type { FollowRead, FollowerStats } from "./types";

/**
 * POST   /api/v1/users/{user_id}/follow
 * DELETE /api/v1/users/{user_id}/follow
 * GET    /api/v1/users/{user_id}/followers
 * GET    /api/v1/users/{user_id}/following
 * GET    /api/v1/users/{user_id}/stats
 */
export const relationshipsService = {
  /** POST /api/v1/users/{user_id}/follow */
  followUser: async (userId: string): Promise<FollowRead> => {
    const { data } = await api.post<FollowRead>(
      `/api/v1/users/${userId}/follow`,
    );
    return data;
  },

  /** DELETE /api/v1/users/{user_id}/follow */
  unfollowUser: async (userId: string): Promise<void> => {
    await api.delete(`/api/v1/users/${userId}/follow`);
  },

  /** GET /api/v1/users/{user_id}/followers */
  getFollowers: async (
    userId: string,
    skip = 0,
    limit = 50,
  ): Promise<FollowRead[]> => {
    const { data } = await api.get<FollowRead[]>(
      `/api/v1/users/${userId}/followers`,
      { params: { skip, limit } },
    );
    return data;
  },

  /** GET /api/v1/users/{user_id}/following */
  getFollowing: async (
    userId: string,
    skip = 0,
    limit = 50,
  ): Promise<FollowRead[]> => {
    const { data } = await api.get<FollowRead[]>(
      `/api/v1/users/${userId}/following`,
      { params: { skip, limit } },
    );
    return data;
  },

  /** GET /api/v1/users/{user_id}/stats */
  getUserStats: async (userId: string): Promise<FollowerStats> => {
    const { data } = await api.get<FollowerStats>(
      `/api/v1/users/${userId}/stats`,
    );
    return data;
  },
};
