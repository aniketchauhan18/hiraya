"use client";
import { useChat } from "@/hooks/useChat";
import { BotMessageSquareIcon, UserRoundIcon, ShareIcon } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CopyButton from "./buttons/copy-button";
import { AnimatePresence, motion } from "framer-motion";
// import TextToDisplay from "./TextToDisplay";

export default function ChatComponent() {
  const { chatMessages } = useChat();
  return (
    <div className="p-5">
      <AnimatePresence mode="popLayout">
        {chatMessages.length >= 1 ? (
          <div className="space-y-3 py-20">
            {chatMessages.map((message) => {
              console.log(message.text);
              return (
                <div key={message.text}>
                  {message.isUser ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="initial"
                      className="space-y-3"
                    >
                      <div className="flex justify-end pb-2">
                        <div className="flex max-w-sm">
                          <p className="p-2 text-sm bg-neutral-200 rounded-md px-3">
                            {message.text}
                          </p>
                          <div>
                            <p className="p-2 bg-neutral-800 rounded-full h-auto ml-1">
                              <UserRoundIcon className="text-white w-4 h-4" />
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-3">
                      <div className="flex justify-start max-w-10/12">
                        <div className="flex max-w-3xl">
                          <div>
                            <p className="p-2 bg-neutral-800 rounded-full h-auto mr-1">
                              <BotMessageSquareIcon className="text-white w-4 h-4" />
                            </p>
                          </div>
                          <div className="p-2 space-y-2 text-sm prose prose-neutral dark:prose-invert prose-headings:bg-neutral-100 dark:prose-headings:bg-neutral-800 prose-headings:p-2 prose-headings:rounded prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-li:marker:text-neutral-500 prose-img:rounded-lg bg-neutral-200 dark:bg-neutral-800 rounded-md px-3">
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
                            {/* <TextToDisplay content={message.text} /> */}
                            {/* <div>
                              {message.links.length > 0 ? (
                                <div className="flex gap-2">
                                  {message.links.map((link, index) => {
                                    // using index here for dev ease
                                    return (
                                      <div className="space-y-1">
                                        <p
                                          key={index}
                                          className=" px-1 py-0.5 text-xs text-blue-600 border-b"
                                        >
                                          {link.text}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div></div>
                              )}
                            </div> */}
                            <div className="flex space-x-2">
                              <CopyButton text={message.text} />
                              <ShareIcon className="w-3 h-3 text-neutral-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="min-h-[90dvh] flex flex-col justify-center items-center font-sedan text-xl font-semibold text-neutral-700">
            <BotMessageSquareIcon className="w-12 h-12 sm:16 sm:h-16 text-neutral-700" />
            <p>Your college assistant awaits!</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
