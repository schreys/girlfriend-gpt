"use client";

import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatBubble, { type Message } from './ChatBubble';
import Image from 'next/image';

interface ConversationLogProps {
  messages: Message[];
  girlfriendName: string;
  isLoadingAiResponse: boolean;
}

const ConversationLog: FC<ConversationLogProps> = ({ messages, girlfriendName, isLoadingAiResponse }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoadingAiResponse]);

  return (
    <ScrollArea className="flex-grow h-[300px] md:h-auto p-4 rounded-md border bg-background" ref={scrollAreaRef}>
      {messages.length === 0 && !isLoadingAiResponse && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Image src="https://picsum.photos/seed/chatbubbles/200/200" alt="No messages yet" width={150} height={150} className="rounded-full opacity-50 mb-4" data-ai-hint="empty chat" />
          <p className="text-lg">No messages yet.</p>
          <p>Start the conversation by talking to {girlfriendName || 'her'}!</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} girlfriendName={girlfriendName} />
      ))}
      {isLoadingAiResponse && (
        <div className="flex items-start gap-3 my-3 max-w-[85%] md:max-w-[75%] self-start">
           <div className="p-3 rounded-xl shadow-md bg-secondary text-secondary-foreground rounded-tl-none">
            <p className="text-sm italic">Typing...</p>
          </div>
        </div>
      )}
    </ScrollArea>
  );
};

export default ConversationLog;
