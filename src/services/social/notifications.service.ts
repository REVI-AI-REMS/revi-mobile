import { api } from "@/src/services/api";
import type { NotificationRead } from "./types";

/**
 * GET   /api/v1/notifications
 * PATCH /api/v1/notifications/{notification_id}/read
 * PATCH /api/v1/notifications/read-all
 */
export const notificationsService = {
  /**
   * GET /api/v1/notifications
   * Filter by is_read to get only unread (false) or already-read (true).
   */
  getNotifications: async (
    skip = 0,
    limit = 50,
    is_read?: boolean,
  ): Promise<NotificationRead[]> => {
    const { data } = await api.get<NotificationRead[]>(
      "/api/v1/notifications",
      {
        params: { skip, limit, ...(is_read !== undefined ? { is_read } : {}) },
      },
    );
    return data;
  },

  /** PATCH /api/v1/notifications/{notification_id}/read */
  markRead: async (notificationId: string): Promise<NotificationRead> => {
    const { data } = await api.patch<NotificationRead>(
      `/api/v1/notifications/${notificationId}/read`,
    );
    return data;
  },

  /** PATCH /api/v1/notifications/read-all */
  markAllRead: async (): Promise<void> => {
    await api.patch("/api/v1/notifications/read-all");
  },
};
