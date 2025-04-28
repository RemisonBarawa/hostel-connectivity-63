
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
}
