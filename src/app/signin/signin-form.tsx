"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LoaderIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SigninWithGoogleButton from "@/components/app/buttons/signin-google-button";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const signInData = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });
      if (signInData?.error) {
        setError(signInData.error);
        setIsLoading(false);
      } else {
        setError(null);
        setIsLoading(false);
        router.refresh();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const inputClasses =
    "rounded-lg bg-neutral-100/40 border border-neutral-200 shadow-none text-neutral-700";

  return (
    <form
      className="flex flex-col p-5 shadow-sm rounded-lg border space-y-3 bg-white w-full max-w-[23rem]"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 border border-neutral-600 rounded-full">
          {/* Agency Image / Logo */}
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold">Welcome Back</p>
        <p className="text-xs text-neutral-500">
          Please enter your details to login.
        </p>
      </div>
      {error && (
        <div className="text-red-500 text-xs text-center">
          Please check your email and password
        </div>
      )}
      <div className="space-y-0.5">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="hello@aniket18.com"
          className={inputClasses}
        />
      </div>
      <div className="space-y-0.5">
        <Label htmlFor="password" className="text-sm">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          placeholder={showPassword ? "jsHU8323kjb" : "**********"}
          className={inputClasses}
        />
        <div
          className="flex items-center pt-1"
          onChange={() => setShowPassword((prev) => !prev)}
        >
          <input type="checkbox" className="mr-1" />
          <p className="text-neutral-500 text-xs">Show Password</p>
        </div>
      </div>
      <Button
        disabled={isLoading}
        className="rounded-lg text-sm bg-gradient-to-b font-light from-neutral-700 to-neutral-800 text-white"
      >
        {isLoading ? (
          <div className="flex items-center">
            <LoaderIcon className="w-4 h-4 mr-1 animate-spin" />
            Logging in..
          </div>
        ) : (
          "Login"
        )}
      </Button>
      {/* <button formAction={signup}>Sign up</button> */}
      <div className="text-center text-xs text-neutral-600">
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-ebb-800 hover:underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      </div>
      <div className="flex items-center gap-3 w-full">
        <div className="border-b border-neutral-300 flex-1 block"></div>
        <p className="text-neutral-600 font-normal text-sm">OR</p>
        <div className="border-b border-neutral-300 flex-1 block"></div>
      </div>
      <SigninWithGoogleButton />
    </form>
  );
}
