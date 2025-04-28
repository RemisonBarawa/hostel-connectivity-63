
import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Function to parse markdown-like syntax in the message
const formatMessageContent = (content: string): React.ReactNode => {
  if (!content) return null;

  // Split the content by double asterisks to find bold sections
  const parts = content.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is surrounded by ** (bold)
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove the asterisks and render as bold
          const boldText = part.substring(2, part.length - 2);
          return <strong key={index}>{boldText}</strong>;
        }
        // Return regular text
        return part ? <span key={index}>{part}</span> : null;
      })}
    </>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'bg-muted/50' : 'bg-white'
      )}
    >
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="leading-relaxed">
          {formatMessageContent(message.content)}
        </div>
      </div>
    </div>
  );
};
