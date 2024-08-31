import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { SendHorizonalIcon, LoaderCircleIcon } from "lucide-react";
import { useChat } from "@/hooks/useChat";

export default function InputQuery() {
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setChatMessages } = useChat();

  const getCharacterLimit = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        // Small screens (sm)
        return 40;
      } else if (window.innerWidth < 768) {
        // Medium screens (md)
        return 60;
      } else if (window.innerWidth < 1024) {
        // Large screens (lg)
        return 80;
      } else if (window.innerWidth < 1280) {
        // Extra large screens (xl)
        return 100;
      } else {
        // 2xl and above
        return 200;
      }
    }
    return 80;
  };

  const isTextArea = inputValue.length > getCharacterLimit();

  useEffect(() => {
    if (isTextArea) {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(
        inputValue.length,
        inputValue.length,
      );
    } else {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(inputValue.length, inputValue.length);
    }
  }, [isTextArea, inputValue]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setInputValue(e.target.value);
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement): void => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleQuerySubmit = async () => {
    setIsLoading(true);
    if (inputValue.trim() == "") {
      setIsLoading(false);
      return;
    }

    // adding links to empty array for this
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { text: inputValue, isUser: true, links: [] },
    ]);

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: inputValue,
        }),
      });
      if (!response.ok) {
        setIsLoading(false);
        throw new Error("Server Response was not ok");
      }
      setInputValue("");
      const data = await response.json();
      console.log(data);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { text: data.data, isUser: false, links: data.links },
      ]);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default action (like submitting a form)
      handleQuerySubmit(); // Call the send function
    }
  };

  return (
    <div className="relative">
      {isTextArea ? (
        <Textarea
          className="min-h-16 max-h-96 resize-none pr-2 border bg-neutral-100 shadow-none pb-8"
          value={inputValue}
          disabled={isLoading}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            handleInputChange(e);
            adjustTextareaHeight(e.target);
          }}
          ref={textAreaRef}
        />
      ) : (
        <Input
          className="rounded-full shadow-sm pr-12 border border-bg-neutral-300 focus:outline-none bg-neutral-100"
          disabled={isLoading}
          value={inputValue}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          placeholder="Ask anthing related to college"
          ref={inputRef}
        />
      )}
      {isTextArea ? (
        <div className="absolute right-2 bottom-1">
          <Button
            className="flex items-center text-xs bg-neutral-700 hover:bg-neutral-800/80 duration-75 h-6 rounded-sm"
            onClick={handleQuerySubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderCircleIcon className="animate-spin w-3 h-3" />
            ) : (
              <SendHorizonalIcon className="w-3 h-3 mr-1" />
            )}
            Send
          </Button>
        </div>
      ) : (
        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2`}>
          {isLoading ? (
            <LoaderCircleIcon className="animate-spin w-3 h-3" />
          ) : (
            <SendHorizonalIcon
              className="text-neutral-700"
              onClick={handleQuerySubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}
