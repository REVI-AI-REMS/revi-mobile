import { aiClient } from "./ai.client";
import type {
  ChatMessage,
  ChatMessageListResponse,
  ChatSession,
  ChatSessionListResponse,
  SendMessageArgs,
} from "./types";

/**
 * Service wrapper around https://backend.reviai.ai's chat endpoints.
 *
 *   POST /chat-sessions                    → create session
 *   GET  /chat-sessions/mine/              → list my sessions (paginated)
 *   GET  /chat-sessions/{id}               → single session
 *   PATCH /chat-sessions/{id}              → rename (chat_title)
 *   DELETE /chat-sessions/{id}             → delete one
 *   DELETE /chat-sessions/delete_all_my_sessions/
 *   GET  /chats/session/{id}               → messages in a session
 *   POST /chats/ai-chat (multipart/form-data: prompt, session_id?, file?, image_url?)
 *   POST /chats/{id}/react                 → react to a message
 *   DELETE /chats/{id}/react/{user_id}     → unreact
 */
export const aiService = {
  // ─── Sessions ──────────────────────────────────────────────────────────
  listSessions: async (
    page = 1,
    pageSize = 20,
  ): Promise<ChatSessionListResponse> => {
    const { data } = await aiClient.get<ChatSessionListResponse>(
      "/chat-sessions/mine/",
      { params: { page, page_size: pageSize } },
    );
    return data;
  },

  createSession: async (title?: string): Promise<ChatSession> => {
    const { data } = await aiClient.post<ChatSession>("/chat-sessions", {
      chat_title: title ?? null,
    });
    return data;
  },

  renameSession: async (id: string, title: string): Promise<ChatSession> => {
    const { data } = await aiClient.patch<ChatSession>(
      `/chat-sessions/${id}`,
      { chat_title: title },
    );
    return data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await aiClient.delete(`/chat-sessions/${id}`);
  },

  deleteAllSessions: async (): Promise<void> => {
    await aiClient.delete("/chat-sessions/delete_all_my_sessions/");
  },

  // ─── Messages ──────────────────────────────────────────────────────────
  getMessages: async (
    sessionId: string,
    page = 1,
    pageSize = 50,
  ): Promise<ChatMessageListResponse> => {
    const { data } = await aiClient.get<ChatMessageListResponse>(
      `/chats/session/${sessionId}`,
      { params: { page, page_size: pageSize } },
    );
    return data;
  },

  /**
   * Send a user prompt to the AI. Uses multipart/form-data because the
   * backend accepts an optional file upload alongside the prompt.
   * Returns the ChatMessage record — `response` holds the AI's answer,
   * and `session_id` is the newly-created session id when none was sent.
   */
  sendMessage: async ({
    prompt,
    sessionId,
    file,
    imageUrl,
  }: SendMessageArgs): Promise<ChatMessage> => {
    const form = new FormData();
    form.append("prompt", prompt);
    if (sessionId) form.append("session_id", sessionId);
    if (imageUrl) form.append("image_url", imageUrl);
    if (file) {
      // React Native's FormData accepts the { uri, name, type } shape —
      // don't strip or wrap in Blob, which breaks on Android.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append("file", file as any);
    }

    const { data } = await aiClient.post<ChatMessage>("/chats/ai-chat", form, {
      // axios sets the multipart boundary automatically when we pass a
      // FormData body; explicit Content-Type would drop the boundary.
    });
    return data;
  },

  // ─── Reactions ─────────────────────────────────────────────────────────
  reactToMessage: async (
    chatId: string,
    reaction: "like" | "dislike",
  ): Promise<void> => {
    await aiClient.post(`/chats/${chatId}/react`, { reaction });
  },

  unreactToMessage: async (chatId: string, userId: string): Promise<void> => {
    await aiClient.delete(`/chats/${chatId}/react/${userId}`);
  },
};
