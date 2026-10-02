"use client";
import { useChat } from "@/hooks/useChat";
import { BotMessageSquareIcon, UserRoundIcon } from "lucide-react";
import CopyButton from "./buttons/copy-button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
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
                  <MessageContent>{message.text}</MessageContent>
                  <UserAvatar />
                </div>
              </Message>
            ) : (
              <Message from="assistant" key={message.id}>
                <div className="group/msg flex items-start gap-3">
                  <AssistantAvatar />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                    {message.text ? (
                      <MessageContent className="w-full max-w-none">
                        <MessageResponse
                          className="prose prose-neutral dark:prose-invert max-w-none text-[0.95rem] leading-relaxed prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-base prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:font-medium prose-a:text-blue-600 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-blue-700 dark:prose-a:text-blue-400"
                          components={{
                            a: ({ href, children, ...props }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.text}
                        </MessageResponse>
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
                      <MessageActions className="-ml-1 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
                        <CopyButton text={message.text} />
                      </MessageActions>
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
