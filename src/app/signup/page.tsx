import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import SignupForm from "./signup-form";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex justify-center items-center min-h-screen p-5">
      <SignupForm />
    </main>
  );
}
