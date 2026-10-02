"use client";
import { useEffect, useState } from "react";
import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@/hooks/useChat";

type ModelOption = { id: string; label: string };

const FALLBACK_MODEL = "openai/gpt-oss-120b";

export default function InputQuery() {
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [models, setModels] = useState<ModelOption[]>([
    { id: FALLBACK_MODEL, label: "GPT-OSS 120B" },
  ]);
  const [selectedModel, setSelectedModel] = useState(FALLBACK_MODEL);
  const { setChatMessages } = useChat();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/models");
        if (!res.ok) return;
        const data = (await res.json()) as {
          models?: ModelOption[];
          defaultModel?: string;
        };
        if (cancelled || !data.models?.length) return;
        setModels(data.models);
        const next =
          data.defaultModel &&
          data.models.some((m) => m.id === data.defaultModel)
            ? data.defaultModel
            : data.models[0].id;
        setSelectedModel(next);
      } catch (err) {
        console.error("Failed to load Groq models:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        body: JSON.stringify({ query: userQuery, model: selectedModel }),
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
        <PromptInputTools>
          <PromptInputSelect
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <PromptInputSelectTrigger className="w-auto min-w-36 gap-1">
              <PromptInputSelectValue placeholder="Model" />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {models.map((m) => (
                <PromptInputSelectItem key={m.id} value={m.id}>
                  {m.label}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
        </PromptInputTools>
        <PromptInputSubmit status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
