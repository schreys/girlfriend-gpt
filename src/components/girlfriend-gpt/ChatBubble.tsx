"use client";

import type { FC } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
  girlfriendName: string;
}

const ChatBubble: FC<ChatBubbleProps> = ({ message, girlfriendName }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 my-3 max-w-[85%] md:max-w-[75%]',
        isUser ? 'self-end flex-row-reverse' : 'self-start'
      )}
    >
      <Avatar className="h-8 w-8 shadow-sm">
        <AvatarImage src={isUser ? `https://picsum.photos/seed/${encodeURIComponent("user")}/40/40` : `https://picsum.photos/seed/${encodeURIComponent(girlfriendName)}/40/40`} data-ai-hint={isUser ? "person face" : "woman face"} />
        <AvatarFallback className={cn(isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>
          {isUser ? <User size={18}/> : <Bot size={18}/>}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'p-3 rounded-xl shadow-md break-words',
          isUser
            ? 'bg-accent text-accent-foreground rounded-tr-none'
            : 'bg-secondary text-secondary-foreground rounded-tl-none'
        )}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p className={cn("text-xs mt-1", isUser ? "text-accent-foreground/70 text-right" : "text-secondary-foreground/70 text-left")}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
