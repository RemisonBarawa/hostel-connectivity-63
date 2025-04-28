
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatContainer } from '@/components/chat/ChatContainer';

const Chat = () => {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-lg border shadow-sm h-[70vh]">
        <ChatContainer />
      </div>
    </div>
  );
};

const ChatPage = () => {
  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
};

export default ChatPage;
