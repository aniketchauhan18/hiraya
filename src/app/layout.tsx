import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatMessageProvider } from "@/hooks/useChat";
import Navbar from "@/components/app/Navbar";
import SessionWrapper from "@/components/app/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Hiraya",
    default: "Hiraya",
  },
  description: "College companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionWrapper>
      <html lang="en">
        <ChatMessageProvider>
          <body className={inter.className}>
            <Navbar />
            {children}
          </body>
        </ChatMessageProvider>
      </html>
    </SessionWrapper>
  );
}
