import { auth } from "@/auth";
import SignInForm from "./signin-form";
import { redirect } from "next/navigation";
import { AuthSearchPageProps } from "../../lib/definitons";


export default async function SigninPage({ searchParams }: AuthSearchPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex justify-center items-center p-5">
      <SignInForm searchParams={searchParams} />
    </main>
  );
}
