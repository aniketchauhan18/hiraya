"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import SigninWithGoogleButton from "@/components/app/buttons/signin-google-button";

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const formObj = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("/api/v1/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObj),
      });

      if (!response.ok) {
        const { error, message } = await response.json();
        setErrors(error);
        if (message) {
          setServerError(message);
        }
        setIsLoading(false);
      }
      if (response.ok) {
        router.push("/signin");
        setErrors({}); // reseting it to
        setServerError(null);
        setIsLoading(false);
      } else {
        console.error("Error while registering user");
      }
    } catch (err) {
      console.log(err);
    }
  };
  const inputClasses =
    "rounded-lg bg-neutral-100/40 border border-neutral-200 shadow-none text-neutral-700";

  return (
    <form
      className="flex flex-col p-5 shadow-sm rounded-lg border space-y-3 bg-white w-full max-w-[25rem]"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center items-center">
        <div className="w-12 h-12 border border-neutral-600 rounded-full">
          {/* Agency Image / Logo */}
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold">Welcome</p>
        <p className="text-xs text-neutral-500">
          Please enter your details to register
        </p>
      </div>
      {serverError && (
        <div className="text-red-500 text-sm text-center">{serverError}</div>
      )}
      <div className="space-y-0.5">
        <Label htmlFor="firstName" className="text-sm">
          Firstname
        </Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          required
          placeholder="Aniket"
          className={inputClasses}
        />
        {errors?.firstName && (
          <div className="text-red-500 text-xs">{errors?.firstName[0]}</div>
        )}
      </div>
      <div className="space-y-0.5">
        <Label htmlFor="lastName" className="text-sm">
          Lastname
        </Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          required
          placeholder="Chauhan"
          className={inputClasses}
        />
        {errors?.lastName && (
          <div className="text-red-500 text-xs">{errors?.lastName[0]}</div>
        )}
      </div>
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
        {errors?.email && (
          <div className="text-red-500 text-xs">{errors?.email[0]}</div>
        )}
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
          placeholder={showPassword ? "1234567890" : "**********"}
          className={inputClasses}
        />
        {errors?.password && (
          <div className="text-red-500 text-xs">{errors?.password[0]}</div>
        )}
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
            Registering...
          </div>
        ) : (
          "Register"
        )}
      </Button>
      {/* <button formAction={signup}>Sign up</button> */}
      <div className="text-center text-xs text-neutral-600">
        <p>
          Already have an account ?{" "}
          <Link
            href="/signin"
            className="text-neutral-900 hover:underline underline-offset-4"
          >
            Login
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
