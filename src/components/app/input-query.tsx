import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { SendHorizonalIcon, LoaderCircleIcon, LoaderIcon } from "lucide-react";
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
      } else {
        return 70;
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
      { text: inputValue, isUser: true, links: [], isLoading: true },
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
      // console.log(data);
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
    <div className="flex items-center justify-center w-full">
      <div className="relative w-full max-w-xl">
        {isTextArea ? (
          <div className="bg-neutral-100 p-3 pt-4 rounded-lg border border-neutral-200">
            <Textarea
              className="min-h-16 border-none text-neutral-800 max-h-44 lg:text-base resize-none focus:outline-none pr-2 rounded-t-lg bg-neutral-100 shadow-none  focus-visible:ring-0 focus-visible:outline-none focus:border-transparent"
              value={inputValue}
              disabled={isLoading}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                handleInputChange(e);
                adjustTextareaHeight(e.target);
              }}
              ref={textAreaRef}
            />
            <div className="flex justify-end items-center pt-2">
              <Button
                className="flex items-center text-xs bg-neutral-700 hover:bg-neutral-800/80 duration-75 h-6 rounded-sm"
                onClick={handleQuerySubmit}
                disabled={isLoading}
                >
                Send
                {isLoading ? (
                  <LoaderIcon className="animate-spin w-3 h-3 text-neutral-600" />
                ) : (
                  <SendHorizonalIcon className="w-3 h-3 ml-1.5" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-2 lg:py-2 border rounded-full border-neutral-200 bg-neutral-100 flex items-center">
            <Input
              className="rounded-full text-neutral-800 lg:text-base shadow-none border-none focus-visible:ring-0 focus-visible:outline-none bg-neutral-100 focus:border-transparent"
              disabled={isLoading}
              value={inputValue}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
              placeholder="Ask anthing related to college"
              ref={inputRef}
            />
            <div className="mr-2">
              {isLoading ? (
                <LoaderIcon className="animate-spin w-3 h-3 text-neutral-600" />
              ) : (
                <SendHorizonalIcon
                  className="text-neutral-700 w-5  h-5"
                  onClick={handleQuerySubmit}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// {isTextArea ? (
//   <div className="absolute right-2 bottom-1">
// {/* <Button
//   className="flex items-center text-xs bg-neutral-700 hover:bg-neutral-800/80 duration-75 h-6 rounded-sm"
//   onClick={handleQuerySubmit}
//   disabled={isLoading}
// >
//   {isLoading ? (
//     <LoaderIcon className="animate-spin w-3 h-3 text-neutral-600" />
//   ) : (
//     <SendHorizonalIcon className="w-3 h-3 mr-1" />
//   )}
//   Send
// </Button> */}
//   </div>
// ) : (
// <div className={`absolute right-3 top-1/2 transform -translate-y-1/2`}>
//   {isLoading ? (
//     <LoaderIcon className="animate-spin w-3 h-3 text-neutral-600" />
//   ) : (
//     <SendHorizonalIcon
//       className="text-neutral-700 w-5  h-5"
//       onClick={handleQuerySubmit}
//     />
//   )}
// </div>
// )}
