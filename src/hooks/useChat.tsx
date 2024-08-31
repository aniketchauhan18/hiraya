"use client";
import { useState, useContext, useMemo, createContext } from "react";

interface LinkType {
  text: string;
  url: string;
}

interface ChatMessage {
  text: string;
  links: LinkType[];
  isUser: boolean;
}

// context type for chatMessages
interface ChatContextType {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatMessageProvider({ children }: React.PropsWithChildren) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const memoizedChatMessages = useMemo(
    () => chatMessages,
    [chatMessages],
  ) as ChatMessage[];
  return (
    <ChatContext.Provider
      value={{ chatMessages: memoizedChatMessages, setChatMessages }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// to-do replace it with database context in future or db memory based on the requirement

// custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be within a ChatMessageaProvider");
  }
  return context;
}
