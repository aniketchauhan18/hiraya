"use client";
import InputQuery from "@/components/app/input-query";
import ChatComponent from "@/components/app/chat";
import { BotMessageSquareIcon } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ChatPage() {
  const { setChatMessages } = useChat();

  const handleNewChatClick = () => {
    setChatMessages([]);
  };

  return (
    <main className="flex h-dvh flex-col">
      <nav className="z-50 min-h-16 shrink-0 bg-neutral-800">
        <div className="flex items-center justify-between p-3">
          <Link href="/" className="flex text-white">
            <BotMessageSquareIcon className="mr-1 h-6 w-6 text-white" />
            <p>Hiraya</p>
          </Link>
          <Button
            className="bg-neutral-200 text-neutral-800 shadow-xs hover:bg-neutral-300"
            onClick={handleNewChatClick}
          >
            New Chat
          </Button>
        </div>
      </nav>
      <ChatComponent />
      <div className="shrink-0 bg-transparent p-3">
        <InputQuery />
      </div>
    </main>
  );
}
