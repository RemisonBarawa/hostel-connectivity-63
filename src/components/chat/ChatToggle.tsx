
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChatContainer } from './ChatContainer';

export const ChatToggle = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Toggle chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <div className="h-full">
          <ChatContainer />
        </div>
      </SheetContent>
    </Sheet>
  );
};
