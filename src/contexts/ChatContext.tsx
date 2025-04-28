
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatState, MessageRole } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface ChatContextType {
  chatState: ChatState;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: uuidv4(),
        content: 'Hello! I\'m your HostelConnect assistant. How can I help you today with finding student accommodation near Kirinyaga University?',
        role: 'assistant',
        createdAt: new Date(),
      },
    ],
    isLoading: false,
  });

  const { toast } = useToast();

  const addMessage = useCallback((content: string, role: MessageRole) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content,
      role,
      createdAt: new Date(),
    };

    setChatState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, newMessage],
    }));

    return newMessage;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage = addMessage(content, 'user');

      // Set loading state
      setChatState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Get all messages for context
        const allMessages = [
          ...chatState.messages,
          userMessage
        ];

        // Call Gemini API through our edge function
        const response = await supabase.functions.invoke('chat-with-gemini', {
          body: {
            messages: allMessages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to get response');
        }

        // Add assistant response
        addMessage(response.data.response, 'assistant');
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to get a response. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setChatState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [addMessage, chatState.messages, toast]
  );

  const resetChat = useCallback(() => {
    setChatState({
      messages: [
        {
          id: uuidv4(),
          content: 'Hello! I\'m your HostelConnect assistant. How can I help you today with finding student accommodation near Kirinyaga University?',
          role: 'assistant',
          createdAt: new Date(),
        },
      ],
      isLoading: false,
    });
  }, []);

  return (
    <ChatContext.Provider value={{ chatState, sendMessage, resetChat }}>
      {children}
    </ChatContext.Provider>
  );
};
