import { auth } from "@/auth";
import SignInForm from "./signin-form";
import { redirect } from "next/navigation";

export default async function SigninPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
  redirect("/auth")

  return (
    <main className="min-h-screen flex justify-center items-center p-5">
      <SignInForm searchParams={await searchParams} />
    </main> 
  );
}
