
import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

const ChatContent = () => {
  const { resetChat } = useChatContext();
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">HostelConnect Assistant</h1>
        <Button variant="outline" size="sm" onClick={resetChat}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Chat
        </Button>
      </div>
      <div className="rounded-lg border shadow-sm h-[70vh]">
        <ChatContainer />
      </div>
    </div>
  );
};

const Chat = () => {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
};

export default Chat;
