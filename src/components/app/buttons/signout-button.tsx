"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SignoutButton({ className }: {className?: string}) {
  return (
    <button
      onClick={() => signOut()}
      className={cn("text-sm font-medium flex items-start hover:underline underline-offset-4", className)}
    >
      Sign out
    </button>
  );
}
