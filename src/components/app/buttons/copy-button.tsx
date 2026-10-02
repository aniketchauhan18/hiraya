"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COPY_DEBOUNCE_MS = 800;
const COPIED_RESET_MS = 2000;

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const lastCopyAtRef = useRef(0);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    const now = Date.now();
    if (now - lastCopyAtRef.current < COPY_DEBOUNCE_MS) {
      return;
    }
    lastCopyAtRef.current = now;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }, [text]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClick}
            aria-label="Copy message"
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <CheckIcon className="size-3.5" strokeWidth={2.25} />
            ) : (
              <CopyIcon className="size-3.5" strokeWidth={2.25} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
