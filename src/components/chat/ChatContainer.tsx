
import React, { useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Skeleton } from '@/components/ui/skeleton';

export const ChatContainer: React.FC = () => {
  const { chatState, sendMessage } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {chatState.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {chatState.isLoading && (
            <div className="flex w-full gap-3 p-4 bg-white">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <ChatInput onSendMessage={sendMessage} isLoading={chatState.isLoading} />
      </div>
    </div>
  );
};
