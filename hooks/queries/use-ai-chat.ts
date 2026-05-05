import type {
    ChatMessage,
    ChatMessageListResponse,
    ChatSession,
    ChatSessionListResponse,
    SendMessageArgs,
} from "@/scripts/services/ai";
import { aiService } from "@/scripts/services/ai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Query keys ───────────────────────────────────────────────────────────

export const aiKeys = {
  all: ["ai"] as const,
  sessions: () => [...aiKeys.all, "sessions"] as const,
  session: (id: string) => [...aiKeys.sessions(), id] as const,
  messages: (sessionId: string) =>
    [...aiKeys.all, "messages", sessionId] as const,
};

// ─── Sessions ──────────────────────────────────────────────────────────────

export function useChatSessions() {
  return useQuery<ChatSessionListResponse>({
    queryKey: aiKeys.sessions(),
    queryFn: () => aiService.listSessions(1, 50),
    staleTime: 1000 * 60 * 5,  // 5 minutes — sidebar doesn't need to reload on every nav
    refetchOnMount: false,       // use cached data when navigating back to chat
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatSession, Error, string | undefined>({
    mutationFn: (title) => aiService.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
    },
  });
}

export function useRenameSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatSession, Error, { id: string; title: string }>({
    mutationFn: ({ id, title }) => aiService.renameSession(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
    },
  });
}

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => aiService.deleteSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
      queryClient.removeQueries({ queryKey: aiKeys.messages(id) });
    },
  });
}

export function useDeleteAllSessionsMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => aiService.deleteAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}

// ─── Messages ──────────────────────────────────────────────────────────────

export function useChatMessages(sessionId: string | undefined) {
  return useQuery<ChatMessageListResponse>({
    queryKey: sessionId ? aiKeys.messages(sessionId) : aiKeys.messages("none"),
    queryFn: () => aiService.getMessages(sessionId!, 1, 50),
    enabled: Boolean(sessionId),
    staleTime: 1000 * 60 * 5,  // 5 minutes — history doesn't change unless we send
    refetchOnMount: false,       // don't re-load when navigating back mid-conversation
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatMessage, Error, SendMessageArgs>({
    mutationFn: (args) => aiService.sendMessage(args),
    onSuccess: (msg) => {
      // Refresh the session's messages and the session list (preview updates)
      queryClient.invalidateQueries({
        queryKey: aiKeys.messages(msg.session_id),
      });
      queryClient.invalidateQueries({ queryKey: aiKeys.sessions() });
    },
  });
}

// ─── Reactions ────────────────────────────────────────────────────────────

export function useReactToMessageMutation(sessionId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { chatId: string; reaction: "like" | "dislike" }
  >({
    mutationFn: ({ chatId, reaction }) =>
      aiService.reactToMessage(chatId, reaction),
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: aiKeys.messages(sessionId),
        });
      }
    },
  });
}
