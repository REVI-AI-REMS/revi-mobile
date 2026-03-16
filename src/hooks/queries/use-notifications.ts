import { notificationsService } from "@/src/services/social/notifications.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useNotifications = (skip = 0, limit = 50, isRead?: boolean) => {
  return useQuery({
    queryKey: ["notifications", { skip, limit, isRead }],
    queryFn: () => notificationsService.getNotifications(skip, limit, isRead),
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
