"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function SignoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm font-medium hover:underline underline-offset-4"
    >
      Sign out
    </button>
  );
}
