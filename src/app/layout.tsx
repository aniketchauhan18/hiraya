import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatMessageProvider } from "@/hooks/useChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ragbot",
  description: "Creator Aniket Chauhan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ChatMessageProvider>
        <body className={inter.className}>{children}</body>
      </ChatMessageProvider>
    </html>
  );
}
