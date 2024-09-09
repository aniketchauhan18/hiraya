"use client";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
export default function SigninWithGoogleButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="border border-neutral-200 py-1 bg-neutral-100 rounded-lg flex justify-center items-center"
    >
      <FcGoogle className="text-2xl" />
    </button>
  );
}
