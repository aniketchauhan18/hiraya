"use client";
import { useChat } from "@/hooks/useChat";
import { BotMessageSquareIcon, UserRoundIcon } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CopyButton from "./buttons/copy-button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";

function AssistantAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-white shadow-sm">
      <BotMessageSquareIcon className="size-4" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
      <UserRoundIcon className="size-4" />
    </div>
  );
}

export default function ChatComponent() {
  const { chatMessages } = useChat();

  return (
    <Conversation>
      <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
        {chatMessages.length === 0 ? (
          <ConversationEmptyState
            className="h-[60dvh]"
            icon={
              <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-800 text-white">
                <BotMessageSquareIcon className="size-7" />
              </div>
            }
            title="Your NIT Hamirpur assistant awaits!"
            description="Ask about academics, exams, placements, or campus life."
          />
        ) : (
          chatMessages.map((message) =>
            message.isUser ? (
              <Message from="user" key={message.id}>
                <div className="flex items-start justify-end gap-3">
                  <MessageContent className="rounded-2xl bg-secondary px-4 py-2.5 leading-relaxed">
                    {message.text}
                  </MessageContent>
                  <UserAvatar />
                </div>
              </Message>
            ) : (
              <Message from="assistant" key={message.id}>
                <div className="group/msg flex items-start gap-3">
                  <AssistantAvatar />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                    {message.text ? (
                      <MessageContent className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:rounded-xl prose-pre:bg-muted prose-pre:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-[''] prose-headings:text-base prose-headings:font-semibold prose-a:text-primary prose-li:marker:text-muted-foreground prose-img:rounded-xl">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[
                            rehypeKatex,
                            [
                              rehypeHighlight,
                              {
                                detect: true,
                                ignoreMissing: true,
                              },
                            ],
                          ]}
                        >
                          {message.text}
                        </Markdown>
                      </MessageContent>
                    ) : (
                      message.isStreaming && (
                        <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                          <Loader size={16} />
                          <span className="text-sm">Thinking…</span>
                        </div>
                      )
                    )}
                    {!message.isStreaming && message.text && (
                      <div className="-ml-1 flex items-center gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
                        <CopyButton text={message.text} />
                      </div>
                    )}
                  </div>
                </div>
              </Message>
            ),
          )
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
