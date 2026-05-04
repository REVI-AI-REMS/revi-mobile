// ─── AI chat types ─────────────────────────────────────────────────────────
// Mirrors https://backend.reviai.ai/openapi.json. Kept narrow on purpose —
// we only name fields the UI actually reads.

export interface ChatSession {
  id: string;
  user_id?: string | null;
  chat_title?: string | null;
  title?: string | null;
  unique_chat_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionListResponse {
  results: ChatSession[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id?: string | null;
  prompt: string;
  original_prompt?: string | null;
  context?: string | null;
  classification?: string | null;
  file?: string | null;
  image_url?: string | null;
  response?: string | null;
  properties?: string | null;
  returned_property_ids?: string | null;
  returned_property_urls?: string | null;
  reaction?: string | null;
  embeddings_status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageListResponse {
  results: ChatMessage[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface SendMessageArgs {
  prompt: string;
  /** Omit on the first send of a new session — backend creates one and
   * returns the new session_id on the response. */
  sessionId?: string;
  /** optional URL to a remote image to attach */
  imageUrl?: string;
  /** optional local file to upload as multipart */
  file?: {
    uri: string;
    name: string;
    type: string;
  };
}
