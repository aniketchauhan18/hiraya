import { ChatMessageProvider } from "@/hooks/useChat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Page",
  description: "College companion",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatMessageProvider>
      <div>{children}</div>
    </ChatMessageProvider>
  );
}
