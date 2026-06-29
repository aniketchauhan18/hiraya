"use client";
import { useState } from "react";
import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@/hooks/useChat";

export default function InputQuery() {
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const { setChatMessages } = useChat();

  const handleSubmit = async (message: PromptInputMessage) => {
    const userQuery = message.text.trim();
    if (!userQuery || status === "submitted" || status === "streaming") {
      return;
    }

    setStatus("submitted");
    const botMessageId = crypto.randomUUID();

    setChatMessages((prevMessages) => [
      ...prevMessages,
      { id: crypto.randomUUID(), text: userQuery, isUser: true, links: [] },
      {
        id: botMessageId,
        text: "",
        isUser: false,
        links: [],
        isStreaming: true,
      },
    ]);

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Server response was not ok");
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        setChatMessages((prevMessages) =>
          prevMessages.map((m) =>
            m.id === botMessageId ? { ...m, text: accumulated } : m,
          ),
        );
      }

      accumulated += decoder.decode();
      setChatMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.id === botMessageId
            ? { ...m, text: accumulated, isStreaming: false }
            : m,
        ),
      );
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setChatMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                text: "Sorry, something went wrong. Please try again.",
                isStreaming: false,
              }
            : m,
        ),
      );
      setStatus("error");
    }
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl rounded-2xl shadow-sm"
    >
      <PromptInputBody>
        <PromptInputTextarea placeholder="Ask anything about NIT Hamirpur..." />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
