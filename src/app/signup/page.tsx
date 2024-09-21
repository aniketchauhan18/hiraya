import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignupForm from "./signup-form";
import { AuthSearchPageProps } from "@/lib/definitons";


export default async function SignupPage({searchParams}: AuthSearchPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex justify-center items-center min-h-screen p-5">
      <SignupForm searchParams={searchParams} />
    </main>
  );
}
